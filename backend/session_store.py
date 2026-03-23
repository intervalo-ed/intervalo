"""
session_store.py — Gestión de sesiones en memoria para Intervalo.
"""

from __future__ import annotations

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
        exercises.append(
            ExerciseInSession(
                exercise_id=exercise_id,
                item_key=si.key,
                question=ex["question"],
                options=ex["options"],
                correct_index=ex["correct_index"],
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
    skill_states = {}
    for key, item_state in state.item_states.items():
        k = f"{key.topic}:{key.skill.value}"
        skill_states[k] = {
            "phase": item_state.phase,
            "step_index": item_state.step_index,
            "next_review": item_state.next_review.isoformat() if item_state.next_review else None,
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
