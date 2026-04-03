"""
session_store.py — Gestión de sesiones en memoria para Intervalo.
"""

from __future__ import annotations

import random
import sys
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent.parent))

from algorithm import (
    SM2ItemState,
    ItemKey,
    FunctionFamily,
    SkillCode,
    WHITE_BELT,
    build_session,
    quality_from_attempt,
    update_item_state,
    should_reinsert,
    default_catalog,
    SM2Config,
    belt_progress,
    xp_for_quality,
    level_progress,
    XP_BONUS_STREAK5,
    XP_BONUS_STREAK10,
    XP_BONUS_RAYA,
    XP_BONUS_BELT,
)
from exercise_bank import get_exercise
from datetime import datetime
from sqlalchemy.orm import Session as DBSession
from models import Session as SessionModel, ItemState


# Mapeo de SkillCode a claves del banco de ejercicios
_SKILL_TO_BANK: dict[str, str] = {
    "CLSF": "visual_recognition",
    "LEXI": "vocabulary",
    "FORM": "parameter_identification",
    "GRAF": "graphing",
    "RESV": "problem_solving",
    "DERI": "derivation",
    "INTG": "integration",
    "APLI": "application",
}


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class ExerciseInSession:
    exercise_id: str
    item_key: ItemKey
    question: str
    options: list[str]
    correct_index: int
    feedback_correct: str
    feedback_incorrect: str
    has_math: bool = False
    graph_fn: str = ""
    graph_view: list = None


@dataclass
class SessionState:
    session_id: str
    user_name: str
    item_states: dict[ItemKey, SM2ItemState]
    exercises: list[ExerciseInSession]
    results: list[dict] = field(default_factory=list)
    xp_session: int = 0
    streak: int = 0


# ── In-memory store ───────────────────────────────────────────────────────────

_sessions: dict[str, SessionState] = {}


# ── Public API ────────────────────────────────────────────────────────────────

_default_config = SM2Config()


def create_session(user_name: str) -> SessionState:
    """Crea una nueva sesión y devuelve el estado inicial."""
    session_id = str(uuid.uuid4())[:8]

    # Inicializa todos los ítems del catálogo con estado inicial
    catalog_keys = default_catalog()
    item_states: dict[ItemKey, SM2ItemState] = {
        key: SM2ItemState() for key in catalog_keys
    }

    # Construye la secuencia de la sesión usando el algoritmo SM-2
    session_items = build_session(item_states)

    # Crea los ejercicios mapeando cada SessionItem a un ejercicio concreto
    exercises: list[ExerciseInSession] = []
    for idx, si in enumerate(session_items):
        topic_value = si.key.topic
        skill_bank_key = _SKILL_TO_BANK.get(si.key.skill.value, si.key.skill.value)
        ex = get_exercise(topic_value, skill_bank_key, _default_config.graph_exercise_probability)
        exercise_id = f"ex_{idx:03d}"
        # Shuffle options, tracking the new position of the correct answer
        correct_answer = ex["options"][ex["correct_index"]]
        shuffled = ex["options"][:]
        random.shuffle(shuffled)
        new_correct_index = shuffled.index(correct_answer)
        exercises.append(
            ExerciseInSession(
                exercise_id=exercise_id,
                item_key=si.key,
                question=ex["question"],
                options=shuffled,
                correct_index=new_correct_index,
                feedback_correct=ex["feedback_correct"],
                feedback_incorrect=ex["feedback_incorrect"],
                has_math=ex.get("has_math", False),
                graph_fn=ex.get("graph_fn", ""),
                graph_view=ex.get("graph_view", None),
            )
        )

    state = SessionState(
        session_id=session_id,
        user_name=user_name,
        item_states=item_states,
        exercises=exercises,
    )
    _sessions[session_id] = state
    return state


def get_session(session_id: str) -> Optional[SessionState]:
    """Devuelve el estado de sesión o None si no existe."""
    return _sessions.get(session_id)


