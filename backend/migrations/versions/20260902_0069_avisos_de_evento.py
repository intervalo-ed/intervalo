"""Cupo propio para las notificaciones de evento (reclutas y cafecito)

Hasta acá el sistema mandaba ESTRICTAMENTE una notificación por día:
`users.notify_last_sent_on` es un `Date` que se escribe en el mismo commit que
el envío (claim-on-read), justamente para que un tick repetido o solapado no
mande dos veces.

Los avisos nuevos —«tu recluta ya te generó N XP», «alguien de tu universidad
invitó un cafecito»— no pueden competir por ese cupo. Si compartieran uno, un
cafecito de la mañana le comería el recordatorio de estudio del mediodía, que es
la notificación que sostiene el hábito y la que más peso tiene en el producto.

Así que el tope pasa a ser 3 por día repartidos: UNA normal, con su guarda de
siempre, y hasta DOS de evento con este contador aparte.

`notify_events_on` guarda el día LOCAL al que corresponde el conteo. Guardando
la fecha en vez de un simple contador, el cupo se reinicia solo cuando cambia el
día de esa persona —cada una tiene su huso— y no hace falta ningún job que lo
limpie a medianoche.

Revision ID: 20260902_0069
Revises: 20260902_0068
Create Date: 2026-09-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260902_0069"
down_revision: Union[str, Sequence[str], None] = "20260902_0068"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("users")}
    if "notify_events_on" not in existing:
        op.add_column("users", sa.Column("notify_events_on", sa.Date(), nullable=True))
    if "notify_events_count" not in existing:
        op.add_column(
            "users",
            sa.Column(
                "notify_events_count", sa.Integer(), nullable=False, server_default="0"
            ),
        )


def downgrade() -> None:
    op.drop_column("users", "notify_events_count")
    op.drop_column("users", "notify_events_on")
