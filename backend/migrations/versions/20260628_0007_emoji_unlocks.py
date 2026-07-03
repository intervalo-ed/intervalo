"""Add per-user emoji unlock columns (career badge tree)

Revision ID: 20260628_0007
Revises: 20260618_0006
Create Date: 2026-06-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260628_0007"
down_revision: Union[str, Sequence[str], None] = "20260618_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("emoji_path", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("emoji_worn", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "emoji_worn")
    op.drop_column("users", "emoji_path")
