"""En qué brazo del experimento cayó cada jugador del minijuego

dx no tenía dónde anotar la variante, así que un A/B solo se podía leer hasta
donde llega PostHog: los eventos. El final del embudo del juego no es un evento
—el cafecito entra en `game_boosts` y la profundidad en `game_attempts`— y sin
esta columna el brazo se perdía justo antes del resultado.

Se escribe UNA vez, al crear la fila, con la misma regla que la atribución de
primer contacto (`game/router.py :: _persist_attribution`). El formato es
`<experimento>:<brazo>` en un solo campo, para que una fila vieja siga diciendo
a qué experimento pertenecía cuando el experimento en curso sea otro.

Revision ID: 20260913_0078
Revises: 20260911_0077
Create Date: 2026-09-13
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260913_0078"
down_revision: Union[str, Sequence[str], None] = "20260911_0077"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("game_players")}
    if "variant" not in existing:
        op.add_column("game_players", sa.Column("variant", sa.String(48), nullable=True))
    indices = {i["name"] for i in sa.inspect(bind).get_indexes("game_players")}
    if "ix_game_players_variant" not in indices:
        # Con índice porque el panel corta por brazo en cada carga y la tabla
        # crece con cada visita, no con cada jugador activo.
        op.create_index("ix_game_players_variant", "game_players", ["variant"])


def downgrade() -> None:
    op.drop_index("ix_game_players_variant", table_name="game_players")
    op.drop_column("game_players", "variant")
