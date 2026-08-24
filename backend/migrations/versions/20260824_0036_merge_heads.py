"""Unificar las dos cabezas de alembic (vacía, solo topología)

El 24/08 el grafo quedó con dos cabezas, las dos colgando de 20260819_0031:

    20260819_0031
      ├── 20260820_0032  (exercises.table_data, rama de ejercicios con tabla)
      └── 20260824_0032  (session_size 8 -> 5)
            └── 20260824_0033  (exercise_feedback.thanks_sent_at)
                  └── 20260824_0034  (exercise_feedback.reason)
                        └── 20260824_0035  (enrollments.known_units)

Pasó porque la rama de tablas salió de un main anterior a 20260824_0032 y se
mergeó después. Las dos ramas tocan tablas distintas, así que no hay conflicto
de esquema — el problema es puramente de topología: con más de una cabeza,
`alembic upgrade head` aborta con "Multiple head revisions are present" y el
deploy se cae antes de arrancar la app.

Esta revisión no toca el esquema. Solo vuelve a juntar las dos ramas para que
haya una única cabeza.

Revision ID: 20260824_0036
Revises: 20260820_0032, 20260824_0035
Create Date: 2026-08-24
"""
from typing import Sequence, Union

revision: str = "20260824_0036"
down_revision: Union[str, Sequence[str], None] = ("20260820_0032", "20260824_0035")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
