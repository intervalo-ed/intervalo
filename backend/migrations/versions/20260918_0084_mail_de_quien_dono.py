"""El mail de quien donó, para poder agradecerle

La mitad de los donantes son invitados sin cuenta. Hasta ahora, cuando el empuje
vencía y tocaba contarle a la persona qué había hecho su cafecito, el mail se
descartaba en seco: `due_cafecito_efecto_emails` pedía `jugador.user_id` y sin
cuenta no hay a dónde escribir. Medido el 17/09: de los donantes identificados,
uno de cada dos no tenía cuenta.

Mercado Pago sí devuelve el mail del pagador (`payer.email`), verificado contra
dos pagos reales. Esta columna es dónde queda, y solo se llena por ahí: el
socket de Cafecito no manda mail y el aviso por mail trae el del pagador legal,
que es otra cosa.

**Se usa solo para el agradecimiento**, y esa restricción es del diseño y no una
convención: esa persona le dio el mail a Mercado Pago para pagar, no a nosotros
para escribirle. Por eso no se guarda en `users.email` —que es el mail que
alguien sí nos dio para que le escribamos— ni se mezcla con él, y nunca se
muestra en público: el feed nombra por alias o por `donor_name`, que es el texto
que la persona eligió.

Revision ID: 20260918_0084
Revises: 20260918_0083
Create Date: 2026-09-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260918_0084"
down_revision: Union[str, Sequence[str], None] = "20260918_0083"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("game_boosts")}
    if "donor_email" not in existing:
        # Sin índice: no se busca por acá nunca. Se lee una sola vez, al vencer
        # el empuje, y ya se tiene la fila en la mano.
        op.add_column(
            "game_boosts", sa.Column("donor_email", sa.String(255), nullable=True)
        )


def downgrade() -> None:
    op.drop_column("game_boosts", "donor_email")
