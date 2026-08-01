"""Add enrollments.motivation (onboarding motivation question)

El refactor del onboarding agrega una pregunta de motivación antes de elegir
curso. La respuesta se guarda por inscripción, junto a university/career, para
poder segmentar y eventualmente adaptar el onboarding más adelante.

Revision ID: 20260724_0015
Revises: 20260722_0014
Create Date: 2026-07-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260724_0015"
down_revision: Union[str, Sequence[str], None] = "20260722_0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "enrollments",
        sa.Column("motivation", sa.String(length=50), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("enrollments", "motivation")
