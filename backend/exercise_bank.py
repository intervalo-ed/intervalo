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
from models import Exercise, ItemExerciseCycle


def _normalize_graph_view(gv):
    """graph_view canónico es una lista [xmin, xmax, ymin, ymax].

    Algunos ejercicios viejos lo guardaron como objeto {xMin, xMax, yMin, yMax};
    lo convertimos a lista para que valide contra el response model (list[Any]).
    Cualquier forma inesperada cae a None (el front usa su vista por defecto).
    """
    if isinstance(gv, list):
        return gv
    if isinstance(gv, dict):
        try:
            return [gv["xMin"], gv["xMax"], gv["yMin"], gv["yMax"]]
        except KeyError:
            return None
    return None


def _parse_feedback_incorrect(raw: str) -> str | list:
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
    except Exception:
        pass
    return raw


def _row_to_dict(row: Exercise) -> dict:
    gv = None
    if row.graph_view:
        try:
            gv = _normalize_graph_view(json.loads(row.graph_view))
        except (json.JSONDecodeError, TypeError):
            pass
    gs = None
    if row.graph_shade:
        try:
            gs = _normalize_graph_view(json.loads(row.graph_shade))
        except (json.JSONDecodeError, TypeError):
            pass
    table = None
    if row.table_data:
        try:
            parsed = json.loads(row.table_data)
            if isinstance(parsed, dict):
                table = parsed
        except (json.JSONDecodeError, TypeError):
            pass
    return {
        "external_id": row.external_id,
        "exercise_type": row.exercise_type,
        "question": row.question,
        "options": [o for o in [row.option_a, row.option_b, row.option_c, row.option_d] if o is not None],
        "correct_index": row.correct_index,
        "has_math": row.has_math or False,
        "feedback_correct": row.feedback_correct,
        "feedback_incorrect": _parse_feedback_incorrect(row.feedback_incorrect),
        "graph_fn": row.graph_fn or "",
        "graph_view": gv,
        "graph_shade": gs,
        "graph_free_aspect": row.graph_free_aspect or False,
        "table": table,
        "explanation": row.explanation,
    }


def _get_or_create_cycle(
    user_id: int,
    course_id: int,
    belt: str,
    topic: str,
    exercise_type: str,
    db: DBSession,
) -> ItemExerciseCycle:
    cycle = (
        db.query(ItemExerciseCycle)
        .filter(
            ItemExerciseCycle.user_id == user_id,
            ItemExerciseCycle.course_id == course_id,
            ItemExerciseCycle.belt == belt,
            ItemExerciseCycle.topic == topic,
            ItemExerciseCycle.exercise_type == exercise_type,
        )
        .first()
    )
    if cycle is None:
        cycle = ItemExerciseCycle(
            user_id=user_id,
            course_id=course_id,
            belt=belt,
            topic=topic,
            exercise_type=exercise_type,
            served_external_ids="[]",
        )
        db.add(cycle)
        db.flush()
    return cycle


