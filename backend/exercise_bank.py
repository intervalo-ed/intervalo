"""
exercise_bank.py — Acceso a ejercicios desde la base de datos.

Cada ejercicio tiene un campo 'subtype':
  "graph" — muestra un gráfico como estímulo principal
  "text"  — muestra una expresión escrita o pregunta textual

La probabilidad de recibir uno u otro se controla desde SM2Config.graph_exercise_probability.
"""

import json
import random

from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func
from models import Exercise


# ── Fallback exercise ──────────────────────────────────────────────────────────
_FALLBACK: dict = {
    "subtype": "text",
    "question": "¿Cuál de estas expresiones representa una función lineal?",
    "options": ["$f(x) = 5x - 2$", "$f(x) = x^2$", "$f(x) = 3^x$", "$f(x) = \\log(x)$"],
    "correct_index": 0,
    "has_math": True,
    "feedback_correct": "¡Correcto! Una función lineal tiene la forma $f(x) = mx + b$.",
    "feedback_incorrect": "La opción correcta es $f(x) = 5x - 2$, que es una función lineal.",
}


def _row_to_dict(row: Exercise) -> dict:
    """Convert an Exercise DB row to the dict format expected by session_store."""
    gv = None
    if row.graph_view:
        try:
            gv = json.loads(row.graph_view)
        except (json.JSONDecodeError, TypeError):
            pass
    return {
        "subtype": row.subtype,
        "question": row.question,
        "options": [row.option_a, row.option_b, row.option_c, row.option_d],
        "correct_index": row.correct_index,
        "has_math": row.has_math or False,
        "feedback_correct": row.feedback_correct,
        "feedback_incorrect": row.feedback_incorrect,
        "graph_fn": row.graph_fn or "",
        "graph_view": gv,
    }


def get_exercise_db(
    course_id: int,
    belt: str,
    topic: str,
    skill: str,
    graph_probability: float,
    db: DBSession,
) -> dict:
    """Devuelve un ejercicio aleatorio para la combinación (course, belt, topic, skill).

    Elige el subtipo (graph/text) según graph_probability.
    Si el subtipo preferido no tiene ejercicios, usa cualquier disponible.
    Si no hay ejercicios, retorna _FALLBACK.
    """
    preferred = "graph" if random.random() < graph_probability else "text"

    # Try preferred subtype first
    row = (
        db.query(Exercise)
        .filter(
            Exercise.course_id == course_id,
            Exercise.belt == belt,
            Exercise.topic == topic,
            Exercise.skill == skill,
            Exercise.subtype == preferred,
        )
        .order_by(func.random())
        .first()
    )

    # Fallback to any subtype
    if row is None:
        row = (
            db.query(Exercise)
            .filter(
                Exercise.course_id == course_id,
                Exercise.belt == belt,
                Exercise.topic == topic,
                Exercise.skill == skill,
            )
            .order_by(func.random())
            .first()
        )

    if row is None:
        return _FALLBACK.copy()

    return _row_to_dict(row)
