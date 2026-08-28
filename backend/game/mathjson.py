"""MathJSON → sympy.

El cliente parsea el LaTeX del alumno con @cortex-js/compute-engine y manda el
árbol MathJSON. Convertirlo acá evita sympy.parse_latex (que arrastra un pin
frágil de antlr4). Un MathJSON mentiroso solo perjudica a quien lo manda: la
comparación numérica es contra la derivada esperada que guardó el server.

Vocabulario deliberadamente acotado al del teclado del juego; cualquier head
desconocido levanta MathJsonError y el intento no se consume (parse_ok=False).
"""

from __future__ import annotations

from typing import Any

import sympy
from sympy import Rational, Symbol, cos, exp, log, sin, tan

x = Symbol("x")


class MathJsonError(ValueError):
    pass


_SYMBOLS: dict[str, sympy.Expr] = {
    "x": x,
    "Pi": sympy.pi,
    "ExponentialE": sympy.E,
    "e": sympy.E,
    "Half": Rational(1, 2),
    "Nothing": sympy.Integer(0),
}

_MAX_DEPTH = 32

# Presupuesto de tamaño, aplicado DURANTE el recorrido.
#
# Las guardas de validator.guard_candidate corren sobre la expresión ya
# construida, o sea demasiado tarde: sympy evalúa `Integer ** Integer` en el acto,
# así que un cuerpo como ["Power", 10, ["Power", 10, 10]] le pide a Python un
# entero de diez mil millones de dígitos antes de que nadie haya podido opinar.
# Un solo POST —y un token de invitado es gratis— alcanzaba para voltear la
# instancia. Lo mismo por lo ancho: _MAX_DEPTH acota la profundidad pero no la
# cantidad de hermanos, así que ["Add", 1, 1, ... un millón de veces] entraba.
#
# Los números son los de validator.py, que es donde vive el criterio; acá se
# aplican antes de construir nada.
_MAX_NODOS = 400
_MAX_EXPONENTE = 12
_MAX_ENTERO = 10**6


def _numero_acotado(valor: sympy.Expr) -> sympy.Expr:
    """Rechaza enteros y racionales fuera de rango. Lo que no es número pasa."""
    if valor.is_Integer:
        if abs(int(valor)) > _MAX_ENTERO:
            raise MathJsonError("números demasiado grandes")
    elif valor.is_Rational:
        if abs(valor.p) > _MAX_ENTERO or abs(valor.q) > _MAX_ENTERO:
            raise MathJsonError("números demasiado grandes")
    return valor


def _exponente_acotado(base: sympy.Expr, exponente: sympy.Expr) -> sympy.Expr:
    """La potencia, revisando el exponente ANTES de calcularla y el resultado
    después.

    Las dos mitades hacen falta. Sin la primera, ["Power", 10, ["Power", 10, 10]]
    manda a evaluar 10 elevado a diez mil millones. Sin la segunda, una torre de
    ["Square", ["Square", ...]] llega al mismo lado por otro camino: cada nivel
    respeta el tope de exponente —siempre es 2— pero DUPLICA el del resultado, y
    con la profundidad que se permite eso son diez elevado a mil millones.

    El tope del resultado es el mismo que ya aplicaba validator.guard_candidate
    sobre la expresión terminada, así que esto no rechaza nada que antes se
    aceptara: solo lo rechaza antes de construirlo.
    """
    if exponente.is_number:
        try:
            if abs(float(exponente)) > _MAX_EXPONENTE:
                raise MathJsonError("exponentes demasiado grandes")
        except (TypeError, ValueError, OverflowError):
            raise MathJsonError("exponente inválido")
    if base.is_number and exponente.is_number:
        try:
            if abs(float(base)) ** abs(float(exponente)) > _MAX_ENTERO:
                raise MathJsonError("números demasiado grandes")
        except OverflowError:
            raise MathJsonError("números demasiado grandes")
        except (TypeError, ValueError):
            pass
    return _numero_acotado(base**exponente)


