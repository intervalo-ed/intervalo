"""Add tags column to exercises (sub-family/archetype classification)

Revision ID: 20260715_0011
Revises: 20260712_0010
Create Date: 2026-07-15
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260715_0011"
down_revision: Union[str, Sequence[str], None] = "20260712_0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("exercises", sa.Column("tags", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("exercises", "tags")
