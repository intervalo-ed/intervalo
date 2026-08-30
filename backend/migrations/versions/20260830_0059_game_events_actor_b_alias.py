"""Add game_events.actor_b_alias (segundo protagonista, "{a} reclutó a {b}")

Hasta ahora el feed solo sabe nombrar a UN protagonista por evento (`actor_alias`,
marcador `{a}`) más, cuando aplica, hasta dos universidades (`{u0}`/`{u1}`). Eso
alcanza para "{a} llegó a 250 seguidas" pero no para un evento que involucra a
DOS personas con nombre propio, como el aviso de reclutamiento: quien trajo y
quien llegó.

`actor_b_alias` es ese segundo @. Sin nivel propio a propósito —no hace falta un
`actor_b_level`—: en el feed se pinta semibold sin color, igual que las siglas de
universidad, porque ahí lo que importa es decir quién es y no destacar su rango
(eso ya lo hace `{a}`, que sigue siendo el protagonista).

Revision ID: 20260830_0059
Revises: 20260830_0058
Create Date: 2026-08-30
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260830_0059"
down_revision: Union[str, Sequence[str], None] = "20260830_0058"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_events" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_events")}
    if "actor_b_alias" not in existing:
        op.add_column(
            "game_events",
            sa.Column("actor_b_alias", sa.String(length=30), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("game_events", "actor_b_alias")
