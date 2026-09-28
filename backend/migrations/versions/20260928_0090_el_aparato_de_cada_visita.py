"""El aparato de cada visita, y si la identidad se recuperó de la cookie

Hasta hoy lo único que el juego sabía del aparato era `game_players.platform`:
"ios", "android" o "desktop". Con eso se puede decir de dónde viene la gente y
no se puede decir nada sobre si el producto le anda bien, que es la pregunta
que abrió esto.

Lo que faltaba estaba en PostHog, y PostHog no alcanza por dos motivos medidos:

· **Pierde el 11% del tráfico.** Brave, Firefox y Opera mandan el `$pageview` y
  después casi nada: el 54,9% de quienes entran por ahí no dejan ni un
  `game_start`, contra el 1,6% del resto. Sobre 1.904 personas desde el 14/09
  son 213, y son justo las que más bloquean — probablemente las mismas que más
  se quejarían.

· **Sus métricas de rendimiento crecen con el uso.** El LCP deja de
  actualizarse recién en la primera interacción y el INP de una persona es el
  PEOR de todos sus toques. Cortando por cuartil de LCP, el cuartil «más lento»
  enganchaba 25 puntos MÁS que el rápido, y por INP 34 puntos más. No es un
  hallazgo: es el uso medido dos veces.

Por eso esta tabla guarda dos cosas anteriores al desenlace —la PRIMERA pintura
y el MODELO del teléfono— y no las agregadas de después.

Las dos columnas booleanas son otra pregunta que compartía el mismo viaje.
Safari borra el almacenamiento de un sitio al que no se vuelve en siete días, y
sin `guest_token` guardado cada carga de página se anota como un jugador nuevo
—lo dice `reglas-trigger.ts` desde antes que esto—. Esa sola mecánica explicaría
a la vez el 41,9% de filas de iOS sin una derivada servida y que iOS retenga la
mitad que Android entre los que sí engancharon. `sin_token_local` cuenta las
visitas que llegaron sin él; `token_rescatado`, cuántas de esas la cookie de
primera parte pudo devolver a su jugador. La proporción entre las dos es la
medición, y el rescate es además el arreglo.

Revision ID: 20260928_0090
Revises: 20260927_0089
Create Date: 2026-09-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260928_0090"
down_revision: Union[str, Sequence[str], None] = "20260927_0089"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLA = "game_device_samples"


def upgrade() -> None:
    bind = op.get_bind()
    if TABLA in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        TABLA,
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=True),
        sa.Column("platform", sa.String(length=8), nullable=True),
        sa.Column("device_model", sa.String(length=64), nullable=True),
        sa.Column("fcp_ms", sa.Integer(), nullable=True),
        sa.Column("dcl_ms", sa.Integer(), nullable=True),
        sa.Column("sin_token_local", sa.Boolean(), nullable=False,
                  server_default="false"),
        sa.Column("token_rescatado", sa.Boolean(), nullable=False,
                  server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["player_id"], ["game_players.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_game_device_samples_player_id", TABLA,
                    ["player_id"], unique=False)
    op.create_index("ix_game_device_samples_platform", TABLA,
                    ["platform"], unique=False)
    op.create_index("ix_game_device_samples_device_model", TABLA,
                    ["device_model"], unique=False)
    op.create_index("ix_game_device_samples_created_at", TABLA,
                    ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_game_device_samples_created_at", table_name=TABLA)
    op.drop_index("ix_game_device_samples_device_model", table_name=TABLA)
    op.drop_index("ix_game_device_samples_platform", table_name=TABLA)
    op.drop_index("ix_game_device_samples_player_id", table_name=TABLA)
    op.drop_table(TABLA)
