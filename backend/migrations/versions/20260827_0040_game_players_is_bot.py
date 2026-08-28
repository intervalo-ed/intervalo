"""Add game_players.is_bot (jugadores sembrados del ranking del minijuego)

El ranking del minijuego arranca vacío, y un ranking vacío no engancha: no hay
a quién escalar, que es todo el gancho del juego. Se siembra con jugadores
(ver backend/scripts/seed_game_bots.py) que tienen `user_id` y `guest_token` en
NULL — ninguna request los resuelve, así que nadie puede jugar con ellos.

La columna existe para poder excluirlos de cualquier análisis de uso: sin una
marca explícita, las filas sembradas serían indistinguibles de jugadores reales
al medir altas, XP o retención del juego.

Revision ID: 20260827_0040
Revises: 20260827_0039
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0040"
down_revision: Union[str, Sequence[str], None] = "20260827_0039"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_players" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_players")}
    if "is_bot" not in existing:
        op.add_column(
            "game_players",
            sa.Column(
                "is_bot",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            ),
        )


def downgrade() -> None:
    op.drop_column("game_players", "is_bot")
