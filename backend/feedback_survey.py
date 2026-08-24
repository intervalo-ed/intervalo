"""Selección de qué ejercicio (si alguno) de una sesión lleva la micro-encuesta
de feedback post-ejercicio, y de qué canal.

Canales muestreados:
  "A" dificultad   — muy_facil | justo | muy_dificil
  "B" explicación  — util | no_util (requiere que el ítem tenga explicación)
  "D" interés      — aburrido | justo | interesante, con chip de razón opcional
                     en los extremos. Es el canal norte para análisis de
                     contenido y retención, y por eso se lleva la mayor parte.
El canal "C" (reporte de contenido) no vive acá: es a demanda del usuario,
sin muestreo ni límite.

Reglas anti-fatiga (server-side):
  - Máx 1 encuesta por sesión.
  - Nunca en el primer ni el último ejercicio.
  - Alternancia: si la sesión anterior del usuario en el curso ya mostró una
    encuesta (impression logueada), esta sesión no lleva ninguna.
  - Si las últimas 3 encuestas mostradas al usuario fueron ignoradas (skip) y
    la más reciente es de los últimos 14 días, se pausa (kill-switch).
  - Nunca se le pregunta al mismo usuario por el mismo ítem dos veces, sin
    importar el canal: preguntar dos veces por el mismo ejercicio además
    primaría la segunda respuesta.

Orden de decisión: **primero el canal, después el ítem**. Es al revés que la
versión original, y el motivo es el targeting: el conteo de impresiones que
reparte cobertura entre ítems ahora es por canal, así que hay que saber el
canal para poder contar. Con un contador compartido, un ítem con varios votos
de dificultad quedaría "cubierto" y nunca recibiría uno de interés, cuando de
interés no sabemos nada de él.

Dos consecuencias del cambio, a tener presentes al leer los datos:
  - Antes, si el sorteo daba "B" y el ítem no tenía explicación, caía a "A" en
    silencio: el B real era bastante menor al nominal. Ahora "B" restringe el
    pool de candidatos en vez de degradarse, así que los ratios nominales son
    los reales.
  - "B" solo loguea impression si el usuario abre "¿Por qué?" (ver
    session-runner.tsx). Esas sesiones quedan sin encuesta y sin consumir la
    alternancia, así que la mezcla observada siempre va a estar más cargada a
    D/A que los pesos nominales. No compensarlo subiendo el peso de B.

Targeting, una vez elegido el canal: prioriza ejercicios con `reviewed` falso o
desconocido, después los que acumularon menos impresiones **de ese canal**, con
desempate aleatorio.
"""
import os
import random
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session as DBSession

from models import Exercise, ExerciseFeedback, Session as SessionModel

SKIP_STREAK_LEN = 3
SKIP_PAUSE_DAYS = 14

# Canales muestreados. La lista estaba copiada en cada query de este módulo y
# se desincronizaba; que sea una constante es lo que evita que vuelva a pasar.
SURVEY_TYPES = ("A", "B", "D")

# Reparto entre canales. D se lleva la mayoría por ser el canal norte; A queda
# como muestra de calibración y B es el más chico.
# TODO(rollout): D arranca en 0.0 a propósito. Subirlo a 0.60 (y A a 0.25)
# recién cuando el frontend con el pane de D esté desplegado y verificado en
# producción. Es un cambio de una línea y revertible en un deploy.
SURVEY_WEIGHTS = {"D": 0.0, "A": 0.6, "B": 0.4}

# Chips de razón del canal D, por polo. Lista cerrada: el endpoint valida
# contra esto antes de persistir. Espejada en web/.../survey-pane.tsx — si
# cambia acá, cambia allá.
D_REASONS = {
    "interesante": ("me_hizo_pensar", "buen_contexto", "aprendi_algo"),
    "aburrido": ("pura_cuenta", "no_le_vi_sentido", "ya_lo_sabia"),
}


def validate_reason(question_type: str, value: str | None, reason: str | None) -> str | None:
    """Devuelve la razón si es válida para ese canal y polo, si no None.

    No levanta: rechazar la request perdería el `value`, que es el dato
    principal, por culpa de un campo opcional. Si llega algo fuera de la lista
    es un bug del cliente, y se detecta comparando cuántos survey_answered
    llevan razón en PostHog contra cuántas filas tienen `reason IS NOT NULL`.
    """
    if question_type != "D":
        return None
    return reason if reason in D_REASONS.get(value or "", ()) else None


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
            ExerciseFeedback.question_type.in_(SURVEY_TYPES),
        )
        .first()
    )
    return exists is not None


def _in_skip_pause(user_id: int, db: DBSession) -> bool:
    recent = (
        db.query(ExerciseFeedback)
        .filter(
            ExerciseFeedback.user_id == user_id,
            ExerciseFeedback.question_type.in_(SURVEY_TYPES),
        )
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
    """Ítems por los que ya se le preguntó a este usuario, en cualquier canal.
    El scope cross-canal es a propósito (ver docstring del módulo)."""
    rows = (
        db.query(ExerciseFeedback.exercise_external_id)
        .filter(
            ExerciseFeedback.user_id == user_id,
            ExerciseFeedback.question_type.in_(SURVEY_TYPES),
        )
        .distinct()
        .all()
    )
    return {r[0] for r in rows}


def _pick_channel(candidates: list) -> str:
    """Sortea el canal con los pesos fijos. "B" solo entra si algún candidato
    tiene explicación; cuando no, su peso se reparte proporcionalmente entre
    los demás (random.choices normaliza por la suma), manteniendo estable la
    relación entre D y A."""
    forced = os.getenv("SURVEY_FORCE_CHANNEL")  # solo para QA local
    if forced in SURVEY_TYPES:
        return forced

    has_expl = any(getattr(ex, "explanation", None) for ex in candidates)
    types = [t for t in SURVEY_WEIGHTS if t != "B" or has_expl]
    weights = [SURVEY_WEIGHTS[t] for t in types]
    if not any(weights):
        return "A"
    return random.choices(types, weights=weights, k=1)[0]


def assign_survey(user_id: int, course_id: int, exercises: list, db: DBSession) -> dict | None:
    """`exercises` son los ExerciseInSession ya armados para la sesión (con
    `.exercise_id` = slot y `.external_id` = clave real). Devuelve
    {"exercise_id": ..., "type": "A"|"B"|"D"} o None."""
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

    channel = _pick_channel(candidates)
    if channel == "B":
        # Garantizado no vacío: _pick_channel solo devuelve "B" si hay alguno.
        candidates = [ex for ex in candidates if getattr(ex, "explanation", None)]

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
            ExerciseFeedback.question_type == channel,
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

    return {"exercise_id": chosen.exercise_id, "type": channel}
