"""Add unit_states.recent_results (portón de graduación "N de los últimos M")

El portón de aprendizaje exigía 3 aciertos al primer intento SEGUIDOS: un solo
resbalón reiniciaba la racha entera a cero. En producción eso sostenía ~34
ítems abiertos y menos de 2 graduados por usuario retenido (ver
2026-08-26-motor-de-sesiones.md §3). `recent_results` guarda los últimos
`learning_window` resultados ("1"/"0", más reciente al final) para poder
graduar con `learning_need` aciertos de esa ventana sin exigir que sean
consecutivos (ver algorithm/sm2.py::_update_learning). VARCHAR(8) alcanza para
cualquier ventana razonable — hoy es 4 — y evita una tabla nueva.

Revision ID: 20260831_0060
Revises: 20260830_0059
Create Date: 2026-08-31
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260831_0060"
down_revision: Union[str, Sequence[str], None] = "20260830_0059"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "unit_states" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("unit_states")}
    if "recent_results" not in existing:
        op.add_column(
            "unit_states",
            sa.Column(
                "recent_results", sa.String(length=8),
                nullable=False, server_default=sa.text("''"),
            ),
        )


def downgrade() -> None:
    op.drop_column("unit_states", "recent_results")