def create_session_db(user_id: int, course_id: int, db: DBSession) -> dict:
    """
    Crea una nueva sesión en la BD y devuelve los datos iniciales con session_id de BD.

    Retorna:
    {
        "session_id": int (ID de la tabla sessions),
        "user_name": str,
        "total": int,
        "exercises": list[ExerciseInSession]
    }
    """
    # Inicializa todos los ítems del catálogo con estado inicial
    catalog_keys = default_catalog()
    item_states: dict[ItemKey, SM2ItemState] = {
        key: SM2ItemState() for key in catalog_keys
    }

    # Construye la secuencia de la sesión usando el algoritmo SM-2
    session_items = build_session(item_states)

    # Crea los ejercicios mapeando cada SessionItem a un ejercicio concreto
    exercises: list[ExerciseInSession] = []
    for idx, si in enumerate(session_items):
        topic_value = si.key.topic
        skill_bank_key = _SKILL_TO_BANK.get(si.key.skill.value, si.key.skill.value)
        ex = get_exercise(topic_value, skill_bank_key, _default_config.graph_exercise_probability)
        exercise_id = f"ex_{idx:03d}"
        # Shuffle options, tracking the new position of the correct answer
        correct_answer = ex["options"][ex["correct_index"]]
        shuffled = ex["options"][:]
        random.shuffle(shuffled)
        new_correct_index = shuffled.index(correct_answer)
        exercises.append(
            ExerciseInSession(
                exercise_id=exercise_id,
                item_key=si.key,
                question=ex["question"],
                options=shuffled,
                correct_index=new_correct_index,
                feedback_correct=ex["feedback_correct"],
                feedback_incorrect=ex["feedback_incorrect"],
                has_math=ex.get("has_math", False),
                graph_fn=ex.get("graph_fn", ""),
                graph_view=ex.get("graph_view", None),
            )
        )

    # Crear registro Session en BD
    db_session = SessionModel(
        user_id=user_id,
        course_id=course_id,
        started_at=datetime.utcnow(),
        exercises_total=len(exercises),
    )
    db.add(db_session)
    db.flush()  # Asegura que se genera el ID sin commitear todo
    session_id_db = db_session.id

    # Inicializar ItemStates en BD para este usuario/curso
    for item_key in catalog_keys:
        existing = db.query(ItemState).filter(
            ItemState.user_id == user_id,
            ItemState.course_id == course_id,
            ItemState.belt == item_key.belt.value,
            ItemState.topic == item_key.topic,
            ItemState.skill == item_key.skill.value,
        ).first()

        if not existing:
            db_item_state = ItemState(
                user_id=user_id,
                course_id=course_id,
                belt=item_key.belt.value,
                topic=item_key.topic,
                skill=item_key.skill.value,
                phase="learning",
                step_index=0,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                next_due=None,
            )
            db.add(db_item_state)

    db.commit()

    # Retornar datos con session_id de BD (convertido a string)
    return {
        "session_id": str(session_id_db),
        "user_name": "",  # No tenemos user_name en BD, se envía desde frontend
        "total": len(exercises),
        "exercises": [
            {
                "id": ex.exercise_id,
                "question": ex.question,
                "options": ex.options,
                "correct_index": ex.correct_index,
                "has_math": ex.has_math,
                "skill": ex.item_key.skill.value,
                "graph_fn": ex.graph_fn,
                "graph_view": ex.graph_view,
                "feedback_correct": ex.feedback_correct,
                "feedback_incorrect": ex.feedback_incorrect,
            }
            for ex in exercises
        ],
    }


def record_answer(
    session_id: str,
    exercise_id: str,
    answer_index: int,
    response_time_s: float,
) -> dict:
    """Registra la respuesta del usuario y actualiza el estado SM-2 del ítem."""
    state = _sessions.get(session_id)
    if state is None:
        raise KeyError(f"Sesión '{session_id}' no encontrada.")

    # Busca el ejercicio correspondiente
    exercise = next((e for e in state.exercises if e.exercise_id == exercise_id), None)
    if exercise is None:
        raise KeyError(f"Ejercicio '{exercise_id}' no encontrado en la sesión.")

    is_correct = answer_index == exercise.correct_index
    quality = quality_from_attempt(is_correct, response_time_s)

    # Actualiza el estado del ítem en el mapa de estados
    current_state = state.item_states.get(exercise.item_key, SM2ItemState())
    new_state = update_item_state(current_state, quality)
    state.item_states[exercise.item_key] = new_state

    # ── XP ───────────────────────────────────────────────────────────────────
    xp_earned = xp_for_quality(quality)

    if is_correct:
        state.streak += 1
        # Bonificaciones por racha (solo en el momento exacto)
        if state.streak == 5:
            xp_earned += XP_BONUS_STREAK5
        elif state.streak == 10:
            xp_earned += XP_BONUS_STREAK10
    else:
        state.streak = 0

    state.xp_session += xp_earned

    feedback = exercise.feedback_correct if is_correct else exercise.feedback_incorrect

    result_record = {
        "exercise_id": exercise_id,
        "item_key": exercise.item_key,
        "is_correct": is_correct,
        "quality": quality,
        "response_time_s": response_time_s,
        "new_phase": new_state.phase,
        "xp_earned": xp_earned,
    }
    state.results.append(result_record)

    return {
        "correct": is_correct,
        "quality": quality,
        "feedback": feedback,
        "xp_earned": xp_earned,
    }


