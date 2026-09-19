"""Desde qué huso horario apareció cada jugador

Cien pesos argentinos son siete centavos de dólar. Para alguien que mira desde
Argentina eso es un gesto entendible; para alguien que mira desde afuera no
significa nada, y encima lo lee mal: el checkout de Mercado Pago muestra
`$ 1.000` sin aclarar de qué peso habla, y el signo `$` también es el peso
uruguayo. Un uruguayo que ve el cartel de diez cafecitos entiende que le piden
unos veinticinco dólares cuando le están pidiendo sesenta y seis centavos.

Esta columna es la señal que permite cobrarle a cada uno en lo que su número
significa algo (`boosts.PRECIO_POR_PAIS`) y escribirle el cartel en sus
términos.

Se guarda el huso crudo —"America/Montevideo", no "UY"— por la misma razón por
la que `first_group_id` guarda el id entero y deduce la universidad de su
prefijo: guardar el país ya masticado tira la diferencia entre Montevideo y
Madrid, y sumar un país mañana sería otra migración en vez de una línea.

Nace en NULL para los 1.102 jugadores que ya existen, y NULL quiere decir
Argentina a la hora del precio: es de donde vinieron todos.

Revision ID: 20260918_0086
Revises: 20260918_0085
Create Date: 2026-09-18
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260918_0086"
down_revision: Union[str, Sequence[str], None] = "20260918_0085"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = {c["name"] for c in sa.inspect(bind).get_columns("game_players")}
    if "timezone" not in existing:
        op.add_column(
            "game_players", sa.Column("timezone", sa.String(length=64), nullable=True)
        )
        op.create_index(
            "ix_game_players_timezone", "game_players", ["timezone"], unique=False
        )
        # Lo poco que ya sabíamos, copiado: quien prendió los recordatorios
        # diarios dejó su huso en `notify_timezone` para que le llegaran a la
        # hora correcta. Es la misma cadena y la escribió el mismo navegador.
        #
        # La diferencia entre las dos columnas —una es dónde está y la otra de
        # dónde vino— no muerde en este backfill: son jugadores que llegaron por
        # grupos de WhatsApp de materias argentinas, así que las dos respuestas
        # son la misma. Sirve para que el panel tenga con qué cortar desde el
        # primer día en vez de esperar a que cada uno vuelva a entrar.
        op.execute(
            "UPDATE game_players SET timezone = notify_timezone "
            "WHERE timezone IS NULL AND notify_timezone IS NOT NULL"
        )


def downgrade() -> None:
    op.drop_index("ix_game_players_timezone", table_name="game_players")
    op.drop_column("game_players", "timezone")
