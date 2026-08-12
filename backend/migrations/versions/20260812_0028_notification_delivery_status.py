"""Resultado de entrega en notification_sends

La fila de `notification_sends` se crea en `push_store.due_notifications`, o sea
cuando el backend elige el copy — antes de que el notifier intente el envío. El
resultado que devuelve el push service (FCM/APNs) sí lo conoce el notifier, pero
hasta ahora solo lo escribía en un `Console.warn` y lo descartaba.

Consecuencia: un envío que nunca salió quedaba en la base idéntico a uno
exitoso, así que una tasa de apertura baja no permitía distinguir "la ignoraron"
(problema de copy) de "nunca llegó" (problema de infraestructura) — dos
diagnósticos opuestos.

Estas columnas las completa el notifier vía POST /internal/push/delivery.
NULL = envío anterior a esta migración, o todavía sin reportar.

Revision ID: 20260812_0028
Revises: 20260811_0027
Create Date: 2026-08-12
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260812_0028"
down_revision: Union[str, Sequence[str], None] = "20260811_0027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notification_sends",
        sa.Column("delivery_status", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "notification_sends",
        sa.Column("delivered_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("notification_sends", "delivered_at")
    op.drop_column("notification_sends", "delivery_status")
