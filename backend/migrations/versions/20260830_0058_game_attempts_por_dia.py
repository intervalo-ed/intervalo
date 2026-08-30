"""Índice compuesto (player_id, created_at) en game_attempts

`_correctas_de_hoy` corre en CADA respuesta —también en las que no parsean— para
armar el `correct_today` que el cliente usa en la diapo del cafecito. Cuenta los
intentos correctos del jugador desde la medianoche local.

Hasta ahora esa consulta se sostenía por `ix_game_attempts_player_id` y porque en
la práctica había pocas filas por jugador. El propio código lo dejaba anotado
como una apuesta y no como una garantía (game/router.py :: _inicio_del_dia): con
MAX_ATTEMPTS=2 el techo por ejercicio estaba puesto, pero desde que los intentos
son ilimitados lo único que mantiene chico el conteo es que nadie insista diez
veces con la misma derivada. Justo los jugadores más activos —los que más
responden y los que más veces ven esa diapo— son los que rompen el supuesto.

El índice compuesto convierte el filtro por fecha en parte del recorrido en vez
de un descarte fila por fila, que es lo que la nota del código pedía.

Se crea CONCURRENTEMENTE en Postgres por lo mismo que los de 20260828_0050: el
deploy corre las migraciones con el server viejo todavía atendiendo, y un
CREATE INDEX común bloquea la tabla mientras dura.

Revision ID: 20260830_0058
Revises: 20260830_0057
Create Date: 2026-08-30
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260830_0058"
down_revision: Union[str, Sequence[str], None] = "20260830_0057"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_IX_POR_DIA = "ix_game_attempts_player_created"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_attempts" not in set(inspector.get_table_names()):
        return
    existentes = {i["name"] for i in inspector.get_indexes("game_attempts")}
    if _IX_POR_DIA in existentes:
        return

    if bind.dialect.name == "postgresql":
        # CONCURRENTLY no puede correr dentro de una transacción.
        with op.get_context().autocommit_block():
            op.execute(
                f"CREATE INDEX CONCURRENTLY IF NOT EXISTS {_IX_POR_DIA} "
                "ON game_attempts (player_id, created_at)"
            )
        return

    op.create_index(_IX_POR_DIA, "game_attempts", ["player_id", "created_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_attempts" not in set(inspector.get_table_names()):
        return
    if _IX_POR_DIA in {i["name"] for i in inspector.get_indexes("game_attempts")}:
        op.drop_index(_IX_POR_DIA, table_name="game_attempts")
