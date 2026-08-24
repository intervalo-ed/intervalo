"""Add exercise_feedback.reason (canal D: chip de razón)

El canal D pregunta si el problema resultó interesante (aburrido/justo/
interesante). En los dos extremos ofrece un chip de razón opcional, que va
en columna propia y no dentro de `value` ni de `free_text`: es el dato norte
para el análisis de contenido y tiene que agregarse con `GROUP BY value,
reason` sin parsear strings. `split_part` sería Postgres-only y el entorno
local es SQLite, así que las queries de análisis no correrían igual en los
dos lados.

El índice acompaña al targeting nuevo de feedback_survey.py, que cuenta
impresiones por (ítem, canal) en vez de globalmente. Ninguno de los tres
índices existentes lo sirve: idx_exfb_user_item arranca por user_id.

El guard idempotente sigue el patrón de 20260801_0023, que existe por un
incidente donde una columna nunca llegó a producción porque la migración
quedó detrás del stamp de alembic.

Revision ID: 20260824_0034
Revises: 20260824_0033
Create Date: 2026-08-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260824_0034"
down_revision: Union[str, Sequence[str], None] = "20260824_0033"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    existing_cols = {col["name"] for col in inspector.get_columns("exercise_feedback")}
    if "reason" not in existing_cols:
        op.add_column(
            "exercise_feedback",
            sa.Column("reason", sa.String(length=30), nullable=True),
        )

    existing_idx = {ix["name"] for ix in inspector.get_indexes("exercise_feedback")}
    if "idx_exfb_item_type" not in existing_idx:
        op.create_index(
            "idx_exfb_item_type",
            "exercise_feedback",
            ["exercise_external_id", "question_type"],
        )


def downgrade() -> None:
    op.drop_index("idx_exfb_item_type", table_name="exercise_feedback")
    op.drop_column("exercise_feedback", "reason")
