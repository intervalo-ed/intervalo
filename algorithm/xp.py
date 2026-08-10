"""
xp.py — Sistema de XP y niveles de Intervalo.

La curva de niveles está basada en φ^(1/6) (razón áurea sexta parte),
que produce una progresión suave y perceptiblemente creciente.
La tabla se precalcula una vez al importar el módulo.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

# ── Curva de niveles ───────────────────────────────────────────────────────────

_PHI = (1 + math.sqrt(5)) / 2
_RATIO = _PHI ** (1 / 6)   # ≈ 1.0835


def _build_xp_table(levels: int = 50) -> list[int]:
    table = [0, 30, 55]   # índice 0 dummy, nivel 1 = 30 XP, nivel 2 = 55 XP
    for _ in range(3, levels + 1):
        next_val = max(table[-1] + 1, int(table[-1] * _RATIO))
        table.append(next_val)
    return table


XP_TABLE: list[int] = _build_xp_table()

# ── Constantes de otorgamiento ─────────────────────────────────────────────────

# XP base por ejercicio en Repaso según el intento en el que se acierta.
# Con 4 opciones, el 4to intento es acierto por descarte y no paga.
XP_BY_ATTEMPT = {1: 8, 2: 2, 3: 1, 4: 0}
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
    """×0.5 (ítem dominado) a ×1.5 (ítem que le cuesta), lineal en la precisión."""
    if samples < DIFFICULTY_MIN_SAMPLES:
        return 1.0
    return 1.5 - first_try_rate


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


def review_xp_base(attempts: int, difficulty: float) -> int:
    """XP base de un ejercicio de Repaso (por intento × dificultad del ítem,
    solo primer intento), sin el multiplicador de racha diaria."""
    base = XP_BY_ATTEMPT.get(attempts, 0)
    if attempts == 1:
        return round(base * difficulty)
    return base


def review_xp_split(
    attempts: int,
    difficulty: float,
    streak_mult: float,
) -> tuple[int, int]:
    """(xp_base, xp_final) de un ejercicio de Repaso. xp_final aplica el
    multiplicador de racha diaria sobre la base."""
    base = review_xp_base(attempts, difficulty)
    return base, round(base * streak_mult)


def practice_xp_split(first_try: bool, streak_mult: float) -> tuple[int, int]:
    """(xp_base, xp_final) de un ejercicio de Práctica. A diferencia de Repaso,
    no ajusta por dificultad del ítem, pero también escala con el multiplicador
    de racha diaria — su base ya es mucho menor, así que no se vuelve
    farmeable."""
    base = XP_PRACTICE_CORRECT if first_try else XP_PRACTICE_WRONG
    return base, round(base * streak_mult)


# ── Funciones de cálculo ───────────────────────────────────────────────────────

def level_from_xp(xp_total: int) -> int:
    """Nivel actual dado el XP total acumulado."""
    level = 1
    accumulated = 0
    while level < len(XP_TABLE) and accumulated + XP_TABLE[level] <= xp_total:
        accumulated += XP_TABLE[level]
        level += 1
    return level


@dataclass
class LevelProgress:
    level: int
    xp_in_level: int    # XP acumulada dentro del nivel actual
    xp_required: int    # XP total requerida para subir al siguiente nivel
    xp_missing: int     # XP que faltan para subir
    progress_pct: float # 0.0 a 100.0


def level_progress(xp_total: int) -> LevelProgress:
    """Progreso detallado hacia el siguiente nivel dado el XP total acumulado."""
    level = level_from_xp(xp_total)
    accumulated = sum(XP_TABLE[1:level])
    xp_in_level = xp_total - accumulated
    xp_required = XP_TABLE[level] if level < len(XP_TABLE) else XP_TABLE[-1]
    xp_missing = max(0, xp_required - xp_in_level)
    pct = round(xp_in_level / xp_required * 100, 1) if xp_required > 0 else 100.0
    return LevelProgress(
        level=level,
        xp_in_level=xp_in_level,
        xp_required=xp_required,
        xp_missing=xp_missing,
        progress_pct=pct,
    )
