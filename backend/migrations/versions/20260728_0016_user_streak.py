"""Add users.streak_days + users.streak_last_date (racha de días de actividad)

La racha es global por usuario: cada día distinto en el que completa al menos
una sesión (repaso o práctica) suma un día acumulado. Los días acumulados
desbloquean el multiplicador de XP del modo Repaso. `streak_last_date` guarda
el último día contado y permite detectar los 30 días de inactividad que
resetean la racha.

Revision ID: 20260728_0016
Revises: 20260724_0015
Create Date: 2026-07-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260728_0016"
down_revision: Union[str, Sequence[str], None] = "20260724_0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("streak_days", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "users",
        sa.Column("streak_last_date", sa.Date(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "streak_last_date")
    op.drop_column("users", "streak_days")
