"""Cuántos estudiantes distintos vio cada plantilla

El ancla de β (game/elo.py) necesita saber de cuánta gente viene lo que aprendió
una plantilla, no cuántas respuestas juntó. No es lo mismo: en el primer día de
producción `t5_pow_over_linear` tenía 12 observaciones de **2 personas**, y
`t3_ax` 11 de **2**. Un motor adaptativo sirve lo difícil solo a los que van
bien, así que lo difícil solo recibe evidencia de gente que va bien — y veinte
respuestas de una sola persona no son veinte datos sobre la plantilla, son veinte
datos sobre esa persona.

El contador se mantiene en `answer_exercise`, que suma uno la primera vez que un
estudiante aporta una observación a esa plantilla.

**El backfill no es opcional.** Sin él todas las filas arrancarían en 0, el ancla
devolvería la semilla pelada para todo el banco, y el juego perdería de golpe
toda la calibración que ya tiene. La cuenta usa el mismo criterio que el runtime:
primeros intentos, sin los ejercicios respondidos con la tabla abierta (esos
nunca movieron β y no tienen por qué contar acá).

Revision ID: 20260828_0051
Revises: 20260828_0050
Create Date: 2026-08-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260828_0051"
down_revision: Union[str, Sequence[str], None] = "20260828_0050"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "game_template_stats"

# Subconsulta correlacionada: la soportan SQLite y Postgres igual, que es lo que
# hace falta para que el dev local y producción corran la MISMA migración.
_BACKFILL = sa.text(f"""
    UPDATE {TABLE} SET n_players = (
        SELECT count(DISTINCT a.player_id)
        FROM game_attempts a
        JOIN game_exercises e ON e.id = a.exercise_id
        WHERE e.template_key = {TABLE}.template_key
          AND a.attempt_number = 1
          AND e.peeked = false
    )
""")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if TABLE not in tables:
        return
    if "n_players" not in {c["name"] for c in inspector.get_columns(TABLE)}:
        op.add_column(
            TABLE,
            sa.Column("n_players", sa.Integer(), nullable=False, server_default="0"),
        )
    # El backfill corre aunque la columna ya existiera: es idempotente (recalcula
    # desde los hechos) y así una base a medio migrar termina bien igual.
    if {"game_attempts", "game_exercises"} <= tables:
        bind.execute(_BACKFILL)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE not in set(inspector.get_table_names()):
        return
    if "n_players" in {c["name"] for c in inspector.get_columns(TABLE)}:
        op.drop_column(TABLE, "n_players")
