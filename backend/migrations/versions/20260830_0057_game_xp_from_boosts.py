"""Add game_players.xp_from_boosts (la XP extra que puso el empuje)

El panel de estadísticas tenía una tile rotulada "XP generado por cafecitos"
que mostraba otra cosa: la CANTIDAD de cafecitos que recibió la universidad, de
cualquiera. Ni era XP ni era de la persona.

La XP que el empuje agregó de verdad no se podía calcular: el multiplicador se
aplica al otorgar (game/router.py :: _otorgar_xp) y ni la XP de cada respuesta
ni el multiplicador de ese momento quedan guardados. Esta columna la anota
cuando pasa.

Arranca en cero para todos. Lo que se ganó antes de esta migración no se puede
recuperar, y estimarlo sería mostrar un número inventado en un panel que existe
justamente para mostrar los de verdad.

Revision ID: 20260830_0057
Revises: 20260829_0056
Create Date: 2026-08-30
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260830_0057"
down_revision: Union[str, Sequence[str], None] = "20260829_0056"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_players" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_players")}
    if "xp_from_boosts" not in existing:
        op.add_column(
            "game_players",
            sa.Column(
                "xp_from_boosts",
                sa.Integer(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )


def downgrade() -> None:
    op.drop_column("game_players", "xp_from_boosts")
