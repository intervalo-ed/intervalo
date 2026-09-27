"""Teclas del teclado, deducidas de la derivada esperada.

El teclado del juego no es solo un input: mostrarlo entero (30 teclas) abruma en
vez de ayudar. El bloque fijo (numpad, x, + − ·, paréntesis, flechas) alcanza
para las derivadas simples; todo lo demás se DESBLOQUEA: la primera vez que una
derivada pide una tecla, esa tecla aparece y ya no se va (game_players.
unlocked_keys).

Antes esto se calculaba por ejercicio —lo que esa derivada pedía más un par de
distractores, para que la fila no fuera la respuesta servida— y el teclado
cambiaba de forma todo el tiempo. El inventario acumulativo cambia el trato: la
fila sí delata algo del ejercicio la primera vez que aparece una tecla, pero a
partir de ahí es solo el resumen de lo que la persona ya sabe escribir, y verlo
crecer es parte del juego. Se cambió información oculta por progresión, a
sabiendas.

Funciones puras sobre el árbol de sympy: la derivada esperada ya está persistida
en `game_exercises.expected_derivative`.
"""

from __future__ import annotations

import sympy
from sympy import cos, exp, log, sin, tan

# Ids que viajan al front (math-keyboard.tsx los mapea a label + LaTeX).
KEY_POW = "pow"      # □^□
KEY_SQ = "sq"        # □²
KEY_SQRT = "sqrt"    # √□
KEY_FRAC = "frac"    # ÷ (fracción)
KEY_E = "e"          # e suelto
KEY_EXPX = "expx"    # e^□
KEY_LN = "ln"
KEY_LOG = "log"      # log_□(□)
KEY_SEN = "sen"
KEY_COS = "cos"
KEY_TG = "tg"
# π queda deliberadamente fuera del vocabulario: ninguna derivada de la tabla
# básica (ni las de la cadena que vienen en v2) lo necesita, y como distractor
# no engaña a nadie — solo ocupa una ranura de las siete.

# Orden en el que se dibuja la fila. Es FIJO a propósito: si las teclas saltan de
# lugar entre ejercicios se rompe la memoria muscular, que es justo lo que hace
# que el teclado se sienta cómodo después de diez derivadas.
CANONICAL_ORDER: tuple[str, ...] = (
    KEY_POW,
    KEY_SQ,
    KEY_SQRT,
    KEY_FRAC,
    KEY_E,
    KEY_EXPX,
    KEY_LN,
    KEY_LOG,
    KEY_SEN,
    KEY_COS,
    KEY_TG,
)
_ORDER_INDEX = {key: i for i, key in enumerate(CANONICAL_ORDER)}

# Sin tope de teclas: el inventario crece hasta las once y el front las acomoda
# en filas balanceadas (math-keyboard.tsx). Un tope acá sería esconderle a
# alguien una tecla que ya se ganó.


def _keys_for_power(base: sympy.Expr, expo: sympy.Expr) -> set[str]:
    """Teclas que exige escribir `base ** expo`."""
    out: set[str] = set()
    if expo == 1:
        return out
    # Exponente negativo: se escribe como fracción, y el denominador se lleva el
    # exponente en positivo.
    magnitude = expo
    if expo.is_number and expo.is_negative:
        out.add(KEY_FRAC)
        magnitude = -expo
    if not magnitude.is_number:
        # a^x, e^x: el exponente es simbólico, hace falta el cajón del exponente.
        out.add(KEY_POW)
    elif magnitude == 2:
        out.add(KEY_SQ)
    elif magnitude == sympy.Rational(1, 2):
        out.add(KEY_SQRT)
    elif magnitude != 1:
        out.add(KEY_POW)
    if base is sympy.E:
        out.discard(KEY_POW)
        out.add(KEY_EXPX)
    return out


