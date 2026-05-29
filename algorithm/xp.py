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

XP_CORRECT          = 5    # respuesta correcta
XP_WRONG            = 1    # respuesta incorrecta (intento)
XP_STREAK_INTERVAL  = 5    # cada cuántas correctas seguidas se otorga bonus
XP_STREAK_BONUS     = 5    # bonus por cada múltiplo del intervalo
XP_TOPIC_MASTERED   = 50   # graduar un topic (learning → review)
XP_BELT_PROMOTED    = 200  # promocionar a un cinturón (todos los topics dominados)


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
