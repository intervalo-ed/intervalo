"""Selección de qué ejercicio (si alguno) de una sesión lleva la micro-encuesta
de feedback post-ejercicio, y de qué tipo ("A" dificultad / "B" explicación).

Reglas anti-fatiga (server-side, ver plan de la feature):
  - Máx 1 encuesta por sesión.
  - Nunca en el primer ni el último ejercicio.
  - Alternancia: si la sesión anterior del usuario en el curso ya mostró una
    encuesta (impression logueada), esta sesión no lleva ninguna.
  - Si las últimas 3 encuestas mostradas al usuario fueron ignoradas (skip) y
    la más reciente es de los últimos 14 días, se pausa (kill-switch).
  - Nunca se le pregunta al mismo usuario por el mismo ítem dos veces.

Targeting: prioriza ejercicios con `reviewed` falso/desconocido, luego los que
acumularon menos respuestas de encuesta, con desempate aleatorio. El tipo es
"B" (si el ítem elegido tiene explicación) con 50% de probabilidad, "A" el
resto.
"""
import random
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from models import Exercise, ExerciseFeedback, Session as SessionModel

SKIP_STREAK_LEN = 3
SKIP_PAUSE_DAYS = 14


def _previous_session_had_survey(user_id: int, course_id: int, db: DBSession) -> bool:
    prev = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user_id, SessionModel.course_id == course_id)
        .order_by(SessionModel.started_at.desc())
        .first()
    )
    if prev is None:
        return False
    exists = (
        db.query(ExerciseFeedback.id)
        .filter(
            ExerciseFeedback.session_id == prev.id,
            ExerciseFeedback.question_type.in_(["A", "B"]),
        )
        .first()
    )
    return exists is not None


def _in_skip_pause(user_id: int, db: DBSession) -> bool:
    recent = (
        db.query(ExerciseFeedback)
        .filter(ExerciseFeedback.user_id == user_id, ExerciseFeedback.question_type.in_(["A", "B"]))
        .order_by(ExerciseFeedback.shown_at.desc())
        .limit(SKIP_STREAK_LEN)
        .all()
    )
    if len(recent) < SKIP_STREAK_LEN:
        return False
    if any(r.answered_at is not None for r in recent):
        return False
    newest = recent[0].shown_at
    return newest > datetime.utcnow() - timedelta(days=SKIP_PAUSE_DAYS)


def _already_asked_items(user_id: int, db: DBSession) -> set[str]:
    rows = (
        db.query(ExerciseFeedback.exercise_external_id)
        .filter(ExerciseFeedback.user_id == user_id, ExerciseFeedback.question_type.in_(["A", "B"]))
        .distinct()
        .all()
    )
    return {r[0] for r in rows}


def assign_survey(user_id: int, course_id: int, exercises: list, db: DBSession) -> dict | None:
    """`exercises` son los ExerciseInSession ya armados para la sesión (con
    `.exercise_id` = slot y `.external_id` = clave real). Devuelve
    {"exercise_id": ..., "type": "A"|"B"} o None."""
    if len(exercises) < 3:
        return None  # nunca 1er/último ejercicio: sin candidatos si hay <3

    if _previous_session_had_survey(user_id, course_id, db):
        return None
    if _in_skip_pause(user_id, db):
        return None

    asked = _already_asked_items(user_id, db)
    candidates = [
        ex for ex in exercises[1:-1]
        if getattr(ex, "external_id", "") and ex.external_id not in asked
    ]
    if not candidates:
        return None

    external_ids = [ex.external_id for ex in candidates]
    exercise_rows = {
        e.external_id: e
        for e in db.query(Exercise).filter(
            Exercise.course_id == course_id, Exercise.external_id.in_(external_ids)
        )
    }

    counts = dict(
        db.query(ExerciseFeedback.exercise_external_id, func.count(ExerciseFeedback.id))
        .filter(
            ExerciseFeedback.exercise_external_id.in_(external_ids),
            ExerciseFeedback.question_type.in_(["A", "B"]),
        )
        .group_by(ExerciseFeedback.exercise_external_id)
        .all()
    )

    unreviewed = [
        ex for ex in candidates
        if not getattr(exercise_rows.get(ex.external_id), "reviewed", None)
    ]
    pool = unreviewed if unreviewed else candidates

    min_count = min(counts.get(ex.external_id, 0) for ex in pool)
    pool = [ex for ex in pool if counts.get(ex.external_id, 0) == min_count]

    chosen = random.choice(pool)
    question_type = "B" if chosen.explanation and random.random() < 0.5 else "A"

    return {"exercise_id": chosen.exercise_id, "type": question_type}
