"""XP del minijuego — funciones puras, constantes propias.

Mecánica calcada de algorithm/xp.py (base por intento + multiplicador de
dificultad + combo) pero con números propios: este XP escribe SOLO
`game_players.xp`. Nunca tocar `users.total_xp` (desbloquearía emojis y
dispararía notificaciones del ranking de Intervalo).
"""

from __future__ import annotations

# La XP por acierto también fija el largo del festejo: el front reparte este
# número en un puñado de pasos que suben el contador, uno por cada ~3 XP (ver
# XP_POR_PASO en web/src/app/derivadas/xp-pasos.ts). Con ~10 el festejo era un
# puñado triste; con ~25 se ve, y el conteo dura menos de dos segundos.
XP_BY_ATTEMPT = {1: 25, 2: 8}

# Del tercer intento en adelante. Los intentos son ilimitados —se responde hasta
# acertar o saltear (ver TOPE_DE_INTENTOS en router.py)— así que hace falta un
# número para el resto de la cola, y no puede ser cero: insistir hasta sacarla
# es la conducta que el juego quiere, y un acierto que no paga nada apaga el
# festejo entero (el conteo no corre con 0 de XP).
XP_INSISTIENDO = 5

# Acertó después de abrir el «¿Por qué?». La explicación termina con la derivada
# escrita, así que esto no premia haberla resuelto: premia haberla leído, que
# también vale algo pero no lo mismo. Gana sobre cualquier otra regla, incluido
# el segundo intento, porque cuál fue el intento deja de decir nada cuando la
# respuesta estaba a la vista.
XP_EXPLICADO = 3

# Combo: cada COMBO_INTERVAL correctas al primer intento seguidas, bonus plano.
COMBO_INTERVAL = 5
COMBO_BONUS = 15

# Con la tabla a la vista la derivada deja de ser una pregunta, así que la XP es
# simbólica: alcanza para que el festejo exista y no para escalar mirando. Plana
# a propósito: sin multiplicador de dificultad, porque la dificultad la resolvió
# la tabla y no la persona.
XP_PEEKED = 5

# Multiplicador de dificultad desde el p̂ al servir: [0.75, 1.6].
_MULT_FLOOR = 0.75
_MULT_SPAN = 0.85


def difficulty_multiplier(p_hat: float) -> float:
    return _MULT_FLOOR + _MULT_SPAN * (1.0 - p_hat)


def xp_for_answer(
    attempt_number: int,
    correct: bool,
    p_hat: float,
    combo_after: int,
    *,
    peeked: bool = False,
    explained: bool = False,
) -> tuple[int, int]:
    """Devuelve (xp_total, combo_bonus) por esta respuesta.

    El orden de las reglas es el orden en que se pisan unas a otras:

      1. `explained` gana sobre todo. Leído el ¿Por qué?, la respuesta estaba
         escrita, y con qué intento se la copió no cambia nada.
      2. `peeked` va después, por lo mismo pero un escalón más arriba: la tabla
         da la fila, no la derivada de este ejercicio.
      3. Y recién ahí el intento: 25 al primero, 8 al segundo, XP_INSISTIENDO
         de ahí en adelante.

    El multiplicador de dificultad y el bonus de combo son los dos solo del
    primer intento y solo si no hubo ayuda: el segundo intento ya vio el color,
    y una racha que se completa mirando no es una racha.
    """
    if not correct:
        return 0, 0
    if explained:
        return XP_EXPLICADO, 0
    if peeked:
        return XP_PEEKED, 0
    base = XP_BY_ATTEMPT.get(attempt_number, XP_INSISTIENDO)
    bonus = 0
    if attempt_number == 1:
        base = round(base * difficulty_multiplier(p_hat))
        if combo_after > 0 and combo_after % COMBO_INTERVAL == 0:
            bonus = COMBO_BONUS
    return base + bonus, bonus
