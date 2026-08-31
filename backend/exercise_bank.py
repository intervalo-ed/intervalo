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
from models import Exercise, ItemDifficulty, ItemExerciseCycle, User


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
    table_boost: float = 1.0,
    require_table: bool = False,
) -> dict:
    """Returns an exercise for the (course, belt, topic, exercise_type) unit,
    avoiding repeats for this user until every exercise in the item's pool has
    been served (the "cycle"). `extra_exclude` additionally excludes
    external_ids already picked earlier in the SAME session being built (e.g.
    practice sessions can sample the same unit more than once before any
    answer is persisted).

    OJO: `extra_exclude` es un set MUTABLE que pertenece al que arma la sesión.
    Si una sesión pide de esta unidad más ejercicios que los que tiene el pool,
    esta función lo vacía para arrancar otra pasada completa (ver abajo).

    `table_boost` (>1) sesga el sorteo hacia los ejercicios con tabla, y
    `require_table` los exige si la unidad tiene alguno disponible. Los dos
    actúan SOLO sobre el sorteo dentro de lo que el ciclo ya dejó disponible:
    cambian el orden en que se sirve el pool, nunca su composición. Sobre un
    ciclo completo el usuario ve exactamente los mismos ejercicios que antes
    (ver session_store._table_boost para el porqué)."""
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
    # served_list preserva el orden real de servido (append-only, ver
    # mark_exercise_served) — lo necesitamos para saber cuál fue el último y
    # no repetirlo apenas se resetea el ciclo (ver más abajo).
    served_list = json.loads(cycle.served_external_ids or "[]")
    served = set(served_list)
    excluded = served | extra_exclude

    available = [r for r in pool if r.external_id not in excluded]
    if not available:
        # Ciclo agotado: se sirvieron todos los del pool (salvo quizás los
        # excluidos por extra_exclude). Arranca un ciclo nuevo, pero sin
        # repetir el último servido: un sorteo uniforme sobre el pool completo
        # lo dejaba volver a salir de inmediato (hasta 8,3% de las veces con
        # pool 12). Ver 2026-08-26-motor-de-sesiones.md §9.
        ultimo = served_list[-1] if served_list else None
        cycle.served_external_ids = "[]"
        available = [
            r for r in pool
            if r.external_id not in extra_exclude and r.external_id != ultimo
        ]
    if not available:
        # La sesión que se está armando ya pidió el pool entero de esta unidad
        # (p. ej. una práctica de 50 sobre un ítem de 15 ejercicios, o un ítem
        # de 1 ejercicio muestreado dos veces). Se arranca otra pasada completa
        # en vez de sortear libre sobre el pool: así el usuario ve las 15 de
        # nuevo en orden aleatorio, en lugar del mismo ejercicio tres veces en
        # un minuto. Con pool de 1 el resultado es el mismo de siempre: repetir.
        extra_exclude.clear()
        available = list(pool)

    con_tabla = [r for r in available if r.table_data]
    if require_table and con_tabla:
        # Garantía de la primera sesión: si esta unidad puede dar tabla, la da.
        # Si no tiene ninguna, no pasa nada y la garantía la cubre otra unidad.
        available = con_tabla
    elif table_boost > 1.0 and con_tabla:
        pesos = [table_boost if r.table_data else 1.0 for r in available]
        return _row_to_dict(random.choices(available, weights=pesos, k=1)[0])

    row = _pick_ranked(
        available, len(pool), len(served), user_id, course_id, belt, topic, exercise_type, db
    )
    return _row_to_dict(row)


# ── Política de orden dentro del pool elegible (Elo + rampa + exploración) ──
# Ver 2026-08-26-motor-de-sesiones.md §8. Sobre un ciclo completo el usuario ve
# exactamente los mismos ejercicios que con sorteo uniforme: esto cambia el
# ORDEN, no la composición.
EXPLORATION_EPS = 0.15
TARGET_BAND_CENTER = 0.75


def _pick_ranked(
    available: list[Exercise],
    pool_size: int,
    served_count: int,
    user_id: int,
    course_id: int,
    belt: str,
    topic: str,
    exercise_type: str,
    db: DBSession,
) -> Exercise:
    if len(available) == 1:
        return available[0]

    if random.random() < EXPLORATION_EPS:
        # Exploración: el menos observado del pool elegible, desempate al azar.
        min_n = min(r.difficulty_n or 0 for r in available)
        candidatos = [r for r in available if (r.difficulty_n or 0) == min_n]
        return random.choice(candidatos)

    cycle_progress = served_count / pool_size if pool_size else 0.0
    if cycle_progress < 1 / 3:
        # Primer tercio del ciclo: el más fácil primero.
        min_diff = min(r.difficulty or 0.0 for r in available)
        candidatos = [r for r in available if (r.difficulty or 0.0) == min_diff]
        return random.choice(candidatos)

    # Resto del ciclo: el más cercano a la banda objetivo (p̂ ≈ 0,75).
    from algorithm.elo import predict as elo_predict

    user = db.query(User).filter(User.id == user_id).first()
    theta_u = user.ability if user else 0.0
    item_row = (
        db.query(ItemDifficulty)
        .filter(
            ItemDifficulty.course_id == course_id,
            ItemDifficulty.belt == belt,
            ItemDifficulty.topic == topic,
            ItemDifficulty.exercise_type == exercise_type,
        )
        .first()
    )
    item_diff = item_row.difficulty if item_row else 0.0

    def distancia(r: Exercise) -> float:
        n_x = r.difficulty_n or 0
        p_hat = elo_predict(theta_u, r.difficulty or 0.0, item_diff, n_x)
        return abs(p_hat - TARGET_BAND_CENTER)

    return min(available, key=distancia)


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
    # Lista append-only en orden de servido (no set/sorted): get_exercise_db
    # necesita saber cuál fue el ÚLTIMO para no repetirlo al resetear el ciclo.
    served_list = json.loads(cycle.served_external_ids or "[]")
    if external_id not in served_list:
        served_list.append(external_id)
        cycle.served_external_ids = json.dumps(served_list)


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
