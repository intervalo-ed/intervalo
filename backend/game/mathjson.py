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


def to_sympy(node: Any, depth: int = 0) -> sympy.Expr:
    if depth > _MAX_DEPTH:
        raise MathJsonError("árbol demasiado profundo")

    if isinstance(node, bool):
        raise MathJsonError("booleano en expresión")
    if isinstance(node, (int, float)):
        return sympy.nsimplify(node, rational=True) if isinstance(node, float) else sympy.Integer(node)
    if isinstance(node, str):
        if node in _SYMBOLS:
            return _SYMBOLS[node]
        # Números serializados como string ("3", "-2.5").
        try:
            return Rational(node)
        except (ValueError, TypeError, ZeroDivisionError, sympy.SympifyError):
            raise MathJsonError(f"símbolo desconocido: {node!r}")
    if isinstance(node, dict):
        if "num" in node:
            try:
                return Rational(str(node["num"]).rstrip("dn"))
            except (ValueError, TypeError, ZeroDivisionError, sympy.SympifyError):
                raise MathJsonError(f"número inválido: {node['num']!r}")
        if "sym" in node:
            return to_sympy(node["sym"], depth + 1)
        if "fn" in node:
            return to_sympy(node["fn"], depth + 1)
        raise MathJsonError(f"objeto desconocido: {sorted(node)!r}")
    if not isinstance(node, list) or not node:
        raise MathJsonError(f"nodo inválido: {type(node).__name__}")

    head, *args = node
    if not isinstance(head, str):
        raise MathJsonError("head no textual")

    def arg(i: int) -> sympy.Expr:
        return to_sympy(args[i], depth + 1)

    def all_args() -> list[sympy.Expr]:
        return [to_sympy(a, depth + 1) for a in args]

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
        return arg(0) ** arg(1)
    if head == "Rational":
        if len(args) != 2:
            raise MathJsonError("Rational espera 2 argumentos")
        return arg(0) / arg(1)
    if head == "Sqrt":
        return sympy.sqrt(arg(0))
    if head == "Root":
        if len(args) != 2:
            raise MathJsonError("Root espera 2 argumentos")
        return arg(0) ** (Rational(1) / arg(1))
    if head == "Square":
        return arg(0) ** 2
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
