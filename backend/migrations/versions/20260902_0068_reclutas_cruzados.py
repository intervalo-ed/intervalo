"""Los reclutas cruzan de producto: una sola arista, dos monedas

Hasta acá el reclutamiento vivía entero adentro del minijuego: `?r=<@>` anotaba
`game_players.referred_by` y cada derivada del recluta le pagaba 10% de XP DE
JUEGO a quien lo trajo. Si el recluta terminaba estudiando en Intervalo clásico,
el reclutador no cobraba nada.

Cuatro columnas para que esa misma relación pague también del lado de clásico,
en su propia moneda.

`users.referred_by_player_id` apunta a `game_players` y no a `users`, y no es un
descuido: el reclutador puede ser un INVITADO del juego, que no tiene fila en
`users`. Ese es justo el caso que hace viral al minijuego —se comparte antes de
registrarse— así que una arista que no lo cubra no cubre lo que importa. Como
`game_players.user_id` es UNIQUE, el jugador ES el join hacia el usuario.

`users.referral_xp_given` y `users.referral_pending` son el espejo exacto de las
del juego, incluida la contabilidad en CENTÉSIMAS: el 10% de una respuesta de 12
XP son 1,2, y redondeando cada pago hacia abajo el 10% prometido se convierte en
8%.

`game_players.classic_xp_owed` es la deuda que no tiene dónde ir todavía: un
reclutador invitado cuyo recluta estudia en clásico gana XP que no se le puede
acreditar porque no tiene cuenta. Se acumula y se salda cuando la fila adquiere
`user_id`. Perderla mataría el caso viral; y de paso es el mejor argumento para
registrarse, porque al hacerlo cobrás lo que ya generaste.

Las cuatro nacen vacías y sin backfill, y es lo correcto: en producción todavía
no hay ni un recluta (medido: cero, de nadie), así que no hay pasado que
reconstruir y cualquier valor distinto de cero sería inventado.

Revision ID: 20260902_0068
Revises: 20260902_0067
Create Date: 2026-09-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260902_0068"
down_revision: Union[str, Sequence[str], None] = "20260902_0067"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    users = {c["name"] for c in inspector.get_columns("users")}
    if "referred_by_player_id" not in users:
        op.add_column(
            "users",
            sa.Column("referred_by_player_id", sa.Integer(), nullable=True),
        )
        op.create_index(
            "ix_users_referred_by_player_id", "users", ["referred_by_player_id"]
        )
        # La FK va aparte y solo en Postgres: SQLite no puede agregar una
        # constraint a una tabla existente sin recrearla entera, y los checks del
        # repo arman la base con create_all() (que sí la pone). Mismo criterio
        # que 20260828_0052_game_reclutas.py.
        if bind.dialect.name != "sqlite":
            op.create_foreign_key(
                "fk_users_referred_by_player_id",
                "users",
                "game_players",
                ["referred_by_player_id"],
                ["id"],
            )
    if "referral_xp_given" not in users:
        op.add_column(
            "users",
            sa.Column(
                "referral_xp_given", sa.Integer(), nullable=False, server_default="0"
            ),
        )
    if "referral_pending" not in users:
        op.add_column(
            "users",
            sa.Column(
                "referral_pending", sa.Integer(), nullable=False, server_default="0"
            ),
        )

    jugadores = {c["name"] for c in inspector.get_columns("game_players")}
    if "classic_xp_owed" not in jugadores:
        op.add_column(
            "game_players",
            sa.Column(
                "classic_xp_owed", sa.Integer(), nullable=False, server_default="0"
            ),
        )


def downgrade() -> None:
    op.drop_column("game_players", "classic_xp_owed")
    op.drop_column("users", "referral_pending")
    op.drop_column("users", "referral_xp_given")
    op.drop_index("ix_users_referred_by_player_id", table_name="users")
    op.drop_column("users", "referred_by_player_id")
