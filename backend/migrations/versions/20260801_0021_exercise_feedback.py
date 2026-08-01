"""Add exercise_feedback table and exercises.reviewed column

Micro-encuesta de feedback post-ejercicio: registra impressions/respuestas de
las encuestas de dificultad ("A"), utilidad de la explicación ("B") y
reportes de problemas de contenido ("C"), atadas a la clave real del
ejercicio (exercise_external_id), no al slot de sesión. `reviewed` en
exercises se usa para priorizar qué ítem lleva la encuesta.

Revision ID: 20260801_0021
Revises: 20260729_0018
Create Date: 2026-08-01
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260801_0021"
down_revision: Union[str, Sequence[str], None] = "20260729_0018"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "exercises",
        sa.Column("reviewed", sa.Boolean(), nullable=True),
    )

    op.create_table(
        "exercise_feedback",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("session_id", sa.Integer(), sa.ForeignKey("sessions.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("exercise_external_id", sa.String(length=100), nullable=False),
        sa.Column("question_type", sa.String(length=1), nullable=False),
        sa.Column("value", sa.String(length=30), nullable=True),
        sa.Column("free_text", sa.Text(), nullable=True),
        sa.Column("shown_at", sa.DateTime(), nullable=False),
        sa.Column("answered_at", sa.DateTime(), nullable=True),
    )
    op.create_index("idx_exfb_user_course", "exercise_feedback", ["user_id", "course_id"])
    op.create_index("idx_exfb_session", "exercise_feedback", ["session_id"])
    op.create_index("idx_exfb_user_item", "exercise_feedback", ["user_id", "exercise_external_id"])


def downgrade() -> None:
    op.drop_index("idx_exfb_user_item", table_name="exercise_feedback")
    op.drop_index("idx_exfb_session", table_name="exercise_feedback")
    op.drop_index("idx_exfb_user_course", table_name="exercise_feedback")
    op.drop_table("exercise_feedback")
    op.drop_column("exercises", "reviewed")
