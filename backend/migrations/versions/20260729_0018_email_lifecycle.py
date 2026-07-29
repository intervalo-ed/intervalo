"""Add users columns for lifecycle emails (bounce + win-back)

Soporte para los emails automáticos de retención: un flag de opt-out global
y dos timestamps de idempotencia (uno por tipo de mail) para no reenviar.

Revision ID: 20260729_0018
Revises: 20260728_0017
Create Date: 2026-07-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260729_0018"
down_revision: Union[str, Sequence[str], None] = "20260728_0017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("email_unsubscribed", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "users",
        sa.Column("bounce_email_sent_at", sa.DateTime(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("winback_email_sent_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "winback_email_sent_at")
    op.drop_column("users", "bounce_email_sent_at")
    op.drop_column("users", "email_unsubscribed")
