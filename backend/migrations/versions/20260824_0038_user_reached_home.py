"""Add users.reached_home (llegó alguna vez al home)

Es el escalón que faltaba en el embudo: entre "completó el onboarding" y
"arrancó una sesión" hay 90 personas que se pierden, y hasta ahora no se podía
saber si se trababan en la autenticación o si llegaban a la app y no tocaban
«empezar». Son dos problemas con soluciones distintas.

Lo marca `/user/progress`, que es el endpoint que el home llama en cada carga.

**Backfill.** Se marca en true a quien tenga evidencia de haber llegado:
  - tiene alguna sesión de repaso o práctica — las sesiones se arrancan DESDE
    el home, así que es prueba directa;
  - o tiene `timezone` seteada, que solo escribe ese mismo endpoint.

La unión de las dos es una COTA INFERIOR, no el número exacto: el `tz` viaja
como query param y no siempre llega (medido: 78 usuarios abrieron sesión sin
tenerlo seteado). Para las cohortes anteriores al 24/08 el escalón queda
subestimado, y el panel lo aclara. Desde esta migración en adelante es exacto.

Booleano y no timestamp a propósito: el hecho se puede reconstruir, el momento
no. Un `first_home_at` con fechas inventadas para el pasado rompería en
silencio cualquier análisis temporal que se apoye en él más adelante.

Revision ID: 20260824_0038
Revises: 20260824_0037
Create Date: 2026-08-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260824_0038"
down_revision: Union[str, Sequence[str], None] = "20260824_0037"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {col["name"] for col in sa.inspect(bind).get_columns("users")}
    if "reached_home" not in existing:
        op.add_column(
            "users",
            sa.Column("reached_home", sa.Boolean(), nullable=False,
                      server_default=sa.text("false")),
        )

    # Backfill. Se escribe siempre (no solo al crear la columna) para que una
    # corrida repetida sobre una base a medio migrar termine de completarlo;
    # es idempotente, solo pasa de false a true.
    op.execute(
        """
        UPDATE users SET reached_home = true
        WHERE reached_home = false
          AND (timezone IS NOT NULL
               OR EXISTS (SELECT 1 FROM sessions s
                          WHERE s.user_id = users.id
                            AND s.mode IN ('main', 'practice')))
        """
    )


def downgrade() -> None:
    op.drop_column("users", "reached_home")
