"""Add game_players.unlocked_keys (teclado acumulativo del minijuego)

Hasta acá la fila dinámica del teclado se calculaba por ejercicio: lo que ESA
derivada pedía más un par de distractores para que la fila no fuera la respuesta
servida. El teclado cambiaba de forma en cada ejercicio.

Pasa a ser un inventario del jugador: cada tecla que una derivada pide queda
desbloqueada para siempre. El teclado deja de ser una pista del ejercicio de
turno y pasa a ser lo que la persona ya sabe escribir, creciendo de a poco. Por
eso el estado tiene que vivir en el jugador y no calcularse al vuelo.

Se guarda como texto separado por comas en vez de una tabla aparte: son a lo
sumo once ids cortos, siempre se leen y escriben enteros, y nunca se consultan
por tecla. Una tabla de asociación acá sería un join por cada /next a cambio de
nada.

Revision ID: 20260827_0043
Revises: 20260827_0042
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0043"
down_revision: Union[str, Sequence[str], None] = "20260827_0042"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_players" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_players")}
    if "unlocked_keys" not in existing:
        op.add_column(
            "game_players",
            sa.Column(
                "unlocked_keys",
                sa.Text(),
                nullable=False,
                server_default="",
            ),
        )


def downgrade() -> None:
    op.drop_column("game_players", "unlocked_keys")
