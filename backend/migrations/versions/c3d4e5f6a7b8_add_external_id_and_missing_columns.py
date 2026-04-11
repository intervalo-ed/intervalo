"""add exercise external_id and missing columns (display_name, attempted)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-04-10

Agrega:
- users.display_name (existía en models.py pero faltaba en la migración inicial)
- item_states.attempted (existía en models.py pero faltaba en la migración inicial)
- exercises.external_id + constraint único (course_id, external_id) + índice

La columna external_id queda nullable para que las 42 filas existentes no rompan.
El seeder (backend/seed_content.py) se encarga de llenarla en el primer run.

Nota: esta migración es **condicional** — inspecciona el schema antes de agregar
columnas/índices/constraints. Esto es necesario porque versiones anteriores del
backend llamaban `init_db()` (Base.metadata.create_all) al arrancar, lo que pudo
haber creado algunas de estas columnas fuera del historial de migraciones.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _columns(inspector, table: str) -> set[str]:
    return {c["name"] for c in inspector.get_columns(table)}


def _index_names(inspector, table: str) -> set[str]:
    return {ix["name"] for ix in inspector.get_indexes(table)}


def _unique_constraint_names(inspector, table: str) -> set[str]:
    return {uc["name"] for uc in inspector.get_unique_constraints(table)}


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    # 1) users.display_name
    if "display_name" not in _columns(inspector, "users"):
        with op.batch_alter_table("users") as batch:
            batch.add_column(sa.Column("display_name", sa.String(200), nullable=True))

    # 2) item_states.attempted
    if "attempted" not in _columns(inspector, "item_states"):
        with op.batch_alter_table("item_states") as batch:
            batch.add_column(
                sa.Column(
                    "attempted",
                    sa.Boolean(),
                    nullable=True,
                    server_default=sa.false(),
                )
            )

    # Re-inspeccionar después de los batch_alter_table (en SQLite recrean la tabla)
    inspector = sa.inspect(bind)

    # 3) exercises.external_id (+ unique constraint + index)
    ex_cols = _columns(inspector, "exercises")
    ex_uniques = _unique_constraint_names(inspector, "exercises")
    ex_indexes = _index_names(inspector, "exercises")

    needs_column = "external_id" not in ex_cols
    needs_unique = "uq_exercises_course_external_id" not in ex_uniques

    if needs_column or needs_unique:
        with op.batch_alter_table("exercises") as batch:
            if needs_column:
                batch.add_column(sa.Column("external_id", sa.String(100), nullable=True))
            if needs_unique:
                batch.create_unique_constraint(
                    "uq_exercises_course_external_id",
                    ["course_id", "external_id"],
                )

    # Re-inspeccionar por si batch recreó la tabla
    inspector = sa.inspect(bind)
    ex_indexes = _index_names(inspector, "exercises")
    if "idx_exercises_external_id" not in ex_indexes:
        op.create_index(
            "idx_exercises_external_id",
            "exercises",
            ["course_id", "external_id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "idx_exercises_external_id" in _index_names(inspector, "exercises"):
        op.drop_index("idx_exercises_external_id", table_name="exercises")

    inspector = sa.inspect(bind)
    with op.batch_alter_table("exercises") as batch:
        if "uq_exercises_course_external_id" in _unique_constraint_names(inspector, "exercises"):
            batch.drop_constraint("uq_exercises_course_external_id", type_="unique")
        if "external_id" in _columns(inspector, "exercises"):
            batch.drop_column("external_id")

    inspector = sa.inspect(bind)
    if "attempted" in _columns(inspector, "item_states"):
        with op.batch_alter_table("item_states") as batch:
            batch.drop_column("attempted")

    inspector = sa.inspect(bind)
    if "display_name" in _columns(inspector, "users"):
        with op.batch_alter_table("users") as batch:
            batch.drop_column("display_name")
