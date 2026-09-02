"""
xp.py — Sistema de XP de Intervalo.

El XP no tiene niveles: es el puntaje crudo que ordena el ranking (global y
por universidad), que es el objetivo de largo plazo del sistema.
"""

from __future__ import annotations

from dataclasses import dataclass

# ── Constantes de otorgamiento ─────────────────────────────────────────────────

# XP base por ejercicio en Repaso según el intento en el que se acierta.
# Después de ver el "incorrecto", elegir entre las 3 opciones restantes es 33%
# de azar (y entre 2, 50%): XP que puede salir por suerte devalúa todo el XP,
# así que del 2do intento en adelante queda solo 1 simbólico y después nada.
XP_BY_ATTEMPT = {1: 8, 2: 1, 3: 0, 4: 0}

# Primer intento en fase de aprendizaje (primer contacto + los drills a 1-2
# días). El logro que el XP certifica es recordar tras un intervalo real, no
# acertar lo que se acaba de ver: paga menos que un repaso genuino y sin
# ajuste de dificultad (todavía no hay retención que medir).
XP_LEARNING_CORRECT = 5
XP_STREAK_INTERVAL  = 5    # cada cuántas correctas limpias seguidas se otorga bonus
XP_STREAK_BONUS     = 5    # bonus por cada múltiplo del intervalo (fijo, sin multiplicadores)

# Práctica es volumen ilimitado a elección del usuario: paga plano y sin
# ajuste de dificultad, aunque sí escala con el multiplicador de racha diaria
# (ver practice_xp_split) — su base es mucho menor que la de Repaso, así que no
# se vuelve farmeable.
XP_PRACTICE_CORRECT = 3    # acierto al primer intento
XP_PRACTICE_WRONG   = 0

# ── Dificultad personal por ítem ───────────────────────────────────────────────

# El XP del primer intento se pondera por qué tan difícil le resulta el ítem al
# estudiante: precisión rodante = proporción de aciertos al primer intento en
# sus últimas DIFFICULTY_WINDOW respuestas.
DIFFICULTY_WINDOW      = 10
DIFFICULTY_MIN_SAMPLES = 3   # con menos respuestas el ajuste queda neutro


def difficulty_multiplier(first_try_rate: float, samples: int) -> float:
    """×0.5 (ítem dominado) a ×1.25 (ítem que le cuesta), lineal en la precisión.

    Asimétrico a propósito: el descuento por ítem en piloto automático llega a
    −50%, pero el premio por ítem difícil se corta en +25%. Sin el tope, el
    multiplicador pagaba más por haber fallado antes (la ventana arrastra los
    fallos) justo cuando el desafío es menor.
    """
    if samples < DIFFICULTY_MIN_SAMPLES:
        return 1.0
    return min(1.25, 1.5 - first_try_rate)


# ── Racha de días y multiplicador de XP ────────────────────────────────────────

# (días acumulados mínimos, multiplicador). La racha cuenta días distintos con
# al menos una sesión completada, no necesariamente consecutivos.
STREAK_TIERS: list[tuple[int, float]] = [
    (0, 1.0),
    (3, 1.2),
    (9, 1.4),
    (18, 1.6),
    (30, 1.8),
    (45, 2.0),
]

# Días consecutivos de inactividad tras los cuales la racha se resetea a 0.
STREAK_RESET_AFTER_DAYS = 30


@dataclass
class StreakInfo:
    days: int
    multiplier: float
    next_threshold: int | None   # días del próximo tramo; None en el máximo
    next_multiplier: float | None
    days_to_next: int            # 0 en el tramo máximo
    is_max: bool
    # El total cae justo en el piso de un tramo, o sea que ese día se desbloqueó
    # el multiplicador. El tramo base (0 días, ×1.0) no cuenta como hito. El
    # cliente no puede deducirlo solo: no conoce STREAK_TIERS.
    tier_reached: bool
    # Multiplicador del tramo anterior al vigente; None en el tramo base. Sirve
    # para mostrar el tramo recién completado el día que se alcanza un hito.
    prev_multiplier: float | None


def streak_info(days: int) -> StreakInfo:
    multiplier = STREAK_TIERS[0][1]
    prev_multiplier: float | None = None
    next_threshold: int | None = None
    next_multiplier: float | None = None
    for i, (threshold, mult) in enumerate(STREAK_TIERS):
        if days >= threshold:
            if i > 0:
                prev_multiplier = multiplier
            multiplier = mult
        elif next_threshold is None:
            next_threshold = threshold
            next_multiplier = mult
    return StreakInfo(
        days=days,
        multiplier=multiplier,
        next_threshold=next_threshold,
        next_multiplier=next_multiplier,
        days_to_next=(next_threshold - days) if next_threshold is not None else 0,
        is_max=next_threshold is None,
        tier_reached=days > 0 and any(days == t for t, _ in STREAK_TIERS),
        prev_multiplier=prev_multiplier,
    )


