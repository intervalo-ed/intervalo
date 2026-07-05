"""
session_store.py — Session lifecycle: build, answer, summarize.

Unit-level spaced repetition: each (belt, topic, exercise_type) triple is one
tracked unit. A topic is considered "mastered" only once *every* one of its
exercise_types has graduated into the reviewing phase.
"""

from __future__ import annotations

import random
import sys
import uuid
from dataclasses import dataclass, field
from datetime import datetime, date, time
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from algorithm import (
    Belt,
    BeltCatalog,
    SM2Config,
    SM2UnitState,
    TopicKey,
    UnitKey,
    XP_BELT_PROMOTED,
    XP_CORRECT,
    XP_STREAK_BONUS,
    XP_STREAK_INTERVAL,
    XP_TOPIC_MASTERED,
    XP_WRONG,
    belt_progress,
    build_session,
    default_catalog,
    is_topic_mastered,
    level_progress,
    load_belt_catalogs,
    quality_from_attempts,
    quality_from_time,
    update_unit_state,
)
from exercise_bank import get_exercise_db, list_exercises_db, topic_exercise_types
from sqlalchemy.orm import Session as DBSession
from models import Answer, Course, Session as SessionModel, UnitState, User
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


# ── User timezone / "today" ───────────────────────────────────────────────────
# El "día de estudio" de la repetición espaciada se define en la zona horaria del
# usuario, NO en la del servidor (UTC en Railway). Sin esto, entre las ~21:00 y la
# medianoche de Argentina (UTC−3) date.today() ya es "mañana" y habilita repasos
# antes de tiempo. Fallback a Argentina mientras el usuario no tenga tz persistida.
DEFAULT_TZ = "America/Argentina/Buenos_Aires"


def _user_zone(db: DBSession, user_id: int) -> ZoneInfo:
    user = db.get(User, user_id)
    tz_name = (user.timezone if user else None) or DEFAULT_TZ
    try:
        return ZoneInfo(tz_name)
    except ZoneInfoNotFoundError:
        return ZoneInfo(DEFAULT_TZ)


def user_today(db: DBSession, user_id: int) -> date:
    """Fecha 'hoy' en la zona horaria del usuario (fallback Argentina)."""
    return datetime.now(_user_zone(db, user_id)).date()


def _user_day_start_utc(db: DBSession, user_id: int) -> datetime:
    """Medianoche del día actual del usuario, expresada en UTC naive (para comparar
    contra columnas DateTime que guardan datetime.utcnow())."""
    tz = _user_zone(db, user_id)
    start_local = datetime.combine(datetime.now(tz).date(), time.min, tzinfo=tz)
    return start_local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)


# ── Course slug resolution ────────────────────────────────────────────────────

_COURSE_SLUG_CACHE: dict[int, str] = {}


def _get_course_slug(course_id: int, db: DBSession) -> str:
    slug = _COURSE_SLUG_CACHE.get(course_id)
    if slug is not None:
        return slug
    course = db.query(Course).filter(Course.id == course_id).first()
    if course is None:
        raise ValueError(f"Course id={course_id} no encontrado en BD")
    _COURSE_SLUG_CACHE[course_id] = course.slug
    return course.slug


def _belt_order(course_id: int, db: DBSession) -> list[Belt]:
    """Orden canónico de cinturones del curso, derivado de course.json
    (antes: constante _BELT_ORDER hardcodeada)."""
    slug = _get_course_slug(course_id, db)
    return list(load_belt_catalogs(slug).keys())


def _all_topic_keys(course_id: int, db: DBSession) -> list[TopicKey]:
    """Full ordered list of topic keys across all belts in canonical order.

    El orden respeta course.json: cinturones en orden, y dentro de cada cinturón
    los temas aplanados unidad-por-unidad (ver BeltCatalog.topics). Esto hace que
    los temas de la unidad 1 se introduzcan antes que los de la unidad 2."""
    slug = _get_course_slug(course_id, db)
    catalogs = load_belt_catalogs(slug)
    keys: list[TopicKey] = []
    for belt in catalogs:  # dict en orden de course.json
        keys.extend(catalogs[belt].all_keys())
    return keys


def _get_catalog(course_id: int, belt: Belt, db: DBSession) -> BeltCatalog:
    slug = _get_course_slug(course_id, db)
    return load_belt_catalogs(slug)[belt]


def _user_catchup_types(
    user_id: int, course_id: int, db: DBSession,
) -> set[tuple[str, str, str]]:
    """(belt, topic, exercise_type) de las units marcadas catch-up del usuario."""
    rows = db.query(
        UnitState.belt, UnitState.topic, UnitState.exercise_type,
    ).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
        UnitState.is_catchup.is_(True),
    ).all()
    return {(r.belt, r.topic, r.exercise_type) for r in rows}


