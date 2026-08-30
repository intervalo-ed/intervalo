"""Add game_players.alias_is_generated (freebie de la primera edición del @)

Hoy un invitado juega bajo un @ al azar (`derivador7431`) y no puede tocarlo
hasta registrarse — PATCH /me le da 403 a propósito, porque elegir el @ es el
gancho del registro. Eso deja a la mayoría jugando con un nombre que no
eligió, potencialmente para siempre.

Esta columna habilita una ÚNICA edición gratis, antes de la primera derivada:
mientras siga en True, el @ es el generado y todavía no se tocó. Se apaga
apenas se usa una vez con éxito, y de ahí en más cambiar el @ vuelve a
requerir registrarse, como siempre.

Revision ID: 20260829_0056
Revises: 20260829_0055
Create Date: 2026-08-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260829_0056"
down_revision: Union[str, Sequence[str], None] = "20260829_0055"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "game_players" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("game_players")}
    if "alias_is_generated" not in existing:
        op.add_column(
            "game_players",
            sa.Column(
                "alias_is_generated",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("true"),
            ),
        )


def downgrade() -> None:
    op.drop_column("game_players", "alias_is_generated")
