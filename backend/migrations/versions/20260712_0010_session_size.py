"""Add session_size to course_progress (max ejercicios por sesión)

Revision ID: 20260712_0010
Revises: 20260711_0009
Create Date: 2026-07-12
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260712_0010"
down_revision: Union[str, Sequence[str], None] = "20260711_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "course_progress",
        sa.Column("session_size", sa.Integer(), nullable=False, server_default="8"),
    )


def downgrade() -> None:
    op.drop_column("course_progress", "session_size")
