"""La primera pregunta abierta del juego

Todo lo que el juego sabe hoy lo sabe porque lo midió: θ y β salen de los
aciertos, el embudo sale de las derivadas resueltas, y la única opinión que
existe —`game_difficulty_votes`— tiene tres respuestas posibles y las tres las
elegimos nosotros. Ninguna de esas fuentes puede decir algo que no le hayamos
preguntado.

Esta tabla es la que puede. Una pregunta abierta en la derivada 18, una sola vez
en la vida de cada jugador.

**La columna `pregunta` existe desde el día uno y no es adorno.** La segunda
pregunta va a llegar —esta es de las que se cambian cada par de meses— y sin esa
columna llegaría como una migración, o peor, como respuestas de dos preguntas
distintas mezcladas en la misma bolsa sin manera de separarlas después.

**El texto puede ser un punto, y eso también es un dato.** La diapo no tiene
botón de saltar: la única salida es escribir algo, y escribir "." es la forma que
tiene alguien de decir «no». Guardarlo y no descartarlo es lo que permite
distinguir los tres estados que importan: `answered_at IS NULL` es «la vio y se
fue», un texto de uno o dos caracteres es «no quiso», y el resto es lo que
vinimos a buscar.

Revision ID: 20260918_0087
Revises: 20260918_0086
Create Date: 2026-09-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260918_0087"
down_revision: Union[str, Sequence[str], None] = "20260918_0086"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if "game_survey_answers" in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        "game_survey_answers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("pregunta", sa.String(length=32), nullable=False),
        sa.Column("texto", sa.Text(), nullable=True),
        sa.Column("shown_at", sa.DateTime(), nullable=False),
        sa.Column("answered_at", sa.DateTime(), nullable=True),
        sa.Column("correctas_al_mostrar", sa.Integer(), nullable=False,
                  server_default="0"),
        sa.Column("platform", sa.String(length=8), nullable=True),
        sa.ForeignKeyConstraint(["player_id"], ["game_players.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_game_survey_answers_player_id", "game_survey_answers",
                    ["player_id"], unique=False)
    op.create_index("ix_game_survey_answers_shown_at", "game_survey_answers",
                    ["shown_at"], unique=False)
    # Leer la tabla es siempre «las respuestas de ESTA pregunta, las últimas
    # primero»: el panel no tiene otra consulta.
    op.create_index("idx_game_survey_pregunta_shown", "game_survey_answers",
                    ["pregunta", "shown_at"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_game_survey_pregunta_shown", table_name="game_survey_answers")
    op.drop_index("ix_game_survey_answers_shown_at", table_name="game_survey_answers")
    op.drop_index("ix_game_survey_answers_player_id", table_name="game_survey_answers")
    op.drop_table("game_survey_answers")
