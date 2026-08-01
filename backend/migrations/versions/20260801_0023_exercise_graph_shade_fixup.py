"""Add graph_shade column to exercises (fixup)

20260731_0020 was supposed to add this column, but it got inserted into the
migration graph *behind* 20260801_0021 after prod's alembic_version was
already stamped at 0021 — so alembic considered 0020 already applied and
skipped it, applying only 20260801_0022 (graph_free_aspect). This re-adds
the missing column, idempotently (skip if it already exists, in case a
future environment did apply 0020 correctly).

Revision ID: 20260801_0023
Revises: 20260801_0022
Create Date: 2026-08-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260801_0023"
down_revision: Union[str, Sequence[str], None] = "20260801_0022"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("exercises")}
    if "graph_shade" not in existing:
        op.add_column(
            "exercises",
            sa.Column("graph_shade", sa.String(length=100), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("exercises", "graph_shade")