def record_answer_db(
    session_id_db: int,
    user_id: int,
    course_id: int,
    exercise_id: str,
    answer_index: int,
    response_time_s: float,
    db: DBSession,
) -> dict:
    """
    Registra respuesta en BD, actualiza SM-2, y retorna feedback.

    Usa la sesión en-memory si existe, o reconstruye lógica.
    Persiste en BD: Answer, ItemState updates, Session counters.
    """
    from models import Answer

    # Obtener sesión desde BD para validación
    db_session = db.query(SessionModel).filter(
        SessionModel.id == session_id_db,
        SessionModel.user_id == user_id,
    ).first()

    if not db_session:
        raise KeyError(f"Sesión {session_id_db} no encontrada o no pertenece al usuario.")

    # Intentar obtener desde en-memory para acceso rápido
    session_id_in_memory = str(session_id_db)
    state = _sessions.get(session_id_in_memory)

    if state is None:
        raise KeyError(f"Sesión en memoria no cargada. Reinicia la sesión.")

    # Busca el ejercicio correspondiente
    exercise = next((e for e in state.exercises if e.exercise_id == exercise_id), None)
    if exercise is None:
        raise KeyError(f"Ejercicio '{exercise_id}' no encontrado en la sesión.")

    is_correct = answer_index == exercise.correct_index
    quality = quality_from_attempt(is_correct, response_time_s)

    # Actualiza el estado del ítem en el mapa de estados
    current_state = state.item_states.get(exercise.item_key, SM2ItemState())
    new_state = update_item_state(current_state, quality)
    state.item_states[exercise.item_key] = new_state

    # ── XP ───────────────────────────────────────────────────────────────────
    xp_earned = xp_for_quality(quality)

    if is_correct:
        state.streak += 1
        if state.streak == 5:
            xp_earned += XP_BONUS_STREAK5
        elif state.streak == 10:
            xp_earned += XP_BONUS_STREAK10
    else:
        state.streak = 0

    state.xp_session += xp_earned

    # ── Guardar en BD ─────────────────────────────────────────────────────────
    # Guardar respuesta
    db_answer = Answer(
        session_id=session_id_db,
        user_id=user_id,
        course_id=course_id,
        exercise_id=exercise_id,
        belt=exercise.item_key.belt.value,
        topic=exercise.item_key.topic,
        skill=exercise.item_key.skill.value,
        is_correct=is_correct,
        response_time_ms=int(response_time_s * 1000),
        quality_score=quality,
        xp_earned=xp_earned,
        answered_at=datetime.utcnow(),
    )
    db.add(db_answer)

    # Actualizar ItemState en BD
    db_item_state = db.query(ItemState).filter(
        ItemState.user_id == user_id,
        ItemState.course_id == course_id,
        ItemState.belt == exercise.item_key.belt.value,
        ItemState.topic == exercise.item_key.topic,
        ItemState.skill == exercise.item_key.skill.value,
    ).first()

    if db_item_state:
        db_item_state.phase = new_state.phase
        db_item_state.step_index = new_state.step_index
        db_item_state.ease_factor = new_state.ease_factor
        db_item_state.interval_days = new_state.interval
        db_item_state.repetitions = new_state.repetitions
        db_item_state.next_due = new_state.next_review
        db_item_state.updated_at = datetime.utcnow()
        db_item_state.last_reviewed_at = datetime.utcnow()

    # Actualizar contador de correctas en sesión
    if is_correct:
        db_session.exercises_correct = (db_session.exercises_correct or 0) + 1
    db_session.updated_at = datetime.utcnow()

    db.commit()

    feedback = exercise.feedback_correct if is_correct else exercise.feedback_incorrect

    return {
        "correct": is_correct,
        "quality": quality,
        "feedback": feedback,
        "xp_earned": xp_earned,
    }


