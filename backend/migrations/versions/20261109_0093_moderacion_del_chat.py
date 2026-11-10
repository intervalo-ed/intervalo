"""Moderación del chat: reportes y bloqueos

`game_message_reports` (un reporte por persona y mensaje) y `game_blocks` (quién
no quiere ver a quién). Apple 1.2 pide poder reportar contenido y bloquear
usuarios en cualquier app con texto escrito por la gente.

Revision ID: 20261109_0093
Revises: 20261101_0092
Create Date: 2026-11-09
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20261109_0093"
down_revision: Union[str, Sequence[str], None] = "20261101_0092"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    existentes = set(sa.inspect(op.get_bind()).get_table_names())
    if "game_message_reports" not in existentes:
        op.create_table(
            "game_message_reports",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("message_id", sa.Integer, sa.ForeignKey("game_messages.id"), nullable=False),
            sa.Column("reporter_id", sa.Integer, sa.ForeignKey("game_players.id"), nullable=False),
            sa.Column("created_at", sa.DateTime, nullable=False),
            sa.UniqueConstraint("message_id", "reporter_id", name="uq_game_message_reports"),
        )
        op.create_index("ix_game_message_reports_id", "game_message_reports", ["id"])
        op.create_index("ix_game_message_reports_message_id", "game_message_reports", ["message_id"])
        op.create_index("ix_game_message_reports_reporter_id", "game_message_reports", ["reporter_id"])
    if "game_blocks" not in existentes:
        op.create_table(
            "game_blocks",
            sa.Column("id", sa.Integer, primary_key=True),
            sa.Column("blocker_id", sa.Integer, sa.ForeignKey("game_players.id"), nullable=False),
            sa.Column("blocked_id", sa.Integer, sa.ForeignKey("game_players.id"), nullable=False),
            sa.Column("created_at", sa.DateTime, nullable=False),
            sa.UniqueConstraint("blocker_id", "blocked_id", name="uq_game_blocks"),
        )
        op.create_index("ix_game_blocks_id", "game_blocks", ["id"])
        op.create_index("ix_game_blocks_blocker_id", "game_blocks", ["blocker_id"])
        op.create_index("ix_game_blocks_blocked_id", "game_blocks", ["blocked_id"])


def downgrade() -> None:
    op.drop_table("game_blocks")
    op.drop_table("game_message_reports")
