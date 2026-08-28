"""Índices del minijuego: universidad y el orden canónico del ranking

Dos índices que faltaban en las columnas por las que más se pregunta.

1. `game_players.university` no tenía ninguno, y se usa en el WHERE de los tres
   endpoints de ranking (general, resumen y universidades), en un
   `SELECT DISTINCT ... ORDER BY university` que corre en CADA carga del
   ranking, y en el GROUP BY de `events._university_standings`, que corre en
   cada tick de simulación — o sea cada diez segundos, para siempre.

2. `(xp DESC, id ASC)` es el orden canónico del juego: así se lista el ranking y
   así se calcula el puesto de alguien. El único índice que había era sobre `xp`
   solo y ascendente, así que tanto el ORDER BY como el COUNT del puesto
   terminaban ordenando la tabla entera. Ese COUNT corre en cada respuesta
   correcta y en cada `/me`, `/player`, `PATCH /me`, `/reset` y `/link`.

Los índices se crean CONCURRENTEMENTE en Postgres: sobre una tabla que está
recibiendo escrituras, un CREATE INDEX común la bloquea hasta terminar, y el
deploy corre las migraciones antes de levantar el server nuevo mientras el
viejo sigue atendiendo. Eso obliga a salir de la transacción de alembic.

Revision ID: 20260828_0050
Revises: 20260828_0049
Create Date: 2026-08-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260828_0050"
down_revision: Union[str, Sequence[str], None] = "20260828_0049"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_IX_UNIVERSIDAD = "ix_game_players_university"
_IX_ORDEN = "ix_game_players_xp_id"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_players" not in set(inspector.get_table_names()):
        return
    existentes = {i["name"] for i in inspector.get_indexes("game_players")}
    postgres = bind.dialect.name == "postgresql"

    if postgres:
        # CONCURRENTLY no puede correr dentro de una transacción.
        with op.get_context().autocommit_block():
            if _IX_UNIVERSIDAD not in existentes:
                op.execute(
                    f"CREATE INDEX CONCURRENTLY IF NOT EXISTS {_IX_UNIVERSIDAD} "
                    "ON game_players (university)"
                )
            if _IX_ORDEN not in existentes:
                op.execute(
                    f"CREATE INDEX CONCURRENTLY IF NOT EXISTS {_IX_ORDEN} "
                    "ON game_players (xp DESC, id ASC)"
                )
        return

    if _IX_UNIVERSIDAD not in existentes:
        op.create_index(_IX_UNIVERSIDAD, "game_players", ["university"])
    if _IX_ORDEN not in existentes:
        # SQLite no distingue el sentido para lo que hace falta acá.
        op.create_index(_IX_ORDEN, "game_players", ["xp", "id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_players" not in set(inspector.get_table_names()):
        return
    existentes = {i["name"] for i in inspector.get_indexes("game_players")}
    for nombre in (_IX_ORDEN, _IX_UNIVERSIDAD):
        if nombre in existentes:
            op.drop_index(nombre, table_name="game_players")