def _mastery_types(
    user_id: int, course_id: int, topic_key: TopicKey, db: DBSession,
) -> list[str]:
    """exercise_types de un tema que cuentan para maestría: los del banco menos
    los que en este usuario existen como catch-up (repaso extra, no despromociona)."""
    catchup = _user_catchup_types(user_id, course_id, db)
    types = topic_exercise_types(course_id, topic_key.belt.value, topic_key.topic, db)
    return [
        et for et in types
        if (topic_key.belt.value, topic_key.topic, et) not in catchup
    ]


def _belt_mastery_types(
    user_id: int,
    course_id: int,
    catalog: BeltCatalog,
    db: DBSession,
) -> dict[TopicKey, list[str]]:
    """exercise_types por tema de un cinturón, excluyendo los catch-up del
    usuario, para que belt_progress no despromocione por un repaso extra."""
    catchup = _user_catchup_types(user_id, course_id, db)
    return {
        tk: [
            et
            for et in topic_exercise_types(course_id, tk.belt.value, tk.topic, db)
            if (tk.belt.value, tk.topic, et) not in catchup
        ]
        for tk in catalog.all_keys()
    }


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class ExerciseInSession:
    exercise_id: str
    unit_key: UnitKey
    question: str
    options: list[str]
    correct_index: int
    feedback_correct: str
    feedback_incorrect: str | list
    has_math: bool = False
    graph_fn: str = ""
    graph_view: list | None = None
    explanation: str | None = None

    @property
    def topic_key(self) -> TopicKey:
        return self.unit_key.topic_key

    @property
    def exercise_type(self) -> str:
        return self.unit_key.exercise_type


@dataclass
class SessionState:
    session_id: str
    user_name: str
    unit_states: dict[UnitKey, SM2UnitState]
    exercises: list[ExerciseInSession]
    results: list[dict] = field(default_factory=list)
    xp_session: int = 0
    streak: int = 0


_sessions: dict[str, SessionState] = {}
_default_config = SM2Config()


class DailySessionLimitError(Exception):
    """Raised when the user already started/finished their main session today."""


def _has_main_session_today(user_id: int, course_id: int, db: DBSession) -> bool:
    today_start = _user_day_start_utc(db, user_id)
    return db.query(SessionModel).filter(
        SessionModel.user_id == user_id,
        SessionModel.course_id == course_id,
        SessionModel.mode == "main",
        SessionModel.started_at >= today_start,
    ).first() is not None


def _has_pending_items(user_id: int, course_id: int, db: DBSession) -> bool:
    """Whether the user has any review item due today or earlier."""
    today = user_today(db, user_id)
    return db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
        UnitState.next_due.isnot(None),
        UnitState.next_due <= today,
    ).first() is not None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_session(session_id: str) -> Optional[SessionState]:
    return _sessions.get(session_id)


def _topic_has_any_units(
    user_id: int, course_id: int, topic_key: TopicKey, db: DBSession,
) -> bool:
    return db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
        UnitState.belt == topic_key.belt.value,
        UnitState.topic == topic_key.topic,
    ).first() is not None


def _create_topic_units(
    user_id: int,
    course_id: int,
    topic_key: TopicKey,
    db: DBSession,
    *,
    is_catchup: bool = False,
) -> list[str]:
    """Create UnitState rows for every exercise_type of the given topic."""
    types = topic_exercise_types(course_id, topic_key.belt.value, topic_key.topic, db)
    today = user_today(db, user_id)
    for et in types:
        db.add(UnitState(
            user_id=user_id,
            course_id=course_id,
            belt=topic_key.belt.value,
            topic=topic_key.topic,
            exercise_type=et,
            phase="learning",
            step_index=0,
            ease_factor=2.5,
            interval_days=1,
            repetitions=0,
            next_due=today,
            attempted=False,
            is_catchup=is_catchup,
        ))
    return types


# Ítem del ejercicio de prueba del onboarding: belt white, tema definición, léxico.
_INTRO_ITEM = TopicKey(belt=Belt.WHITE, topic="definition")
_INTRO_ITEM_EXERCISE_TYPE = "LEXI"


def seed_intro_item(user_id: int, course_id: int, correct: bool, db: DBSession) -> None:
    """Persiste el resultado del ejercicio de prueba del onboarding sobre el ítem
    white/definition/LEXI, aplicándole el mismo update SM-2 que una respuesta real.

    Acierto al primer intento (calidad 5) lo agenda para mañana, así queda fuera de
    la primera sesión. Fallo (calidad 0) lo deja pendiente para hoy, así aparece en
    la primera sesión. Crea las units del tema definición si todavía no existen; el
    resto de los temas los desbloquea la primera sesión (_ensure_active_units)."""
    if not _topic_has_any_units(user_id, course_id, _INTRO_ITEM, db):
        _create_topic_units(user_id, course_id, _INTRO_ITEM, db)
        db.flush()

    row = db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
        UnitState.belt == _INTRO_ITEM.belt.value,
        UnitState.topic == _INTRO_ITEM.topic,
        UnitState.exercise_type == _INTRO_ITEM_EXERCISE_TYPE,
    ).first()
    if row is None:
        return

    new_state = update_unit_state(
        SM2UnitState(), 5 if correct else 0, today=user_today(db, user_id)
    )
    row.phase = new_state.phase
    row.step_index = new_state.step_index
    row.ease_factor = new_state.ease_factor
    row.interval_days = new_state.interval
    row.repetitions = new_state.repetitions
    row.next_due = new_state.next_review
    row.attempted = True
    row.last_reviewed_at = datetime.utcnow()
    db.commit()


