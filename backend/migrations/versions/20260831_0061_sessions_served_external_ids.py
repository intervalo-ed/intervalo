"""Add sessions.served_external_ids (qué se sirvió, en orden, desde el arranque)

Hoy una sesión de repaso solo deja rastro de lo que el usuario RESPONDIÓ
(`answers`); lo servido y no respondido no queda en ningún lado, así que una
sesión abandonada sin ninguna respuesta no dice ni siquiera qué ejercicio vio
la persona. Agravante: si la caché en memoria del proceso se enfría,
`_reconstruct_session_state` volvía a sortear con `build_session`, pudiendo
darle a la persona OTRA sesión (otros ítems, no solo otro orden) tras un
reinicio del backend.

`served_external_ids` es la lista completa de external_id, en el orden en que
se armó la sesión, escrita en el mismo commit que ya crea la fila de
`sessions`. `_reconstruct_session_state` pasa a leer esto en vez de inventar.
Sesiones viejas quedan en "[]" y caen al comportamiento anterior (compat).
Ver 2026-08-26-motor-de-sesiones.md §4-bis.

Revision ID: 20260831_0061
Revises: 20260831_0060
Create Date: 2026-08-31
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260831_0061"
down_revision: Union[str, Sequence[str], None] = "20260831_0060"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "sessions" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("sessions")}
    if "served_external_ids" not in existing:
        op.add_column(
            "sessions",
            sa.Column(
                "served_external_ids", sa.Text(),
                nullable=False, server_default=sa.text("'[]'"),
            ),
        )


def downgrade() -> None:
    op.drop_column("sessions", "served_external_ids")
