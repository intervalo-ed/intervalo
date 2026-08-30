"""El juego marca si se leyó el «¿Por qué?» antes de acertar

El juego pasa a explicar. Cuando la derivada sale mal, al lado de Revisar y
Saltear aparece un «¿Por qué?» que muestra de dónde salía —y por lo tanto
muestra la respuesta—, así que acertar después de leerlo no puede pagar lo
mismo que resolverlo (game/xp.py :: XP_EXPLICADO).

La columna es hermana de `peeked` y se lee igual en el panel: separa «resolvió»
de «lo leyó». La diferencia está en de quién viene el dato. `peeked` lo confiesa
el cliente al responder, porque la tabla de derivadas la abre el front y el
servidor no se entera; esto lo escribe el servidor, porque la explicación se la
tiene que pedir a él. No hay forma de leer el ¿Por qué? sin quedar marcado.

Sin backfill: los ejercicios viejos son todos de antes de que el botón
existiera, así que `false` es su valor correcto y no una aproximación.

Revision ID: 20260829_0054
Revises: 20260828_0053
Create Date: 2026-08-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260829_0054"
down_revision: Union[str, Sequence[str], None] = "20260828_0053"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "game_exercises"
COLUMN = "explained"


def _tiene_columna(bind) -> bool:
    inspector = sa.inspect(bind)
    if TABLE not in set(inspector.get_table_names()):
        return False
    return COLUMN in {c["name"] for c in inspector.get_columns(TABLE)}


def upgrade() -> None:
    bind = op.get_bind()
    if _tiene_columna(bind):
        return
    op.add_column(
        TABLE,
        sa.Column(
            COLUMN,
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    bind = op.get_bind()
    if not _tiene_columna(bind):
        return
    op.drop_column(TABLE, COLUMN)
