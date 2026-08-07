"""Add item exercise cycle tracking + answers.exercise_external_id

Para evitar que un usuario repita un ejercicio de un ítem (belt+topic+
exercise_type) antes de haber completado todos los demás del mismo ítem, se
necesita: (1) saber qué ejercicio real respondió el usuario (answers solo
guardaba el slot posicional de la sesión, no la identidad real del
ejercicio), y (2) un registro por usuario+ítem de qué ejercicios ya se
sirvieron en el ciclo vigente.

Nota: answers.exercise_external_id ya se había agregado una vez (migración
20260718_0012) y se borró al día siguiente (20260719_0013) por un revert que
rompió la cadena de alembic en prod — acá se vuelve a agregar como columna
nueva de cero, sin tocar ninguna migración vieja.

Revision ID: 20260802_0025
Revises: 20260801_0024
Create Date: 2026-08-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260802_0025"
down_revision: Union[str, Sequence[str], None] = "20260801_0024"
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

    op.create_table(
        "item_exercise_cycles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("belt", sa.String(length=20), nullable=False),
        sa.Column("topic", sa.String(length=50), nullable=False),
        sa.Column("exercise_type", sa.String(length=20), nullable=False),
        sa.Column(
            "served_external_ids",
            sa.Text(),
            nullable=False,
            server_default="[]",
        ),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint(
            "user_id", "course_id", "belt", "topic", "exercise_type",
            name="unique_user_course_item_cycle",
        ),
    )
    op.create_index(
        "idx_item_exercise_cycles_user_course",
        "item_exercise_cycles",
        ["user_id", "course_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_item_exercise_cycles_user_course", table_name="item_exercise_cycles")
    op.drop_table("item_exercise_cycles")
    op.drop_index("idx_answers_exercise_external_id", table_name="answers")
    op.drop_column("answers", "exercise_external_id")