def _unlock_next_topic(
    user_id: int,
    course_id: int,
    mastered_key: TopicKey,
    db: DBSession,
) -> None:
    """When a topic graduates, unlock the next undiscovered topic in catalog order."""
    catalog_keys = _all_topic_keys(course_id, db)

    mastered_idx = None
    for idx, key in enumerate(catalog_keys):
        if key.belt == mastered_key.belt and key.topic == mastered_key.topic:
            mastered_idx = idx
            break
    if mastered_idx is None:
        return

    for idx in range(mastered_idx + 1, len(catalog_keys)):
        next_key = catalog_keys[idx]
        if not _topic_has_any_units(user_id, course_id, next_key, db):
            _create_topic_units(user_id, course_id, next_key, db)
            return


def _aggregate_topic_progress(
    rows: list[UnitState],
    expected_types: list[str],
    today: date,
) -> dict:
    """Roll per-unit state up into the topic-shaped progress dict the UI expects."""
    # Maestría/status/progress se calculan SOLO sobre units no-catchup: un ítem
    # agregado después (catch-up) se aprende como repaso extra y no debe bajar de
    # "dominado" un tema ya dominado ni inflar 'mastered' al graduarse.
    mastery_rows = [r for r in rows if not r.is_catchup]
    catchup_types = {r.exercise_type for r in rows if r.is_catchup}
    mastery_types = [et for et in expected_types if et not in catchup_types]
    total_types = len(mastery_types)
    mastered = sum(1 for r in mastery_rows if r.phase == "review")
    attempted = any(r.attempted for r in mastery_rows)
    # 'pending' incluye TODAS las filas (la catch-up vencida hoy es accionable).
    pending = any(r.next_due and r.next_due <= today for r in rows)

    if total_types == 0:
        status = "nuevo"
    elif mastered == total_types and total_types > 0:
        status = "dominado"
    elif not attempted:
        status = "nuevo"
    else:
        status = "aprendiendo"

    next_dues = [r.next_due for r in rows if r.next_due is not None]
    next_review = min(next_dues).isoformat() if next_dues else None
    aggregate_phase = "review" if (
        total_types > 0 and mastered == total_types
    ) else "learning"

    rows_by_type = {r.exercise_type: r for r in rows}
    skills = []
    for et in expected_types:
        row = rows_by_type.get(et)
        skills.append(
            {
                "exercise_type": et,
                "state": _unit_state(row),
                "next_review": (
                    row.next_due.isoformat() if row and row.next_due else None
                ),
            }
        )

    return {
        "phase": aggregate_phase,
        "step_index": mastered,
        "status": status,
        "progress": f"{mastered}/{total_types}",
        "is_pending": pending,
        "attempted": attempted,
        "next_review": next_review,
        "failed": False,
        "skills": skills,
    }


def _unit_state(row: UnitState | None) -> str:
    """Per-exercise-type learning state for the UI pills."""
    if row is None or not row.attempted:
        return "sin_empezar"
    if row.phase == "review":
        return "dominado"
    return "aprendiendo"


def _exercise_to_dict(ex: ExerciseInSession) -> dict:
    return {
        "id": ex.exercise_id,
        "question": ex.question,
        "options": ex.options,
        "correct_index": ex.correct_index,
        "has_math": ex.has_math,
        "topic": ex.topic_key.topic,
        "belt": ex.topic_key.belt.value,
        "graph_fn": ex.graph_fn,
        "graph_view": ex.graph_view,
        "feedback_correct": ex.feedback_correct,
        "feedback_incorrect": ex.feedback_incorrect,
        "explanation": ex.explanation,
    }


def _shuffle_options(ex: dict) -> tuple[list, int, list | None]:
    """Shuffle options preserving the parallel alignment of feedback_incorrect.

    feedback_incorrect is a per-option array (null on the correct index); it must
    be permuted with the exact same order as options, or hints end up attached to
    the wrong option.
    """
    order = list(range(len(ex["options"])))
    random.shuffle(order)
    shuffled = [ex["options"][i] for i in order]
    new_correct_index = order.index(ex["correct_index"])
    feedback = ex.get("feedback_incorrect")
    shuffled_feedback = (
        [feedback[i] for i in order] if isinstance(feedback, list) else feedback
    )
    return shuffled, new_correct_index, shuffled_feedback