def required_keys(expr: sympy.Expr) -> set[str]:
    """Teclas sin las cuales esta derivada no se puede escribir."""
    out: set[str] = set()
    for node in sympy.preorder_traversal(expr):
        if isinstance(node, exp):
            out.add(KEY_EXPX)
        elif isinstance(node, log):
            out.add(KEY_LN)
        elif isinstance(node, sin):
            out.add(KEY_SEN)
        elif isinstance(node, cos):
            out.add(KEY_COS)
        elif isinstance(node, tan):
            out.add(KEY_TG)
        elif isinstance(node, sympy.Pow):
            base, expo = node.as_base_exp()
            out |= _keys_for_power(base, expo)
        elif isinstance(node, sympy.Rational) and not isinstance(node, sympy.Integer):
            # Coeficiente fraccionario suelto (3/2): también se escribe con ÷.
            out.add(KEY_FRAC)
    return out


# ── El bloque FIJO, que hasta `dx-rampa-1` no se desbloqueaba nunca ─────────
#
# El numérico, la incógnita, las cuatro operaciones y los paréntesis estaban
# SIEMPRE completos: el único vocabulario que crecía era el dinámico de arriba.
# La rampa los mete en el mismo mecanismo, y por eso viven en la MISMA columna
# (`game_players.unlocked_keys`) y no en una nueva: es una lista de ids separada
# por comas, así que sumarle ids de otra familia no es una migración.
#
# Los ids llevan prefijo `f:` justamente para que las dos familias convivan sin
# pisarse y para que un cliente viejo —que filtra por su propio diccionario—
# los ignore solo, sin romperse.
#
# El retroceso y las flechas NO están acá y no es un olvido: no se desbloquean
# nunca. Son las dos cosas que hacen falta para corregir lo que se escribió, y
# un teclado del que no se puede volver atrás no es una rampa, es una trampa.
FIJA_X = "f:x"
FIJA_MAS = "f:+"
FIJA_MENOS = "f:-"
FIJA_POR = "f:*"
FIJA_PAR = "f:()"     # los dos paréntesis son una sola tecla a estos efectos
FIJA_CLEAR = "f:C"

FIJAS_ORDER: tuple[str, ...] = (
    *(f"f:{d}" for d in "0123456789"),
    FIJA_X, FIJA_MAS, FIJA_MENOS, FIJA_POR, FIJA_PAR, FIJA_CLEAR,
)
_FIJAS_INDEX = {k: i for i, k in enumerate(FIJAS_ORDER)}

# El calendario de la rampa, para lo que NO sale de la respuesta.
#
# Los dígitos y la `x` se desbloquean por NECESIDAD —lo que la derivada esperada
# exige— y eso alcanza para las tres primeras, que son fijas por diseño: `x` da
# 1, `x²` da 2x y `2x²` da 4x. De la cuarta en adelante el motor de Elo toma el
# control y empieza a servir sumas y coeficientes cualesquiera, así que ahí
# entran los operadores.
#
# El techo es lo que garantiza que esto sea una rampa y no una jaula: a la
# octava derivada servida se desbloquea TODO lo que falte, haya salido o no.
ESCALONES: dict[int, frozenset[str]] = {
    1: frozenset({"f:1"}),
    4: frozenset({FIJA_MAS, FIJA_MENOS, FIJA_POR, FIJA_CLEAR}),
    6: frozenset({FIJA_PAR}),
}
RAMPA_COMPLETA_EN = 8


