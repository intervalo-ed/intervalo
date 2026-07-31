"""Add users columns for varied push notification copy (rotation + rank tracking)

Soporte para el pool de notificaciones push con variedad de copy: dos columnas
para no repetir la última categoría/variante enviada (rotación ponderada, ver
notification_copy.py) y una para trackear el rank global del usuario la última
vez que se lo chequeó, necesaria para detectar "te pasaron en el ranking"
(hoy el leaderboard es 100% en vivo, sin historial). También se indexa
total_xp: varias categorías nuevas hacen COUNT/ORDER BY filtrados por esa
columna en cada tick.

Revision ID: 20260731_0019
Revises: 20260729_0018
Create Date: 2026-07-31
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260731_0019"
down_revision: Union[str, Sequence[str], None] = "20260729_0018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("notify_last_category", sa.String(32), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("notify_last_variant_key", sa.String(64), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("notify_last_rank", sa.Integer(), nullable=True),
    )
    op.create_index("idx_users_total_xp", "users", ["total_xp"])


def downgrade() -> None:
    op.drop_index("idx_users_total_xp", table_name="users")
    op.drop_column("users", "notify_last_rank")
    op.drop_column("users", "notify_last_variant_key")
    op.drop_column("users", "notify_last_category")
