"""El registro de nombres: un @ por persona, en todo Intervalo

Crea `handles` y la llena con lo que ya existe. NO cambia ningún comportamiento:
después de esta migración nada lee la tabla todavía, y `users.username` y
`game_players.alias` siguen siendo la autoridad. Es a propósito — así se puede
desplegar, mirar los datos y recién después dar vuelta los escritores.

Y NO decide ganadores. Si un mismo string es de dos personas distintas, el
backfill deja la primera fila y saltea la segunda en silencio; quién se queda
con qué lo resuelve `scripts/reconcile_handles.py`, que renombra gente y por eso
no puede vivir acá: Alembic corre solo en cada deploy de Railway, y un
renombrado que te sorprende a las 3 AM no es algo para automatizar.

Medido contra producción antes de escribir esto (573 usuarios, 99 jugadores):
cero colisiones reales, cero alias de invitado que pisen un username, y tres
divergencias de gente cuyo @ del juego difiere del username. O sea que el
backfill entra completo y no saltea nada.

El ORDEN de los tres pasos importa, y es de más específico a más general:

  1. Los @ ya retirados del juego (`game_alias_history`). Van primero porque son
     los únicos que ya no se pueden reclamar: si un username vivo pisa uno de
     estos, el que tiene que perder es el username, no la historia.
  2. Los alias vivos de `game_players`.
  3. Los `users.username` que todavía no estén.

Revision ID: 20260902_0067
Revises: 20260902_0066
Create Date: 2026-09-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260902_0067"
down_revision: Union[str, Sequence[str], None] = "20260902_0066"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if "handles" not in set(inspector.get_table_names()):
        op.create_table(
            "handles",
            sa.Column("handle", sa.String(30), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
            sa.Column(
                "player_id", sa.Integer(), sa.ForeignKey("game_players.id"), nullable=True
            ),
            sa.Column(
                "status", sa.String(10), nullable=False, server_default="active"
            ),
            sa.Column("claimed_at", sa.DateTime(), nullable=True),
            sa.Column("released_at", sa.DateTime(), nullable=True),
            sa.CheckConstraint(
                "user_id IS NOT NULL OR player_id IS NOT NULL", name="ck_handles_owner"
            ),
            sa.CheckConstraint(
                "status IN ('active','retired')", name="ck_handles_status"
            ),
        )
        op.create_index("ix_handles_user_id", "handles", ["user_id"])
        op.create_index("ix_handles_player_id", "handles", ["player_id"])
        # Parciales: un solo handle ACTIVO por dueño, pero los retirados se
        # acumulan sin límite. Hacen falta las dos variantes de `where` porque
        # los checks del repo arman la base en SQLite y producción es Postgres.
        op.create_index(
            "uq_handles_active_user",
            "handles",
            ["user_id"],
            unique=True,
            sqlite_where=sa.text("status = 'active' AND user_id IS NOT NULL"),
            postgresql_where=sa.text("status = 'active' AND user_id IS NOT NULL"),
        )
        op.create_index(
            "uq_handles_active_player",
            "handles",
            ["player_id"],
            unique=True,
            sqlite_where=sa.text("status = 'active' AND player_id IS NOT NULL"),
            postgresql_where=sa.text("status = 'active' AND player_id IS NOT NULL"),
        )

    # ── Backfill ──────────────────────────────────────────────────────────────
    #
    # Idempotente por el `NOT EXISTS`: se puede correr de nuevo sin duplicar ni
    # pisar nada. No se usa `ON CONFLICT DO NOTHING` porque SQLite y Postgres lo
    # escriben distinto y esto corre en los dos.

    # 1. Los @ retirados del juego.
    op.execute(
        """
        INSERT INTO handles (handle, player_id, status, claimed_at, released_at)
        SELECT h.alias, h.player_id, 'retired', h.released_at, h.released_at
        FROM game_alias_history h
        WHERE NOT EXISTS (SELECT 1 FROM handles x WHERE x.handle = h.alias)
        """
    )

    # 2. Los alias vivos. `user_id` viaja en la misma fila cuando el jugador ya
    #    está vinculado: es la MISMA persona, no dos dueños.
    op.execute(
        """
        INSERT INTO handles (handle, player_id, user_id, status, claimed_at)
        SELECT gp.alias, gp.id, gp.user_id, 'active', gp.created_at
        FROM game_players gp
        WHERE gp.alias IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM handles x WHERE x.handle = gp.alias)
        """
    )

    # 3. Los usernames que falten. El `NOT EXISTS` sobre user_id evita darle DOS
    #    filas activas a un jugador registrado cuyo alias ya entró en el paso 2
    #    con su user_id puesto: ahí el username diverge y lo resuelve la
    #    reconciliación, no el backfill.
    op.execute(
        """
        INSERT INTO handles (handle, user_id, status, claimed_at)
        SELECT u.username, u.id, 'active', u.created_at
        FROM users u
        WHERE u.username IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM handles x WHERE x.handle = u.username)
          AND NOT EXISTS (
              SELECT 1 FROM handles y
              WHERE y.user_id = u.id AND y.status = 'active'
          )
        """
    )


def downgrade() -> None:
    op.drop_index("uq_handles_active_player", table_name="handles")
    op.drop_index("uq_handles_active_user", table_name="handles")
    op.drop_index("ix_handles_player_id", table_name="handles")
    op.drop_index("ix_handles_user_id", table_name="handles")
    op.drop_table("handles")
