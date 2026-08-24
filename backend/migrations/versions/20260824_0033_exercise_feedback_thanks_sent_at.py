"""Add exercise_feedback.thanks_sent_at (mail de agradecimiento por reportar)

Marcador de idempotencia por REPORTE, no por usuario: a diferencia de bounce/
winback/streak (un mail por estado del usuario), acá el disparador es la
acción puntual de reportar, y un usuario puede reportar más de una vez.

Revision ID: 20260824_0033
Revises: 20260824_0032
Create Date: 2026-08-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260824_0033"
down_revision: Union[str, Sequence[str], None] = "20260824_0032"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "exercise_feedback",
        sa.Column("thanks_sent_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("exercise_feedback", "thanks_sent_at")
