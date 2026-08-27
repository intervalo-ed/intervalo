"""Actividad simulada del ranking: los sembrados también juegan.

Un ranking congelado no engancha. Si mientras alguien resuelve nada se mueve,
escalar no se siente como ganarle a nadie: se siente como subir una escalera
vacía. Así que los jugadores sembrados avanzan solos.

El avance lo dispara el propio tráfico, no un worker: cada consulta al pulso
mira si pasó el intervalo desde el último avance y, si pasó, adelanta a unos
pocos. Sin proceso aparte, sin cron, y sin escribir en la base cuando no hay
nadie mirando — que es la mayor parte del tiempo.

Dos requests simultáneas no pueden adelantar dos veces: el turno se toma con un
UPDATE condicional sobre la única fila de estado, y solo sigue quien haya
cambiado esa fila.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta

from sqlalchemy import and_ as sa_and, or_ as sa_or
from sqlalchemy.orm import Session

from models import GamePlayer, GameSimState

# Cada cuánto avanza la simulación. Coincide con lo que el cliente consulta el
# pulso: así casi todo pedido encuentra algo nuevo.
TICK_SECONDS = 10

# Cuántos sembrados se mueven en cada avance y cuánto suma cada uno. La XP por
# acierto real ronda 25 (game/xp.py), así que esto equivale a que entre 3 y 6
# personas hayan resuelto una derivada en los últimos diez segundos.
BOTS_PER_TICK = (3, 6)
XP_PER_MOVE = (20, 40)

# Ventana de las flechitas de "se movió recién". La foto del puesto se refresca
# a la mitad de la ventana, así que lo que muestra cada flecha es un movimiento
# de entre 2,5 y 5 minutos — nunca más viejo que eso.
RANK_WINDOW_SECONDS = 300
SNAPSHOT_REFRESH_SECONDS = RANK_WINDOW_SECONDS // 2


def get_state(db: Session) -> GameSimState:
    """La única fila de estado, creada al vuelo la primera vez."""
    state = db.query(GameSimState).filter(GameSimState.id == 1).first()
    if state is None:
        state = GameSimState(id=1, version=0)
        db.add(state)
        db.flush()
    return state


def bump_version(db: Session) -> None:
    """Marca que el ranking cambió, para que el cliente lo note en el pulso."""
    state = get_state(db)
    state.version = (state.version or 0) + 1


def _claim_tick(db: Session, now: datetime) -> bool:
    """Toma el turno de avanzar, si le toca a esta request.

    El UPDATE condicional es lo que hace que dos requests simultáneas no
    adelanten dos veces: la segunda no encuentra ninguna fila que cumpla la
    condición y se va con las manos vacías.
    """
    get_state(db)
    cutoff = now - timedelta(seconds=TICK_SECONDS)
    claimed = (
        db.query(GameSimState)
        .filter(
            GameSimState.id == 1,
            sa_or(GameSimState.last_tick_at.is_(None), GameSimState.last_tick_at <= cutoff),
        )
        .update({"last_tick_at": now}, synchronize_session=False)
    )
    return claimed > 0


def _advance_bots(db: Session, now: datetime, rng: random.Random) -> int:
    """Le suma XP a unos pocos sembrados. Devuelve cuántos se movieron."""
    # Solo los que ya están en el ranking: un sembrado con 0 XP no compite, y
    # despertarlo de la nada se vería como que apareció alguien de la nada.
    candidates = (
        db.query(GamePlayer.id)
        .filter(GamePlayer.is_bot.is_(True), GamePlayer.xp > 0)
        .all()
    )
    if not candidates:
        return 0

    how_many = min(len(candidates), rng.randint(*BOTS_PER_TICK))
    chosen = rng.sample([row[0] for row in candidates], how_many)
    for player_id in chosen:
        gain = rng.randint(*XP_PER_MOVE)
        db.query(GamePlayer).filter(GamePlayer.id == player_id).update(
            {
                "xp": GamePlayer.xp + gain,
                "exercises_correct": GamePlayer.exercises_correct + 1,
                "exercises_attempted": GamePlayer.exercises_attempted + 1,
                "last_seen_at": now,
            },
            synchronize_session=False,
        )
    return len(chosen)


def _refresh_snapshots(db: Session, now: datetime) -> None:
    """Corre el registro de fotos del puesto, si la última ya está vieja.

    Es un registro de desplazamiento de dos posiciones: la foto reciente pasa a
    ser la de referencia y se toma una nueva. Así el punto de comparación
    siempre tiene entre media ventana y una ventana de antigüedad, y nunca hay
    un instante en que todas las flechas del ranking se apaguen juntas.

    Se recorre el ranking una vez y se escribe el puesto de cada fila. Son unos
    cientos de filas cada dos minutos y medio: sale más barato que mantener una
    tabla de historial, y alcanza porque la flecha solo necesita un punto contra
    el cual comparar.
    """
    state = get_state(db)
    if state.last_snapshot_at is not None:
        age = (now - state.last_snapshot_at).total_seconds()
        if age < SNAPSHOT_REFRESH_SECONDS:
            return

    rows = (
        db.query(GamePlayer.id)
        .filter(GamePlayer.xp > 0)
        .order_by(GamePlayer.xp.desc(), GamePlayer.id.asc())
        .all()
    )
    for index, (player_id,) in enumerate(rows):
        db.query(GamePlayer).filter(GamePlayer.id == player_id).update(
            {
                "rank_snapshot": GamePlayer.rank_recent,
                "rank_snapshot_at": GamePlayer.rank_recent_at,
                "rank_recent": index + 1,
                "rank_recent_at": now,
            },
            synchronize_session=False,
        )
    state.last_snapshot_at = now


def maybe_tick(db: Session) -> bool:
    """Avanza la simulación si le toca. Devuelve si hubo cambios.

    Nunca se pone al día: si nadie miró el ranking en una hora, al volver se
    avanza UN tick, no trescientos sesenta. Un ranking que teletransporta a
    todos de golpe se lee como un error, no como actividad.
    """
    now = datetime.utcnow()
    if not _claim_tick(db, now):
        return False

    moved = _advance_bots(db, now, random.Random())
    _refresh_snapshots(db, now)
    if moved:
        bump_version(db)
    db.commit()
    return moved > 0


def rank_delta(player: GamePlayer, current_rank: int, now: datetime | None = None) -> int:
    """Puestos que ganó (positivo) o perdió (negativo) en los últimos minutos.

    Se compara contra la foto de referencia; mientras esa todavía no existe
    (recién sembrado, o apenas arrancó la simulación) sirve la reciente. Si la
    única que hay ya quedó fuera de la ventana devuelve 0: una flecha que habla
    de hace media hora no dice "está pasando ahora", que es lo único que la
    flecha tiene para decir.
    """
    reference = now or datetime.utcnow()
    for rank, taken_at in (
        (player.rank_snapshot, player.rank_snapshot_at),
        (player.rank_recent, player.rank_recent_at),
    ):
        if rank is None or taken_at is None:
            continue
        if (reference - taken_at).total_seconds() > RANK_WINDOW_SECONDS:
            continue
        return rank - current_rank
    return 0
