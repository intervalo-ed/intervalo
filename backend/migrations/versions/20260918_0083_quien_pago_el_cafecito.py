"""Quién pagó el cafecito

Hasta ahora una donación llegaba anónima y el juego tenía que adivinar de quién
era: se miraban las intenciones abiertas de los últimos treinta minutos y se
repartía entre todas. Está medido lo que eso cuesta — de 27 pagos, 4 quedaron
ambiguos, y a esa gente el juego les mostró «todavía no llegó» DESPUÉS de haber
pagado, que es la única frase del juego capaz de hacer sentir estafado a alguien
que acaba de poner plata (docs/reports/2026-09-17-cafecito-embudo.md).

Con Checkout Pro eso deja de ser necesario: la preferencia se crea con
`external_reference = dx:<jugador>` y el pago vuelve con esa referencia puesta,
así que se lee en vez de inferirse. Esta columna es dónde queda escrito.

Nullable a propósito, y para siempre. Las 57 filas que ya existen no tienen
dueño conocido y no se puede inventar uno; las que sigan entrando por el socket
de Cafecito o por el mail de Mercado Pago tampoco, porque esos avisos traen un
nombre libre o el nombre legal del pagador, y ninguno de los dos es un jugador.
NULL acá quiere decir «no sabemos», que es distinto de «no hay nadie».

Revision ID: 20260918_0083
Revises: 20260914_0082
Create Date: 2026-09-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260918_0083"
down_revision: Union[str, Sequence[str], None] = "20260914_0082"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("game_boosts")}
    if "player_id" not in existing:
        # En modo batch y no con un `add_column` pelado: SQLite no sabe agregar
        # una FOREIGN KEY con ALTER, y la cadena de migraciones se corre entera
        # sobre SQLite en cada check (scripts/check_schema_migrations.py). Batch
        # le da a SQLite la estrategia de copiar y mover, y en Postgres —que es
        # producción— emite el ALTER de siempre.
        with op.batch_alter_table("game_boosts") as batch:
            batch.add_column(sa.Column("player_id", sa.Integer(), nullable=True))
            batch.create_foreign_key(
                "fk_game_boosts_player_id", "game_players", ["player_id"], ["id"]
            )
    indices = {i["name"] for i in sa.inspect(bind).get_indexes("game_boosts")}
    if "ix_game_boosts_player_id" not in indices:
        # Con índice porque la pregunta que esta columna vino a contestar
        # —«¿cuántas personas distintas donaron?»— se hace agrupando por acá, y
        # porque el panel la va a cruzar contra `game_players` en cada carga.
        op.create_index("ix_game_boosts_player_id", "game_boosts", ["player_id"])


def downgrade() -> None:
    op.drop_index("ix_game_boosts_player_id", table_name="game_boosts")
    op.drop_column("game_boosts", "player_id")
