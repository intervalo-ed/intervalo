"""Elo online del minijuego — funciones puras, sin BD.

Adaptado del reporte del motor (docs/reports/2026-08-26-motor-de-sesiones.md §5/§8):
p̂ = σ((θ − β) · SCALE), actualización con learning rate decreciente tras cada
primer intento. Sin reentrenamiento ni jobs: aritmética en la misma transacción
que escribe la respuesta.
"""

from __future__ import annotations

import math

# Calibración por temperatura medida en producción de Intervalo (a = 0.818).
SCALE = 0.818

# Banda objetivo de probabilidad de acierto al primer intento.
TARGET_LOW = 0.70
TARGET_HIGH = 0.80
TARGET_MID = 0.75

# ε-exploración: con esta probabilidad se sirve la plantilla con menos
# observaciones dentro de la banda ampliada, para que las betas nuevas
# converjan rápido.
EPSILON = 0.15
# Banda ampliada para el paso de exploración.
EXPLORE_LOW = 0.65
EXPLORE_HIGH = 0.85

# Rampa inicial: mientras n_updates < RAMP_UPDATES se restringe tier <= n_updates,
# así el juego arranca en y=k, y=x aunque el θ inicial sea 0.
RAMP_UPDATES = 5

# Dificultad seed por tier (v1 sin cadena). Con θ=0: T0 → p̂≈0.86, T5 → p̂≈0.32.
# Al sumar cadena en v2, reservar {6: 1.4, 7: 2.0, 8: 2.6}.
BETA_SEED: dict[int, float] = {0: -2.2, 1: -1.6, 2: -1.0, 3: -0.4, 4: 0.3, 5: 0.9}

# Hiperparámetros del update (grid del reporte: a_u=0.8 b_u=0.15 a_x=1.2 b_x=0.05).
_A_USER = 0.8
_B_USER = 0.15
_A_TEMPLATE = 1.2
_B_TEMPLATE = 0.05


def predict(theta: float, beta: float) -> float:
    """p̂ de acierto al primer intento para (jugador, plantilla)."""
    return 1.0 / (1.0 + math.exp(-(theta - beta) * SCALE))


def update(
    theta: float, n_user: int, beta: float, n_template: int, correct: bool
) -> tuple[float, float]:
    """Devuelve (theta', beta') tras el resultado del PRIMER intento."""
    e = (1.0 if correct else 0.0) - predict(theta, beta)
    theta_next = theta + _A_USER / (1.0 + _B_USER * n_user) * e
    beta_next = beta - _A_TEMPLATE / (1.0 + _B_TEMPLATE * n_template) * e
    return theta_next, beta_next


def difficulty_stars(p_hat: float) -> int:
    """1 (regalada) a 5 (durísima), para mostrar en el front."""
    return max(1, min(5, round(1 + 4 * (1 - p_hat))))


# Cortes de θ para los 4 niveles del ranking. El juego no tiene cinturones, así
# que este es el equivalente: el color del nombre se gana resolviendo más
# difícil, no acumulando XP.
#
# Salen de BETA_SEED: una plantilla cae en la banda objetivo cuando
# θ ≈ β + logit(0.75)/SCALE = β + 1.34. O sea que θ=0.3 es "las sumas ya salen
# cómodas" (T2), θ=1.6 "los productos" (T4) y θ=2.2 "los cocientes" (T5). Un
# jugador nuevo arranca en θ=0 y por lo tanto en blanco, como corresponde.
_LEVEL_CUTS = (0.3, 1.6, 2.2)


def level_of(theta: float) -> int:
    """Nivel 0-3 del jugador; el front lo pinta con los colores de cinturón."""
    for index, cut in enumerate(_LEVEL_CUTS):
        if theta < cut:
            return index
    return len(_LEVEL_CUTS)
