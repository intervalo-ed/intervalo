"""Los grupos de WhatsApp del tracker, copiados a la base

El panel sabía cuántos jugadores trajo cada grupo pero no cuánta gente había
adentro, así que no podía calcular lo único que compara dos difusiones entre sí:
el clickrate por miembro. Ese denominador vivía en un Google Sheet y se cruzaba
a mano — el reporte del 28/08 tiene los nueve grupos escritos como constantes.

Es una copia y no la fuente: la fuente sigue siendo el Sheet. La refresca
`scripts/diag/sync_grupos.py` cuando se manda una ola, y `synced_at` deja que el
panel diga qué tan vieja está en vez de mentir en silencio.

Revision ID: 20260913_0079
Revises: 20260913_0078
Create Date: 2026-09-13
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260913_0079"
down_revision: Union[str, Sequence[str], None] = "20260913_0078"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "game_groups" in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        "game_groups",
        sa.Column("id", sa.String(20), primary_key=True),
        sa.Column("universidad", sa.String(120), nullable=True),
        sa.Column("cluster", sa.String(120), nullable=True),
        sa.Column("materia", sa.String(120), nullable=True),
        sa.Column("titulo", sa.String(200), nullable=True),
        sa.Column("miembros", sa.Integer(), nullable=True),
        sa.Column("ultimo_envio", sa.Date(), nullable=True),
        sa.Column("ultima_campana", sa.String(120), nullable=True),
        sa.Column("producto", sa.String(40), nullable=True),
        sa.Column("fuente", sa.String(20), nullable=True),
        sa.Column("synced_at", sa.DateTime(), nullable=False),
    )
    for col in ("universidad", "ultimo_envio", "ultima_campana", "producto"):
        op.create_index(f"ix_game_groups_{col}", "game_groups", [col])


def downgrade() -> None:
    op.drop_table("game_groups")
