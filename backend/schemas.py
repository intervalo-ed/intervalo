"""
schemas.py — Pydantic response models for the HTTP API.

Kept in a single module so the OpenAPI spec exposes clean, named schemas that
`openapi-typescript` can turn into useful TypeScript types. Request bodies for
POSTs still live next to the endpoints that consume them in `main.py`.
"""

from __future__ import annotations

from typing import Any

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


# ── Progress ──────────────────────────────────────────────────────────────────

class UnitProgress(BaseModel):
    exercise_type: str
    state: str          # "sin_empezar" | "aprendiendo" | "dominado"


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


# ── Leaderboard ───────────────────────────────────────────────────────────────

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    name: str
    total_xp: int
    is_current_user: bool


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]


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
    incorrect: int
    items: list[SummaryItem]
    topic_states: dict[str, TopicProgress]
    belt_progress: BeltProgressInfo
    xp_earned: int
    level_info: LevelInfoWithMissing
