"""Add users.first_group_id / first_utm_source (atribución de primer contacto)

Hasta ahora el origen de cada persona vivía solo en PostHog, como person
property (`first_group_id`, ver web/src/lib/analytics/attribution.ts). Eso tiene
dos problemas para el análisis por cohortes:

  - PostHog subcuenta ~2x por bloqueadores, así que las tasas por origen salen
    de un denominador que no es el real.
  - Cruzar origen con comportamiento (sesiones, XP, retención) obliga a un join
    manual entre dos sistemas, a mano, cada semana.

Con la columna acá, "¿qué grupos traen gente que vuelve?" es una consulta.

Se llenan en `enroll_user` y solo si están en NULL: gana el primer contacto,
igual que el `register_once` del cliente. Los usuarios anteriores a esta
migración quedan en NULL — su historia sigue estando en PostHog.

El índice es por `first_group_id`: todos los cortes del panel agrupan por ahí.

Revision ID: 20260824_0037
Revises: 20260824_0036
Create Date: 2026-08-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260824_0037"
down_revision: Union[str, Sequence[str], None] = "20260824_0036"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns("users")}
    if "first_group_id" not in existing:
        op.add_column("users", sa.Column("first_group_id", sa.String(length=20), nullable=True))
    if "first_utm_source" not in existing:
        op.add_column("users", sa.Column("first_utm_source", sa.String(length=20), nullable=True))

    indexes = {ix["name"] for ix in inspector.get_indexes("users")}
    if "ix_users_first_group_id" not in indexes:
        op.create_index("ix_users_first_group_id", "users", ["first_group_id"])


def downgrade() -> None:
    op.drop_index("ix_users_first_group_id", table_name="users")
    op.drop_column("users", "first_utm_source")
    op.drop_column("users", "first_group_id")
