"""El empuje de cafecito llega a Intervalo clásico

Dos columnas, las dos para que el empuje por universidad —hasta ahora exclusivo
del minijuego— también multiplique la XP de estudio.

`enrollments.university_set_at` es el candado antimudanza, gemelo exacto de
`game_players.university_set_at`. Sin él, con un empuje corriendo cualquiera
podría rehacer el alta con la universidad impulsada y cobrarlo. Hoy no hay UI
para cambiar de universidad en clásico (/onboarding redirige a / si ya estás
inscripto, y solo POST /user/enroll la escribe), así que la exposición es de
API y no de un click — pero el empuje dura un día, y la columna cuesta dos
líneas. NULL = nunca la cambió, que es el caso normal: se cargó en el
onboarding y quedó. Se escribe solo cuando ya había una universidad y cambia.

`answers.xp_from_boost` es cuánto de la XP de cada respuesta la puso el empuje
y no la racha. Se guarda por respuesta porque después NO se puede reconstruir:
de la respuesta sobrevive el total, y ni el multiplicador que corría ni su
reparto entre las dos mecánicas quedan en ninguna fila. Es el mismo motivo por
el que existe `game_players.xp_from_boosts`.

Las dos nacen vacías y sin backfill, y es lo correcto: un `university_set_at`
inventado para las altas viejas las marcaría como mudanzas que nunca pasaron y
les sacaría el primer empuje que les toque, y un `xp_from_boost` distinto de
cero en respuestas anteriores al empuje sería XP atribuida a un cafecito que no
existió. Cero es honesto en los dos casos.

Revision ID: 20260902_0066
Revises: 20260902_0065
Create Date: 2026-09-02
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260902_0066"
down_revision: Union[str, Sequence[str], None] = "20260902_0065"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    enrollments = {col["name"] for col in inspector.get_columns("enrollments")}
    if "university_set_at" not in enrollments:
        op.add_column(
            "enrollments", sa.Column("university_set_at", sa.DateTime(), nullable=True)
        )

    answers = {col["name"] for col in inspector.get_columns("answers")}
    if "xp_from_boost" not in answers:
        op.add_column(
            "answers",
            sa.Column(
                "xp_from_boost",
                sa.Integer(),
                nullable=False,
                server_default="0",
            ),
        )


def downgrade() -> None:
    op.drop_column("answers", "xp_from_boost")
    op.drop_column("enrollments", "university_set_at")
