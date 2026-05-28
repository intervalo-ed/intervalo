"""
session_store.py — Session lifecycle: build, answer, summarize.

Topic-level spaced repetition: each (belt, topic) pair is one tracked unit.
"""

from __future__ import annotations

import random
import sys
import uuid
from dataclasses import dataclass, field
from datetime import datetime, date
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from algorithm import (
    Belt,
    BeltCatalog,
    SM2Config,
    SM2TopicState,
    TopicKey,
    XP_BELT_PROMOTED,
    XP_CORRECT,
    XP_STREAK_BONUS,
    XP_STREAK_INTERVAL,
    XP_TOPIC_MASTERED,
    XP_WRONG,
    belt_progress,
    build_session,
    default_catalog,
    level_progress,
    load_belt_catalogs,
    quality_from_correctness,
    update_topic_state,
)
from exercise_bank import get_exercise_db
from sqlalchemy.orm import Session as DBSession
from models import Answer, Course, Session as SessionModel, TopicState, User


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


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class ExerciseInSession:
    exercise_id: str
    topic_key: TopicKey
    question: str
    options: list[str]
    correct_index: int
    feedback_correct: str
    feedback_incorrect: str
    has_math: bool = False
    graph_fn: str = ""
    graph_view: list | None = None
    explanation: str | None = None


@dataclass
class SessionState:
    session_id: str
    user_name: str
    topic_states: dict[TopicKey, SM2TopicState]
    exercises: list[ExerciseInSession]
    results: list[dict] = field(default_factory=list)
    xp_session: int = 0
    streak: int = 0


_sessions: dict[str, SessionState] = {}
_default_config = SM2Config()
MAX_UNLOCKED_TOPICS = 5


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_session(session_id: str) -> Optional[SessionState]:
    return _sessions.get(session_id)


def _unlocked_count(user_id: int, course_id: int, db: DBSession) -> int:
    """Count topics in the learning phase (both new and in-progress)."""
    return db.query(TopicState).filter(
        TopicState.user_id == user_id,
        TopicState.course_id == course_id,
        TopicState.phase == "learning",
    ).count()


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
        exists = db.query(TopicState).filter(
            TopicState.user_id == user_id,
            TopicState.course_id == course_id,
            TopicState.belt == next_key.belt.value,
            TopicState.topic == next_key.topic,
        ).first()
        if not exists:
            db.add(TopicState(
                user_id=user_id,
                course_id=course_id,
                belt=next_key.belt.value,
                topic=next_key.topic,
                phase="learning",
                step_index=0,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                next_due=date.today(),
                attempted=False,
            ))
            return


