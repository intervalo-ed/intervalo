"""La pantalla de regreso: hasta cuándo se le contó lo que pasó

Dos columnas en `game_players`, las dos para lo mismo: que el digest de
bienvenida no cuente dos veces lo que ya contó.

**`digest_seen_at`.** La ventana del digest es «desde la última vez que te
mostré esto», y no se puede leer de `last_seen_at`: esa se pisa DURANTE la
sesión —la tocan `/next`, `/answer`, `/skip` y el generador de ejercicios—, así
que para cuando la pantalla se dibuja ya vale «ahora» y la ventana sale vacía
siempre. El síntoma sería una pantalla que no cuenta nada, que es exactamente
la clase de bug que nadie reporta porque se ve igual que «no pasó nada».

Avanza cuando el digest se SIRVE y no cuando la persona toca Continuar. Una
pantalla que se mostró ya se contó, y esperar al Continuar significaría que
quien cierra la pestaña vuelve a recibir la misma novedad mañana, que es peor
que perderla.

NULL es «nunca se le mostró», y es el valor correcto para las 3.281 filas que ya
existen: el primer digest de cada uno mira contra `last_seen_at` —que para ese
primer caso todavía es una referencia honesta— y de ahí en adelante contra esta.

**`referral_xp_digest_seen`.** El tercer canal que cuenta lo que generaron los
reclutas, al lado de `referral_xp_push_seen` y `referral_xp_email_seen`. Son
tres y no uno porque ninguno puede enterarse por el otro: con un solo contador,
la notificación que salió por push dejaría al digest sin nada que decir, y al
revés. Cada canal lleva su propia marca de hasta dónde cobró.

Arranca en 0 y no en el `referral_xp_given` actual: el primer digest de un
reclutador le va a contar todo lo que acumuló hasta hoy de una vez, y eso es lo
correcto — por este canal no se le contó nunca nada.

Revision ID: 20260927_0089
Revises: 20260924_0088
Create Date: 2026-09-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260927_0089"
down_revision: Union[str, Sequence[str], None] = "20260924_0088"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLA = "game_players"


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if TABLA not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns(TABLA)}

    if "digest_seen_at" not in existing:
        op.add_column(TABLA, sa.Column("digest_seen_at", sa.DateTime(), nullable=True))

    if "referral_xp_digest_seen" not in existing:
        op.add_column(
            TABLA,
            sa.Column(
                "referral_xp_digest_seen",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
        )


def downgrade() -> None:
    op.drop_column(TABLA, "referral_xp_digest_seen")
    op.drop_column(TABLA, "digest_seen_at")
