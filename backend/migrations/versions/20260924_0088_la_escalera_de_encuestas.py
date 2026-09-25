"""La escalera de encuestas del juego: el corte de la ventana y la repetitividad

Dos cosas que van juntas porque la primera es lo que habilita a la segunda.

**El corte (`game_difficulty_votes.corte_ejercicio_id`).** La encuesta de
dificultad volvía cada 30 respuestas y el ajuste mira hasta 20 hacia atrás, así
que dos votos seguidos nunca se pisaban. Ese invariante era aritmético —30 > 20—
y vivía escrito en un comentario de `game/opinion.py` que nada verificaba: la
consulta que arma la ventana era `ORDER BY id DESC LIMIT 20` y no miraba esta
tabla en ninguna cláusula. Al pasar la cadencia a una escalera que arranca con
huecos de 10, la mitad de la evidencia quedaría contada dos veces y el segundo
voto cobraría de nuevo una sorpresa que el primero ya cobró.

La columna guarda el `game_exercises.id` más nuevo que ese ajuste cobró, y el voto
siguiente mira desde ahí para adelante. **Se escribe solo cuando el voto movió θ**:
lo que no se puede cobrar dos veces es lo ya cobrado, y un «justo» —o un voto que
la evidencia no respaldó— no cobró nada, así que sus respuestas siguen
disponibles. Las 437 filas anteriores a hoy quedan en NULL y eso es correcto y no
una laguna: para el corte solo importa el ajuste más reciente, y el primero que se
aplique después del deploy lo escribe. Mientras tanto la ventana se comporta como
antes.

**La tabla nueva (`game_repetition_votes`).** La segunda pregunta del juego:
«¿te están saliendo repetidas?», con tres valores y el mismo protocolo de dos
pasos que la de dificultad. Existe porque el tema aparecía solo: cinco de las 109
respuestas a la pregunta abierta hablan de repetición sin que nadie la mencionara,
y las cinco son de jugadores pesados. Antes de eso, el arreglo del 10/09 salió del
reporte de una sola persona («conté 4 veces la misma en 10 oportunidades»), y al
medirlo la repetición de enunciado era del 77,5% del ejercicio 51 en adelante.

Tabla aparte y no un canal más de `game_difficulty_votes` porque lo que se congela
es otro: allá son θ, aciertos y p̂ —cuánto prometió el motor y cuánto entregó la
persona—; acá son cuántas plantillas y cuántos enunciados distintos vio. Los dos
contadores y no uno porque son dos preguntas: ocho plantillas distintas pueden ser
ocho veces el mismo enunciado.

Revision ID: 20260924_0088
Revises: 20260918_0087
Create Date: 2026-09-24
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260924_0088"
down_revision: Union[str, Sequence[str], None] = "20260918_0087"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

VOTOS = "game_difficulty_votes"
TABLA = "game_repetition_votes"


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    tablas = set(inspector.get_table_names())

    if VOTOS in tablas:
        existing = {col["name"] for col in inspector.get_columns(VOTOS)}
        if "corte_ejercicio_id" not in existing:
            # Nullable y sin `server_default`: NULL es «este voto no cobró nada»,
            # que es el valor correcto para todo el histórico y también el más
            # común de acá en adelante.
            op.add_column(
                VOTOS, sa.Column("corte_ejercicio_id", sa.Integer(), nullable=True)
            )

    if TABLA in tablas:
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
        # Sin θ, al revés que la tabla de dificultad: lo que se mide acá no es la
        # habilidad de nadie, y guardarlo invitaría a cruces que no significan
        # nada.
        sa.Column("n_updates_at_vote", sa.Integer(), nullable=False),
        sa.Column("ventana", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "plantillas_distintas", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column(
            "enunciados_distintos", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column("platform", sa.String(8), nullable=True),
        # Mismo criterio que `ck_game_votes_voto`: el día que alguien agregue un
        # cuarto valor, esto lo frena antes de que el panel empiece a contar
        # categorías que no existen. Ojo que `justo` aparece en los tres canales
        # del producto con tres significados distintos.
        sa.CheckConstraint(
            "voto IS NULL OR voto IN ('variado','justo','repetitivo')",
            name="ck_game_rep_voto",
        ),
    )
    op.create_index(f"ix_{TABLA}_player_id", TABLA, ["player_id"])
    op.create_index(f"ix_{TABLA}_shown_at", TABLA, ["shown_at"])
    op.create_index("idx_game_rep_player_shown", TABLA, ["player_id", "shown_at"])


def downgrade() -> None:
    op.drop_table(TABLA)
    op.drop_column(VOTOS, "corte_ejercicio_id")
