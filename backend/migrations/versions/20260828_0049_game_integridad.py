"""Integridad del minijuego: intentos únicos y las claves foráneas que faltaban

Dos cosas que el esquema decía tener y no tenía.

1. `game_attempts` no tenía nada que impidiera dos filas con el mismo número de
   intento para un mismo ejercicio. El tope de intentos se chequeaba con un
   COUNT sin candado, o sea que era consultivo: dos respuestas en vuelo —un doble
   toque, o el reintento que dispara el teléfono cuando la primera tardó— podían
   pasar las dos. El otro motor del repo ya había resuelto esto mismo
   (20260813_0029_dedup_answers_unique_slot); acá nunca se trasladó.

   El índice es PARCIAL, solo sobre los intentos que parsearon. Los que no
   parsearon se guardan a propósito con el número ANTERIOR —no consumen intento,
   ver router.answer_exercise— así que se repiten de manera legítima y no pueden
   entrar en la restricción.

2. `game_events`, `game_cta_events` y `game_boost_intents` declaran en models.py
   una clave foránea a `game_players` que sus migraciones nunca crearon. La
   consecuencia no era teórica: al fusionar un invitado con una cuenta se borra
   la fila del invitado, y estas tres tablas quedaban apuntando a un jugador que
   ya no existe. En producción pasaba en silencio; en una base armada con
   `create_all` —las de los scripts de chequeo— la FK sí existía y el borrado
   levantaba IntegrityError desde adentro de `get_current_player`, o sea en
   cualquier endpoint y en bucle.

   El código ya reparenta las tres tablas (game/deps.py), así que de acá en más
   no se generan huérfanas. Esta migración limpia las que hayan quedado y crea
   las claves para que no vuelvan a aparecer.

Todo va con las mismas guardas defensivas que las migraciones anteriores del
juego: se inspecciona antes de tocar, así correr esto dos veces no rompe nada.

Revision ID: 20260828_0049
Revises: 20260827_0048
Create Date: 2026-08-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260828_0049"
down_revision: Union[str, Sequence[str], None] = "20260827_0048"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_INDICE_INTENTOS = "uq_game_attempts_slot"

# Las tres que apuntan al jugador sin decirlo. `nulleable` es si la columna
# admite NULL: donde se puede, la huérfana se despunta; donde no, se borra.
_HUERFANAS = (
    ("game_events", "fk_game_events_player", True),
    ("game_cta_events", "fk_game_cta_events_player", True),
    # Una intención de donar apunta sí o sí a alguien. Si ese alguien ya no
    # existe, la intención no se puede resolver nunca: no hay nada que conservar.
    ("game_boost_intents", "fk_game_boost_intents_player", False),
)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    es_sqlite = bind.dialect.name == "sqlite"

    if "game_attempts" in tables:
        indices = {i["name"] for i in inspector.get_indexes("game_attempts")}
        if _INDICE_INTENTOS not in indices:
            # Antes del índice hay que quedarse con UNA fila por (ejercicio,
            # intento): si ya se coló un duplicado por la carrera que esto viene
            # a cerrar, crear el índice fallaría. Sobrevive la más vieja, que es
            # la que el jugador vio.
            op.execute(
                sa.text(
                    """
                    DELETE FROM game_attempts
                    WHERE parse_ok AND id NOT IN (
                        SELECT MIN(id) FROM game_attempts
                        WHERE parse_ok
                        GROUP BY exercise_id, attempt_number
                    )
                    """
                )
            )
            op.create_index(
                _INDICE_INTENTOS,
                "game_attempts",
                ["exercise_id", "attempt_number"],
                unique=True,
                sqlite_where=sa.text("parse_ok"),
                postgresql_where=sa.text("parse_ok"),
            )

    for tabla, nombre_fk, nulleable in _HUERFANAS:
        if tabla not in tables:
            continue
        if nulleable:
            op.execute(
                sa.text(
                    f"""
                    UPDATE {tabla} SET player_id = NULL
                    WHERE player_id IS NOT NULL
                      AND player_id NOT IN (SELECT id FROM game_players)
                    """
                )
            )
        else:
            op.execute(
                sa.text(
                    f"""
                    DELETE FROM {tabla}
                    WHERE player_id IS NOT NULL
                      AND player_id NOT IN (SELECT id FROM game_players)
                    """
                )
            )
        # En SQLite no se puede agregar una FK con ALTER: haría falta recrear la
        # tabla entera. No vale la pena — las bases SQLite de este proyecto se
        # arman con create_all, donde la clave ya viene puesta desde models.py.
        # Lo que sí importa acá es la limpieza de huérfanas, que ya corrió.
        if es_sqlite:
            continue
        existentes = {fk.get("name") for fk in inspector.get_foreign_keys(tabla)}
        if nombre_fk not in existentes:
            op.create_foreign_key(nombre_fk, tabla, "game_players", ["player_id"], ["id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    es_sqlite = bind.dialect.name == "sqlite"

    if not es_sqlite:
        for tabla, nombre_fk, _ in _HUERFANAS:
            if tabla not in tables:
                continue
            if nombre_fk in {fk.get("name") for fk in inspector.get_foreign_keys(tabla)}:
                op.drop_constraint(nombre_fk, tabla, type_="foreignkey")

    if "game_attempts" in tables:
        if _INDICE_INTENTOS in {i["name"] for i in inspector.get_indexes("game_attempts")}:
            op.drop_index(_INDICE_INTENTOS, table_name="game_attempts")