def to_sympy(node: Any, depth: int = 0, presupuesto: list[int] | None = None) -> sympy.Expr:
    if depth > _MAX_DEPTH:
        raise MathJsonError("árbol demasiado profundo")
    # Lista de un elemento como contador compartido por toda la recursión.
    if presupuesto is None:
        presupuesto = [_MAX_NODOS]
    presupuesto[0] -= 1
    if presupuesto[0] < 0:
        raise MathJsonError("expresión demasiado larga")

    if isinstance(node, bool):
        raise MathJsonError("booleano en expresión")
    if isinstance(node, (int, float)):
        if isinstance(node, float):
            if not (-_MAX_ENTERO <= node <= _MAX_ENTERO):
                raise MathJsonError("números demasiado grandes")
            # nsimplify es una búsqueda por fracciones continuas y se le puede
            # dar de comer algo que la haga trabajar mucho; el rango de arriba es
            # lo que la mantiene barata.
            return sympy.nsimplify(node, rational=True)
        return _numero_acotado(sympy.Integer(node))
    if isinstance(node, str):
        if node in _SYMBOLS:
            return _SYMBOLS[node]
        # Números serializados como string ("3", "-2.5").
        try:
            return _numero_acotado(Rational(node))
        except (ValueError, TypeError, ZeroDivisionError, sympy.SympifyError):
            raise MathJsonError(f"símbolo desconocido: {node!r}")
    if isinstance(node, dict):
        if "num" in node:
            try:
                return _numero_acotado(Rational(str(node["num"]).rstrip("dn")))
            except (ValueError, TypeError, ZeroDivisionError, sympy.SympifyError):
                raise MathJsonError(f"número inválido: {node['num']!r}")
        if "sym" in node:
            return to_sympy(node["sym"], depth + 1, presupuesto)
        if "fn" in node:
            return to_sympy(node["fn"], depth + 1, presupuesto)
        raise MathJsonError(f"objeto desconocido: {sorted(node)!r}")
    if not isinstance(node, list) or not node:
        raise MathJsonError(f"nodo inválido: {type(node).__name__}")

    head, *args = node
    if not isinstance(head, str):
        raise MathJsonError("head no textual")

    def arg(i: int) -> sympy.Expr:
        return to_sympy(args[i], depth + 1, presupuesto)

    def all_args() -> list[sympy.Expr]:
        return [to_sympy(a, depth + 1, presupuesto) for a in args]

    if head == "Add":
        return sympy.Add(*all_args())
    if head == "Subtract":
        if len(args) != 2:
            raise MathJsonError("Subtract espera 2 argumentos")
        return arg(0) - arg(1)
    if head == "Negate":
        return -arg(0)
    if head == "Multiply" or head == "InvisibleOperator":
        return sympy.Mul(*all_args())
    if head == "Divide":
        if len(args) != 2:
            raise MathJsonError("Divide espera 2 argumentos")
        return arg(0) / arg(1)
    if head == "Power":
        if len(args) != 2:
            raise MathJsonError("Power espera 2 argumentos")
        return _exponente_acotado(arg(0), arg(1))
    if head == "Rational":
        if len(args) != 2:
            raise MathJsonError("Rational espera 2 argumentos")
        return arg(0) / arg(1)
    if head == "Sqrt":
        return sympy.sqrt(arg(0))
    if head == "Root":
        if len(args) != 2:
            raise MathJsonError("Root espera 2 argumentos")
        return _exponente_acotado(arg(0), Rational(1) / arg(1))
    if head == "Square":
        return _exponente_acotado(arg(0), sympy.Integer(2))
    if head == "Exp":
        return exp(arg(0))
    if head == "Ln":
        return log(arg(0))
    if head == "Log":
        # ["Log", x] es base 10; ["Log", x, b] es base b.
        if len(args) == 1:
            return log(arg(0), 10)
        if len(args) == 2:
            return log(arg(0), arg(1))
        raise MathJsonError("Log espera 1 o 2 argumentos")
    if head == "Lb":
        return log(arg(0), 2)
    if head == "Sin":
        return sin(arg(0))
    if head == "Cos":
        return cos(arg(0))
    if head == "Tan":
        return tan(arg(0))
    # Inversas: el teclado las ofrece por paridad con GeoGebra. Una respuesta
    # con inversas se evalúa y se marca incorrecta con normalidad, en vez de
    # rebotar como "no pudimos evaluar".
    if head == "Arcsin":
        return sympy.asin(arg(0))
    if head == "Arccos":
        return sympy.acos(arg(0))
    if head == "Arctan":
        return sympy.atan(arg(0))
    if head == "Abs":
        return sympy.Abs(arg(0))
    if head == "Delimiter":
        # Delimiter envuelve paréntesis; el 2º argumento (estilo) se ignora.
        return arg(0)
    if head == "Sequence":
        if len(args) == 1:
            return arg(0)
        raise MathJsonError("Sequence con múltiples elementos")

    raise MathJsonError(f"operación no soportada: {head!r}")
