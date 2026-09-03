"""Hasta dónde se contó la XP de cada recluta, por canal

`users.referral_xp_push_seen` y `users.referral_xp_email_seen` — cuánto de
`referral_xp_given` ya se le anunció al reclutador por el aviso y por el mail.

Existen porque los dos canales prometían una ventana que nadie estaba calculando:
el aviso decía «tus reclutas te dejaron N XP hoy» y el mail «N XP esta semana»,
las dos veces con el acumulado histórico. El mismo número volvía a salir todos
los días y todas las semanas, para siempre.

El backfill NO las deja en cero, y esa es la única decisión de esta migración:
arrancan igualadas a `referral_xp_given`. En cero, el primer envío después del
deploy anunciaría toda la historia como si hubiera pasado hoy —el mismo bug, una
vez más y en el peor momento—. Igualadas, todos empiezan a cero de XP NUEVA y el
próximo aviso cuenta solo lo que entre a partir de acá.

Revision ID: 20260903_0072
Revises: 20260902_0071
Create Date: 2026-09-03
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260903_0072"
down_revision: Union[str, Sequence[str], None] = "20260902_0071"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_COLUMNAS = ("referral_xp_push_seen", "referral_xp_email_seen")


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    users = {c["name"] for c in inspector.get_columns("users")}

    nuevas = [c for c in _COLUMNAS if c not in users]
    for nombre in nuevas:
        op.add_column(
            "users",
            sa.Column(
                nombre,
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
        )

    # Solo las que acaba de crear esta corrida: si la migración se reintenta, las
    # que ya existían pueden tener marcas avanzadas y volver a igualarlas contra
    # `referral_xp_given` perdería la posición del corte.
    for nombre in nuevas:
        op.execute(
            sa.text(
                f"UPDATE users SET {nombre} = referral_xp_given "
                "WHERE referral_xp_given > 0"
            )
        )


def downgrade() -> None:
    for nombre in _COLUMNAS:
        op.drop_column("users", nombre)
