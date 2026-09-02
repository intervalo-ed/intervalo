"""Add users.pwa_first_seen_at (instaló y abrió la PWA)

El frontend ya sabe detectar si está corriendo en display-mode: standalone
(ver web/src/lib/platform/detect.ts :: isStandalone()) y ya manda esa señal a
PostHog como super-property (`pwa_standalone`), pero nunca se persistía en
esta base — así que ni el embudo, ni las tarjetas titulares, ni la curva de
retención podían responder "¿instaló la app?".

Lo marca `/user/progress?pwa=1`, el mismo endpoint que ya marca
`reached_home` en cada carga del home, con el mismo criterio: se escribe una
sola vez, no se pisa.

Sin backfill, a diferencia de `reached_home`: ahí había evidencia indirecta
(sesiones, timezone) para reconstruir una cota inferior del pasado. Acá no
hay ninguna fuente — nadie mandó esta señal antes de esta migración — así que
la columna nace vacía para todo el mundo y el dato es real desde el día uno.

DateTime y no bool, también a diferencia de `reached_home`: como no hace
falta backfill, no hay fechas inventadas que temer, y el momento exacto es
justamente lo que necesita la curva de retención re-basada (D+0 ancla en
este timestamp).

Revision ID: 20260902_0064
Revises: 20260831_0063
Create Date: 2026-09-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260902_0064"
down_revision: Union[str, Sequence[str], None] = "20260831_0063"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {col["name"] for col in sa.inspect(bind).get_columns("users")}
    if "pwa_first_seen_at" not in existing:
        op.add_column("users", sa.Column("pwa_first_seen_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "pwa_first_seen_at")
