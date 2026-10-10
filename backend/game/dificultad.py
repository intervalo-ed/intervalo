"""La palanca de dificultad: la persona elige con qué nivel practica.

## Dos θ y no uno

Elegir una posición NO escribe θ. θ es lo que el juego mide: ordena el ranking
por Elo, pinta el color del @, dispara los eventos de nivel y promedia el Elo de
la universidad. Si la palanca lo escribiera, todo eso pasaría a ser elegible.

Hay entonces dos números:

    θ real     el de siempre. Solo lo mueven las respuestas (`elo.update`).
    θ de juego el que mira el selector de ejercicios (`generator.pick_template`).
               Sin posición elegida, o con el interruptor apagado, es el real.

La consecuencia es que la elección es auto-correctiva sin que haga falta
programarlo: quien se pone más arriba de lo que da recibe ejercicios con p̂ bajo,
acierta menos, y su θ real baja o sube más despacio; quien se pone más abajo
acierta más y θ real sube más despacio. Nada se infla a mano.

## Lo que queda registrado contra θ real

`p_hat`, `theta_at_serve` y `beta_at_serve` del ejercicio se guardan contra θ
real, que es lo que el motor cree de verdad. La calibración del panel compara
esa predicción con lo que pasó, y si se guardara contra θ de juego mediría la
elección y no el motor.

## La β no aprende de quien eligió

`game_template_stats` es una sola tabla para todos. Un jugador fuera de su banda
la sesgaría: quien se pone en lo más difícil y falla hundiría las β de T7 y T8
hacia arriba para todos. Con una posición elegida, θ real se mueve igual pero la
β de la plantilla no (ver `router._aplicar_elo`); los contadores de personas
sí corren, porque el ancla cuenta gente y no respuestas.

## Lo que sigue mandando por encima

La rampa inicial (`elo.max_tier_de`) y el tope del salteo (`max_tier`) son filtros
del pool y se aplican antes de puntuar, así que la palanca no los aflojan. Los
tres ejercicios fijos del onboarding no pasan por el selector.

## Una consecuencia que hay que saber

La XP paga por tier (`xp.XP_POR_TIER`), no por p̂: jugar más difícil paga más por
acierto. Es la palanca de una posible monetización futura y hoy queda así, a
propósito, para medirla.
"""

from __future__ import annotations

import os

from . import elo

ENV_ENCENDIDO = "DIFICULTAD_ENABLED"
POSICIONES = 9

# θ de juego por posición. Una grilla de ~0,4 que arranca en −0,4 y llega a 2,8,
# que es el techo del catálogo (2,77, ver `check_game_techo.py`). Salta el hueco
# de θ≈0,7, donde ninguna plantilla cae en banda con las semillas; la posición 3
# queda en 0,9. Los números se afinan con lo que muestre el panel.
THETA_DE_POSICION: tuple[float, ...] = (-0.4, 0.0, 0.4, 0.9, 1.2, 1.6, 2.0, 2.4, 2.8)


def habilitado() -> bool:
    """Apagado por defecto, como `MURO_ENABLED`. Se lee en cada pedido: apagarlo
    es cambiar la variable y que el próximo `/next` ya salga como siempre."""
    return os.getenv(ENV_ENCENDIDO, "").strip().lower() in {"1", "true", "yes", "on"}


def es_posicion(valor: object) -> bool:
    return isinstance(valor, int) and not isinstance(valor, bool) and 0 <= valor < POSICIONES


def elegida(player) -> int | None:
    """La posición que rige para este jugador, o None si manda el motor."""
    if not habilitado():
        return None
    pos = getattr(player, "dificultad", None)
    return pos if es_posicion(pos) else None


def theta_de_juego(player) -> float:
    """El θ con el que el selector puntúa las plantillas."""
    pos = elegida(player)
    return player.theta if pos is None else THETA_DE_POSICION[pos]


def nivel_de_posicion(posicion: int) -> int:
    """El nivel 0-3 (el color) que le corresponde a una posición. El front lo
    espeja en `dificultad.ts`."""
    return elo.level_of(THETA_DE_POSICION[posicion])