def get_summary(session_id: str) -> dict:
    """Devuelve el resumen de la sesión."""
    state = _sessions.get(session_id)
    if state is None:
        raise KeyError(f"Sesión '{session_id}' no encontrada.")

    total = len(state.results)
    correct_count = sum(1 for r in state.results if r["is_correct"])
    incorrect_count = total - correct_count

    items = []
    for result in state.results:
        key: ItemKey = result["item_key"]
        items.append({
            "topic": key.topic,
            "skill": key.skill.value,
            "correct": result["is_correct"],
            "phase": result["new_phase"],
        })

    # Estado final de cada ítem (topic:skill → SM2 state actual)
    # Solo incluir ítems que fueron practicados en esta sesión
    practiced_keys = {r["item_key"] for r in state.results}
    # Ítems que tuvieron al menos un fallo en esta sesión
    failed_keys = {r["item_key"] for r in state.results if not r["is_correct"]}
    skill_states = {}
    for key, item_state in state.item_states.items():
        if key not in practiced_keys:
            continue
        k = f"{key.topic}:{key.skill.value}"
        skill_states[k] = {
            "phase": item_state.phase,
            "step_index": item_state.step_index,
            "next_review": item_state.next_review.isoformat() if item_state.next_review else None,
            "failed": key in failed_keys,
        }

    # Progreso del cinturón
    bp = belt_progress(state.item_states, WHITE_BELT)

    # Progreso de nivel XP (basado en XP de la sesión como MVP)
    lp = level_progress(state.xp_session)

    return {
        "session_id": session_id,
        "user_name": state.user_name,
        "total": total,
        "correct": correct_count,
        "incorrect": incorrect_count,
        "items": items,
        "skill_states": skill_states,
        "belt_progress": {
            "graduated": bp.graduated,
            "total": bp.total,
            "stripes": bp.stripes,
            "promoted": bp.promoted,
        },
        "xp_earned": state.xp_session,
        "level_info": {
            "level": lp.level,
            "xp_in_level": lp.xp_in_level,
            "xp_required": lp.xp_required,
            "xp_missing": lp.xp_missing,
            "progress_pct": lp.progress_pct,
        },
    }


def get_summary_db(
    session_id_db: int,
    user_id: int,
    db: DBSession,
) -> dict:
    """
    Devuelve resumen desde BD y marca sesión como terminada.

    Lee de Answer y ItemState en BD para construir el resumen.
    """
    from models import Answer

    # Obtener sesión desde BD
    db_session = db.query(SessionModel).filter(
        SessionModel.id == session_id_db,
        SessionModel.user_id == user_id,
    ).first()

    if not db_session:
        raise KeyError(f"Sesión {session_id_db} no encontrada.")

    # Obtener todas las respuestas para esta sesión
    answers = db.query(Answer).filter(Answer.session_id == session_id_db).all()

    total = len(answers)
    correct_count = sum(1 for a in answers if a.is_correct)
    incorrect_count = total - correct_count

    items = []
    for answer in answers:
        items.append({
            "topic": answer.topic,
            "skill": answer.skill,
            "correct": answer.is_correct,
            "phase": "review" if answer.is_correct else "learning",  # Simplified
        })

    # Estado final de ítems practicados
    skill_states = {}
    for answer in answers:
        k = f"{answer.topic}:{answer.skill}"
        if k not in skill_states:
            # Obtener ItemState actual
            item_state = db.query(ItemState).filter(
                ItemState.user_id == user_id,
                ItemState.topic == answer.topic,
                ItemState.skill == answer.skill,
            ).first()

            if item_state:
                skill_states[k] = {
                    "phase": item_state.phase,
                    "step_index": item_state.step_index,
                    "next_review": item_state.next_due.isoformat() if item_state.next_due else None,
                    "failed": not answer.is_correct,
                }

    # Calcular XP total de la sesión
    xp_earned = sum(a.xp_earned or 0 for a in answers)

    # Marcar sesión como terminada
    db_session.finished_at = datetime.utcnow()
    db_session.xp_earned = xp_earned
    db.commit()

    # Retornar datos del resumen
    return {
        "session_id": str(session_id_db),
        "user_name": "",
        "total": total,
        "correct": correct_count,
        "incorrect": incorrect_count,
        "items": items,
        "skill_states": skill_states,
        "belt_progress": {
            "graduated": 0,  # Simplified for now
            "total": 0,
            "stripes": 0,
            "promoted": False,
        },
        "xp_earned": xp_earned,
        "level_info": {
            "level": 1,
            "xp_in_level": xp_earned % 1000,
            "xp_required": 1000,
            "xp_missing": max(0, 1000 - (xp_earned % 1000)),
            "progress_pct": ((xp_earned % 1000) / 1000) * 100,
        },
    }
