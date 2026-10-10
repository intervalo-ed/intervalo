"""La palanca de dificultad: qué posición eligió cada jugador

`game_players.dificultad` es la posición (0-8) que la persona eligió en la
palanca, o NULL cuando manda el motor, que es lo que hace hoy todo el mundo.
Nullable y sin default a propósito: NULL no es «la posición del medio», es «no
eligió», y la diferencia es lo que el panel va a contar.

Revision ID: 20261010_0091
Revises: 20260928_0090
Create Date: 2026-10-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20261010_0091"
down_revision: Union[str, Sequence[str], None] = "20260928_0090"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("game_players")}
    if "dificultad" not in existing:
        op.add_column("game_players", sa.Column("dificultad", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("game_players", "dificultad")