def _serialize_topic_state(ts: TopicState, num_steps: int) -> dict:
    """Project a DB TopicState row into the API-facing dict."""
    if ts.phase == "learning":
        if not ts.attempted:
            status = "nuevo"
            progress = f"0/{num_steps}"
        else:
            status = "aprendiendo"
            progress = f"{ts.step_index}/{num_steps}"
    else:
        status = "dominado"
        progress = f"{num_steps}/{num_steps}"

    is_pending = bool(ts.next_due and ts.next_due <= date.today())
    return {
        "phase": ts.phase,
        "step_index": ts.step_index,
        "status": status,
        "progress": progress,
        "is_pending": is_pending,
        "attempted": ts.attempted,
        "next_review": ts.next_due.isoformat() if ts.next_due else None,
        "failed": False,
    }


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
    topic_key: TopicKey,
    course_id: int,
    db: DBSession,
) -> ExerciseInSession:
    ex = get_exercise_db(
        course_id,
        topic_key.belt.value,
        topic_key.topic,
        _default_config.graph_exercise_probability,
        db,
    )
    correct_answer = ex["options"][ex["correct_index"]]
    shuffled = ex["options"][:]
    random.shuffle(shuffled)
    new_correct_index = shuffled.index(correct_answer)
    return ExerciseInSession(
        exercise_id=f"ex_{idx:03d}",
        topic_key=topic_key,
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


def _load_or_unlock_topic_states(
    user_id: int,
    course_id: int,
    db: DBSession,
) -> tuple[dict[TopicKey, SM2TopicState], dict[TopicKey, bool]]:
    """
    Load existing TopicState rows; create new ones up to MAX_UNLOCKED_TOPICS.
    Returns (topic_states, topic_attempted) maps for build_session().
    """
    catalog_keys = _all_topic_keys(course_id, db)
    topic_states: dict[TopicKey, SM2TopicState] = {}
    topic_attempted: dict[TopicKey, bool] = {}
    unlocked = _unlocked_count(user_id, course_id, db)

    for key in catalog_keys:
        row = db.query(TopicState).filter(
            TopicState.user_id == user_id,
            TopicState.course_id == course_id,
            TopicState.belt == key.belt.value,
            TopicState.topic == key.topic,
        ).first()

        if row:
            topic_states[key] = SM2TopicState(
                phase=row.phase,
                step_index=row.step_index,
                ease_factor=row.ease_factor,
                interval=row.interval_days,
                repetitions=row.repetitions,
                next_review=row.next_due or date.today(),
            )
            topic_attempted[key] = row.attempted
        elif unlocked < MAX_UNLOCKED_TOPICS:
            topic_states[key] = SM2TopicState()
            topic_attempted[key] = False
            unlocked += 1
            db.add(TopicState(
                user_id=user_id,
                course_id=course_id,
                belt=key.belt.value,
                topic=key.topic,
                phase="learning",
                step_index=0,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                next_due=date.today(),
                attempted=False,
            ))

    db.commit()
    return topic_states, topic_attempted


# ── Public API ────────────────────────────────────────────────────────────────

def create_session_db(user_id: int, course_id: int, db: DBSession) -> dict:
    """Create a new session, picking the next batch of exercises with the SR algorithm."""
    topic_states, topic_attempted = _load_or_unlock_topic_states(user_id, course_id, db)

    session_topics = build_session(
        topic_states,
        topic_attempted=topic_attempted,
        introduce_new_topic=None,
    )

    exercises = [
        _build_exercise(idx, st.key, course_id, db)
        for idx, st in enumerate(session_topics)
    ]

    db_session = SessionModel(
        user_id=user_id,
        course_id=course_id,
        started_at=datetime.utcnow(),
        exercises_total=len(exercises),
    )
    db.add(db_session)
    db.flush()
    session_id_db = db_session.id
    db.commit()

    session_id_str = str(session_id_db)
    _sessions[session_id_str] = SessionState(
        session_id=session_id_str,
        user_name="",
        topic_states=topic_states,
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

    candidate_keys: list[TopicKey] = []
    for belt_str in belts:
        try:
            belt_enum = Belt(belt_str)
        except ValueError:
            continue
        catalog = all_catalogs.get(belt_enum)
        if catalog:
            candidate_keys.extend(catalog.all_keys())

    if not candidate_keys:
        raise ValueError(f"No hay topics disponibles para los cinturones: {belts}")

    sampled_keys = random.choices(candidate_keys, k=count)
    exercises = [
        _build_exercise(idx, key, course_id, db)
        for idx, key in enumerate(sampled_keys)
    ]

    db_session = SessionModel(
        user_id=user_id, course_id=course_id,
        started_at=datetime.utcnow(), exercises_total=len(exercises),
    )
    db.add(db_session)
    db.flush()
    db.commit()

    session_id_str = str(db_session.id)
    _sessions[session_id_str] = SessionState(
        session_id=session_id_str,
        user_name="",
        topic_states={key: SM2TopicState() for key in set(sampled_keys)},
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
    catalog_keys = _all_topic_keys(course_id, db)
    topic_states: dict[TopicKey, SM2TopicState] = {}
    topic_attempted: dict[TopicKey, bool] = {}

    for key in catalog_keys:
        row = db.query(TopicState).filter(
            TopicState.user_id == user_id,
            TopicState.course_id == course_id,
            TopicState.belt == key.belt.value,
            TopicState.topic == key.topic,
        ).first()
        if row:
            topic_states[key] = SM2TopicState(
                phase=row.phase,
                step_index=row.step_index,
                ease_factor=row.ease_factor,
                interval=row.interval_days,
                repetitions=row.repetitions,
                next_review=row.next_due or date.today(),
            )
            topic_attempted[key] = row.attempted
        else:
            topic_states[key] = SM2TopicState()
            topic_attempted[key] = False

    session_topics = build_session(topic_states, topic_attempted=topic_attempted)
    exercises = [
        _build_exercise(idx, st.key, course_id, db)
        for idx, st in enumerate(session_topics)
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
        topic_states=topic_states,
        exercises=exercises,
        streak=streak,
    )


def record_answer_db(
    session_id_db: int,
    user_id: int,
    course_id: int,
    exercise_id: str,
    answer_index: int,
    response_time_s: float,
    db: DBSession,
) -> dict:
    """Record an answer, update SM-2 state, and return feedback."""
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

    is_correct = answer_index == exercise.correct_index
    quality = quality_from_correctness(is_correct)

    current_state = state.topic_states.get(exercise.topic_key, SM2TopicState())
    new_state = update_topic_state(current_state, quality)
    state.topic_states[exercise.topic_key] = new_state

    if is_correct:
        state.streak += 1
        xp_earned = XP_CORRECT
        if state.streak % XP_STREAK_INTERVAL == 0:
            xp_earned += XP_STREAK_BONUS
    else:
        state.streak = 0
        xp_earned = XP_WRONG

    db_ts = db.query(TopicState).filter(
        TopicState.user_id == user_id,
        TopicState.course_id == course_id,
        TopicState.belt == exercise.topic_key.belt.value,
        TopicState.topic == exercise.topic_key.topic,
    ).first()

    if db_ts:
        old_phase = db_ts.phase
        db_ts.phase = new_state.phase
        db_ts.step_index = new_state.step_index
        db_ts.ease_factor = new_state.ease_factor
        db_ts.interval_days = new_state.interval
        db_ts.repetitions = new_state.repetitions
        db_ts.next_due = new_state.next_review
        db_ts.attempted = True
        db_ts.updated_at = datetime.utcnow()
        db_ts.last_reviewed_at = datetime.utcnow()

        if old_phase == "learning" and new_state.phase == "review":
            xp_earned += XP_TOPIC_MASTERED
            _unlock_next_topic(user_id, course_id, exercise.topic_key, db)

            belt_catalog = _get_catalog(course_id, exercise.topic_key.belt, db)
            if belt_progress(state.topic_states, belt_catalog).promoted:
                xp_earned += XP_BELT_PROMOTED

    state.xp_session += xp_earned

    db.add(Answer(
        session_id=session_id_db,
        user_id=user_id,
        course_id=course_id,
        exercise_id=exercise_id,
        belt=exercise.topic_key.belt.value,
        topic=exercise.topic_key.topic,
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
        "topic_key": exercise.topic_key,
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


def get_user_progress_db(user_id: int, course_id: int, db: DBSession) -> dict:
    """Return topic states (per-topic SR snapshot) and level info."""
    catalog_keys = _all_topic_keys(course_id, db)

    if not db.query(TopicState).filter(
        TopicState.user_id == user_id, TopicState.course_id == course_id,
    ).first():
        for idx, key in enumerate(catalog_keys):
            if idx >= MAX_UNLOCKED_TOPICS:
                break
            db.add(TopicState(
                user_id=user_id,
                course_id=course_id,
                belt=key.belt.value,
                topic=key.topic,
                phase="learning",
                step_index=0,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                next_due=date.today(),
                attempted=False,
            ))
        db.commit()

    num_steps = len(_default_config.learning_steps)
    topic_states: dict[str, dict] = {}
    for key in catalog_keys:
        row = db.query(TopicState).filter(
            TopicState.user_id == user_id,
            TopicState.course_id == course_id,
            TopicState.belt == key.belt.value,
            TopicState.topic == key.topic,
        ).first()
        if row:
            topic_states[key.topic] = _serialize_topic_state(row, num_steps)

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
    num_steps = len(_default_config.learning_steps)
    catalog_keys = _all_topic_keys(course_id, db)

    all_states = db.query(TopicState).filter(
        TopicState.user_id == user_id, TopicState.course_id == course_id,
    ).all()
    state_map = {(s.belt, s.topic): s for s in all_states}

    failed_in_session: set[tuple[str, str]] = set()
    for a in answers:
        if not a.is_correct:
            failed_in_session.add((a.belt, a.topic))
    practiced_in_session = {(a.belt, a.topic) for a in answers}

    topic_states: dict[str, dict] = {}
    sm2_states: dict[TopicKey, SM2TopicState] = {}
    for key in catalog_keys:
        row = state_map.get((key.belt.value, key.topic))
        if row:
            ts_dict = _serialize_topic_state(row, num_steps)
            if (row.belt, row.topic) in failed_in_session:
                ts_dict["failed"] = True
            topic_states[key.topic] = ts_dict
            sm2_states[key] = SM2TopicState(
                phase=row.phase,
                step_index=row.step_index,
                ease_factor=row.ease_factor,
                interval=row.interval_days,
                repetitions=row.repetitions,
                next_review=row.next_due or date.today(),
            )

    # Belt progress for the highest belt touched in this session
    if answers:
        belts_in_session = {a.belt for a in answers}
        focus_belt_str = max(
            belts_in_session,
            key=lambda b: _BELT_ORDER.index(Belt(b)),
        )
        focus_belt = Belt(focus_belt_str)
        bp = belt_progress(sm2_states, _get_catalog(course_id, focus_belt, db))
    else:
        bp = belt_progress(sm2_states, _get_catalog(course_id, Belt.WHITE, db))

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
