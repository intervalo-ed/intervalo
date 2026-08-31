"""Add Elo jerárquico: users.ability, exercises.difficulty, item_difficulty

Estado del modelo de selección de próximo ejercicio (algorithm/elo.py):
habilidad por usuario, dificultad por ejercicio con backoff a dificultad por
ítem cuando el ejercicio individual no tiene evidencia propia todavía. Arranca
en 0.0/0 para todo el mundo (cold start correcto: la primera predicción es
p=0.5 y se ajusta solo con cada respuesta, sin reentrenamiento ni pipeline de
features). Ver 2026-08-26-motor-de-sesiones.md §5/§6/§9.

`item_difficulty` es chica a propósito: una fila por (course, belt, topic,
exercise_type) — 209 en producción al 2026-08-26 — no por ejercicio.

Revision ID: 20260831_0062
Revises: 20260831_0061
Create Date: 2026-08-31
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260831_0062"
down_revision: Union[str, Sequence[str], None] = "20260831_0061"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "users" in tables:
        existing = {col["name"] for col in inspector.get_columns("users")}
        if "ability" not in existing:
            op.add_column(
                "users",
                sa.Column("ability", sa.Float(), nullable=False, server_default=sa.text("0.0")),
            )
        if "ability_n" not in existing:
            op.add_column(
                "users",
                sa.Column("ability_n", sa.Integer(), nullable=False, server_default=sa.text("0")),
            )

    if "exercises" in tables:
        existing = {col["name"] for col in inspector.get_columns("exercises")}
        if "difficulty" not in existing:
            op.add_column(
                "exercises",
                sa.Column("difficulty", sa.Float(), nullable=False, server_default=sa.text("0.0")),
            )
        if "difficulty_n" not in existing:
            op.add_column(
                "exercises",
                sa.Column("difficulty_n", sa.Integer(), nullable=False, server_default=sa.text("0")),
            )

    if "item_difficulty" not in tables:
        op.create_table(
            "item_difficulty",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("course_id", sa.Integer(), nullable=False),
            sa.Column("belt", sa.String(20), nullable=False),
            sa.Column("topic", sa.String(50), nullable=False),
            sa.Column("exercise_type", sa.String(20), nullable=False),
            sa.Column("difficulty", sa.Float(), nullable=False, server_default=sa.text("0.0")),
            sa.Column("difficulty_n", sa.Integer(), nullable=False, server_default=sa.text("0")),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["course_id"], ["courses.id"]),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "course_id", "belt", "topic", "exercise_type",
                name="uq_item_difficulty_unit",
            ),
        )


def downgrade() -> None:
    op.drop_table("item_difficulty")
    op.drop_column("exercises", "difficulty_n")
    op.drop_column("exercises", "difficulty")
    op.drop_column("users", "ability_n")
    op.drop_column("users", "ability")