def _build_exercise(
    idx: int,
    unit_key: UnitKey,
    course_id: int,
    db: DBSession,
) -> ExerciseInSession:
    ex = get_exercise_db(
        course_id,
        unit_key.belt.value,
        unit_key.topic,
        unit_key.exercise_type,
        db,
    )
    shuffled, new_correct_index, shuffled_feedback = _shuffle_options(ex)
    return ExerciseInSession(
        exercise_id=f"ex_{idx:03d}",
        unit_key=unit_key,
        question=ex["question"],
        options=shuffled,
        correct_index=new_correct_index,
        feedback_correct=ex["feedback_correct"],
        feedback_incorrect=shuffled_feedback,
        has_math=ex.get("has_math", False),
        graph_fn=ex.get("graph_fn", ""),
        graph_view=ex.get("graph_view"),
        explanation=ex.get("explanation"),
    )


def _rows_to_unit_states(
    rows: list[UnitState],
    today: date,
) -> tuple[dict[UnitKey, SM2UnitState], dict[UnitKey, bool]]:
    states: dict[UnitKey, SM2UnitState] = {}
    attempted: dict[UnitKey, bool] = {}
    for row in rows:
        uk = UnitKey(
            belt=Belt(row.belt),
            topic=row.topic,
            exercise_type=row.exercise_type,
        )
        states[uk] = SM2UnitState(
            phase=row.phase,
            step_index=row.step_index,
            ease_factor=row.ease_factor,
            interval=row.interval_days,
            repetitions=row.repetitions,
            next_review=row.next_due or today,
        )
        attempted[uk] = row.attempted
    return states, attempted


ACTIVE_CAP = 18


def _active_unit_count(user_id: int, course_id: int, db: DBSession) -> int:
    """Units activas = en fase de aprendizaje (nuevo + aprendiendo), no graduadas."""
    return db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
        UnitState.phase != "review",
    ).count()


def _fill_catchup_units(user_id: int, course_id: int, db: DBSession) -> None:
    """Rellena exercise_types faltantes en temas que el usuario YA tocó
    (tiene ≥1 fila). Cubre el caso de agregar un skill nuevo a un tema activo
    (p.ej. GRAF agregado retro a funciones ya en uso). Exento del tope
    ACTIVE_CAP: se desbloquean de inmediato y vencen hoy para que sean
    repasables ya.

    NO crea filas para temas con 0 filas del usuario: los temas nuevos o
    renombrados los desbloquea _ensure_active_units cuando la progresión
    normal alcanza esa posición del catálogo, respetando el tope."""
    topic_keys = _all_topic_keys(course_id, db)

    rows = db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
    ).all()
    existing = {(r.belt, r.topic, r.exercise_type) for r in rows}
    topics_with_units = {(r.belt, r.topic) for r in rows}

    today = user_today(db, user_id)
    changed = False
    for tk in topic_keys:
        # Solo rellenar temas que el usuario ya tocó: evita auto-desbloquear
        # temas nuevos (o keys renombradas) que quedan "atrás" en el catálogo.
        if (tk.belt.value, tk.topic) not in topics_with_units:
            continue
        types = topic_exercise_types(course_id, tk.belt.value, tk.topic, db)
        for et in sorted(types):
            if (tk.belt.value, tk.topic, et) in existing:
                continue
            db.add(UnitState(
                user_id=user_id,
                course_id=course_id,
                belt=tk.belt.value,
                topic=tk.topic,
                exercise_type=et,
                phase="learning",
                step_index=0,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                next_due=today,
                attempted=False,
                is_catchup=True,
            ))
            changed = True
    if changed:
        db.commit()


def _ensure_active_units(
    user_id: int,
    course_id: int,
    db: DBSession,
) -> None:
    """Desbloquea temas en orden de catálogo respetando un máximo ESTRICTO de
    ACTIVE_CAP (18) units en fase de aprendizaje. Como un tema se desbloquea
    entero (todos sus exercise_types de golpe), solo se introduce el siguiente
    tema si entra completo sin pasarse de 18; si no entra, se espera a que
    gradúen units y se liberen cupos. A medida que las units graduan (pasan a
    'review') se vuelven a desbloquear temas hasta volver a llenar los 18."""
    # Catch-up primero (exento del tope): ítems que quedaron detrás del frontier
    # ya desbloqueado deben aparecer aunque haya >=18 units activas.
    _fill_catchup_units(user_id, course_id, db)

    active = _active_unit_count(user_id, course_id, db)
    if active >= ACTIVE_CAP:
        return
    changed = False
    for tk in _all_topic_keys(course_id, db):
        if active >= ACTIVE_CAP:
            break
        if _topic_has_any_units(user_id, course_id, tk, db):
            continue
        types = topic_exercise_types(course_id, tk.belt.value, tk.topic, db)
        # Mantener el orden del catálogo: si el próximo tema no entra completo,
        # frenar (no saltearlo) para no desbloquear temas fuera de orden.
        if active + len(types) > ACTIVE_CAP:
            break
        _create_topic_units(user_id, course_id, tk, db)
        active += len(types)
        changed = True
    if changed:
        db.commit()


