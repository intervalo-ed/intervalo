"""Add mode column to sessions for daily-gate marker

Revision ID: 20260528_0002
Revises: 20260417_0001
Create Date: 2026-05-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260528_0002"
down_revision: Union[str, Sequence[str], None] = "20260417_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "sessions",
        sa.Column(
            "mode",
            sa.String(16),
            nullable=False,
            server_default="main",
        ),
    )


def downgrade() -> None:
    op.drop_column("sessions", "mode")
