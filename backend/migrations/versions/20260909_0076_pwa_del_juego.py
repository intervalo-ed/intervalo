"""Cuándo se vio a un jugador desde la app instalada

`users.pwa_first_seen_at` existe desde hace rato y es lo que permite medir si
alguien instaló Intervalo. El minijuego no tenía nada equivalente, así que la
diapo que pide la pantalla de inicio se podía mostrar pero no se podía saber si
servía: el cliente sabe si está en standalone y esa señal moría en el navegador.

Revision ID: 20260909_0076
Revises: 20260908_0075
Create Date: 2026-09-09
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260909_0076"
down_revision: Union[str, Sequence[str], None] = "20260908_0075"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("game_players")}
    if "pwa_first_seen_at" not in existing:
        op.add_column(
            "game_players", sa.Column("pwa_first_seen_at", sa.DateTime(), nullable=True)
        )


def downgrade() -> None:
    op.drop_column("game_players", "pwa_first_seen_at")