def _load_unit_states(
    user_id: int,
    course_id: int,
    db: DBSession,
) -> tuple[dict[UnitKey, SM2UnitState], dict[UnitKey, bool]]:
    rows = db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
    ).all()
    return _rows_to_unit_states(rows, user_today(db, user_id))


def _make_topic_introducer(
    user_id: int,
    course_id: int,
    db: DBSession,
    unit_states: dict[UnitKey, SM2UnitState],
    unit_attempted: dict[UnitKey, bool],
):
    """
    Return a callback that unlocks the next undiscovered topic on demand,
    creating UnitState rows and mirroring them into the in-memory maps so
    build_session sees them. Returns [] when the catalog is exhausted.
    """
    catalog_keys = _all_topic_keys(course_id, db)
    cursor = {"idx": 0}

    def _introduce() -> list[UnitKey]:
        while cursor["idx"] < len(catalog_keys):
            tk = catalog_keys[cursor["idx"]]
            cursor["idx"] += 1
            if _topic_has_any_units(user_id, course_id, tk, db):
                continue
            types = _create_topic_units(user_id, course_id, tk, db)
            db.commit()
            new_keys: list[UnitKey] = []
            for et in types:
                uk = UnitKey(belt=tk.belt, topic=tk.topic, exercise_type=et)
                unit_states[uk] = SM2UnitState()
                unit_attempted[uk] = False
                new_keys.append(uk)
            return new_keys
        return []

    return _introduce


# ── Public API ────────────────────────────────────────────────────────────────

def create_session_db(user_id: int, course_id: int, db: DBSession) -> dict:
    """Create a new session, picking the next batch of exercises with the SR algorithm."""
    # One main session per day, EXCEPT the user can keep reviewing while there
    # are still pending (due) items. Once nothing's due, the daily gate applies.
    if _has_main_session_today(user_id, course_id, db) and not _has_pending_items(
        user_id, course_id, db
    ):
        raise DailySessionLimitError(
            "Ya completaste tus repasos de hoy. Volvé mañana."
        )

    _ensure_active_units(user_id, course_id, db)
    unit_states, unit_attempted = _load_unit_states(user_id, course_id, db)

    # El desbloqueo lo maneja _ensure_active_units (cap de 15); la sesión solo
    # arma con lo que está activo/vencido, sin introducir temas extra.
    session_units = build_session(
        unit_states,
        unit_attempted=unit_attempted,
        introduce_new_topic=None,
    )

    exercises = [
        _build_exercise(idx, su.key, course_id, db)
        for idx, su in enumerate(session_units)
    ]

    db_session = SessionModel(
        user_id=user_id,
        course_id=course_id,
        started_at=datetime.utcnow(),
        exercises_total=len(exercises),
        mode="main",
    )
    db.add(db_session)
    db.flush()
    session_id_db = db_session.id
    db.commit()

    session_id_str = str(session_id_db)
    _sessions[session_id_str] = SessionState(
        session_id=session_id_str,
        user_name="",
        unit_states=unit_states,
        exercises=exercises,
    )

    return {
        "session_id": session_id_str,
        "user_name": "",
        "total": len(exercises),
        "exercises": [_exercise_to_dict(ex) for ex in exercises],
    }


def create_zen_session_db(
    user_id: int,
    course_id: int,
    belt: str,
    topics: list[str],
    count: int,
    db: DBSession,
) -> dict:
    """Zen mode: random exercises from selected topics of a single unit, no SR tracking."""
    slug = _get_course_slug(course_id, db)
    all_catalogs = load_belt_catalogs(slug)

    try:
        belt_enum = Belt(belt)
    except ValueError:
        raise ValueError(f"Unidad desconocida: {belt}")
    catalog = all_catalogs.get(belt_enum)
    if not catalog:
        raise ValueError(f"Unidad desconocida: {belt}")

    wanted = set(topics)
    candidate_units: list[UnitKey] = []
    for tk in catalog.all_keys():
        if tk.topic not in wanted:
            continue
        for et in topic_exercise_types(course_id, tk.belt.value, tk.topic, db):
            candidate_units.append(
                UnitKey(belt=tk.belt, topic=tk.topic, exercise_type=et)
            )

    if not candidate_units:
        raise ValueError(f"No hay ejercicios disponibles para los temas seleccionados: {topics}")

    sampled = random.choices(candidate_units, k=count)
    exercises = [
        _build_exercise(idx, uk, course_id, db)
        for idx, uk in enumerate(sampled)
    ]

    db_session = SessionModel(
        user_id=user_id, course_id=course_id,
        started_at=datetime.utcnow(), exercises_total=len(exercises),
        mode="zen",
    )
    db.add(db_session)
    db.flush()
    db.commit()

    session_id_str = str(db_session.id)
    _sessions[session_id_str] = SessionState(
        session_id=session_id_str,
        user_name="",
        unit_states={uk: SM2UnitState() for uk in set(sampled)},
        exercises=exercises,
    )

    return {
        "session_id": session_id_str,
        "user_name": "",
        "total": len(exercises),
        "exercises": [_exercise_to_dict(ex) for ex in exercises],
    }


