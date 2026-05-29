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
    update_unit_state,
)
from exercise_bank import get_exercise_db, topic_exercise_types
from sqlalchemy.orm import Session as DBSession
from models import Answer, Course, Session as SessionModel, UnitState, User


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


_BELT_ORDER = [Belt.WHITE, Belt.BLUE, Belt.VIOLET, Belt.BROWN, Belt.BLACK]


def _all_topic_keys(course_id: int, db: DBSession) -> list[TopicKey]:
    """Full ordered list of topic keys across all belts in canonical order."""
    slug = _get_course_slug(course_id, db)
    catalogs = load_belt_catalogs(slug)
    keys: list[TopicKey] = []
    for belt in _BELT_ORDER:
        if belt in catalogs:
            keys.extend(catalogs[belt].all_keys())
    return keys


def _get_catalog(course_id: int, belt: Belt, db: DBSession) -> BeltCatalog:
    slug = _get_course_slug(course_id, db)
    return load_belt_catalogs(slug)[belt]


def _belt_topic_types(
    course_id: int,
    catalog: BeltCatalog,
    db: DBSession,
) -> dict[TopicKey, list[str]]:
    """Discover the exercise_types declared per topic for one belt."""
    return {
        tk: topic_exercise_types(course_id, tk.belt.value, tk.topic, db)
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
    feedback_incorrect: str
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
    today_start = datetime.combine(date.today(), time.min)
    return db.query(SessionModel).filter(
        SessionModel.user_id == user_id,
        SessionModel.course_id == course_id,
        SessionModel.mode == "main",
        SessionModel.started_at >= today_start,
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
) -> list[str]:
    """Create UnitState rows for every exercise_type of the given topic."""
    types = topic_exercise_types(course_id, topic_key.belt.value, topic_key.topic, db)
    today = date.today()
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
        ))
    return types


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
) -> dict:
    """Roll per-unit state up into the topic-shaped progress dict the UI expects."""
    total_types = len(expected_types)
    mastered = sum(1 for r in rows if r.phase == "review")
    attempted = any(r.attempted for r in rows)
    today = date.today()
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
    units = [
        {"exercise_type": et, "state": _unit_state(rows_by_type.get(et))}
        for et in expected_types
    ]

    return {
        "phase": aggregate_phase,
        "step_index": mastered,
        "status": status,
        "progress": f"{mastered}/{total_types}",
        "is_pending": pending,
        "attempted": attempted,
        "next_review": next_review,
        "failed": False,
        "units": units,
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
    correct_answer = ex["options"][ex["correct_index"]]
    shuffled = ex["options"][:]
    random.shuffle(shuffled)
    new_correct_index = shuffled.index(correct_answer)
    return ExerciseInSession(
        exercise_id=f"ex_{idx:03d}",
        unit_key=unit_key,
        question=ex["question"],
        options=shuffled,
        correct_index=new_correct_index,
        feedback_correct=ex["feedback_correct"],
        feedback_incorrect=ex["feedback_incorrect"],
        has_math=ex.get("has_math", False),
        graph_fn=ex.get("graph_fn", ""),
        graph_view=ex.get("graph_view"),
        explanation=ex.get("explanation"),
    )


def _rows_to_unit_states(
    rows: list[UnitState],
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
            next_review=row.next_due or date.today(),
        )
        attempted[uk] = row.attempted
    return states, attempted


def _bootstrap_first_topic_if_empty(
    user_id: int,
    course_id: int,
    db: DBSession,
) -> None:
    """Seed the very first topic when a user has no units yet."""
    has_any = db.query(UnitState).filter(
        UnitState.user_id == user_id,
        UnitState.course_id == course_id,
    ).first() is not None
    if has_any:
        return
    for tk in _all_topic_keys(course_id, db):
        _create_topic_units(user_id, course_id, tk, db)
        break
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
    return _rows_to_unit_states(rows)


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
    if _has_main_session_today(user_id, course_id, db):
        raise DailySessionLimitError(
            "Ya empezaste tu sesión de hoy. Volvé mañana."
        )

    _bootstrap_first_topic_if_empty(user_id, course_id, db)
    unit_states, unit_attempted = _load_unit_states(user_id, course_id, db)

    introduce_new_topic = _make_topic_introducer(
        user_id, course_id, db, unit_states, unit_attempted,
    )

    session_units = build_session(
        unit_states,
        unit_attempted=unit_attempted,
        introduce_new_topic=introduce_new_topic,
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
    belts: list[str],
    count: int,
    db: DBSession,
) -> dict:
    """Zen mode: random exercises from selected belts, no SR tracking."""
    slug = _get_course_slug(course_id, db)
    all_catalogs = load_belt_catalogs(slug)

    candidate_units: list[UnitKey] = []
    for belt_str in belts:
        try:
            belt_enum = Belt(belt_str)
        except ValueError:
            continue
        catalog = all_catalogs.get(belt_enum)
        if not catalog:
            continue
        for tk in catalog.all_keys():
            for et in topic_exercise_types(course_id, tk.belt.value, tk.topic, db):
                candidate_units.append(
                    UnitKey(belt=tk.belt, topic=tk.topic, exercise_type=et)
                )

    if not candidate_units:
        raise ValueError(f"No hay topics disponibles para los cinturones: {belts}")

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
    unit_states, unit_attempted = _rows_to_unit_states(rows)

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
    quality = quality_from_attempts(attempts)

    current_state = state.unit_states.get(unit_key, SM2UnitState())
    new_state = update_unit_state(current_state, quality)
    state.unit_states[unit_key] = new_state

    if is_correct:
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

    if db_us:
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
            expected_types = topic_exercise_types(
                course_id, topic_key.belt.value, topic_key.topic, db,
            )
            if is_topic_mastered(state.unit_states, topic_key, expected_types):
                xp_earned += XP_TOPIC_MASTERED
                _unlock_next_topic(user_id, course_id, topic_key, db)

                belt_catalog = _get_catalog(course_id, topic_key.belt, db)
                belt_types_map = _belt_topic_types(course_id, belt_catalog, db)
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

    feedback = exercise.feedback_correct if is_correct else exercise.feedback_incorrect
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

    _bootstrap_first_topic_if_empty(user_id, course_id, db)

    rows = db.query(UnitState).filter(
        UnitState.user_id == user_id, UnitState.course_id == course_id,
    ).all()
    rows_by_topic = _topic_rows_index(rows)

    topic_states: dict[str, dict] = {}
    for key in catalog_keys:
        topic_rows = rows_by_topic.get((key.belt.value, key.topic))
        if not topic_rows:
            continue
        expected = topic_exercise_types(course_id, key.belt.value, key.topic, db)
        topic_states[key.topic] = _aggregate_topic_progress(topic_rows, expected)

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

    topic_states: dict[str, dict] = {}
    unit_states_map, _ = _rows_to_unit_states(rows)

    for key in catalog_keys:
        topic_rows = rows_by_topic.get((key.belt.value, key.topic))
        if not topic_rows:
            continue
        expected = topic_exercise_types(course_id, key.belt.value, key.topic, db)
        ts_dict = _aggregate_topic_progress(topic_rows, expected)
        if (key.belt.value, key.topic) in failed_in_session:
            ts_dict["failed"] = True
        topic_states[key.topic] = ts_dict

    # Belt progress for the highest belt touched in this session
    if answers:
        belts_in_session = {a.belt for a in answers}
        focus_belt_str = max(
            belts_in_session,
            key=lambda b: _BELT_ORDER.index(Belt(b)),
        )
        focus_belt = Belt(focus_belt_str)
    else:
        focus_belt = Belt.WHITE

    belt_catalog = _get_catalog(course_id, focus_belt, db)
    belt_types_map = _belt_topic_types(course_id, belt_catalog, db)
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
