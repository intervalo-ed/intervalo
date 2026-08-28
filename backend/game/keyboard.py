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


def parse_unlocked(raw: str | None) -> set[str]:
    """Lee la columna, descartando ids que ya no existan en el vocabulario."""
    if not raw:
        return set()
    return {k for k in raw.split(",") if k in _ORDER_INDEX}


def serialize(keys: set[str]) -> str:
    return ",".join(in_order(keys))


def in_order(keys: set[str]) -> list[str]:
    """Las teclas en CANONICAL_ORDER, que es el orden en que se dibujan."""
    return sorted(keys, key=lambda k: _ORDER_INDEX[k])


def parse_unlocked_ordered(raw: str | None) -> list[str]:
    return in_order(parse_unlocked(raw))


def unlock(raw: str | None, expr: sympy.Expr) -> tuple[str, list[str]]:
    """Suma al inventario lo que esta derivada exige.

    Devuelve (columna nueva, teclas recién desbloqueadas). Lo segundo es lo que
    el front necesita para poder festejar solo lo nuevo en vez de animar la fila
    entera en cada ejercicio.
    """
    have = parse_unlocked(raw)
    fresh = required_keys(expr) - have
    return serialize(have | fresh), in_order(fresh)
