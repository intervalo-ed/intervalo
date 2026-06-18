"""
schemas.py — Pydantic response models for the HTTP API.

Kept in a single module so the OpenAPI spec exposes clean, named schemas that
`openapi-typescript` can turn into useful TypeScript types. Request bodies for
POSTs still live next to the endpoints that consume them in `main.py`.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel


# ── Generic ───────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str


# ── Course metadata ───────────────────────────────────────────────────────────

class BeltEntry(BaseModel):
    headline: str
    description: str


# ── Enrollment ────────────────────────────────────────────────────────────────

class EnrollmentResponse(BaseModel):
    success: bool
    message: str


# ── Status ────────────────────────────────────────────────────────────────────

class UserStatusResponse(BaseModel):
    # Authoritative "new vs returning" signal, read from the DB rather than from
    # client-writable Clerk metadata (which drifts). `enrolled` means the user
    # finished onboarding; `has_progress` means they have any learning state.
    enrolled: bool
    has_progress: bool


# ── Progress ──────────────────────────────────────────────────────────────────

class UnitProgress(BaseModel):
    exercise_type: str
    state: str          # "sin_empezar" | "aprendiendo" | "dominado"
    next_review: str | None = None  # ISO date del próximo repaso de esta unit


class TopicProgress(BaseModel):
    phase: str          # "learning" | "review"
    step_index: int
    status: str         # "nuevo" | "aprendiendo" | "dominado"
    progress: str       # "0/3" | "1/3" | "2/3" | "3/3"
    is_pending: bool
    attempted: bool
    next_review: str | None = None
    failed: bool
    units: list[UnitProgress] = []


class LevelInfo(BaseModel):
    level: int
    xp_in_level: int
    xp_required: int
    progress_pct: float


class LevelInfoWithMissing(BaseModel):
    level: int
    xp_in_level: int
    xp_required: int
    xp_missing: int
    progress_pct: float


class UserProgressResponse(BaseModel):
    topic_states: dict[str, TopicProgress]
    level_info: LevelInfo
    main_session_done_today: bool


# ── Push notifications ──────────────────────────────────────────────────────────

class NotificationSettings(BaseModel):
    enabled: bool
    time: str | None = None       # "HH:MM", 15-min steps
    timezone: str | None = None   # IANA name


class SimpleResponse(BaseModel):
    success: bool


# ── Feedback ──────────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    categoria: Literal["error", "idea", "comentario"]
    mensaje: str


class PushSubscriptionOut(BaseModel):
    id: int
    endpoint: str
    p256dh: str
    auth: str


class DueNotification(BaseModel):
    user_id: int
    pending_count: int
    subscriptions: list[PushSubscriptionOut]


# ── Leaderboard ───────────────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    name: str
    username: str | None = None
    total_xp: int
    exercises: int
    is_current_user: bool
    career: str | None = None
    university: str | None = None


class LeaderboardMe(BaseModel):
    # Datos del usuario actual dentro del scope (filtro) pedido. Se calculan
    # sobre el set completo, no sobre la página, así "posición actual" y "XP para
    # subir" no dependen de cuántas filas se hayan cargado.
    rank: int | None = None       # posición en el scope, None si no aparece
    xp_to_next: int | None = None  # XP para alcanzar al de arriba
    total_xp: int = 0


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]  # solo la página pedida (offset..offset+limit)
    total_xp: int                    # total del scope (global o por universidad)
    total_exercises: int             # total del scope
    total_count: int                 # cantidad de usuarios en el scope
    has_more: bool                   # quedan más páginas después de esta
    me: LeaderboardMe
    universities: list[str]          # universidades presentes (para el filtro)


# ── Session ───────────────────────────────────────────────────────────────────

class SessionExercise(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
    has_math: bool
    topic: str
    belt: str
    graph_fn: str
    graph_view: list[Any] | None = None
    feedback_correct: str
    feedback_incorrect: str
    explanation: str | None = None


class SessionStartResponse(BaseModel):
    session_id: str
    user_name: str
    total: int
    exercises: list[SessionExercise]


class AnswerResponse(BaseModel):
    correct: bool
    quality: int       # SM-2 quality score
    feedback: str
    xp_earned: int


class SummaryItem(BaseModel):
    topic: str
    belt: str
    correct: bool


class BeltProgressInfo(BaseModel):
    mastered: int
    total: int
    promoted: bool


class SessionSummaryResponse(BaseModel):
    session_id: str
    user_name: str
    total: int
    correct: int
    first_try_correct: int
    incorrect: int
    items: list[SummaryItem]
    topic_states: dict[str, TopicProgress]
    belt_progress: BeltProgressInfo
    xp_earned: int
    level_info: LevelInfoWithMissing
