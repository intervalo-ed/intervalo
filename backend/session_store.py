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
from exercise_bank import get_exercise_db
from datetime import datetime, date
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func
from models import Session as SessionModel, ItemState


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
    """Crea una nueva sesión en memoria (legacy, sin BD)."""
    raise NotImplementedError("Use create_session_db() instead.")


def get_session(session_id: str) -> Optional[SessionState]:
    """Devuelve el estado de sesión o None si no existe."""
    return _sessions.get(session_id)


def _unlock_next_item(user_id: int, course_id: int, graduated_item_key: ItemKey, db: DBSession) -> None:
    """Unlock the next item in sequence when one graduates."""
    catalog_keys = default_catalog()

    # Find the index of the graduated item
    graduated_idx = None
    for idx, key in enumerate(catalog_keys):
        if (key.belt == graduated_item_key.belt and
            key.topic == graduated_item_key.topic and
            key.skill == graduated_item_key.skill):
            graduated_idx = idx
            break

    if graduated_idx is None:
        return

    # Find the next item that doesn't exist yet
    for idx in range(graduated_idx + 1, len(catalog_keys)):
        next_key = catalog_keys[idx]
        existing = db.query(ItemState).filter(
            ItemState.user_id == user_id,
            ItemState.course_id == course_id,
            ItemState.belt == next_key.belt.value,
            ItemState.topic == next_key.topic,
            ItemState.skill == next_key.skill.value,
        ).first()

        if not existing:
            # Create the next item
            db_item_state = ItemState(
                user_id=user_id,
                course_id=course_id,
                belt=next_key.belt.value,
                topic=next_key.topic,
                skill=next_key.skill.value,
                phase="learning",
                step_index=0,
                ease_factor=2.5,
                interval_days=1,
                repetitions=0,
                next_due=date.today(),
                attempted=False,
            )
            db.add(db_item_state)
            break  # Only unlock one at a time


def _get_unlocked_items_count(user_id: int, course_id: int, db: DBSession) -> int:
    """Count items in Nuevo + Aprendiendo states."""
    nuevo_count = db.query(ItemState).filter(
        ItemState.user_id == user_id,
        ItemState.course_id == course_id,
        ItemState.phase == "learning",
        ItemState.attempted == False,
    ).count()

    aprendiendo_count = db.query(ItemState).filter(
        ItemState.user_id == user_id,
        ItemState.course_id == course_id,
        ItemState.phase == "learning",
        ItemState.attempted == True,
    ).count()

    return nuevo_count + aprendiendo_count


def _should_unlock_item(index: int, current_total: int) -> bool:
    """Determine if item at index should be unlocked. Max 15 in nuevo+aprendiendo."""
    return current_total < 15


