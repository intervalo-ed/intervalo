"""Reclutas: quién trajo a quién, y cuánto le pagó

Tres columnas en `game_players` para la mecánica de referidos del minijuego (ver
game/referrals.py):

· `referred_by` — el jugador cuyo @ venía en el `?r=` del link por el que este
  entró. Autorreferencia a la misma tabla, indexada porque la vista "Reclutas"
  del ranking es exactamente esa consulta.
· `referral_xp_given` — cuánta XP le dio ESTE jugador a quien lo trajo. Vive del
  lado del recluta porque es lo que muestra cada renglón de esa vista.
· `referral_pending` — el resto en centésimas de XP, para que el 10% cierre
  exacto en vez de perderse de a poco en cada redondeo.

Sin backfill: nadie tiene reclutador todavía, y NULL es la respuesta correcta
para todos los jugadores que ya existen.

La clave foránea no se crea en SQLite —haría falta recrear la tabla— igual que en
20260828_0049. Las bases SQLite de este repo se arman con `create_all`, donde la
clave viene desde models.py.

Revision ID: 20260828_0052
Revises: 20260828_0051
Create Date: 2026-08-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260828_0052"
down_revision: Union[str, Sequence[str], None] = "20260828_0051"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE = "game_players"
FK = "fk_game_players_referred_by"
INDICE = "ix_game_players_referred_by"

_COLUMNAS = (
    ("referred_by", sa.Column("referred_by", sa.Integer(), nullable=True)),
    (
        "referral_xp_given",
        sa.Column("referral_xp_given", sa.Integer(), nullable=False, server_default="0"),
    ),
    (
        "referral_pending",
        sa.Column("referral_pending", sa.Integer(), nullable=False, server_default="0"),
    ),
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE not in set(inspector.get_table_names()):
        return
    existentes = {c["name"] for c in inspector.get_columns(TABLE)}
    for nombre, columna in _COLUMNAS:
        if nombre not in existentes:
            op.add_column(TABLE, columna)

    if INDICE not in {i["name"] for i in inspector.get_indexes(TABLE)}:
        op.create_index(INDICE, TABLE, ["referred_by"])

    if bind.dialect.name == "sqlite":
        return
    if FK not in {fk.get("name") for fk in inspector.get_foreign_keys(TABLE)}:
        op.create_foreign_key(FK, TABLE, TABLE, ["referred_by"], ["id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE not in set(inspector.get_table_names()):
        return

    if bind.dialect.name != "sqlite":
        if FK in {fk.get("name") for fk in inspector.get_foreign_keys(TABLE)}:
            op.drop_constraint(FK, TABLE, type_="foreignkey")
    if INDICE in {i["name"] for i in inspector.get_indexes(TABLE)}:
        op.drop_index(INDICE, table_name=TABLE)

    existentes = {c["name"] for c in inspector.get_columns(TABLE)}
    for nombre, _ in reversed(_COLUMNAS):
        if nombre in existentes:
            op.drop_column(TABLE, nombre)
