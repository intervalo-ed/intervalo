"""Cuánta XP le pusieron los reclutas a cada persona

`users.referral_xp_earned` — la parte de `total_xp` que no salió de estudiar.

El ranking de clásico filtra por `total_xp > 0`, y desde que los reclutas pagan
XP de clásico ese filtro dejó de significar «resolvió algo acá»: alguien que
nunca respondió un ejercicio pero trajo a alguien ya aparece en la tabla. Es
exactamente el agujero que el minijuego cerró en la misma serie cambiando a
`exercises_correct > 0`.

Se podría preguntar contra `answers`, pero es la tabla más grande y el ranking la
consultaría en cada request. Con esta columna la pregunta es una comparación
entre dos números de la misma fila.

El backfill es exacto y barato: lo que le dio cada recluta está en su propia fila
(`users.referral_xp_given`), así que sumarlas por reclutador reconstruye el
histórico sin tocar `answers`.

Revision ID: 20260903_0073
Revises: 20260903_0072
Create Date: 2026-09-03
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260903_0073"
down_revision: Union[str, Sequence[str], None] = "20260903_0072"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "referral_xp_earned" in {c["name"] for c in inspector.get_columns("users")}:
        return

    op.add_column(
        "users",
        sa.Column(
            "referral_xp_earned",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    # El reclutador es un `game_players`, y `game_players.user_id` es UNIQUE, así
    # que el jugador es el puente entre las dos filas de `users`.
    op.execute(
        sa.text(
            """
            UPDATE users SET referral_xp_earned = COALESCE((
                SELECT SUM(r.referral_xp_given)
                FROM users AS r
                JOIN game_players AS p ON p.id = r.referred_by_player_id
                WHERE p.user_id = users.id
            ), 0)
            """
        )
    )


def downgrade() -> None:
    op.drop_column("users", "referral_xp_earned")