def create_session_db(user_id: int, course_id: int, db: DBSession) -> dict:
    """
    Crea una nueva sesión en la BD y devuelve los datos iniciales con session_id de BD.

    Implements progressive unlock: max 15 items in Nuevo + Aprendiendo states.
    Rest remain locked and are created as previous items graduate.
    """
    catalog_keys = default_catalog()
    item_states: dict[ItemKey, SM2ItemState] = {}
    item_attempted: dict[ItemKey, bool] = {}

    # Count current unlocked items
    unlocked_count = _get_unlocked_items_count(user_id, course_id, db)

    # Load existing item states from BD
    for idx, item_key in enumerate(catalog_keys):
        db_item_state = db.query(ItemState).filter(
            ItemState.user_id == user_id,
            ItemState.course_id == course_id,
            ItemState.belt == item_key.belt.value,
            ItemState.topic == item_key.topic,
            ItemState.skill == item_key.skill.value,
        ).first()

        if db_item_state:
            # Item exists in BD
            item_states[item_key] = SM2ItemState(
                phase=db_item_state.phase,
                step_index=db_item_state.step_index,
                ease_factor=db_item_state.ease_factor,
                interval=db_item_state.interval_days,
                repetitions=db_item_state.repetitions,
                next_review=db_item_state.next_due or datetime.now().date(),
            )
            item_attempted[item_key] = db_item_state.attempted
        elif _should_unlock_item(idx, unlocked_count):
            # Create new unlocked item
            item_states[item_key] = SM2ItemState()
            item_attempted[item_key] = False
            unlocked_count += 1  # Track newly unlocked items towards the 15 limit

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
                next_due=date.today(),
                attempted=False,
            )
            db.add(db_item_state)
        else:
            # Item locked - don't create it yet
            pass

    db.commit()

    # Construye la secuencia de la sesión usando el algoritmo SM-2
    # Only select items that are "Nuevo" (not attempted) or "Pendiente" (next_review <= today)
    session_items = build_session(
        item_states,
        item_attempted=item_attempted,
        introduce_new_item=None  # All unlocked items already exist in catalog
    )

    # Crea los ejercicios mapeando cada SessionItem a un ejercicio concreto
    exercises: list[ExerciseInSession] = []
    for idx, si in enumerate(session_items):
        ex = get_exercise_db(
            course_id, si.key.belt.value, si.key.topic,
            si.key.skill.value, _default_config.graph_exercise_probability, db,
        )
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

    # Items already created in the loop above (lines 234-276) respecting the 15-item limit.
    # No need to create more here.
    db.commit()

    # Almacenar en memoria para acceso rápido durante la sesión activa
    session_id_str = str(session_id_db)
    session_state = SessionState(
        session_id=session_id_str,
        user_name="",
        item_states=item_states,  # Use loaded item_states, not fresh ones
        exercises=exercises,
        results=[],
        xp_session=0,
        streak=0,
    )
    _sessions[session_id_str] = session_state

    # Retornar datos con session_id de BD (convertido a string)
    return {
        "session_id": session_id_str,
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

    Usa la sesión en-memory si existe, o reconstruye desde BD y catálogo.
    Persiste en BD: Answer, ItemState updates, Session counters.
    """
    print(f"DEBUG: record_answer_db called for session {session_id_db}, exercise {exercise_id}")
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

    # Si no está en memoria, reconstruir desde BD y catálogo
    if state is None:
        print(f"DEBUG: Session {session_id_in_memory} not in memory, reconstructing from DB...")
        # Reconstruir el estado desde BD
        catalog_keys = default_catalog()
        item_states: dict[ItemKey, SM2ItemState] = {}
        item_attempted: dict[ItemKey, bool] = {}

        for item_key in catalog_keys:
            db_item_state = db.query(ItemState).filter(
                ItemState.user_id == user_id,
                ItemState.course_id == course_id,
                ItemState.belt == item_key.belt.value,
                ItemState.topic == item_key.topic,
                ItemState.skill == item_key.skill.value,
            ).first()

            if db_item_state:
                item_states[item_key] = SM2ItemState(
                    phase=db_item_state.phase,
                    step_index=db_item_state.step_index,
                    ease_factor=db_item_state.ease_factor,
                    interval=db_item_state.interval_days,
                    repetitions=db_item_state.repetitions,
                    next_review=db_item_state.next_due or datetime.now().date(),
                )
                item_attempted[item_key] = db_item_state.attempted
            else:
                item_states[item_key] = SM2ItemState()
                item_attempted[item_key] = False

        # Reconstruir ejercicios usando build_session
        session_items = build_session(item_states, item_attempted=item_attempted)
        exercises: list[ExerciseInSession] = []
        for idx, si in enumerate(session_items):
            ex = get_exercise_db(
                course_id, si.key.belt.value, si.key.topic,
                si.key.skill.value, _default_config.graph_exercise_probability, db,
            )
            exercise_id_gen = f"ex_{idx:03d}"
            correct_answer = ex["options"][ex["correct_index"]]
            shuffled = ex["options"][:]
            random.shuffle(shuffled)
            new_correct_index = shuffled.index(correct_answer)
            exercises.append(
                ExerciseInSession(
                    exercise_id=exercise_id_gen,
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

        # Crear SessionState y almacenar en memoria para futuros usos
        state = SessionState(
            session_id=session_id_in_memory,
            user_name="",
            item_states=item_states,
            exercises=exercises,
            results=[],
            xp_session=0,
            streak=0,
        )
        _sessions[session_id_in_memory] = state

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
        old_phase = db_item_state.phase
        db_item_state.phase = new_state.phase
        db_item_state.step_index = new_state.step_index
        db_item_state.ease_factor = new_state.ease_factor
        db_item_state.interval_days = new_state.interval
        db_item_state.repetitions = new_state.repetitions
        db_item_state.next_due = new_state.next_review
        db_item_state.attempted = True  # Mark as attempted after first response
        db_item_state.updated_at = datetime.utcnow()
        db_item_state.last_reviewed_at = datetime.utcnow()

        # If item just graduated from learning → review, unlock next item
        if old_phase == "learning" and new_state.phase == "review":
            _unlock_next_item(user_id, course_id, exercise.item_key, db)

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


def get_user_progress_db(user_id: int, course_id: int, db: DBSession) -> dict:
    """
    Get user's current progress (skill states and level info).

    Only includes unlocked items (those that exist in BD).
    Locked items are not created yet and don't appear here.

    On first call (no items exist), creates the first 15 items.

    Returns:
    {
        "skill_states": {...},
        "level_info": {...}
    }
    """
    from models import Answer

    catalog_keys = default_catalog()

    # Check if user has any items yet
    item_count = db.query(ItemState).filter(
        ItemState.user_id == user_id,
        ItemState.course_id == course_id,
    ).count()

    # If no items exist, create the first 15
    if item_count == 0:
        for idx, item_key in enumerate(catalog_keys):
            if idx >= 15:  # Max 15 initial items
                break
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
                next_due=date.today(),
                attempted=False,
            )
            db.add(db_item_state)
        db.commit()

    # Get all item states for user/course
    # Items exist in DB only if they've been unlocked (limit enforced at creation time)
    skill_states: dict[str, dict] = {}

    for item_key in catalog_keys:
        db_item_state = db.query(ItemState).filter(
            ItemState.user_id == user_id,
            ItemState.course_id == course_id,
            ItemState.belt == item_key.belt.value,
            ItemState.topic == item_key.topic,
            ItemState.skill == item_key.skill.value,
        ).first()

        if db_item_state:
            key_str = f"{item_key.topic}:{item_key.skill.value}"

            # Determine status based ONLY on actual item state, not on due date
            if db_item_state.phase == "learning":
                if not db_item_state.attempted:
                    status = "nuevo"  # 0/3 - never attempted
                    progress = "0/3"
                    print(f"DEBUG: {key_str} is nuevo (attempted={db_item_state.attempted}, phase={db_item_state.phase})")
                else:
                    status = "aprendiendo"  # Naranja - in learning phase, was attempted
                    # Progress based on step_index: 0→0/3, 1→1/3, 2→2/3
                    progress = f"{db_item_state.step_index}/3"
            else:  # phase == "review"
                status = "graduado"  # 3/3 - graduated
                progress = "3/3"

            # Check if item is pending (due for review)
            from datetime import date as date_module
            today = date_module.today()
            is_pending = db_item_state.next_due and db_item_state.next_due <= today

            skill_states[key_str] = {
                "phase": db_item_state.phase,
                "step_index": db_item_state.step_index,
                "status": status,  # nuevo, aprendiendo, graduado
                "progress": progress,  # Visual representation (0/3, aprendiendo, 3/3)
                "is_pending": is_pending,  # True if next_review <= today
                "attempted": db_item_state.attempted,
                "next_review": db_item_state.next_due.isoformat() if db_item_state.next_due else None,
                "failed": False
            }

    # Calculate total XP from all answers
    total_xp = db.query(func.sum(Answer.xp_earned)).filter(
        Answer.user_id == user_id,
        Answer.course_id == course_id,
    ).scalar() or 0

    # Calculate level info
    lp = level_progress(total_xp)
    level_info = {
        "level": lp.level,
        "xp_in_level": lp.xp_in_level,
        "xp_required": lp.xp_required,
        "progress_pct": lp.progress_pct,
    }

    return {
        "skill_states": skill_states,
        "level_info": level_info,
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

    # Estado final de TODOS los ítems (practicados y no practicados)
    skill_states = {}
    course_id = 1  # Default course
    catalog_keys = default_catalog()

    # Obtener todos los ItemStates del usuario para este curso
    all_item_states = db.query(ItemState).filter(
        ItemState.user_id == user_id,
        ItemState.course_id == course_id,
    ).all()

    # Crear un diccionario de búsqueda rápida
    item_state_map = {
        (item.topic, item.skill): item
        for item in all_item_states
    }

    # Iterar sobre todos los items del catálogo
    for item_key in catalog_keys:
        k = f"{item_key.topic}:{item_key.skill.value}"

        # Obtener el ItemState de BD
        item_state = item_state_map.get((item_key.topic, item_key.skill.value))

        if item_state:
            # Determinar status y progress igual que en get_user_progress_db
            if item_state.phase == "learning":
                if not item_state.attempted:
                    status = "nuevo"
                    progress = "0/3"
                else:
                    status = "aprendiendo"
                    # Progress based on step_index: 0→0/3, 1→1/3, 2→2/3
                    progress = f"{item_state.step_index}/3"
            else:  # phase == "review"
                status = "graduado"
                progress = "3/3"

            # Revisar si fue practicado en esta sesión
            was_practiced = any(a.topic == item_state.topic and a.skill == item_state.skill for a in answers)
            failed_in_session = was_practiced and not any(a.topic == item_state.topic and a.skill == item_state.skill and a.is_correct for a in answers)

            # Revisar si es pendiente (next_due <= hoy)
            from datetime import date as date_module
            today = date_module.today()
            is_pending = item_state.next_due and item_state.next_due <= today

            skill_states[k] = {
                "phase": item_state.phase,
                "step_index": item_state.step_index,
                "status": status,
                "progress": progress,
                "is_pending": is_pending,
                "attempted": item_state.attempted,
                "next_review": item_state.next_due.isoformat() if item_state.next_due else None,
                "failed": failed_in_session,
            }

    # Calcular XP total de la sesión
    xp_earned = sum(a.xp_earned or 0 for a in answers)

    # Marcar sesión como terminada
    db_session.finished_at = datetime.utcnow()
    db_session.xp_earned = xp_earned
    db.commit()

    # Calcular XP total acumulado del usuario (no solo la sesión)
    total_xp = db.query(func.sum(Answer.xp_earned)).filter(
        Answer.user_id == user_id,
        Answer.course_id == 1,
    ).scalar() or 0

    lp = level_progress(total_xp)

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
            "level": lp.level,
            "xp_in_level": lp.xp_in_level,
            "xp_required": lp.xp_required,
            "xp_missing": lp.xp_missing,
            "progress_pct": lp.progress_pct,
        },
    }