def create_test_session_db(
    user_id: int,
    course_id: int,
    items: list[dict],
    db: DBSession,
) -> dict:
    """QA/test mode: play through EVERY exercise in each selected item
    (belt, topic, exercise_type), in order. No SR tracking, like zen.

    `items` is a list of {belt, topic, exercise_type} dicts.
    """
    exercises: list[ExerciseInSession] = []
    idx = 0
    for item in items:
        belt = item.get("belt")
        topic = item.get("topic")
        et = item.get("exercise_type")
        try:
            belt_enum = Belt(belt)
        except ValueError:
            raise ValueError(f"Unidad desconocida: {belt}")
        unit_key = UnitKey(belt=belt_enum, topic=topic, exercise_type=et)
        rows = list_exercises_db(course_id, belt, topic, et, db)
        for ex in rows:
            shuffled, new_correct_index, shuffled_feedback = _shuffle_options(ex)
            exercises.append(
                ExerciseInSession(
                    exercise_id=f"ex_{idx:03d}",
                    unit_key=unit_key,
                    question=ex["question"],
                    options=shuffled,
                    correct_index=new_correct_index,
                    feedback_correct=ex["feedback_correct"],
                    feedback_incorrect=shuffled_feedback,
                    has_math=ex.get("has_math", False),
                    graph_fn=ex.get("graph_fn", ""),
                    graph_view=ex.get("graph_view"),
                    explanation=ex.get("explanation"),
                )
            )
            idx += 1

    if not exercises:
        raise ValueError("No hay ejercicios para los items seleccionados.")

    # Orden aleatorio respecto al orden de contenido de los JSONs.
    random.shuffle(exercises)

    db_session = SessionModel(
        user_id=user_id, course_id=course_id,
        started_at=datetime.utcnow(), exercises_total=len(exercises),
        mode="zen",  # reuse zen guard: no SR tracking, XP only
    )
    db.add(db_session)
    db.flush()
    db.commit()

    session_id_str = str(db_session.id)
    _sessions[session_id_str] = SessionState(
        session_id=session_id_str,
        user_name="",
        unit_states={ex.unit_key: SM2UnitState() for ex in exercises},
        exercises=exercises,
    )

    return {
        "session_id": session_id_str,
        "user_name": "",
        "total": len(exercises),
        "exercises": [_exercise_to_dict(ex) for ex in exercises],
    }


def _reconstruct_session_state(
    session_id_db: int,
    user_id: int,
    course_id: int,
    db: DBSession,
) -> SessionState:
    """Rebuild SessionState from DB when the in-memory cache is cold."""
    rows = db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
    ).all()
    unit_states, unit_attempted = _rows_to_unit_states(rows, user_today(db, user_id))

    session_units = build_session(unit_states, unit_attempted=unit_attempted)
    exercises = [
        _build_exercise(idx, su.key, course_id, db)
        for idx, su in enumerate(session_units)
    ]

    streak = 0
    recent = (
        db.query(Answer.is_correct)
        .filter(Answer.session_id == session_id_db)
        .order_by(Answer.answered_at.desc())
        .all()
    )
    for row in recent:
        if row.is_correct:
            streak += 1
        else:
            break

    return SessionState(
        session_id=str(session_id_db),
        user_name="",
        unit_states=unit_states,
        exercises=exercises,
        streak=streak,
    )


