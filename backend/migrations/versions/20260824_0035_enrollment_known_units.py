"""Add enrollments.known_units (unidades que la persona declara conocer)

Slide nueva del onboarding: sobre las 4 unidades del curso elegido, marcar
cuáles ya vio. Se guardan las claves del catálogo separadas por coma
("functions,limits"), mismo criterio de columna corta que `motivation` en esta
misma tabla.

Es un dato DECLARATIVO: no toca SM-2 ni el orden del plan de estudio. Un
autoreporte optimista agendaría lejos temas que la persona en realidad no
domina, y no los volvería a ver. Primero juntamos el dato y vemos si predice
algo.

Marcar es opcional, así que NULL es un valor esperado y frecuente, no un
faltante.

Revision ID: 20260824_0035
Revises: 20260824_0034
Create Date: 2026-08-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260824_0035"
down_revision: Union[str, Sequence[str], None] = "20260824_0034"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {col["name"] for col in sa.inspect(bind).get_columns("enrollments")}
    if "known_units" not in existing:
        op.add_column(
            "enrollments",
            sa.Column("known_units", sa.String(length=100), nullable=True),
        )


def downgrade() -> None:
    op.drop_column("enrollments", "known_units")
