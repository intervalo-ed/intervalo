"""Elo jerárquico para P(quality_score = 5) — habilidad por usuario, dificultad
por ejercicio con backoff a dificultad por ítem. Puro, sin BD: quien llama
(backend/session_store.py, backend/exercise_bank.py) lee/escribe los floats.

Hiperparámetros y derivación en 2026-08-26-motor-de-sesiones.md §5 (AUC 0,708
online vs 0,726 de un GBM entrenado en batch — la diferencia no justifica el
pipeline) y §6 (temperatura por calibración post-hoc, banda 0,7-0,8 real 0,779).
No se reentrena: cada respuesta actualiza theta/beta con un paso que decrece
con la cantidad de observaciones (ver `update`).
"""

import math

TEMPERATURE = 0.818

A_U, B_U = 0.8, 0.15
A_X, B_X = 1.2, 0.05
W_ITEM = 0.3


def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def predict(
    theta_u: float,
    beta_x: float,
    beta_i: float,
    n_x: int,
    temperature: float = TEMPERATURE,
) -> float:
    """P(acierto al primer intento). `beta_x` mezclado con `beta_i` (dificultad
    del ítem) con peso n_x/(n_x+4): con poca evidencia propia del ejercicio, el
    ítem manda; con n_x grande, el ejercicio se auto-explica."""
    w = n_x / (n_x + 4)
    diff = w * beta_x + (1 - w) * beta_i
    return sigmoid((theta_u - diff) * temperature)


def update(
    theta_u: float,
    beta_x: float,
    beta_i: float,
    n_u: int,
    n_x: int,
    n_i: int,
    y: int,
) -> tuple[float, float, float]:
    """Un paso de descenso por gradiente sobre la log-verosimilitud logística
    (y − p̂, con paso decreciente en n). Devuelve (theta_u, beta_x, beta_i)
    actualizados — el llamador es responsable de persistirlos junto con los
    contadores incrementados (n_u+1, n_x+1, n_i+1)."""
    p = predict(theta_u, beta_x, beta_i, n_x)
    e = y - p
    theta_u = theta_u + A_U / (1 + B_U * n_u) * e
    beta_x = beta_x - A_X / (1 + B_X * n_x) * e
    beta_i = beta_i - W_ITEM * A_X / (1 + B_X * n_i) * e
    return theta_u, beta_x, beta_i
