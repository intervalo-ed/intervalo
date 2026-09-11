"""Cuánto pesa cada línea del feed del juego

El feed emitía una línea por cada hecho, y cada hecho por separado obedecía su
regla —es una entrada y no un estado, el hito se cuenta una vez—. Aun así una
sesión de veinte minutos producía cinco líneas, porque son cinco hechos
DISTINTOS de la misma persona: medido en producción, cuatro personas armaron 20
de los 47 eventos de un día.

Para frenar eso hace falta comparar la línea nueva contra la que YA está
publicada, y para comparar hace falta guardar cuánto pesaba. Eso es esta columna.

Revision ID: 20260911_0077
Revises: 20260909_0076
Create Date: 2026-09-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260911_0077"
down_revision: Union[str, Sequence[str], None] = "20260909_0076"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("game_events")}
    if "strength" not in existing:
        op.add_column("game_events", sa.Column("strength", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("game_events", "strength")
