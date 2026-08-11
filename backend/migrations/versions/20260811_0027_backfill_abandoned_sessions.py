"""Backfill sessions.abandoned

La columna `sessions.abandoned` existe desde la migración inicial pero nunca la
escribió nadie: todas las filas quedaron en false/NULL, incluidas las sesiones
que el usuario efectivamente abandonó. Cualquiera que consultara
`where abandoned = true` obtenía cero filas y concluía que nadie abandona nunca.

No se puede escribir en el momento del abandono (nadie avisa que se fue), así
que se deriva del tiempo: sin `finished_at` y empezada hace más de 2h. De acá en
adelante lo mantiene al día `session_store.sweep_abandoned_sessions`, que corre
cada hora desde el notifier.

Revision ID: 20260811_0027
Revises: 20260810_0026
Create Date: 2026-08-11
"""
from datetime import datetime, timedelta
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260811_0027"
down_revision: Union[str, Sequence[str], None] = "20260810_0026"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Mismo criterio que session_store.sweep_abandoned_sessions (2h). El corte se
    # calcula en Python y se pasa como parámetro: `INTERVAL` es sintaxis Postgres
    # y esta migración también corre contra el SQLite de desarrollo.
    cutoff = datetime.utcnow() - timedelta(hours=2)
    op.execute(
        sa.text(
            """
            UPDATE sessions
            SET abandoned = true
            WHERE finished_at IS NULL
              AND (abandoned IS NULL OR NOT abandoned)
              AND started_at < :cutoff
            """
        ).bindparams(cutoff=cutoff)
    )


def downgrade() -> None:
    # No hay vuelta atrás fiel: antes de esta migración el dato era uniformemente
    # falso, así que "restaurar" es volver todo a false.
    op.execute("UPDATE sessions SET abandoned = false WHERE abandoned IS true")
