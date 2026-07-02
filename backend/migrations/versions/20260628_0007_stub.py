"""Stub migration — revision applied to DB but file was missing

Revision ID: 20260628_0007
Revises: 20260618_0006
Create Date: 2026-06-28
"""
from typing import Sequence, Union

from alembic import op

revision: str = "20260628_0007"
down_revision: Union[str, Sequence[str], None] = "20260618_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
