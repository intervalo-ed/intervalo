"""Move Probabilidad unit from blue to white belt (data migration)

Reasigna el cinturón de los temas de la unidad `probabilidad` (curso
probabilidad) de blue → white, para acompañar el cambio de catálogo
(content/probabilidad + course.json). Toca el progreso de usuarios ya existentes
en `unit_states` (y su archivo). Los ejercicios (tabla `exercises`) y los
headlines (`belt_info`) los reasigna el seeder desde el contenido.

Revision ID: 20260711_0009
Revises: 20260711_0008
Create Date: 2026-07-11
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260711_0009"
down_revision: Union[str, Sequence[str], None] = "20260711_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Temas de la unidad `probabilidad` que se mueven de cinturón.
_TOPICS = (
    "espacios", "axiomas", "laplace", "condicional",
    "independencia", "total", "bayes",
)


def _remap(from_belt: str, to_belt: str) -> None:
    bind = op.get_bind()
    course_id = bind.execute(
        sa.text("SELECT id FROM courses WHERE slug = 'probabilidad'")
    ).scalar()
    if course_id is None:
        return  # curso no seedeado en este entorno: nada que migrar
    placeholders = ", ".join(f":t{i}" for i in range(len(_TOPICS)))
    params = {f"t{i}": t for i, t in enumerate(_TOPICS)}
    params.update(cid=course_id, frm=from_belt, to=to_belt)
    for table in ("unit_states", "unit_state_archive"):
        bind.execute(
            sa.text(
                f"UPDATE {table} SET belt = :to "
                f"WHERE course_id = :cid AND belt = :frm "
                f"AND topic IN ({placeholders})"
            ),
            params,
        )


def upgrade() -> None:
    _remap("blue", "white")


def downgrade() -> None:
    _remap("white", "blue")
