"""Add is_catchup flag to unit_states

Revision ID: 20260616_0005
Revises: 20260613_0004
Create Date: 2026-06-16
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260616_0005"
down_revision: Union[str, Sequence[str], None] = "20260613_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "unit_states",
        sa.Column(
            "is_catchup",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )


def downgrade() -> None:
    op.drop_column("unit_states", "is_catchup")