def fijas_requeridas(expr: sympy.Expr) -> set[str]:
    """Las teclas fijas sin las cuales esta derivada no se puede escribir.

    Es la garantía que hace que la rampa no pueda trabar a nadie: la tecla que
    la respuesta necesita aparece en el ejercicio que la necesita, no después.
    """
    out: set[str] = set()
    for node in sympy.preorder_traversal(expr):
        if isinstance(node, sympy.Symbol):
            out.add(FIJA_X)
        elif isinstance(node, sympy.Rational):
            # Cubre Integer y Rational: `str(abs(...))` da "4" o "1/2", y de ahí
            # salen los dígitos que hay que poder tipear.
            for ch in str(abs(node)):
                if ch.isdigit():
                    out.add(f"f:{ch}")
            if node.is_negative:
                out.add(FIJA_MENOS)
        elif isinstance(node, sympy.Add):
            out.add(FIJA_MAS)
        elif isinstance(node, (exp, log, sin, cos, tan)):
            # Escribir una función es escribir su paréntesis.
            out.add(FIJA_PAR)
    return out


def fijas_del_escalon(n_servidos: int) -> set[str]:
    """Lo que el calendario suelta al servir el ejercicio número `n_servidos`."""
    if n_servidos >= RAMPA_COMPLETA_EN:
        return set(FIJAS_ORDER)
    return set().union(*(v for k, v in ESCALONES.items() if n_servidos >= k)) \
        if any(n_servidos >= k for k in ESCALONES) else set()


def parse_unlocked(raw: str | None) -> set[str]:
    """Las teclas DINÁMICAS de la columna, descartando lo que no reconozca.

    Sigue devolviendo solo las dinámicas aunque la columna ahora guarde las dos
    familias: es lo que alimenta la fila de arriba del teclado, y meterle ids
    fijos la llenaría de teclas que ya están dibujadas abajo.
    """
    if not raw:
        return set()
    return {k for k in raw.split(",") if k in _ORDER_INDEX}


def parse_fijas(raw: str | None) -> set[str]:
    """Las teclas FIJAS desbloqueadas. Vacío = nadie tocó la rampa."""
    if not raw:
        return set()
    return {k for k in raw.split(",") if k in _FIJAS_INDEX}


def fijas_en_orden(keys: set[str]) -> list[str]:
    return sorted(keys, key=lambda k: _FIJAS_INDEX[k])


def serialize(keys: set[str]) -> str:
    """La columna. Acepta las dos familias mezcladas y las ordena por separado."""
    din = {k for k in keys if k in _ORDER_INDEX}
    fij = {k for k in keys if k in _FIJAS_INDEX}
    return ",".join(in_order(din) + fijas_en_orden(fij))


def in_order(keys: set[str]) -> list[str]:
    """Las teclas en CANONICAL_ORDER, que es el orden en que se dibujan."""
    return sorted(keys, key=lambda k: _ORDER_INDEX[k])


def parse_unlocked_ordered(raw: str | None) -> list[str]:
    return in_order(parse_unlocked(raw))


def unlock(raw: str | None, expr: sympy.Expr, rampa: bool = False,
           n_servidos: int = 0) -> tuple[str, list[str], list[str]]:
    """Suma al inventario lo que esta derivada exige.

    Devuelve (columna nueva, dinámicas nuevas, fijas nuevas). Las dos listas van
    SEPARADAS y no juntas porque alimentan dos filas distintas del teclado, y
    porque `new_keys` tiene que seguir siendo un subconjunto de `keys` — que es
    un invariante que el contrato de la API promete y `check_game_unlocks`
    verifica.

    Con `rampa` puesto —el jugador cayó en un brazo de `dx-rampa-1`— también
    crece el bloque FIJO, por necesidad más calendario. Sin rampa las fijas que
    la columna ya tuviera **se conservan pero no crecen**: si el experimento se
    apaga a mitad de camino, nadie pierde teclas que ya se había ganado.
    """
    have_din = parse_unlocked(raw)
    fresh = required_keys(expr) - have_din
    todo = have_din | fresh | parse_fijas(raw)
    if not rampa:
        return serialize(todo), in_order(fresh), []
    nuevas_fij = (fijas_requeridas(expr) | fijas_del_escalon(n_servidos)) - todo
    return serialize(todo | nuevas_fij), in_order(fresh), fijas_en_orden(nuevas_fij)
