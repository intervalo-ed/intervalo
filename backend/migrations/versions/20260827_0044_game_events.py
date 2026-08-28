"""Historial de eventos del minijuego

Debajo del CTA vive un feed de lo que va pasando: cafecitos invitados, gente que
se registra, escaladas grandes, rachas, cambios de puntero y universidades que se
pasan entre sí. Es un historial SOLO del sistema —ningún texto lo escribe un
usuario— así que no hay nada que moderar.

Agrega:
  - game_events: una fila por hecho, con la oración ya armada y el emoji
    aparte. `dedupe_key` es lo que impide contar dos veces el mismo hecho (el
    hito de racha de alguien, su registro, el aviso de que una universidad está por
    pasar a otra).
  - game_sim_state.uni_order_json: foto del orden anterior del ranking de
    universidades. Sin una referencia previa no se puede afirmar "la UNT le pasó a
    la UNR", solo cómo está el orden ahora.

Revision ID: 20260827_0044
Revises: 20260827_0043
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0044"
down_revision: Union[str, Sequence[str], None] = "20260827_0043"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_sim_state" in tables:
        existing = {col["name"] for col in inspector.get_columns("game_sim_state")}
        if "uni_order_json" not in existing:
            op.add_column("game_sim_state", sa.Column("uni_order_json", sa.Text(), nullable=True))

    if "game_events" not in tables:
        op.create_table(
            "game_events",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("kind", sa.String(length=16), nullable=False),
            sa.Column("text", sa.Text(), nullable=False),
            sa.Column("emoji", sa.String(length=8), nullable=False),
            sa.Column("actor_alias", sa.String(length=30), nullable=True),
            sa.Column("player_id", sa.Integer(), nullable=True),
            sa.Column("university", sa.String(length=120), nullable=True),
            sa.Column("dedupe_key", sa.String(length=80), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_game_events_id", "game_events", ["id"])
        op.create_index("ix_game_events_kind", "game_events", ["kind"])
        op.create_index("ix_game_events_player_id", "game_events", ["player_id"])
        op.create_index("ix_game_events_university", "game_events", ["university"])
        # La consulta del feed es "los últimos N" y la de deduplicación es
        # "¿hubo uno con esta clave hace poco?": las dos van indexadas.
        op.create_index("ix_game_events_dedupe_key", "game_events", ["dedupe_key"])
        op.create_index("ix_game_events_created_at", "game_events", ["created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_events" in tables:
        op.drop_table("game_events")

    if "game_sim_state" in tables:
        existing = {col["name"] for col in inspector.get_columns("game_sim_state")}
        if "uni_order_json" in existing:
            op.drop_column("game_sim_state", "uni_order_json")
