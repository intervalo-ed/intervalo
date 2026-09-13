"""La opinión de la gente sobre la dificultad del juego

Hasta ahora el motor de dx decidía la dificultad solo con lo que mide: sirve lo
que estima que se acierta 3 de cada 4 veces y mueve θ con cada primer intento. A
la persona nunca se le preguntó nada. Esta tabla guarda lo que contesta cuando se
le pregunta, y además qué creía el motor en ese mismo momento.

Las dos mitades son igual de importantes. El voto solo no dice nada —«me
resultan fáciles» puede salir de alguien que acierta el 95% o el 60%— y lo que lo
vuelve una medición es tenerlo al lado de `p_hat_medio` y `aciertos`, que son lo
que el motor prometía y lo que la persona entregó sobre la misma tanda.

Se congelan y no se recalculan después: β se mueve con cada respuesta y
`scripts/diag/backfill_elo.py` reescribe θ de todo el historial, así que la misma
consulta hecha el mes que viene daría otro número.

El voto además ajusta el θ de quien lo emite, dentro de un tope y solo cuando su
propio registro va para el mismo lado (`game/opinion.py`). `delta_theta` guarda
lo que se aplicó, que muchas veces es cero.

Revision ID: 20260913_0081
Revises: 20260913_0080
Create Date: 2026-09-13
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260913_0081"
down_revision: Union[str, Sequence[str], None] = "20260913_0080"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLA = "game_difficulty_votes"


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if TABLA in set(inspector.get_table_names()):
        return
    op.create_table(
        TABLA,
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "player_id", sa.Integer(), sa.ForeignKey("game_players.id"), nullable=False
        ),
        # NULL mientras la pregunta se mostró y no se contestó.
        sa.Column("voto", sa.String(12), nullable=True),
        sa.Column("shown_at", sa.DateTime(), nullable=False),
        sa.Column("answered_at", sa.DateTime(), nullable=True),
        sa.Column("theta_at_vote", sa.Float(), nullable=False),
        sa.Column("n_updates_at_vote", sa.Integer(), nullable=False),
        sa.Column("ventana", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("aciertos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("p_hat_medio", sa.Float(), nullable=True),
        sa.Column("delta_theta", sa.Float(), nullable=False, server_default="0"),
        sa.Column("platform", sa.String(8), nullable=True),
        # Los tres valores son los mismos del canal A de `exercise_feedback`, y
        # el check está para que sigan siéndolo: el día que alguien agregue un
        # cuarto voto del lado del juego, esto lo frena antes de que el panel
        # empiece a contar categorías que el clásico no tiene.
        sa.CheckConstraint(
            "voto IS NULL OR voto IN ('muy_facil','justo','muy_dificil')",
            name="ck_game_votes_voto",
        ),
    )
    op.create_index(f"ix_{TABLA}_player_id", TABLA, ["player_id"])
    op.create_index(f"ix_{TABLA}_shown_at", TABLA, ["shown_at"])
    op.create_index("idx_game_votes_player_shown", TABLA, ["player_id", "shown_at"])


def downgrade() -> None:
    op.drop_table(TABLA)
