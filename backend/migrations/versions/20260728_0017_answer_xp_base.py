"""Add answers.xp_base (XP de la respuesta antes del multiplicador de racha)

Separa, por respuesta, cuánto XP es "base" (por intento y dificultad personal
del ítem) de cuánto es "extra" gracias al multiplicador de racha diaria. El
resumen de sesión resta xp_base al total para mostrar el XP extra ganado por
el multiplicador.

Revision ID: 20260728_0017
Revises: 20260728_0016
Create Date: 2026-07-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260728_0017"
down_revision: Union[str, Sequence[str], None] = "20260728_0016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "answers",
        sa.Column("xp_base", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("answers", "xp_base")
