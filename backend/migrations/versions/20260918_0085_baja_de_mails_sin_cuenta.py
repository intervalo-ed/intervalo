"""La baja de mails de quien no tiene cuenta

Quien dona sin registrarse deja su dirección en el pago
(`game_boosts.donor_email`, migración 0084) y el mail de agradecimiento le llega
ahí. Ese mail lleva su link de baja como cualquier otro: los headers
`List-Unsubscribe` no son opcionales — Gmail y Yahoo cuentan su ausencia como
señal negativa de reputación para TODO el correo saliente, no solo para el mail
que los omite.

Pero la baja hasta hoy se escribía en `users.email_unsubscribed`, y un invitado
no tiene fila en `users`. Esta columna es dónde cae esa baja.

Son dos banderas y no una porque son dos identidades distintas: un jugador con
cuenta se da de baja como usuario —ahí el mail lo recibe por ser usuario— y uno
sin cuenta solo existe como jugador.

Revision ID: 20260918_0085
Revises: 20260918_0084
Create Date: 2026-09-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260918_0085"
down_revision: Union[str, Sequence[str], None] = "20260918_0084"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("game_players")}
    if "email_unsubscribed" not in existing:
        op.add_column(
            "game_players",
            sa.Column(
                "email_unsubscribed",
                sa.Boolean(),
                nullable=False,
                server_default="false",
            ),
        )


def downgrade() -> None:
    op.drop_column("game_players", "email_unsubscribed")
