"""Quién entra al ranking del minijuego, y en qué orden.

Tres expresiones SQL y nada más. Viven acá y no en `router.py` por un motivo
concreto: `events.py` las necesita —el feed anuncia posiciones, así que tiene que
filtrar igual que la tabla— y no puede importar del router sin cerrar un ciclo.
El resultado era que las reinlineaba, con un comentario que nombraba la constante
que no podía usar. Dos copias de una regla que el propio comentario declara que
"tienen que moverse JUNTAS" es la forma más segura de que no se muevan juntas.

El gemelo de Intervalo clásico es `main.VISIBLE_EN_RANKING`, que responde la
misma pregunta con las columnas de `users`.
"""

from __future__ import annotations

from sqlalchemy import and_, case, or_
from sqlalchemy.orm import Session

from models import GamePlayer

from . import elo

# Quién ENTRA al ranking: quien resolvió al menos una derivada acá.
#
# Antes el filtro era `xp > 0`, y eso NO prueba haber resuelto nada:
# `referrals.acreditar` le suma XP al reclutador con un UPDATE crudo, así que
# alguien podía figurar en la tabla sin haber derivado nunca. Con los reclutas
# cruzando de producto el agujero se agranda —quien solo estudia en Intervalo
# clásico le paga XP de juego a quien lo trajo—, así que arreglarlo es parte del
# cruce y no un extra.
#
# Todos los lugares que lo usan tienen que moverse JUNTOS. Si el que cuenta
# cuántos van delante no filtra igual que el que arma la lista, la ventana
# `around_me` se centra en una fila que no es la propia, y el síntoma es "a
# veces mi fila aparece corrida", que nadie reporta como bug.
#
# Los sembrados NO se excluyen acá, y es a propósito: pueblan el ranking para
# que el primero en llegar tenga a quién escalar (ver game/schemas.py).
RESOLVIO_ACA = GamePlayer.exercises_correct > 0


# ── El ranking individual se puede ordenar por dos cosas ──────────────────────
# La XP mide cuánto jugaste; el Elo, qué tan difícil resolvés. El selector de la
# cabecera (desktop-layout.tsx) elige entre las dos.
#
# El orden por Elo pone primero a quien ya salió de la rampa (elo.RAMP_UPDATES)
# y recién después a los provisorios. Es el mismo criterio que el ranking de
# universidades, que ordena por `(ranked, rating_avg, rated_players)`, un nivel
# más abajo: con tres respuestas el theta todavía es ruido, y sin este corte una
# racha de suerte alcanza para encabezar la tabla del juego entero.
CALIFICADO = case((GamePlayer.n_updates >= elo.RAMP_UPDATES, 1), else_=0)

# Las claves de orden, como tuplas para `order_by(*...)`. El desempate por `id`
# es el mismo en las dos: sin él, dos valores iguales pueden salir en cualquier
# orden y la lista tiembla de una página a la otra.
ORDEN_ELO = (CALIFICADO.desc(), GamePlayer.theta.desc(), GamePlayer.id.asc())
ORDEN_XP = (GamePlayer.xp.desc(), GamePlayer.id.asc())


def puesto(db: Session, player: GamePlayer, scope: list | None = None) -> int:
    """Puesto 1-based en el orden canónico (xp DESC, id ASC).

    Cuenta cuántos van DELANTE, que es lo mismo que ordenar la tabla y buscar la
    fila propia pero sin traerla. `scope` acota la comparación a un subconjunto
    —hoy, a una universidad— y por eso la misma función sirve para el puesto
    global y para el de adentro de la casa de estudios.

    Vive acá y no en el router por el motivo que da el encabezado del módulo: el
    feed anuncia posiciones y necesita contar EXACTAMENTE igual que la tabla. Con
    una copia en cada lado, el día que una de las dos cambie el feed va a
    anunciar entradas al top que la tabla no muestra.
    """
    ahead = (
        db.query(GamePlayer.id)
        .filter(
            *(scope or []),
            RESOLVIO_ACA,
            or_(
                GamePlayer.xp > player.xp,
                and_(GamePlayer.xp == player.xp, GamePlayer.id < player.id),
            ),
        )
        .count()
    )
    return ahead + 1


def cuantos_compiten(db: Session, scope: list | None = None) -> int:
    """Cuánta gente hay en el ranking, con el mismo filtro que `puesto`.

    Lo usa el feed para no anunciar un corte que no existe: en un juego de ocho
    personas, «entró al top 10» lo dice cualquiera por el solo hecho de estar.
    """
    return db.query(GamePlayer.id).filter(*(scope or []), RESOLVIO_ACA).count()


def scope_de_universidad(player: GamePlayer) -> list | None:
    """El filtro que acota `puesto` a la universidad del jugador, o None si no
    cargó ninguna. Devolver None y no una lista vacía es la diferencia entre «su
    universidad» y «todo el juego», y quien llama tiene que poder distinguirlas."""
    uni = (player.university or "").strip()
    return [GamePlayer.university == uni] if uni else None
