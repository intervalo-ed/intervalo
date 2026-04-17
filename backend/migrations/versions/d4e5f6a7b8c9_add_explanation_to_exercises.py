"""add explanation column to exercises

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-04-16

Agrega exercises.explanation — texto extendido con teoría (soporta LaTeX).
Campo opcional (nullable), usa batch_alter_table para compatibilidad con SQLite.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(inspector, table: str) -> set[str]:
    return {c["name"] for c in inspector.get_columns(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "explanation" not in _columns(inspector, "exercises"):
        with op.batch_alter_table("exercises") as batch:
            batch.add_column(sa.Column("explanation", sa.Text(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "explanation" in _columns(inspector, "exercises"):
        with op.batch_alter_table("exercises") as batch:
            batch.drop_column("explanation")
