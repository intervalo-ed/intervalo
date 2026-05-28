"""
exercise_bank.py — Acceso a ejercicios desde la base de datos.

Cada ejercicio tiene un 'exercise_type' (código de skill: LEXI, CLSF, FORM,
GRAF, …). El cliente del bank pide ejercicios para una unidad concreta
(belt, topic, exercise_type) — esa es ahora la granularidad del algoritmo
de SR.
"""

import json
import random

from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func
from models import Exercise


def _row_to_dict(row: Exercise) -> dict:
    gv = None
    if row.graph_view:
        try:
            gv = json.loads(row.graph_view)
        except (json.JSONDecodeError, TypeError):
            pass
    return {
        "exercise_type": row.exercise_type,
        "question": row.question,
        "options": [row.option_a, row.option_b, row.option_c, row.option_d],
        "correct_index": row.correct_index,
        "has_math": row.has_math or False,
        "feedback_correct": row.feedback_correct,
        "feedback_incorrect": row.feedback_incorrect,
        "graph_fn": row.graph_fn or "",
        "graph_view": gv,
        "explanation": row.explanation,
    }


def get_exercise_db(
    course_id: int,
    belt: str,
    topic: str,
    exercise_type: str,
    db: DBSession,
) -> dict:
    """Returns a random exercise for the (course, belt, topic, exercise_type) unit."""
    row = (
        db.query(Exercise)
        .filter(
            Exercise.course_id == course_id,
            Exercise.belt == belt,
            Exercise.topic == topic,
            Exercise.exercise_type == exercise_type,
        )
        .order_by(func.random())
        .first()
    )

    if row is None:
        raise LookupError(
            f"No hay ejercicios en BD para course_id={course_id} "
            f"belt={belt!r} topic={topic!r} exercise_type={exercise_type!r}. "
            f"Revisá el seeder (backend/seed_content.py)."
        )

    return _row_to_dict(row)


def topic_exercise_types(
    course_id: int,
    belt: str,
    topic: str,
    db: DBSession,
) -> list[str]:
    """Return the distinct exercise_types available for a (course, belt, topic).

    This is what defines a topic's "unit set" for the SR algorithm.
    """
    rows = (
        db.query(Exercise.exercise_type)
        .filter(
            Exercise.course_id == course_id,
            Exercise.belt == belt,
            Exercise.topic == topic,
        )
        .distinct()
        .all()
    )
    return [r[0] for r in rows]
