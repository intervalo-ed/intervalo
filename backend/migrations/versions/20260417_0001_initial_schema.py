"""Initial schema (Clerk-based auth)

Revision ID: 20260417_0001
Revises:
Create Date: 2026-04-17

Fresh, consolidated initial schema after switching from manual Google OAuth
(backend-minted JWTs keyed by a `google_id`) to Clerk-managed identities
(`clerk_user_id` = Clerk's `sub` claim). Five stacked migrations were
collapsed here since there is no historical data to preserve.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260417_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clerk_user_id", sa.String(200), nullable=True),
        sa.Column("email", sa.String(200), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("display_name", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("clerk_user_id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_clerk_user_id"), "users", ["clerk_user_id"])
    op.create_index(op.f("ix_users_email"), "users", ["email"])

    # ── courses ──────────────────────────────────────────────────────────────
    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(50), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index(op.f("ix_courses_slug"), "courses", ["slug"])

    # ── enrollments ──────────────────────────────────────────────────────────
    op.create_table(
        "enrollments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("university", sa.String(100), nullable=True),
        sa.Column("career", sa.String(200), nullable=True),
        sa.Column("enrolled_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "course_id", name="unique_user_course"),
    )

    # ── item_states ──────────────────────────────────────────────────────────
    op.create_table(
        "item_states",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("belt", sa.String(20), nullable=False),
        sa.Column("topic", sa.String(50), nullable=False),
        sa.Column("skill", sa.String(10), nullable=False),
        sa.Column("phase", sa.String(20), nullable=False),
        sa.Column("step_index", sa.Integer(), nullable=True),
        sa.Column("ease_factor", sa.Float(), nullable=True),
        sa.Column("interval_days", sa.Integer(), nullable=True),
        sa.Column("repetitions", sa.Integer(), nullable=True),
        sa.Column("next_due", sa.Date(), nullable=True),
        sa.Column("attempted", sa.Boolean(), nullable=True, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("last_reviewed_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "user_id", "course_id", "belt", "topic", "skill",
            name="unique_user_course_item",
        ),
    )
    op.create_index("idx_item_states_next_due", "item_states", ["next_due"])
    op.create_index("idx_item_states_user_course", "item_states", ["user_id", "course_id"])

    # ── sessions ─────────────────────────────────────────────────────────────
    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("abandoned", sa.Boolean(), nullable=True),
        sa.Column("exercises_total", sa.Integer(), nullable=False),
        sa.Column("exercises_correct", sa.Integer(), nullable=True),
        sa.Column("xp_earned", sa.Integer(), nullable=True),
        sa.Column("belt_on_start", sa.String(20), nullable=True),
        sa.Column("belt_on_finish", sa.String(20), nullable=True),
        sa.Column("belt_promoted", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_sessions_user_course", "sessions", ["user_id", "course_id"])
    op.create_index("idx_sessions_started_at", "sessions", ["started_at"])
    op.create_index("idx_sessions_finished_at", "sessions", ["finished_at"])

    # ── answers ──────────────────────────────────────────────────────────────
    op.create_table(
        "answers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("exercise_id", sa.String(20), nullable=True),
        sa.Column("belt", sa.String(20), nullable=False),
        sa.Column("topic", sa.String(50), nullable=False),
        sa.Column("skill", sa.String(10), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("response_time_ms", sa.Integer(), nullable=True),
        sa.Column("quality_score", sa.Integer(), nullable=True),
        sa.Column("xp_earned", sa.Integer(), nullable=True),
        sa.Column("answered_at", sa.DateTime(), nullable=True),
        sa.Column("intra_session_position", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_answers_session_id", "answers", ["session_id"])
    op.create_index("idx_answers_user_course", "answers", ["user_id", "course_id"])
    op.create_index("idx_answers_answered_at", "answers", ["answered_at"])
    op.create_index("idx_answers_belt_topic_skill", "answers", ["belt", "topic", "skill"])

    # ── exercises ────────────────────────────────────────────────────────────
    op.create_table(
        "exercises",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("external_id", sa.String(100), nullable=True),
        sa.Column("belt", sa.String(20), nullable=False),
        sa.Column("topic", sa.String(50), nullable=False),
        sa.Column("skill", sa.String(10), nullable=False),
        sa.Column("subtype", sa.String(10), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("option_a", sa.Text(), nullable=False),
        sa.Column("option_b", sa.Text(), nullable=False),
        sa.Column("option_c", sa.Text(), nullable=False),
        sa.Column("option_d", sa.Text(), nullable=False),
        sa.Column("correct_index", sa.Integer(), nullable=False),
        sa.Column("has_math", sa.Boolean(), nullable=True, server_default="0"),
        sa.Column("feedback_correct", sa.Text(), nullable=False),
        sa.Column("feedback_incorrect", sa.Text(), nullable=False),
        sa.Column("graph_fn", sa.String(500), nullable=True),
        sa.Column("graph_view", sa.String(100), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("course_id", "external_id", name="uq_exercises_course_external_id"),
    )
    op.create_index("idx_exercises_lookup", "exercises", ["course_id", "belt", "topic", "skill"])
    op.create_index("idx_exercises_external_id", "exercises", ["course_id", "external_id"])
    op.create_index("ix_exercises_id", "exercises", ["id"])

    # ── belt_info ────────────────────────────────────────────────────────────
    op.create_table(
        "belt_info",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("belt", sa.String(20), nullable=False),
        sa.Column("headline", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("course_id", "belt", name="uq_belt_info_course_belt"),
    )
    op.create_index("ix_belt_info_id", "belt_info", ["id"])

    # ── push_subscriptions ───────────────────────────────────────────────────
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("course_id", sa.Integer(), nullable=False),
        sa.Column("endpoint", sa.String(1000), nullable=False),
        sa.Column("p256dh", sa.String(1000), nullable=False),
        sa.Column("auth", sa.String(1000), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("last_used_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "endpoint", name="unique_user_endpoint"),
    )


def downgrade() -> None:
    op.drop_table("push_subscriptions")
    op.drop_index("ix_belt_info_id", table_name="belt_info")
    op.drop_table("belt_info")
    op.drop_index("ix_exercises_id", table_name="exercises")
    op.drop_index("idx_exercises_external_id", table_name="exercises")
    op.drop_index("idx_exercises_lookup", table_name="exercises")
    op.drop_table("exercises")
    op.drop_index("idx_answers_belt_topic_skill", table_name="answers")
    op.drop_index("idx_answers_answered_at", table_name="answers")
    op.drop_index("idx_answers_user_course", table_name="answers")
    op.drop_index("idx_answers_session_id", table_name="answers")
    op.drop_table("answers")
    op.drop_index("idx_sessions_finished_at", table_name="sessions")
    op.drop_index("idx_sessions_started_at", table_name="sessions")
    op.drop_index("idx_sessions_user_course", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("idx_item_states_user_course", table_name="item_states")
    op.drop_index("idx_item_states_next_due", table_name="item_states")
    op.drop_table("item_states")
    op.drop_table("enrollments")
    op.drop_index(op.f("ix_courses_slug"), table_name="courses")
    op.drop_table("courses")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_clerk_user_id"), table_name="users")
    op.drop_table("users")
