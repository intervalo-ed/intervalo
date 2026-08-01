"""Add graph_shade column to exercises

Soporte para sombrear el área bajo una curva entre dos valores de x en
gráficos GRAF (ej. área de una densidad uniforme que representa una
probabilidad). Formato igual a graph_view: string JSON de una lista
[xMin, xMax], o null si el ejercicio no sombrea nada.

Revision ID: 20260731_0020
Revises: 20260801_0021
Create Date: 2026-07-31
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260731_0020"
down_revision: Union[str, Sequence[str], None] = "20260801_0021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "exercises",
        sa.Column("graph_shade", sa.String(length=100), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("exercises", "graph_shade")
