"""Make option_c/option_d nullable and rename analisis-1 slug to analisis

Revision ID: 20260630_0007
Revises: 20260618_0006
Create Date: 2026-06-30
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260630_0007"
down_revision: Union[str, Sequence[str], None] = "20260628_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("exercises") as batch_op:
        batch_op.alter_column("option_c", existing_type=sa.Text(), nullable=True)
        batch_op.alter_column("option_d", existing_type=sa.Text(), nullable=True)
    op.execute("UPDATE courses SET slug = 'analisis' WHERE slug = 'analisis-1'")


def downgrade() -> None:
    op.execute("UPDATE courses SET slug = 'analisis-1' WHERE slug = 'analisis'")
    with op.batch_alter_table("exercises") as batch_op:
        batch_op.alter_column("option_d", existing_type=sa.Text(), nullable=False)
        batch_op.alter_column("option_c", existing_type=sa.Text(), nullable=False)
