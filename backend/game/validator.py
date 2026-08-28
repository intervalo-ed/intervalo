"""Validación por equivalencia numérica.

Se evalúan la derivada esperada (del server) y la respuesta del alumno en una
grilla fija de puntos; si coinciden en suficientes puntos co-válidos, la
respuesta es correcta en cualquier forma algebraica. También se comparan los
errores predecibles del template para dar feedback específico.
"""

from __future__ import annotations

import json
import math

import sympy
from sympy import Symbol

x = Symbol("x")

# Puntos "feos" a propósito: una coincidencia casual en todos a la vez es
# despreciable. Si la expresión esperada tiene log, se usa la grilla positiva.
_GRID = (-2.7, -1.9, -1.3, -0.61, 0.37, 0.52, 1.23, 1.77, 2.31, 3.31)
_GRID_POSITIVE = (0.11, 0.37, 0.52, 1.23, 1.77, 2.31, 3.31, 4.7, 6.13, 8.9)

_MIN_COVALID = 5
_REL_TOL = 1e-6

# Guardas contra expresiones patológicas del cliente.
_MAX_OPS = 60
_MAX_INT = 10**6
_MAX_EXPONENT = 12


class AnswerRejected(ValueError):
    """La expresión no se puede evaluar con garantías (no consume intento)."""


def expr_from_stored(s: str) -> sympy.Expr:
    """Parsea un string que escribió este mismo server (str(sympy_expr))."""
    return sympy.sympify(s)


def guard_candidate(expr: sympy.Expr) -> None:
    if not expr.free_symbols <= {x}:
        extra = ", ".join(sorted(str(s) for s in expr.free_symbols - {x}))
        raise AnswerRejected(f"la respuesta solo puede usar x (encontré: {extra})")
    if sympy.count_ops(expr) > _MAX_OPS:
        raise AnswerRejected("expresión demasiado larga")
    if expr.has(sympy.Derivative) or expr.has(sympy.Integral):
        raise AnswerRejected("escribí la derivada ya resuelta")
    for atom in expr.atoms(sympy.Integer):
        if abs(int(atom)) > _MAX_INT:
            raise AnswerRejected("números demasiado grandes")
    for p in expr.atoms(sympy.Pow):
        exponent = p.exp
        if exponent.is_number:
            try:
                if abs(float(exponent)) > _MAX_EXPONENT:
                    raise AnswerRejected("exponentes demasiado grandes")
            except TypeError:
                raise AnswerRejected("exponente inválido")


def _lambdify(expr: sympy.Expr):
    return sympy.lambdify(x, expr, modules=["math"])


def _eval_at(fn, point: float) -> float | None:
    try:
        value = fn(point)
    except (ValueError, ZeroDivisionError, OverflowError, TypeError):
        return None
    if isinstance(value, complex):
        return None
    try:
        value = float(value)
    except (TypeError, ValueError, OverflowError):
        return None
    if math.isnan(value) or math.isinf(value):
        return None
    return value


def numerically_equivalent(expected: sympy.Expr, candidate: sympy.Expr) -> bool:
    """True si coinciden en ≥ _MIN_COVALID puntos donde ambas evalúan a real
    finito. Levanta AnswerRejected si no hay puntos suficientes para decidir."""
    grid = _GRID_POSITIVE if expected.has(sympy.log) else _GRID
    f_expected = _lambdify(expected)
    f_candidate = _lambdify(candidate)

    covalid = 0
    for point in grid:
        g = _eval_at(f_expected, point)
        h = _eval_at(f_candidate, point)
        if g is None or h is None:
            continue
        covalid += 1
        if abs(g - h) > _REL_TOL * max(1.0, abs(g), abs(h)):
            return False
    if covalid < _MIN_COVALID:
        raise AnswerRejected("no pudimos evaluar tu respuesta en suficientes puntos")
    return True


def _matches_quietly(expected: sympy.Expr, candidate: sympy.Expr) -> bool:
    """Como numerically_equivalent pero sin exigir co-validez (para distractores)."""
    try:
        return numerically_equivalent(expected, candidate)
    except AnswerRejected:
        return False


def match_common_error(common_errors_json: str | None, candidate: sympy.Expr) -> str | None:
    """Feedback específico si la respuesta coincide con un error predecible."""
    if not common_errors_json:
        return None
    try:
        errors = json.loads(common_errors_json)
    except (TypeError, ValueError):
        return None
    for entry in errors:
        try:
            wrong = expr_from_stored(entry["expr"])
        except (KeyError, sympy.SympifyError, TypeError):
            continue
        if _matches_quietly(wrong, candidate):
            return entry.get("feedback")
    return None
