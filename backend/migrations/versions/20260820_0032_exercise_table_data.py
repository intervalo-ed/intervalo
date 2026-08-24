"""Add table_data column to exercises

Tercer formato de ejercicio: una tabla chica de dos columnas cuya columna
derivada se rellena con valores precalculados al confirmar una opción. Ver
authoring-context.md, sección "Tablas".

Guarda el objeto entero serializado como JSON. Es `Text` y no `String(100)`
como los `graph_*` porque un `table` serializado ronda los 400-800 caracteres.

Idempotente a propósito: los `graph_*` dejaron el precedente de una columna que
nunca llegó a producción porque la migración quedó detrás del stamp de alembic
(ver 20260801_0023_exercise_graph_shade_fixup.py).

Revision ID: 20260820_0032
Revises: 20260819_0031
Create Date: 2026-08-20
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260820_0032"
down_revision: Union[str, Sequence[str], None] = "20260819_0031"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("exercises")}
    if "table_data" not in existing:
        op.add_column("exercises", sa.Column("table_data", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("exercises", "table_data")
