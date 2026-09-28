"""`dx-banda-1`: a qué tasa de acierto apuntamos, sorteado por jugador.

## Por qué este experimento y no otro

El 54,6% de los votos de dificultad dice «muy fácil» y el 1,8% «muy difícil», y
la proporción EMPEORA con la experiencia: 50,7% con menos de 25 respuestas,
76,2% pasando las 250. La pregunta que sigue es cuánto de eso era el motor mal
calibrado y cuánto es la banda objetivo puesta demasiado floja.

La recalibración del 27/09 (`scripts/diag/recalibrar_motor.py`) contesta la
primera mitad: el motor prometía 83,86% y la gente entregaba 91,48%, así que
apuntando a 75% servía 82%. Con `SCALE` y las semillas arregladas, apuntar a 75%
sirve 75%. **Eso ya es ~10 puntos más difícil sin tocar la banda**, y es un
cambio global que no se puede sortear: `game_template_stats` es una sola tabla y
un brazo le movería la dificultad al otro.

Lo que sí se puede sortear es a qué le apunta el selector para CADA jugador, que
es el único parámetro de dificultad que vive del lado de la persona. Este
experimento pregunta si, ya con el motor diciendo la verdad, conviene apuntar
más abajo todavía.

## Los dos brazos

    control    p̂ ∈ [0,70 , 0,80]   centro 0,75   — la banda de siempre
    exigente   p̂ ∈ [0,58 , 0,72]   centro 0,65   — diez puntos más abajo

El centro de 0,65 no es redondo por gusto: 0,75 → 0,65 son 0,45 unidades de θ
con `SCALE` 1,1266, o sea **casi exactamente el ancho de una banda** (0,478).
Se corre la banda un ancho entero, que es el salto más chico que garantiza que
lo que se sirve cambie de verdad y no se solape con lo de antes.

El ancho también crece, de 0,10 a 0,14. Es a propósito y no simetría descuidada:
abajo de 0,70 el catálogo tiene menos plantillas por unidad de dificultad —los
tiers de arriba están apelmazados, T7 y T8 miden 1,51 y 1,54— así que una banda
igual de angosta se quedaría vacía más seguido y la escalera de rescate de
`pick_template` mandaría a lo más cercano igual. Mejor declarar el ancho que
fingirlo.

## A quién le aplica, y desde cuándo

A todo el que se creó desde `DESDE`, desde su primer ejercicio. No hay umbral de
entrada como en `dx-elo-1`: acá el tratamiento tiene sentido desde la primera
derivada y el interés es justamente la gente nueva, que es la que todavía se
puede perder.

**La inscripción es «se le sirvió el primer ejercicio», que es anterior al
tratamiento**, así que el contraste no está condicionado por nada que el
tratamiento cause. La métrica —qué votó— sí requiere haber llegado a la
pregunta, y a eso lo cuida un guardarraíl explícito: si la fracción que llega a
votar difiere entre brazos, el contraste de los votos está contaminado por quién
llegó y el panel lo dice antes de mostrar el resultado.

## Qué NO entra

**El decaimiento del paso.** Es la otra palanca por jugador y sería tentador
meterla como segundo factor, pero `dx-elo-1` la está midiendo hasta el 06/10 con
su propio sorteo. Dos experimentos moviendo el mismo `lr` sobre la misma gente
no se pueden leer por separado.

**La frecuencia de la pregunta.** Subió para todos el 27/09 y a propósito no se
sortea: es el termómetro con el que se lee este experimento, y un termómetro que
marque distinto en cada brazo no mide, decora.
"""

from __future__ import annotations

import os

from . import sorteo

EXPERIMENTO = "dx-banda-1"
BRAZOS = ("control", "exigente")
ENV_ENCENDIDO = "BANDA_ENABLED"

# (low, high) de p̂ por brazo. El centro se deriva, no se tabula: es el punto al
# que `pick_template` acerca cuando la banda queda vacía, y si se escribiera a
# mano podría dejar de estar adentro de su propia banda sin que nada avise.
BANDAS: dict[str, tuple[float, float]] = {
    "control": (0.70, 0.80),
    "exigente": (0.58, 0.72),
}

# La banda ampliada de la ε-exploración, un escalón más ancha a cada lado que la
# objetivo — la misma relación que tenían EXPLORE_LOW/HIGH con TARGET_LOW/HIGH.
_MARGEN_EXPLORACION = 0.05


def habilitado() -> bool:
    """Arranca ENCENDIDO. Igual que la rampa y al revés que el muro: lo peor que
    puede hacer una banda más exigente es no gustar, y eso se lee en los votos;
    un tope de pago puede hacer daño en horas."""
    crudo = os.getenv(ENV_ENCENDIDO)
    if crudo is None:
        return True
    return crudo.strip().lower() not in {"0", "false", "no", "off", ""}


def brazo_de(player_id: int) -> str:
    return sorteo.brazo_de(player_id, EXPERIMENTO, BRAZOS)


def banda_de(player_id: int) -> tuple[float, float]:
    """(low, high) de p̂ para este jugador. Apagado = la de siempre."""
    if not habilitado():
        return BANDAS["control"]
    return BANDAS[brazo_de(player_id)]


def centro_de(low: float, high: float) -> float:
    return (low + high) / 2.0


def exploracion_de(low: float, high: float) -> tuple[float, float]:
    return (max(0.01, low - _MARGEN_EXPLORACION), min(0.99, high + _MARGEN_EXPLORACION))
