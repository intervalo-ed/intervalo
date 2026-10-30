"""`dx-muro-1`: el tope diario de derivadas, y el pase que lo levantaba.
**CERRADO el 30/10/2026, por decisión de producto y no por lectura.** Ganó el
control: nadie tiene tope, ni nuevos ni viejos, y el cafecito vuelve a comprar
solo lo que compraba antes —el multiplicador de la universidad (`boosts.py`)—.
Este módulo ya no decide nada: no hay 402, no hay cartel, no hay `muro` en las
respuestas. Lo que queda acá es lo que el panel necesita para mostrar lo que se
juntó mientras corrió —el sorteo, que es determinista, el tope y la fecha de
arranque— y nada más.

**Por qué se cerró sin llegar al n comprometido.** El juego se porta a una app
nativa (React Native) y se quiere UN flujo, sin lógica de experimento que
replicar del otro lado. Se queda el control porque es el juego que todos
conocían y el único que no le corta nada a nadie; el panel lo dice con todas
las letras (`metrics/game_queries.py :: EXPERIMENTO_MURO`): no es un veredicto
sobre si un tope paga.

## Qué era

El primer experimento de monetización del producto: hasta acá un cafecito
compraba un multiplicador de XP para TODA una universidad, y este probaba
venderle a una persona la llave de su propio tope. Dos brazos desde el 27/09,
sorteados del lado del servidor con el hash de `sorteo.brazo_de`, y **solo para
jugadores nuevos** —quien ya jugaba antes del arranque no tuvo tope nunca—:

    control   sin tope (el juego de siempre)
    muro      30 derivadas RESUELTAS por día; un cafecito lo levantaba para
              siempre (el pase se derivaba de `game_boosts`, sin tabla nueva)

Treinta estaba medido (26/09, sobre 2.120 jugador-día): dejaba intacto al 82%
de los jugador-día, no podía tocar la activación —3 resueltas en la primera
tanda— y era el número más chico que se podía leer este semestre. El
interruptor era `MURO_ENABLED`, apagado por default.
"""

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

from . import sorteo

EXPERIMENTO = "dx-muro-1"

# El índice ES el bucket, igual que en los otros sorteos. Ya no reparte nada,
# pero el panel reconstruye el brazo de cada uno con esto.
BRAZOS: tuple[str, ...] = ("control", "muro")

# Cuántas derivadas resueltas por día tenía el brazo `muro`. Solo lo lee el
# panel, para rotular el brazo y para saber quién llegó a chocarlo.
TOPE_DIARIO = 30

# Desde cuándo participaba la gente: solo los creados a partir de este día
# entraban al experimento.
ARRANQUE = date(2026, 9, 27)

# El huso del juego, para traducir `ARRANQUE` a la escala de la base. Duplicado
# a propósito del de `router`, igual que en `aforo.py`.
_TZ_JUEGO = ZoneInfo("America/Argentina/Buenos_Aires")

# El instante del corte, en UTC ingenuo, que es la escala de
# `game_players.created_at`.
NACIDO_DESPUES_DE = (
    datetime(ARRANQUE.year, ARRANQUE.month, ARRANQUE.day, tzinfo=_TZ_JUEGO)
    .astimezone(ZoneInfo("UTC"))
    .replace(tzinfo=None)
)


def brazo_de(player_id: int) -> str:
    """El brazo que le tocó a cada jugador mientras el experimento corrió. El
    hash es determinista, así que se puede reconstruir sin columna."""
    return sorteo.brazo_de(player_id, EXPERIMENTO, BRAZOS)