def streak_multiplier(days: int) -> float:
    return streak_info(days).multiplier


# ── Racha × empuje de cafecito ────────────────────────────────────────────────

# El techo del producto de los DOS multiplicadores que hoy escalan la XP de
# Intervalo: la racha diaria (hasta ×2,0, ver STREAK_TIERS) y el empuje de
# cafecito de la universidad (hasta ×3,0, ver game/boosts.py :: MAX_MULTIPLIER).
#
# Es una constante PROPIA y no `boosts.MAX_MULTIPLIER` importado, aunque tenga
# forma de lo mismo: aquel topea cuántos cafecitos suman entre todos, este topea
# el producto de dos mecánicas distintas. Mezclarlos rompe una promesa escrita.
#
# Y el número es 4,0 y no 3,0 justamente por eso. Con tope 3,0, una sola persona
# con quince días de racha (×1,5) y su propia donación de diez cafecitos (×2,0)
# llega sola al techo — y game/boosts.py promete lo contrario con todas las
# letras: "El ×3 no se compra, se junta — hacen falta al menos dos personas".
# 4,0 es exactamente el máximo de un donante solo con la racha al máximo, así
# que nadie lo pasa por su cuenta y a quien no tiene racha alta juntarse con
# otro donante le sigue sumando.
MAX_TOTAL_MULTIPLIER = 4.0


def effective_multiplier(streak_mult: float, boost_mult: float = 1.0) -> float:
    """El multiplicador que de verdad se cobra: racha × empuje, topeado.

    Vive acá y no en el que llama porque lo necesitan DOS lugares —el que paga
    (session_store.record_answer_db) y el que lo muestra (get_user_progress_db,
    que alimenta la tile "Multiplicador de XP")— y dos implementaciones del
    mismo `min` se desincronizan en el primer ajuste. Si la tile dice ×2,4 y la
    caja paga ×2,2, el que pierde la confianza es el número, no el código.
    """
    return min(MAX_TOTAL_MULTIPLIER, streak_mult * boost_mult)


def xp_from_boost(base: int, streak_mult: float, total_mult: float) -> int:
    """Cuánto de la XP de esta respuesta la puso el empuje, y no la racha.

    La diferencia entre lo que se pagó y lo que se habría pagado sin empuje —
    misma definición que `game_players.xp_from_boosts` en el minijuego. Se
    guarda por respuesta porque después NO se puede reconstruir: de la respuesta
    sobrevive el total, y ni el multiplicador que corría ni su reparto entre
    racha y cafecito quedan en ninguna fila.
    """
    return round(base * total_mult) - round(base * streak_mult)


def review_xp_base(attempts: int, difficulty: float, *, learning: bool = False) -> int:
    """XP base de un ejercicio de Repaso (por intento × dificultad del ítem,
    solo primer intento), sin el multiplicador de racha diaria.

    En fase de aprendizaje el primer intento paga XP_LEARNING_CORRECT plano:
    ni la base de repaso ni el ajuste de dificultad aplican al primer contacto.
    """
    if learning and attempts == 1:
        return XP_LEARNING_CORRECT
    base = XP_BY_ATTEMPT.get(attempts, 0)
    if attempts == 1:
        return round(base * difficulty)
    return base


def review_xp_split(
    attempts: int,
    difficulty: float,
    mult: float,
    *,
    learning: bool = False,
) -> tuple[int, int]:
    """(xp_base, xp_final) de un ejercicio de Repaso.

    `mult` es el multiplicador EFECTIVO: racha × empuje de cafecito, ya topeado
    (ver `effective_multiplier`). Se redondea una sola vez, sobre el producto —
    aplicar los dos factores por separado redondeando cada uno da un número
    distinto del que muestra la tile."""
    base = review_xp_base(attempts, difficulty, learning=learning)
    return base, round(base * mult)


def practice_xp_split(first_try: bool, mult: float) -> tuple[int, int]:
    """(xp_base, xp_final) de un ejercicio de Práctica. A diferencia de Repaso,
    no ajusta por dificultad del ítem, pero también escala con el multiplicador
    efectivo — su base ya es mucho menor, así que no se vuelve farmeable."""
    base = XP_PRACTICE_CORRECT if first_try else XP_PRACTICE_WRONG
    return base, round(base * mult)
