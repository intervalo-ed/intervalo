"""El chat del minijuego: una tabla para lo que escribe la gente

Hasta acá el único texto del juego lo escribía el sistema (`game_events`), y por
eso no había nada que moderar. Esta tabla abre esa puerta, y por eso es una tabla
aparte: el feed del sistema sigue siendo del sistema, y todo lo que hay que mirar
con lupa —saneado, tope de frecuencia, bajar un mensaje— queda de un solo lado.

Sin backfill: no hay nada que migrar, el chat arranca vacío.

Los dos índices no son de trámite. `created_at` es por donde se ordena y se poda;
`player_id` es por donde se busca todo lo que escribió alguien, que es lo que hay
que hacer el día que haya que bajar a una persona y no a un mensaje.

Revision ID: 20260829_0055
Revises: 20260829_0054
Create Date: 2026-08-29
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260829_0055"
down_revision: Union[str, Sequence[str], None] = "20260829_0054"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "game_messages"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE in set(inspector.get_table_names()):
        return

    op.create_table(
        TABLE,
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "player_id",
            sa.Integer(),
            sa.ForeignKey("game_players.id"),
            nullable=False,
        ),
        sa.Column("alias", sa.String(length=30), nullable=False),
        sa.Column("university", sa.String(length=120), nullable=True),
        sa.Column("level", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column(
            "hidden", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index(f"ix_{TABLE}_id", TABLE, ["id"])
    op.create_index(f"ix_{TABLE}_player_id", TABLE, ["player_id"])
    op.create_index(f"ix_{TABLE}_created_at", TABLE, ["created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE not in set(inspector.get_table_names()):
        return
    op.drop_index(f"ix_{TABLE}_created_at", table_name=TABLE)
    op.drop_index(f"ix_{TABLE}_player_id", table_name=TABLE)
    op.drop_index(f"ix_{TABLE}_id", table_name=TABLE)
    op.drop_table(TABLE)
