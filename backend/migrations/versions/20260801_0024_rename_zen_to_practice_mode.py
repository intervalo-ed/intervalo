"""Rename session mode 'zen' to 'practice'

El modo de práctica libre se llamaba "zen" en código y en la columna
sessions.mode. Se renombra a "practice" en todo el código (endpoint, funciones,
frontend) por decisión de producto; esta migración actualiza los datos ya
existentes para que ninguna fila quede con el valor viejo.

Revision ID: 20260801_0024
Revises: 20260801_0023
Create Date: 2026-08-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260801_0024"
down_revision: Union[str, Sequence[str], None] = "20260801_0023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("UPDATE sessions SET mode = 'practice' WHERE mode = 'zen'")


def downgrade() -> None:
    op.execute("UPDATE sessions SET mode = 'zen' WHERE mode = 'practice'")
