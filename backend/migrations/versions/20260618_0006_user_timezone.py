"""Add per-user timezone column (IANA) for spaced-repetition "today"

Revision ID: 20260618_0006
Revises: 20260616_0005
Create Date: 2026-06-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260618_0006"
down_revision: Union[str, Sequence[str], None] = "20260616_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("timezone", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "timezone")
