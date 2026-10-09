"""`dx-banda-1`: a qué tasa de acierto apuntamos, sorteado por jugador.
**CANCELADO el 09/10/2026, sin leerse.** Este módulo ya no decide nada: el
selector (`generator.pick_template`) apunta a la banda de `elo.py` para todos.
Lo que queda acá es lo que el panel necesita para mostrar lo que se juntó
mientras corrió —el sorteo, que es determinista, y las dos bandas— y nada más.

## Qué era

El 54,6% de los votos de dificultad decía «muy fácil» y la proporción empeoraba
con la experiencia: 76,2% pasando las 250 respuestas. Después de la
recalibración del 27/09 (`scripts/diag/recalibrar_motor.py`), que sola ya
servía unos diez puntos más difícil, quedaba la pregunta de si convenía apuntar
más abajo todavía. Dos brazos desde el 28/09, para quien se creó desde ese día:

    control    p̂ ∈ [0,70 , 0,80]   centro 0,75   — la banda de siempre
    exigente   p̂ ∈ [0,58 , 0,72]   centro 0,65   — diez puntos más abajo

La métrica era la fracción del primer voto de cada persona que decía «muy
fácil», con la pregunta adelantada a la 8 para que se leyera este semestre.

## Por qué se canceló

No por futilidad ni por resultado: porque la pregunta dejó de valer la pena con
el algoritmo de hoy. La dificultad se va a elegir de otra forma, y correr la
banda diez puntos sobre un selector que está por cambiar mide algo que no va a
existir. Un experimento que se cancela antes de leerse no deja veredicto, y el
panel lo dice con todas las letras (`metrics/game_queries.py ::
EXPERIMENTO_BANDA`): los números de abajo son lo que se juntó, sin contraste.

Lo que sí dejó: la pregunta de dificultad quedó en la 8 y con la cadencia
duplicada (`opinion-trigger.ts`), que es un termómetro mejor con o sin
experimento.
"""

from __future__ import annotations

from . import sorteo

EXPERIMENTO = "dx-banda-1"
BRAZOS = ("control", "exigente")

# (low, high) de p̂ por brazo, como corrieron entre el 28/09 y el 09/10. Solo las
# lee el panel para rotular la tabla; el motor no las mira más.
BANDAS: dict[str, tuple[float, float]] = {
    "control": (0.70, 0.80),
    "exigente": (0.58, 0.72),
}


def brazo_de(player_id: int) -> str:
    """El brazo que le tocó a cada jugador mientras el experimento corrió. El
    hash es determinista, así que se puede reconstruir sin columna."""
    return sorteo.brazo_de(player_id, EXPERIMENTO, BRAZOS)
