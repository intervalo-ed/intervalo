"""Drop answers.exercise_external_id (revert of #75, deploy failed)

feat/track-exercise-external-id (#75) shipped a broken deploy and was reverted
in code (#77). Production's alembic history was already stamped at 20260718_0012
by the time the deploy crashed, so that migration file is kept in place and this
migration undoes it going forward, instead of deleting it and breaking the chain.

Revision ID: 20260719_0013
Revises: 20260718_0012
Create Date: 2026-07-19
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260719_0013"
down_revision: Union[str, Sequence[str], None] = "20260718_0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("idx_answers_exercise_external_id", table_name="answers")
    op.drop_column("answers", "exercise_external_id")


def downgrade() -> None:
    op.add_column(
        "answers",
        sa.Column("exercise_external_id", sa.String(length=100), nullable=True),
    )
    op.create_index(
        "idx_answers_exercise_external_id",
        "answers",
        ["exercise_external_id"],
    )
