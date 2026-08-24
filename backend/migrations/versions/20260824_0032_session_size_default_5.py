"""Bajar el default de session_size de 8 a 5

Producto quiere sesiones más cortas por default (mejor retención). Cambia el
default de la columna para las cuentas nuevas y baja a quienes nunca lo
tocaron: como el valor nunca se escribía explícito al crear `course_progress`
(dependía del default implícito de la columna), toda fila en 8 es
indistinguible entre "nunca lo tocó" y "lo puso en 8 a propósito" — se toma la
primera lectura, igual criterio que 20260811_0027 con `sessions.abandoned`.

`session_store.reset_course` ya vuelve a aplicar el default al reiniciar un
curso, así que no hace falta backfill aparte para eso.

Revision ID: 20260824_0032
Revises: 20260819_0031
Create Date: 2026-08-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260824_0032"
down_revision: Union[str, Sequence[str], None] = "20260819_0031"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("course_progress") as batch_op:
        batch_op.alter_column(
            "session_size",
            server_default="5",
            existing_type=sa.Integer(),
            existing_nullable=False,
        )
    op.execute("UPDATE course_progress SET session_size = 5 WHERE session_size = 8")


def downgrade() -> None:
    with op.batch_alter_table("course_progress") as batch_op:
        batch_op.alter_column(
            "session_size",
            server_default="8",
            existing_type=sa.Integer(),
            existing_nullable=False,
        )
    # No hay vuelta atrás fiel: no se puede distinguir quién estaba en 8 por
    # default de quien lo puso a mano en 5. Se revierte solo lo que esta
    # migración cambió (5 -> 8 uniforme), como en 20260811_0027.
    op.execute("UPDATE course_progress SET session_size = 8 WHERE session_size = 5")
