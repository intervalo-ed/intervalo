"""Con qué copia de dx se le habló a cada grupo: análisis o genérico.

La ola del minijuego se mandó partida en dos —los grupos donde las derivadas
están en el temario y los demás— y esa división vive únicamente en los planes de
`hermes/campaigns/plans/`, que no están en el repo ni en producción. El panel no
podía distinguirlas: todos los planes de dx comparten `id: juego-lanzamiento`,
así que la columna «Última campaña» del tracker dice lo mismo para los dos.

Adivinarlo por la materia no alcanza, y está medido: una expresión regular sobre
«Análisis / Cálculo / Matemática I…» reproduce 47 de los 66 grupos de análisis y
manda 6 de los 85 genéricos al lado equivocado —los tres de «Cálculo financiero»
entre ellos—. Un 71% de acierto no se puede poner arriba de un clickrate.

Así que la etiqueta se guarda. La escribe `scripts/diag/sync_grupos.py` desde un
mapeo que sale de los planes, y el panel la lee. Queda `NULL` para todo grupo que
no haya recibido dx o del que no sepamos la copia, y el panel cuenta esos aparte
en vez de repartirlos a ojo.

Additive y con guarda de existencia: la columna puede ya estar si la base se
adelantó al código.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260913_0080"
down_revision: Union[str, Sequence[str], None] = "20260913_0079"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _tiene_columna(nombre: str) -> bool:
    insp = sa.inspect(op.get_bind())
    if "game_groups" not in insp.get_table_names():
        return True  # sin tabla no hay nada que agregar
    return nombre in {c["name"] for c in insp.get_columns("game_groups")}


def upgrade() -> None:
    if not _tiene_columna("cluster_dx"):
        op.add_column("game_groups",
                      sa.Column("cluster_dx", sa.String(20), nullable=True))
        op.create_index("ix_game_groups_cluster_dx", "game_groups", ["cluster_dx"])


def downgrade() -> None:
    if _tiene_columna("cluster_dx"):
        op.drop_index("ix_game_groups_cluster_dx", table_name="game_groups")
        op.drop_column("game_groups", "cluster_dx")
