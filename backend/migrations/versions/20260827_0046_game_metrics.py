"""Instrumentación del minijuego para el panel de derivadas

Tres agujeros que el panel no podía tapar leyendo lo que ya había:

  - game_exercises.peeked: mirar la tabla ya cambiaba la mecánica (sin Elo, XP
    simbólica) pero no se guardaba en ningún lado. Sin la columna, «resolvió» y
    «copió» quedan mezclados en la misma tasa de acierto.
  - game_attempts.attempt_number pasa a admitir el 0: una respuesta que no
    parsea se registra igual, con parse_ok=False y sin consumir intento. Antes
    el endpoint devolvía temprano y esa fricción —lo que la gente escribe y el
    parser no entiende— no dejaba rastro.
  - game_cta_events: impresiones y clicks de los llamados a la acción. Es lo que
    permite cerrar el embudo del cafecito de punta a punta contra game_boosts,
    algo que PostHog no puede hacer porque no conoce esa tabla.

Revision ID: 20260827_0046
Revises: 20260827_0045
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0046"
down_revision: Union[str, Sequence[str], None] = "20260827_0045"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_exercises" in tables:
        existing = {col["name"] for col in inspector.get_columns("game_exercises")}
        if "peeked" not in existing:
            op.add_column(
                "game_exercises",
                sa.Column(
                    "peeked",
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.false(),
                ),
            )

    if "game_cta_events" not in tables:
        op.create_table(
            "game_cta_events",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("player_id", sa.Integer(), nullable=True),
            sa.Column("cta", sa.String(length=20), nullable=False),
            sa.Column("action", sa.String(length=12), nullable=False),
            sa.Column("placement", sa.String(length=24), nullable=True),
            sa.Column("solved", sa.Integer(), nullable=True),
            sa.Column("university", sa.String(length=120), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_game_cta_events_id", "game_cta_events", ["id"])
        op.create_index("ix_game_cta_events_player_id", "game_cta_events", ["player_id"])
        op.create_index("ix_game_cta_events_cta", "game_cta_events", ["cta"])
        op.create_index("ix_game_cta_events_action", "game_cta_events", ["action"])
        op.create_index("ix_game_cta_events_university", "game_cta_events", ["university"])
        # El panel agrega por semana, así que la fecha va indexada.
        op.create_index("ix_game_cta_events_created_at", "game_cta_events", ["created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_cta_events" in tables:
        op.drop_table("game_cta_events")

    if "game_exercises" in tables:
        existing = {col["name"] for col in inspector.get_columns("game_exercises")}
        if "peeked" in existing:
            op.drop_column("game_exercises", "peeked")
