"""Add graph_free_aspect column to exercises

Soporte para desactivar el aspecto 1:1 forzado de Mafs en gráficos GRAF de
probabilidad (variables aleatorias), donde el eje Y casi siempre es [0,1] y
forzar 1:1 infla Y muy por encima de eso, desperdiciando espacio vertical.
Boolean, default None/false: sin el flag, el gráfico se comporta exactamente
igual que hoy (preserveAspectRatio="contain"), opt-in explícito por ejercicio.

Revision ID: 20260801_0022
Revises: 20260731_0020
Create Date: 2026-08-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260801_0022"
down_revision: Union[str, Sequence[str], None] = "20260731_0020"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "exercises",
        sa.Column("graph_free_aspect", sa.Boolean(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("exercises", "graph_free_aspect")
