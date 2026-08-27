"""Teclas dinámicas del teclado, deducidas de la derivada esperada.

El teclado del juego no es solo un input: es la heurística que orienta sobre qué
hacer, así que mostrarlo entero (30 teclas) abruma en vez de ayudar. El bloque
fijo (numpad, x, + − ·, paréntesis, flechas) alcanza para las derivadas simples;
todo lo demás aparece SOLO cuando este ejercicio lo pide, más un par de
distractores legítimos de la misma familia para que la fila no sea la respuesta
servida.

Funciones puras sobre el árbol de sympy. La derivada esperada ya está persistida
en `game_exercises.expected_derivative`, así que esto se calcula al vuelo en
/next: no hay columna ni migración.
"""

from __future__ import annotations

import random

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

# Ancho de la fila. Con más de 7 la fila deja de leerse de un vistazo.
MAX_KEYS = 7
# Piso cuando el ejercicio pide al menos una tecla: sola en la fila, la tecla
# necesaria sería literalmente la respuesta.
MIN_KEYS = 4

# Confusiones plausibles por familia: son las teclas que alguien podría elegir
# mal, no relleno al azar (sen/cos se intercambian, ln/log se confunden, a^x se
# escribe como e^x).
_SIBLINGS: dict[str, tuple[str, ...]] = {
    KEY_SEN: (KEY_COS, KEY_TG),
    KEY_COS: (KEY_SEN, KEY_TG),
    KEY_TG: (KEY_SEN, KEY_COS),
    KEY_LN: (KEY_LOG,),
    KEY_LOG: (KEY_LN,),
    KEY_EXPX: (KEY_POW, KEY_E),
    KEY_POW: (KEY_SQ, KEY_EXPX, KEY_SQRT),
    KEY_SQ: (KEY_POW, KEY_SQRT),
    KEY_FRAC: (KEY_SQ, KEY_POW),
}

# Último recurso para llegar al piso cuando la familia no da más hermanos.
# Ordenado de más a menos plausible: un exponente o una fracción de más se
# pueden creer, una raíz o un π en una derivada de esta tabla no.
_FILLER: tuple[str, ...] = (KEY_POW, KEY_SQ, KEY_FRAC, KEY_E, KEY_SQRT)


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


def keys_for(expr: sympy.Expr, seed: int) -> list[str]:
    """Fila dinámica del teclado para esta derivada, en orden canónico.

    Sin teclas necesarias devuelve la lista vacía: la fila queda en blanco y eso
    ya dice algo ("acá no hace falta nada raro"). El alto de la fila lo reserva
    el front, así que el teclado no cambia de tamaño.
    """
    required = required_keys(expr)
    if not required:
        return []

    target = min(MAX_KEYS, max(MIN_KEYS, len(required) + 2))
    chosen = set(required)

    # Los hermanos de las teclas necesarias van PRIMERO: son las confusiones de
    # verdad. El relleno solo entra si la familia no da para llegar al piso —
    # mezclarlos en una sola bolsa dejaba filas absurdas (√ y ÷ como
    # distractores de sen x, con cos ausente).
    siblings: list[str] = []
    for key in sorted(required, key=lambda k: _ORDER_INDEX[k]):
        for sibling in _SIBLINGS.get(key, ()):
            if sibling not in chosen and sibling not in siblings:
                siblings.append(sibling)
    filler = [k for k in _FILLER if k not in chosen and k not in siblings]

    # El sorteo decide cuáles entran cuando sobran candidatos, no en qué orden
    # se dibujan (eso lo fija CANONICAL_ORDER).
    rng = random.Random(seed)
    rng.shuffle(siblings)
    rng.shuffle(filler)
    for key in (*siblings, *filler):
        if len(chosen) >= target:
            break
        chosen.add(key)

    return sorted(chosen, key=lambda k: _ORDER_INDEX[k])
