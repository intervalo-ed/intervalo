"""Track the exact exercise served per answer (exercise_external_id)

answers.exercise_id only stores the positional session slot ("ex_000"); it does
not identify the real exercise the user saw. This adds a stable identifier
(external_id, e.g. "white_definition_clsf_01") reported by the client so we can
audit exactly which exercise each user answered in each session.

Revision ID: 20260718_0012
Revises: 20260715_0011
Create Date: 2026-07-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260718_0012"
down_revision: Union[str, Sequence[str], None] = "20260715_0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "answers",
        sa.Column("exercise_external_id", sa.String(length=100), nullable=True),
    )
    op.create_index(
        "idx_answers_exercise_external_id",
        "answers",
        ["exercise_external_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_answers_exercise_external_id", table_name="answers")
    op.drop_column("answers", "exercise_external_id")
