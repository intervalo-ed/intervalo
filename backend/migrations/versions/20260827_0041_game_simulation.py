"""Simulación de actividad del ranking del minijuego

Un ranking congelado no engancha: si nada se mueve mientras la persona resuelve,
escalar no se siente como ganarle a nadie. Los jugadores sembrados pasan a
"jugar" mediante un tick perezoso que dispara el propio tráfico
(backend/game/simulation.py) — sin worker ni cron, así que no cuesta nada cuando
no hay nadie mirando.

Esto agrega:
  - game_sim_state: una sola fila con el momento del último avance (para que dos
    requests simultáneas no adelanten dos veces) y un `version` que se
    incrementa con cada cambio del ranking. El cliente consulta ese número cada
    10 s y solo refresca la lista si cambió.
  - game_players.rank_snapshot / rank_snapshot_at: foto del puesto de cada
    jugador tomada cada tanto. La diferencia contra el puesto actual es la
    flechita de "se movió recién" de cada fila.

Revision ID: 20260827_0041
Revises: 20260827_0040
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0041"
down_revision: Union[str, Sequence[str], None] = "20260827_0040"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_players" in tables:
        existing = {col["name"] for col in inspector.get_columns("game_players")}
        for name, kind in (
            ("rank_snapshot", sa.Integer()),
            ("rank_snapshot_at", sa.DateTime()),
            ("rank_recent", sa.Integer()),
            ("rank_recent_at", sa.DateTime()),
        ):
            if name not in existing:
                op.add_column("game_players", sa.Column(name, kind, nullable=True))

    if "game_sim_state" not in tables:
        op.create_table(
            "game_sim_state",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("last_tick_at", sa.DateTime(), nullable=True),
            sa.Column("last_snapshot_at", sa.DateTime(), nullable=True),
            sa.Column(
                "version", sa.Integer(), nullable=False, server_default=sa.text("0")
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_sim_state" in tables:
        op.drop_table("game_sim_state")

    if "game_players" in tables:
        existing = {col["name"] for col in inspector.get_columns("game_players")}
        for name in ("rank_recent_at", "rank_recent", "rank_snapshot_at", "rank_snapshot"):
            if name in existing:
                op.drop_column("game_players", name)
