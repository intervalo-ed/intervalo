"""Purge removed algebra topics divisibility & fractions (data migration)

El PR #103 (commit 14cbc30) eliminó los topics `divisibility` y `fractions` de
la unidad Aritmética del curso álgebra, pero solo del catálogo (course.json +
algebra.generated.ts + borrado de los JSON de contenido). La DB quedó con:

- filas `exercises` huérfanas: el seeder de arranque corre sin `--prune`
  (main.py), así que nunca se borran los ejercicios seedeados antes de la
  remoción → siguen sirviéndose en repaso.
- filas `unit_states`/`unit_state_archive` de progreso del usuario para esos
  topics: el motor de repaso (session_store._load_unit_states) las carga sin
  filtrar por catálogo → build_session las agenda cuando vencen.

Esta migración completa la remoción borrando esas filas huérfanas. Es
irreversible por diseño (borra progreso/ejercicios); el downgrade es no-op.
Idempotente: los DELETE sin match son no-ops en entornos ya limpios.

`answers` guarda belt/topic como strings sin FK a `exercises`, y nada referencia
`unit_states` por FK, así que el borrado no viola constraints ni toca el
historial de respuestas ni el XP (que vive en users.total_xp).

Revision ID: 20260722_0014
Revises: 20260719_0013
Create Date: 2026-07-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260722_0014"
down_revision: Union[str, Sequence[str], None] = "20260719_0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Topics removidos de la unidad Aritmética (belt white) del curso álgebra.
_BELT = "white"
_TOPICS = ("divisibility", "fractions")


def upgrade() -> None:
    bind = op.get_bind()
    course_id = bind.execute(
        sa.text("SELECT id FROM courses WHERE slug = 'algebra'")
    ).scalar()
    if course_id is None:
        return  # curso no seedeado en este entorno: nada que limpiar

    placeholders = ", ".join(f":t{i}" for i in range(len(_TOPICS)))
    params = {f"t{i}": t for i, t in enumerate(_TOPICS)}
    params.update(cid=course_id, belt=_BELT)

    for table in ("exercises", "unit_states", "unit_state_archive"):
        bind.execute(
            sa.text(
                f"DELETE FROM {table} "
                f"WHERE course_id = :cid AND belt = :belt "
                f"AND topic IN ({placeholders})"
            ),
            params,
        )


def downgrade() -> None:
    # No-op: el borrado de progreso/ejercicios es irreversible, y los JSON de
    # contenido de estos topics ya no existen (borrados en 14cbc30), así que
    # re-seedear tampoco los recrearía.
    pass
