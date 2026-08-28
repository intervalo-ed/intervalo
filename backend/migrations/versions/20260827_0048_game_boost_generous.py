"""Empujes generosos: intenciones de donar y empuje global

Cafecito no puede decirnos a qué universidad va un cafecito: sus tres campos
—nombre, contacto y mensaje— son opcionales y no se pueden marcar obligatorios.
En vez de exigirle a quien dona que escriba una sigla a mano justo cuando está
pagando, se resuelve del lado de acá:

  - game_boost_intents: cuando alguien toca el botón de cafecito, el juego ya
    sabe quién es y de qué universidad. Se guarda eso, y la donación se empareja
    después por cercanía en el tiempo. No le pide NADA al donante.
  - game_boosts.university pasa a ser NULLABLE: NULL = empuje global, para todo
    el mundo. Es a dónde va la donación que no se puede atribuir. Que una
    donación no produzca nada es el peor resultado posible —la persona pagó y no
    vio pasar nada—, así que la regla es que siempre pase algo, y ante la duda
    se es generoso: en el peor caso se le regala el empuje a más gente.

Revision ID: 20260827_0048
Revises: 20260827_0047
Create Date: 2026-08-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260827_0048"
down_revision: Union[str, Sequence[str], None] = "20260827_0047"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_boosts" in tables:
        cols = {c["name"]: c for c in inspector.get_columns("game_boosts")}
        if "university" in cols and not cols["university"]["nullable"]:
            # SQLite no sabe ALTER COLUMN; alembic lo resuelve recreando la tabla.
            with op.batch_alter_table("game_boosts") as batch:
                batch.alter_column(
                    "university", existing_type=sa.String(length=120), nullable=True
                )

    if "game_boost_intents" not in tables:
        op.create_table(
            "game_boost_intents",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("player_id", sa.Integer(), nullable=False),
            sa.Column("university", sa.String(length=120), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("consumed_at", sa.DateTime(), nullable=True),
        )
        op.create_index("ix_game_boost_intents_id", "game_boost_intents", ["id"])
        op.create_index(
            "ix_game_boost_intents_player_id", "game_boost_intents", ["player_id"]
        )
        op.create_index(
            "ix_game_boost_intents_university", "game_boost_intents", ["university"]
        )
        # La consulta es siempre "las de la última media hora sin consumir".
        op.create_index(
            "ix_game_boost_intents_created_at", "game_boost_intents", ["created_at"]
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "game_boost_intents" in tables:
        op.drop_table("game_boost_intents")

    # `university` vuelve a NOT NULL: los empujes globales, que no tienen a dónde
    # ir en el esquema viejo, se descartan.
    if "game_boosts" in tables:
        op.execute(sa.text("DELETE FROM game_boosts WHERE university IS NULL"))
        with op.batch_alter_table("game_boosts") as batch:
            batch.alter_column(
                "university", existing_type=sa.String(length=120), nullable=False
            )
