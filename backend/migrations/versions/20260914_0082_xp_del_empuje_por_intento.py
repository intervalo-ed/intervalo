"""Add game_attempts.xp_from_boost (cuánto de esa XP lo puso el empuje)

El minijuego sabía cuánta XP extra le dio el empuje a UNA PERSONA en toda su
vida (`game_players.xp_from_boosts`, migración 0057) pero no podía responder
"cuánta XP extra generó el empuje de la UBA desde las 14", que es lo que hace
falta para devolverle el número a quien donó.

`game_attempts` guardaba solo `xp_awarded`, ya multiplicado, y el multiplicador
de ese momento no queda en ninguna fila: el reparto entre base y empuje no se
puede reconstruir. Esta columna lo anota cuando pasa, igual que
`answers.xp_from_boost` del lado clásico.

Arranca en cero para todos, y por lo mismo que su precedente: lo que se ganó
antes de esta migración no se recupera, y estimarlo sería inventar el número que
esta columna existe para no inventar.

Revision ID: 20260914_0082
Revises: 20260913_0081
Create Date: 2026-09-14
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260914_0082"
down_revision: Union[str, Sequence[str], None] = "20260913_0081"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_attempts" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_attempts")}
    if "xp_from_boost" not in existing:
        op.add_column(
            "game_attempts",
            sa.Column(
                "xp_from_boost",
                sa.Integer(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )


def downgrade() -> None:
    op.drop_column("game_attempts", "xp_from_boost")
