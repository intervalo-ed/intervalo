"""El historial guarda las piezas, no la oración resuelta

El feed escribía las siglas y los nombres como texto plano, así que en pantalla
la UBA no se veía como la UBA y un jugador no llevaba el color de su nivel. Para
poder pintarlos hay que saber DÓNDE están: el texto pasa a traer marcadores
({a}, {u0}, {u1}) y estas columnas, con qué reemplazarlos.

  - actor_level: el nivel del jugador cuando ocurrió el evento, que es lo que le
    da color al nombre igual que en el ranking. NULL cuando el nombre no es de un
    jugador (quien invita un cafecito escribe lo que quiere en Cafecito).
  - university_b: la segunda universidad de los eventos entre dos.

Las filas viejas no tienen marcadores y se siguen mostrando tal cual: sin `{}`
que reemplazar, el texto sale plano y nada se rompe.

Revision ID: 20260827_0045
Revises: 20260827_0044
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0045"
down_revision: Union[str, Sequence[str], None] = "20260827_0044"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_events" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_events")}
    for name, kind in (
        ("actor_level", sa.Integer()),
        ("university_b", sa.String(length=120)),
    ):
        if name not in existing:
            op.add_column("game_events", sa.Column(name, kind, nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_events" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_events")}
    for name in ("university_b", "actor_level"):
        if name in existing:
            op.drop_column("game_events", name)
