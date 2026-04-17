"""
schemas.py — Pydantic response models for the HTTP API.

Kept in a single module so the OpenAPI spec exposes clean, named schemas that
`openapi-typescript` can turn into useful TypeScript types. Request bodies for
POSTs still live next to the endpoints that consume them in `main.py`.

Field shapes were lifted directly from the dicts returned by `session_store.py`
and `main.py` — they preserve current behavior, not improve it.
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


# ── Auth ──────────────────────────────────────────────────────────────────────

class GuestAuthResponse(BaseModel):
    access_token: str
    name: str
    user_id: int


# ── Enrollment ────────────────────────────────────────────────────────────────

class EnrollmentResponse(BaseModel):
    success: bool
    message: str


# ── Progress (used by /user/progress and the summary skill_states map) ────────

class SkillState(BaseModel):
    phase: str          # "learning" | "review"
    step_index: int
    status: str         # "nuevo" | "aprendiendo" | "graduado"
    progress: str       # "0/3" | "1/3" | "2/3" | "3/3"
    is_pending: bool
    attempted: bool
    next_review: str | None = None
    failed: bool


class LevelInfo(BaseModel):
    """Level info as returned by /user/progress."""
    level: int
    xp_in_level: int
    xp_required: int
    progress_pct: float


class LevelInfoWithMissing(BaseModel):
    """Level info as returned by /session/{id}/summary (adds xp_missing)."""
    level: int
    xp_in_level: int
    xp_required: int
    xp_missing: int
    progress_pct: float


class UserProgressResponse(BaseModel):
    skill_states: dict[str, SkillState]
    level_info: LevelInfo


# ── Session ───────────────────────────────────────────────────────────────────

class SessionExercise(BaseModel):
    id: str
    question: str
    options: list[str]
    correct_index: int
    has_math: bool
    skill: str
    topic: str
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
    quality: int       # SM-2 quality score, 0–5
    feedback: str
    xp_earned: int


class SummaryItem(BaseModel):
    topic: str
    skill: str
    correct: bool
    phase: str


class BeltProgressInfo(BaseModel):
    graduated: int
    total: int
    stripes: int
    promoted: bool


class SessionSummaryResponse(BaseModel):
    session_id: str
    user_name: str
    total: int
    correct: int
    incorrect: int
    items: list[SummaryItem]
    skill_states: dict[str, SkillState]
    belt_progress: BeltProgressInfo
    xp_earned: int
    level_info: LevelInfoWithMissing
