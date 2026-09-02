"""Add game_players.numeric_cycle_json (ciclado de números por plantilla)

Los números de cada plantilla generadora (game/templates.py) salían de
random.Random puro: nada impedía que el mismo coeficiente saliera repetido
varias veces seguidas. `numeric_cycle_json` guarda, por jugador, qué valores
le quedan por servir a cada ranura de cada plantilla antes de agotar su rango
y recién ahí volver a barajar (game/cycler.py::CyclingRandom). Arranca vacío
("{}") para todo el mundo: no hay ninguna fuente para reconstruir qué números
ya vio cada jugador antes de este cambio.

Revision ID: 20260902_0065
Revises: 20260902_0064
Create Date: 2026-09-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260902_0065"
down_revision: Union[str, Sequence[str], None] = "20260902_0064"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_players" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_players")}
    if "numeric_cycle_json" not in existing:
        op.add_column(
            "game_players",
            sa.Column(
                "numeric_cycle_json", sa.Text(),
                nullable=False, server_default="{}",
            ),
        )


def downgrade() -> None:
    op.drop_column("game_players", "numeric_cycle_json")
