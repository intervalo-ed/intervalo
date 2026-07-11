"""Course editor: suspended flag, progress iterations, active cap, archive

Revision ID: 20260711_0008
Revises: 20260630_0007
Create Date: 2026-07-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260711_0008"
down_revision: Union[str, Sequence[str], None] = "20260630_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "unit_states",
        sa.Column("suspended", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "answers",
        sa.Column("iteration", sa.Integer(), nullable=False, server_default="1"),
    )
    op.add_column(
        "sessions",
        sa.Column("iteration", sa.Integer(), nullable=False, server_default="1"),
    )

    op.create_table(
        "course_progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("iteration", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("active_cap", sa.Integer(), nullable=False, server_default="18"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "course_id", name="unique_user_course_progress"),
    )

    op.create_table(
        "unit_state_archive",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("iteration", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("belt", sa.String(length=20), nullable=False),
        sa.Column("topic", sa.String(length=50), nullable=False),
        sa.Column("exercise_type", sa.String(length=20), nullable=False),
        sa.Column("phase", sa.String(length=20), nullable=False),
        sa.Column("step_index", sa.Integer(), nullable=True),
        sa.Column("ease_factor", sa.Float(), nullable=True),
        sa.Column("interval_days", sa.Integer(), nullable=True),
        sa.Column("repetitions", sa.Integer(), nullable=True),
        sa.Column("next_due", sa.Date(), nullable=True),
        sa.Column("attempted", sa.Boolean(), nullable=True),
        sa.Column("is_catchup", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("suspended", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("archived_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "idx_unit_state_archive_user_course",
        "unit_state_archive",
        ["user_id", "course_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_unit_state_archive_user_course", table_name="unit_state_archive")
    op.drop_table("unit_state_archive")
    op.drop_table("course_progress")
    op.drop_column("sessions", "iteration")
    op.drop_column("answers", "iteration")
    op.drop_column("unit_states", "suspended")