def get_exercise_db(
    course_id: int,
    belt: str,
    topic: str,
    exercise_type: str,
    db: DBSession,
    user_id: int,
    extra_exclude: set[str] | None = None,
) -> dict:
    """Returns an exercise for the (course, belt, topic, exercise_type) unit,
    avoiding repeats for this user until every exercise in the item's pool has
    been served (the "cycle"). `extra_exclude` additionally excludes
    external_ids already picked earlier in the SAME session being built (e.g.
    practice sessions can sample the same unit more than once before any
    answer is persisted).

    OJO: `extra_exclude` es un set MUTABLE que pertenece al que arma la sesión.
    Si una sesión pide de esta unidad más ejercicios que los que tiene el pool,
    esta función lo vacía para arrancar otra pasada completa (ver abajo)."""
    pool = (
        db.query(Exercise)
        .filter(
            Exercise.course_id == course_id,
            Exercise.belt == belt,
            Exercise.topic == topic,
            Exercise.exercise_type == exercise_type,
        )
        .all()
    )

    if not pool:
        raise LookupError(
            f"No hay ejercicios en BD para course_id={course_id} "
            f"belt={belt!r} topic={topic!r} exercise_type={exercise_type!r}. "
            f"Revisá el seeder (backend/seed_content.py)."
        )

    if extra_exclude is None:
        extra_exclude = set()

    cycle = _get_or_create_cycle(user_id, course_id, belt, topic, exercise_type, db)
    served = set(json.loads(cycle.served_external_ids or "[]"))
    excluded = served | extra_exclude

    available = [r for r in pool if r.external_id not in excluded]
    if not available:
        # Ciclo agotado: se sirvieron todos los del pool (salvo quizás los
        # excluidos por extra_exclude). Arranca un ciclo nuevo.
        cycle.served_external_ids = "[]"
        available = [r for r in pool if r.external_id not in extra_exclude]
    if not available:
        # La sesión que se está armando ya pidió el pool entero de esta unidad
        # (p. ej. una práctica de 50 sobre un ítem de 15 ejercicios, o un ítem
        # de 1 ejercicio muestreado dos veces). Se arranca otra pasada completa
        # en vez de sortear libre sobre el pool: así el usuario ve las 15 de
        # nuevo en orden aleatorio, en lugar del mismo ejercicio tres veces en
        # un minuto. Con pool de 1 el resultado es el mismo de siempre: repetir.
        extra_exclude.clear()
        available = list(pool)

    row = random.choice(available)
    return _row_to_dict(row)


def mark_exercise_served(
    user_id: int,
    course_id: int,
    belt: str,
    topic: str,
    exercise_type: str,
    external_id: str | None,
    db: DBSession,
) -> None:
    """Registra un external_id como servido en el ciclo vigente del ítem. Se
    llama al registrar una respuesta (el ejercicio quedó efectivamente
    completado por el usuario), no al elegirlo."""
    if not external_id:
        return
    cycle = _get_or_create_cycle(user_id, course_id, belt, topic, exercise_type, db)
    served = set(json.loads(cycle.served_external_ids or "[]"))
    if external_id not in served:
        served.add(external_id)
        cycle.served_external_ids = json.dumps(sorted(served))


def list_exercises_db(
    course_id: int,
    belt: str,
    topic: str,
    exercise_type: str,
    db: DBSession,
) -> list[dict]:
    """Returns ALL exercises for the (course, belt, topic, exercise_type) unit,
    in stable id order. Used by the test/QA session to play through every
    exercise in an item rather than sampling one."""
    rows = (
        db.query(Exercise)
        .filter(
            Exercise.course_id == course_id,
            Exercise.belt == belt,
            Exercise.topic == topic,
            Exercise.exercise_type == exercise_type,
        )
        .order_by(Exercise.id)
        .all()
    )
    return [_row_to_dict(r) for r in rows]


def course_exercise_types(
    course_id: int,
    db: DBSession,
) -> dict[tuple[str, str], list[str]]:
    """(belt, topic) → exercise_types del curso, en UNA sola query.

    El "unit set" de cada tema para el algoritmo de SR. Antes esto se pedía tema
    por tema (`topic_exercise_types`), y como casi todo lo que arma progreso o
    sesiones recorre el catálogo completo, un solo GET /user/progress disparaba
    ~50-150 queries idénticas. El curso entero entra en una sola fila por combo,
    así que se trae de una y se consulta en memoria.

    El orden dentro de cada tema es alfabético y explícito: define el orden del
    array `skills` que ve el front, y sin ORDER BY dependía de cómo cada motor
    implemente DISTINCT (SQLite ordena, Postgres no garantiza nada).
    """
    rows = (
        db.query(Exercise.belt, Exercise.topic, Exercise.exercise_type)
        .filter(Exercise.course_id == course_id)
        .distinct()
        .order_by(Exercise.belt, Exercise.topic, Exercise.exercise_type)
        .all()
    )
    out: dict[tuple[str, str], list[str]] = {}
    for belt, topic, exercise_type in rows:
        out.setdefault((belt, topic), []).append(exercise_type)
    return out