def record_answer_db(
    session_id_db: int,
    user_id: int,
    course_id: int,
    exercise_id: str,
    answer_index: int,
    attempts: int,
    response_time_s: float,
    db: DBSession,
) -> dict:
    """Record an answer, update SM-2 state for the unit, return feedback."""
    db_session = db.query(SessionModel).filter(
        SessionModel.id == session_id_db,
        SessionModel.user_id == user_id,
    ).first()
    if not db_session:
        raise KeyError(f"Sesión {session_id_db} no encontrada o no pertenece al usuario.")

    session_id_str = str(session_id_db)
    state = _sessions.get(session_id_str)
    if state is None:
        state = _reconstruct_session_state(session_id_db, user_id, course_id, db)
        _sessions[session_id_str] = state

    exercise = next((e for e in state.exercises if e.exercise_id == exercise_id), None)
    if exercise is None:
        raise KeyError(f"Ejercicio '{exercise_id}' no encontrado en la sesión.")

    unit_key = exercise.unit_key
    is_correct = attempts <= 3
    # Solo el acierto limpio (al primer intento) otorga XP de correcta y suma
    # racha. Si hubo al menos un error previo, aunque después se acierte, se
    # otorga el XP de intento (1) y se corta la racha.
    first_try = attempts == 1
    # quality_score guardado (semántica de resumen: 5 ⟺ primer intento).
    quality = quality_from_attempts(attempts)

    current_state = state.unit_states.get(unit_key, SM2UnitState())

    # Calidad que alimenta SM-2 (distinta del quality_score guardado):
    #  - Aprendizaje: solo avanza con acierto al primer intento (5); si no, 0
    #    (reinicia al paso 1 ese mismo día).
    #  - Retención: si acertó al primer intento, la calidad la define el tiempo
    #    (<10s→5, <30s→4, resto→3) y modula el ease factor; si pifió, 0 (repasa
    #    el mismo día sin salir de la fase de retención).
    if current_state.phase == "review":
        sm2_quality = quality_from_time(response_time_s) if first_try else 0
    else:
        sm2_quality = 5 if first_try else 0

    new_state = update_unit_state(
        current_state, sm2_quality, today=user_today(db, user_id)
    )
    state.unit_states[unit_key] = new_state

    if first_try:
        state.streak += 1
        xp_earned = XP_CORRECT
        if state.streak % XP_STREAK_INTERVAL == 0:
            xp_earned += XP_STREAK_BONUS
    else:
        state.streak = 0
        xp_earned = XP_WRONG

    db_us = db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
        UnitState.belt == unit_key.belt.value,
        UnitState.topic == unit_key.topic,
        UnitState.exercise_type == unit_key.exercise_type,
    ).first()

    # Zen mode is free practice: it only awards XP and must not touch the
    # student's spaced-repetition progress (phase, interval, due date, mastery).
    if db_us and db_session.mode != "zen":
        old_phase = db_us.phase
        db_us.phase = new_state.phase
        db_us.step_index = new_state.step_index
        db_us.ease_factor = new_state.ease_factor
        db_us.interval_days = new_state.interval
        db_us.repetitions = new_state.repetitions
        db_us.next_due = new_state.next_review
        db_us.attempted = True
        db_us.updated_at = datetime.utcnow()
        db_us.last_reviewed_at = datetime.utcnow()

        if old_phase == "learning" and new_state.phase == "review":
            topic_key = unit_key.topic_key
            # Maestría/promoción ignoran las units catch-up (repaso extra): un ítem
            # agregado después no debe condicionar ni despromocionar lo ya logrado.
            expected_types = _mastery_types(user_id, course_id, topic_key, db)
            if is_topic_mastered(state.unit_states, topic_key, expected_types):
                xp_earned += XP_TOPIC_MASTERED
                _ensure_active_units(user_id, course_id, db)

                belt_catalog = _get_catalog(course_id, topic_key.belt, db)
                belt_types_map = _belt_mastery_types(
                    user_id, course_id, belt_catalog, db,
                )
                if belt_progress(
                    state.unit_states, belt_catalog, topic_types=belt_types_map,
                ).promoted:
                    xp_earned += XP_BELT_PROMOTED

    state.xp_session += xp_earned

    db.add(Answer(
        session_id=session_id_db,
        user_id=user_id,
        course_id=course_id,
        exercise_id=exercise_id,
        belt=unit_key.belt.value,
        topic=unit_key.topic,
        exercise_type=unit_key.exercise_type,
        is_correct=is_correct,
        response_time_ms=int(response_time_s * 1000),
        quality_score=quality,
        xp_earned=xp_earned,
        answered_at=datetime.utcnow(),
    ))

    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.total_xp = (user.total_xp or 0) + xp_earned

    if is_correct:
        db_session.exercises_correct = (db_session.exercises_correct or 0) + 1
    db.commit()

    state.results.append({
        "exercise_id": exercise_id,
        "unit_key": unit_key,
        "is_correct": is_correct,
        "quality": quality,
    })

    if is_correct:
        feedback = exercise.feedback_correct
    elif isinstance(exercise.feedback_incorrect, list):
        feedback = exercise.explanation or ""
    else:
        feedback = exercise.feedback_incorrect
    return {
        "correct": is_correct,
        "quality": quality,
        "feedback": feedback,
        "xp_earned": xp_earned,
    }


def _topic_rows_index(
    rows: list[UnitState],
) -> dict[tuple[str, str], list[UnitState]]:
    out: dict[tuple[str, str], list[UnitState]] = {}
    for r in rows:
        out.setdefault((r.belt, r.topic), []).append(r)
    return out


