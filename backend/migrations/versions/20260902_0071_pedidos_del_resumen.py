"""El marcador que separa los dos pedidos del resumen

`users.summary_ask_last_session` — el nº de sesión en el que el resumen pidió
algo por última vez, sea el cafecito o reclutar. Con la cadencia sola no alcanza
para garantizar la separación: el café también sale en los hitos de racha, que
caen en cualquier número de sesión y pueden aterrizar justo al lado de un pedido
de reclutas. Ver backend/summary_asks.py.

Nace vacía, y eso es exactamente lo que hace falta: nadie tiene un pedido
anterior que respetar, así que el primero que corresponda sale sin esperar.

Revision ID: 20260902_0071
Revises: 20260902_0070
Create Date: 2026-09-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260902_0071"
down_revision: Union[str, Sequence[str], None] = "20260902_0070"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    users = {c["name"] for c in inspector.get_columns("users")}
    if "summary_ask_last_session" not in users:
        op.add_column(
            "users", sa.Column("summary_ask_last_session", sa.Integer(), nullable=True)
        )


def downgrade() -> None:
    op.drop_column("users", "summary_ask_last_session")
