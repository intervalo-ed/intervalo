"""Avisos nativos: suscripciones de push de la app de Expo

`game_push_subscriptions.kind` dice por qué canal sale cada fila: "web" (Web
Push, lo que había) o "expo" (la app nativa). Las de Expo guardan el token en
`endpoint` y dejan `p256dh`/`auth` vacías, así que el único de `endpoint` sigue
sirviendo para lo mismo: un aparato es una fila, y si cambia de jugador se muda.

Default "web" en la base para que las filas que ya existen queden como lo que son.

Revision ID: 20261101_0092
Revises: 20261010_0091
Create Date: 2026-11-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20261101_0092"
down_revision: Union[str, Sequence[str], None] = "20261010_0091"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existentes = {
        c["name"] for c in sa.inspect(bind).get_columns("game_push_subscriptions")
    }
    if "kind" not in existentes:
        op.add_column(
            "game_push_subscriptions",
            sa.Column("kind", sa.String(10), nullable=False, server_default="web"),
        )


def downgrade() -> None:
    op.drop_column("game_push_subscriptions", "kind")
