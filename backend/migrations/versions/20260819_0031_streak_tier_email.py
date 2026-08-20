"""Add users columns for the streak-tier congratulation email

Tercer email de ciclo de vida: felicitar al llegar a un hito del multiplicador
de XP (3/9/18/30/45 días de racha), a la mañana siguiente. `streak_email_sent_tier`
es la idempotencia — guarda el último umbral ya felicitado y se compara contra
el tier derivado de `streak_days` — y `streak_email_sent_at` la observabilidad.

El upgrade backfillea el tier vigente de cada usuario: sin eso, el primer tick
del worker después del deploy encontraría a todo el que ya tiene racha con
"hito pendiente" y lo felicitaría de golpe por algo que logró hace semanas.

Revision ID: 20260819_0031
Revises: 20260814_0030
Create Date: 2026-08-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260819_0031"
down_revision: Union[str, Sequence[str], None] = "20260814_0030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Congelados de algorithm/xp.py STREAK_TIERS (solo los umbrales con hito; el
# tramo base de 0 días no se felicita). Si la tabla cambia en el futuro, esta
# migración NO se actualiza: describe el estado del mundo al momento del deploy.
TIER_THRESHOLDS = [3, 9, 18, 30, 45]


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("streak_email_sent_tier", sa.Integer(), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("streak_email_sent_at", sa.DateTime(), nullable=True),
    )

    # Backfill: el mayor umbral <= streak_days queda marcado como "ya
    # felicitado". CASE descendente: la primera condición que matchea gana.
    whens = " ".join(
        f"WHEN streak_days >= {t} THEN {t}" for t in reversed(TIER_THRESHOLDS)
    )
    op.execute(
        f"UPDATE users SET streak_email_sent_tier = CASE {whens} ELSE NULL END"
    )


def downgrade() -> None:
    op.drop_column("users", "streak_email_sent_at")
    op.drop_column("users", "streak_email_sent_tier")
