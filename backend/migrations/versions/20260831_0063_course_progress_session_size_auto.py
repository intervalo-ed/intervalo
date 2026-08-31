"""Add course_progress.session_size_auto (rampa de tamaño de sesión)

El tamaño de sesión (`session_size`) era una sola constante fija
(SESSION_SIZE_DEFAULT=5) y a la vez un ajuste manual que el usuario puede subir
desde el editor (`PUT /course/{course}/session-size`). Los datos de producción
muestran que el tamaño es la variable con el efecto más grande y limpio sobre
si la primera sesión se termina (AUC 0,694 sola; +5,5pp dentro del mismo
usuario yendo de 8 a 5) — ver 2026-08-26-motor-de-sesiones.md §4/§8 — así que
pasa a ser una rampa (3 en la sesión 1, 4 en la 2-3, 5+ de ahí en más, con
techo 8 y reset a 3 tras abandonar una sesión) en vez de un número fijo.

`session_size_auto` decide si `create_session_db` recalcula el tamaño en cada
sesión (rampa) o respeta el valor que el usuario fijó a mano. Arranca en TRUE
para todo el mundo; `set_session_size` lo apaga la primera vez que alguien usa
el selector, y reiniciar el curso lo prende de nuevo. Backfill: quien ya tenía
un `session_size` distinto del viejo default (5) es porque lo tocó a mano, así
que arranca en FALSE para no pisarle la preferencia con la rampa.

Revision ID: 20260831_0063
Revises: 20260831_0062
Create Date: 2026-08-31
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260831_0063"
down_revision: Union[str, Sequence[str], None] = "20260831_0062"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "course_progress" not in set(inspector.get_table_names()):
        return
    existing = {col["name"] for col in inspector.get_columns("course_progress")}
    if "session_size_auto" not in existing:
        op.add_column(
            "course_progress",
            sa.Column(
                "session_size_auto", sa.Boolean(),
                nullable=False, server_default=sa.text("true"),
            ),
        )
        op.execute(
            "UPDATE course_progress SET session_size_auto = false "
            "WHERE session_size != 5"
        )


def downgrade() -> None:
    op.drop_column("course_progress", "session_size_auto")
