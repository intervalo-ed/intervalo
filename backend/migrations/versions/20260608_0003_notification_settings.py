"""Add per-user push-notification preference columns

Revision ID: 20260608_0003
Revises: 20260528_0002
Create Date: 2026-06-08
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260608_0003"
down_revision: Union[str, Sequence[str], None] = "20260528_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("notify_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("users", sa.Column("notify_time", sa.String(5), nullable=True))
    op.add_column("users", sa.Column("notify_timezone", sa.String(64), nullable=True))
    op.add_column("users", sa.Column("notify_last_sent_on", sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "notify_last_sent_on")
    op.drop_column("users", "notify_timezone")
    op.drop_column("users", "notify_time")
    op.drop_column("users", "notify_enabled")
