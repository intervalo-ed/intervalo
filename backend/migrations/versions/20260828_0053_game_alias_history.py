"""Los @ viejos siguen apuntando a su dueño

El link de reclutamiento lleva el @ de quien comparte (`?r=cociente3196`) y el
servidor lo resuelve mirando quién se llama así hoy. Cambiar de @ rompía eso, y
no en un caso raro: el juego ofrece reclutar a las diez resueltas y pide el
registro a las doce, y registrarse es exactamente el momento en que se elige el @
definitivo. El camino normal era mandar un link y dejarlo muerto dos ejercicios
después.

El segundo agujero es más silencioso: al soltar un @, quedaba libre. Quien lo
tomara heredaba los links viejos y cobraría por gente que trajo otra persona.
Con esta tabla el @ queda reservado para siempre (`aliases.alias_taken` la
consulta), así que soltarlo no se lo regala a nadie.

Sin backfill: nadie cambió de @ todavía con reclutas de por medio, y no hay
manera de reconstruir @ que ya no existen.

Revision ID: 20260828_0053
Revises: 20260828_0052
Create Date: 2026-08-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260828_0053"
down_revision: Union[str, Sequence[str], None] = "20260828_0052"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "game_alias_history"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE in set(inspector.get_table_names()):
        return
    op.create_table(
        TABLE,
        sa.Column("alias", sa.String(length=30), primary_key=True),
        sa.Column(
            "player_id",
            sa.Integer(),
            sa.ForeignKey("game_players.id"),
            nullable=False,
        ),
        sa.Column("released_at", sa.DateTime(), nullable=True),
    )
    op.create_index(f"ix_{TABLE}_player_id", TABLE, ["player_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE not in set(inspector.get_table_names()):
        return
    op.drop_index(f"ix_{TABLE}_player_id", table_name=TABLE)
    op.drop_table(TABLE)
