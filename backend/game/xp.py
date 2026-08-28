"""XP del minijuego — funciones puras, constantes propias.

Mecánica calcada de algorithm/xp.py (base por intento + multiplicador de
dificultad + combo) pero con números propios: este XP escribe SOLO
`game_players.xp`. Nunca tocar `users.total_xp` (desbloquearía emojis y
dispararía notificaciones del ranking de Intervalo).
"""

from __future__ import annotations

# La XP por acierto también fija el largo del festejo: el front reparte este
# número en un puñado de círculos que viajan al contador, uno por cada ~3 XP
# (ver XP_PER_PARTICLE en web/src/app/derivemos/xp-burst.tsx). Con ~10 el
# festejo era un puñado triste; con ~25 se ve, y el conteo dura menos de dos
# segundos.
XP_BY_ATTEMPT = {1: 25, 2: 8}

# Combo: cada COMBO_INTERVAL correctas al primer intento seguidas, bonus plano.
COMBO_INTERVAL = 5
COMBO_BONUS = 15

# Con la tabla a la vista la derivada deja de ser una pregunta, así que la XP es
# simbólica: alcanza para que el festejo exista —unas pocas bolitas— y no para
# escalar mirando. Plana a propósito: sin multiplicador de dificultad, porque la
# dificultad la resolvió la tabla y no la persona.
XP_PEEKED = 5

# Multiplicador de dificultad desde el p̂ al servir: [0.75, 1.6].
_MULT_FLOOR = 0.75
_MULT_SPAN = 0.85


def difficulty_multiplier(p_hat: float) -> float:
    return _MULT_FLOOR + _MULT_SPAN * (1.0 - p_hat)


def xp_for_answer(attempt_number: int, correct: bool, p_hat: float, combo_after: int) -> tuple[int, int]:
    """Devuelve (xp_total, combo_bonus) por esta respuesta.

    El multiplicador de dificultad solo aplica al primer intento (igual que el
    Elo: el segundo intento ya vio feedback). El bonus de combo se paga al
    completar cada ventana de COMBO_INTERVAL.
    """
    if not correct:
        return 0, 0
    base = XP_BY_ATTEMPT.get(attempt_number, 0)
    if attempt_number == 1:
        base = round(base * difficulty_multiplier(p_hat))
    bonus = 0
    if attempt_number == 1 and combo_after > 0 and combo_after % COMBO_INTERVAL == 0:
        bonus = COMBO_BONUS
    return base + bonus, bonus


def xp_for_peeked(correct: bool) -> tuple[int, int]:
    """XP de una respuesta dada con la tabla abierta.

    Sin bonus de combo: la racha SE MANTIENE (mirar la tabla no la corta) pero
    no se cobra, que es lo que evita que la ventana de combo se complete a
    fuerza de mirar.
    """
    return (XP_PEEKED if correct else 0), 0
