"""Dispositivo del minijuego: de dónde vienen y desde dónde juegan

El layout del juego se elige por plataforma —flujo de slides en el teléfono,
todo en una vista en la compu— y hasta ahora eso no quedaba escrito en ningún
lado salvo en PostHog. Sin la columna, el panel no puede contestar ni de dónde
viene la gente ni si se comporta distinto según el aparato, que son dos
preguntas que cambian qué se construye después.

  - game_players.platform: el dispositivo de PRIMER contacto, que no se pisa.
  - game_exercises.platform: el de cada ejercicio, que es lo que permite
    atribuir cada respuesta al aparato en el que se dio.

Los dos los manda el cliente en X-Game-Platform y no se deducen del User-Agent:
`getPlatform()` mira además maxTouchPoints porque un iPad se reporta como
Macintosh, y deducirla en el server diría "desktop" para alguien que en realidad
está jugando el flujo de teléfono.

Nullable sin backfill: las filas viejas no tienen de dónde sacar el dato, y
rellenarlas con un valor inventado sería peor que dejarlas en blanco — el panel
las muestra como «sin dato» y dice cuántas son.

Revision ID: 20260827_0047
Revises: 20260827_0046
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0047"
down_revision: Union[str, Sequence[str], None] = "20260827_0046"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_COLUMNS = (
    ("game_players", "ix_game_players_platform"),
    ("game_exercises", "ix_game_exercises_platform"),
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    for table, index in _COLUMNS:
        if table not in tables:
            continue
        existing = {col["name"] for col in inspector.get_columns(table)}
        if "platform" in existing:
            continue
        op.add_column(table, sa.Column("platform", sa.String(length=8), nullable=True))
        op.create_index(index, table, ["platform"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    for table, index in _COLUMNS:
        if table not in tables:
            continue
        existing = {col["name"] for col in inspector.get_columns(table)}
        if "platform" not in existing:
            continue
        if index in {ix["name"] for ix in inspector.get_indexes(table)}:
            op.drop_index(index, table_name=table)
        op.drop_column(table, "platform")