def get_user_progress_db(user_id: int, course_id: int, db: DBSession) -> dict:
    """Return topic-level progress (rolled up from per-unit state) and level info."""
    catalog_keys = _all_topic_keys(course_id, db)

    _ensure_active_units(user_id, course_id, db)

    rows = db.query(UnitState).filter(
        UnitState.user_id == user_id, UnitState.course_id == course_id,
    ).all()
    rows_by_topic = _topic_rows_index(rows)

    today = user_today(db, user_id)
    topic_states: dict[str, dict] = {}
    for key in catalog_keys:
        topic_rows = rows_by_topic.get((key.belt.value, key.topic))
        if not topic_rows:
            continue
        expected = topic_exercise_types(course_id, key.belt.value, key.topic, db)
        topic_states[f"{key.belt.value}/{key.topic}"] = _aggregate_topic_progress(topic_rows, expected, today)

    user = db.query(User).filter(User.id == user_id).first()
    total_xp = user.total_xp if user else 0
    lp = level_progress(total_xp)

    return {
        "topic_states": topic_states,
        "level_info": {
            "level": lp.level,
            "xp_in_level": lp.xp_in_level,
            "xp_required": lp.xp_required,
            "progress_pct": lp.progress_pct,
        },
        "main_session_done_today": _has_main_session_today(user_id, course_id, db),
    }


def get_summary_db(
    session_id_db: int,
    user_id: int,
    db: DBSession,
) -> dict:
    """Finalize the session and return a summary."""
    db_session = db.query(SessionModel).filter(
        SessionModel.id == session_id_db,
        SessionModel.user_id == user_id,
    ).first()
    if not db_session:
        raise KeyError(f"Sesión {session_id_db} no encontrada.")

    answers = db.query(Answer).filter(Answer.session_id == session_id_db).all()
    total = len(answers)
    correct_count = sum(1 for a in answers if a.is_correct)
    # "Correctos" = acertados al primer intento. quality_score == 5 ⟺ attempts == 1
    # (ver quality_from_attempts). El resto, aunque se acierte luego, no cuenta.
    first_try_correct = sum(1 for a in answers if a.quality_score == 5)
    incorrect_count = total - correct_count

    items = [
        {
            "topic": a.topic,
            "belt": a.belt,
            "correct": a.is_correct,
        }
        for a in answers
    ]

    course_id = db_session.course_id
    catalog_keys = _all_topic_keys(course_id, db)

    rows = db.query(UnitState).filter(
        UnitState.user_id == user_id, UnitState.course_id == course_id,
    ).all()
    rows_by_topic = _topic_rows_index(rows)

    failed_in_session: set[tuple[str, str]] = set()
    for a in answers:
        if not a.is_correct:
            failed_in_session.add((a.belt, a.topic))

    today = user_today(db, user_id)
    topic_states: dict[str, dict] = {}
    unit_states_map, _ = _rows_to_unit_states(rows, today)

    for key in catalog_keys:
        topic_rows = rows_by_topic.get((key.belt.value, key.topic))
        if not topic_rows:
            continue
        expected = topic_exercise_types(course_id, key.belt.value, key.topic, db)
        ts_dict = _aggregate_topic_progress(topic_rows, expected, today)
        if (key.belt.value, key.topic) in failed_in_session:
            ts_dict["failed"] = True
        topic_states[f"{key.belt.value}/{key.topic}"] = ts_dict

    # Belt progress for the highest belt touched in this session
    if answers:
        belts_in_session = {a.belt for a in answers}
        order = _belt_order(course_id, db)
        focus_belt_str = max(
            belts_in_session,
            key=lambda b: order.index(Belt(b)),
        )
        focus_belt = Belt(focus_belt_str)
    else:
        focus_belt = Belt.WHITE

    belt_catalog = _get_catalog(course_id, focus_belt, db)
    belt_types_map = _belt_mastery_types(user_id, course_id, belt_catalog, db)
    bp = belt_progress(unit_states_map, belt_catalog, topic_types=belt_types_map)

    xp_earned = sum(a.xp_earned or 0 for a in answers)
    db_session.finished_at = datetime.utcnow()
    db_session.xp_earned = xp_earned
    db.commit()

    user = db.query(User).filter(User.id == user_id).first()
    total_xp = user.total_xp if user else 0
    lp = level_progress(total_xp)

    return {
        "session_id": str(session_id_db),
        "user_name": "",
        "total": total,
        "correct": correct_count,
        "first_try_correct": first_try_correct,
        "incorrect": incorrect_count,
        "items": items,
        "topic_states": topic_states,
        "belt_progress": {
            "mastered": bp.mastered,
            "total": bp.total,
            "promoted": bp.promoted,
        },
        "xp_earned": xp_earned,
        "level_info": {
            "level": lp.level,
            "xp_in_level": lp.xp_in_level,
            "xp_required": lp.xp_required,
            "xp_missing": lp.xp_missing,
            "progress_pct": lp.progress_pct,
        },
    }
