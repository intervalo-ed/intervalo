"""Los dos marcadores de idempotencia de los avisos nuevos

Los push de evento no necesitan columna: `notification_sends` ya es un historial
append-only con categoría y fecha, así que "¿ya le avisé de esto hoy?" es una
consulta y no un estado nuevo.

Los mails sí, porque no dejan rastro en esa tabla:

`game_boosts.email_sent_at` — el mail del cafecito sale al VENCER el empuje, que
es recién cuando el número está cerrado. Sin este marcador, cada corrida del
worker volvería a encontrar el mismo empuje vencido y mandaría el mail de nuevo.

`users.reclutas_email_sent_on` — la fecha de la última semana en que se mandó el
resumen. Guarda la FECHA y no un booleano para que el guard sea "ya se le mandó
ESTA semana" y no "ya se le mandó alguna vez".

Las dos nacen vacías, que es lo correcto: no hay avisos pasados que marcar como
enviados, y marcar los empujes viejos como ya-contados sería mentir en la
dirección segura pero sin motivo — el mail solo mira los que vencieron después
de esta migración.

Revision ID: 20260902_0070
Revises: 20260902_0069
Create Date: 2026-09-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260902_0070"
down_revision: Union[str, Sequence[str], None] = "20260902_0069"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    users = {c["name"] for c in inspector.get_columns("users")}
    if "reclutas_email_sent_on" not in users:
        op.add_column(
            "users", sa.Column("reclutas_email_sent_on", sa.Date(), nullable=True)
        )

    boosts = {c["name"] for c in inspector.get_columns("game_boosts")}
    if "email_sent_at" not in boosts:
        op.add_column(
            "game_boosts", sa.Column("email_sent_at", sa.DateTime(), nullable=True)
        )


def downgrade() -> None:
    op.drop_column("game_boosts", "email_sent_at")
    op.drop_column("users", "reclutas_email_sent_on")
