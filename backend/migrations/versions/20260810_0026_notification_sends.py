"""Add notification_sends table

Hoy no queda ningún registro histórico de las notificaciones push enviadas:
User.notify_last_sent_on/notify_last_category/notify_last_variant_key solo
guardan el último estado (para el guard de idempotencia diario), se pisan en
cada envío. Esta tabla es append-only, una fila por usuario por envío, y
permite analizar después qué categorías/variantes de copy (ver
notification_copy.py) tienen mejor tasa de apertura y si llevan a sesiones
reales.

Revision ID: 20260810_0026
Revises: 20260802_0025
Create Date: 2026-08-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260810_0026"
down_revision: Union[str, Sequence[str], None] = "20260802_0025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notification_sends",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("category", sa.String(length=30), nullable=False),
        sa.Column("variant_key", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.String(length=500), nullable=False),
        sa.Column("sent_at", sa.DateTime(), nullable=False),
        sa.Column("opened_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "idx_notification_sends_user_id",
        "notification_sends",
        ["user_id"],
    )
    op.create_index(
        "idx_notification_sends_sent_at",
        "notification_sends",
        ["sent_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_notification_sends_sent_at", table_name="notification_sends")
    op.drop_index("idx_notification_sends_user_id", table_name="notification_sends")
    op.drop_table("notification_sends")
