"""Empujes de XP por universidad, pagados con cafecitos

El minijuego se financia con donaciones, y hasta ahora el botón de Cafecito era
un link plano: lo que pasaba del otro lado no volvía nunca al juego. Esto lo
convierte en mecánica — quien invita un cafecito multiplica el XP de TODA su
universidad durante media hora, y el resto del ranking lo ve pasar.

Agrega:
  - game_boosts: una fila por donación, que nunca se muta. El multiplicador
    activo de una universidad es una suma sobre las filas no vencidas, así que dos
    donaciones simultáneas no pueden pisarse. `external_ref` es UNIQUE desde el
    día uno —aunque hoy el disparo sea manual— para que el día que entre el mail
    de Cafecito un reenvío no regale el empuje dos veces.
  - game_players.university_set_at: cuándo se CAMBIÓ la universidad por última vez.
    Es el candado del empuje: sin él, cada empuje se llenaría de gente que se
    muda a la universidad impulsada por media hora.

Revision ID: 20260827_0042
Revises: 20260827_0041
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0042"
down_revision: Union[str, Sequence[str], None] = "20260827_0041"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_players" in tables:
        existing = {col["name"] for col in inspector.get_columns("game_players")}
        if "university_set_at" not in existing:
            op.add_column(
                "game_players", sa.Column("university_set_at", sa.DateTime(), nullable=True)
            )

    if "game_boosts" not in tables:
        op.create_table(
            "game_boosts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("university", sa.String(length=120), nullable=False),
            sa.Column("cafecitos", sa.Integer(), nullable=False),
            sa.Column("donor_name", sa.String(length=80), nullable=True),
            sa.Column(
                "source",
                sa.String(length=20),
                nullable=False,
                server_default="manual",
            ),
            sa.Column("external_ref", sa.String(length=64), nullable=True, unique=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_game_boosts_university", "game_boosts", ["university"])
        # La consulta caliente es "empujes vigentes": corre en CADA respuesta del
        # juego, así que el filtro por vencimiento va indexado.
        op.create_index("ix_game_boosts_expires_at", "game_boosts", ["expires_at"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_boosts" in tables:
        op.drop_table("game_boosts")

    if "game_players" in tables:
        existing = {col["name"] for col in inspector.get_columns("game_players")}
        if "university_set_at" in existing:
            op.drop_column("game_players", "university_set_at")
