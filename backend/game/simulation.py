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
from zoneinfo import ZoneInfo

from sqlalchemy import and_ as sa_and, or_ as sa_or, text as sa_text
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

# ── La flecha del ranking: cuánto subió HOY ─────────────────────────────────
#
# La flecha de cada fila es «el puesto con el que empezó el día menos el de
# ahora». Hay UNA foto por día —la saca el primer tick después de la medianoche
# de Buenos Aires— y todo lo demás se calcula al leer.
#
# Hasta el 05/10 era otra cosa: una ventana de 2,5 a 5 minutos, con dos fotos
# en registro de desplazamiento que se corrían cada 150 segundos. Tenía tres
# problemas, y los tres se vieron con un jugador de verdad:
#
#   · **Olvidaba.** Quien subía 875 puestos en una tanda veía «↑136»: lo de los
#     últimos minutos. El número que la persona quiere es el de su día.
#   · **Arrancaba tarde.** La foto solo incluía a quien ya tenía XP, así que un
#     recién llegado no tenía contra qué compararse hasta el primer corrimiento
#     posterior a su primer acierto. Los primeros aciertos —que son los que más
#     puestos mueven, porque la cola del ranking es densa— no contaban.
#   · **Numeraba otra población.** La foto ordenaba a los de `xp > 0` y el
#     ranking muestra a los de `exercises_correct > 0` (ver `ranking.py`): con
#     alguien en una y no en la otra, todas las flechas arrastraban el mismo
#     corrimiento.
#
# Y es más barata: un UPDATE de toda la tabla por día en vez de uno cada dos
# minutos y medio.
#
# El día es el de Buenos Aires, el mismo del resto del juego (el contador de
# derivadas, el tope): `router._inicio_del_dia` usa esta misma zona.
TZ_JUEGO = ZoneInfo("America/Argentina/Buenos_Aires")
_UTC = ZoneInfo("UTC")


def inicio_del_dia(now: datetime) -> datetime:
    """La medianoche de Buenos Aires anterior a `now`, en UTC ingenuo."""
    local = now.replace(tzinfo=_UTC).astimezone(TZ_JUEGO)
    medianoche = local.replace(hour=0, minute=0, second=0, microsecond=0)
    return medianoche.astimezone(_UTC).replace(tzinfo=None)


def get_state(db: Session) -> GameSimState:
    """La única fila de estado, creada al vuelo la primera vez."""
    state = db.query(GameSimState).filter(GameSimState.id == 1).first()
    if state is None:
        state = GameSimState(id=1, version=0)
        db.add(state)
        db.flush()
    return state


def bump_version(db: Session) -> None:
    """Marca que el ranking cambió, para que el cliente lo note en el pulso.

    El incremento va del lado de SQL y no leyendo-sumando-escribiendo en Python.
    Con la forma vieja, dos respuestas correctas simultáneas leían la misma
    versión y escribían la misma versión+1: se perdía un incremento. Para un
    detector de cambios eso es tolerable, pero además obligaba a LEER la fila
    —la única fila de esta tabla, por la que pasan todas las respuestas correctas
    y todos los pulsos— y una lectura antes de una escritura sobre la misma fila
    es exactamente cómo se arma una fila de espera.
    """
    cambiadas = (
        db.query(GameSimState)
        .filter(GameSimState.id == 1)
        .update({"version": GameSimState.version + 1}, synchronize_session=False)
    )
    if not cambiadas:
        # Todavía no existe (base recién creada): se crea y se reintenta.
        get_state(db)
        db.query(GameSimState).filter(GameSimState.id == 1).update(
            {"version": GameSimState.version + 1}, synchronize_session=False
        )


def _claim_tick(db: Session, now: datetime) -> bool:
    """Toma el turno de avanzar, si le toca a esta request.

    El UPDATE condicional es lo que hace que dos requests simultáneas no
    adelanten dos veces: la segunda no encuentra ninguna fila que cumpla la
    condición y se va con las manos vacías.

    Y COMITEA en el acto, sin esperar al resto del avance. Esa fila es la única
    de su tabla, así que su candado es global: mientras un pulso la tenga
    tomada, cualquier otro pulso y cualquier respuesta correcta quedan haciendo
    cola detrás. Sosteniéndolo hasta el final del tick —bots, fotos del ranking,
    sincronización de universidades, poda— el juego entero se frenaba durante
    todo ese trabajo, cada diez segundos. Reteniéndolo solo lo que dura el claim,
    la exclusión sigue siendo la misma y la cola dura microsegundos.
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
    db.commit()
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
    """Saca la foto del día, si todavía no se sacó.

    Con cuánto puesto empezó hoy cada uno. Corre en el primer tick posterior a
    la medianoche de Buenos Aires; si a esa hora no hay nadie, corre cuando
    llegue el primero, y da lo mismo: sin tráfico no hay ticks, sin ticks los
    sembrados no avanzan, y sin nadie jugando el orden no cambió.

    Numera a quienes están EN el ranking (`exercises_correct > 0`), con el orden
    canónico. Tiene que ser la misma población y el mismo orden que arma la
    lista (`ranking.RESOLVIO_ACA`, `ranking.ORDEN_XP`), o la flecha compara
    puestos de dos tablas distintas.

    Se escribe el puesto de cada fila en UNA sentencia, numerando con una función
    de ventana. Antes era un UPDATE por jugador dentro de un bucle de Python,
    apoyado en que fueran "unos cientos de filas cada dos minutos y medio" — que
    es exactamente el supuesto que rompe una difusión que funcione. Con veinte
    mil jugadores eso son veinte mil viajes a la base adentro de un solo pedido,
    reteniendo mientras tanto el candado de la tabla de estado y el de cada fila
    que va tocando: el juego entero se detenía cada dos minutos y medio.
    """
    state = get_state(db)
    if state.last_snapshot_at is not None and state.last_snapshot_at >= inicio_del_dia(now):
        return

    # `UPDATE ... FROM` con una subconsulta numerada. Postgres y SQLite escriben
    # esta forma igual (SQLite la soporta desde la 3.33), así que no hace falta
    # bifurcar por dialecto.
    db.execute(
        sa_text(
            """
            UPDATE game_players
               SET rank_snapshot = puestos.puesto,
                   rank_snapshot_at = :ahora
              FROM (
                    SELECT id,
                           row_number() OVER (ORDER BY xp DESC, id ASC) AS puesto
                      FROM game_players
                     WHERE exercises_correct > 0
                   ) AS puestos
             WHERE game_players.id = puestos.id
            """
        ),
        {"ahora": now},
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
    # El ranking de universidades se mueve con cada avance, así que el sobrepaso se
    # busca acá y no en un proceso aparte. El import es local para no armar un
    # ciclo: events no sabe nada de la simulación, pero boosts sí la usa.
    from . import boosts, events

    events.sync_universities(db, boosts.MIN_PLAYERS_RANKED, now=now)
    events.prune(db, now=now)
    if moved:
        bump_version(db)
    db.commit()
    return moved > 0


def hay_foto_de_hoy(db: Session, now: datetime) -> bool:
    """Si la foto del día ya se sacó. Una lectura de la fila de estado."""
    ultima = (
        db.query(GameSimState.last_snapshot_at).filter(GameSimState.id == 1).scalar()
    )
    return ultima is not None and ultima >= inicio_del_dia(now)


def rank_delta(
    player: GamePlayer,
    current_rank: int,
    now: datetime,
    *,
    ultimo_puesto: int,
    hay_foto: bool,
) -> int:
    """Puestos que ganó (positivo) o perdió (negativo) HOY.

    Tres casos, y ninguno escribe nada:

      · **Tiene foto de hoy**: arrancó el día en ese puesto. La flecha es la
        diferencia.
      · **No la tiene, y la foto de hoy ya se sacó**: entró al ranking hoy —su
        primera derivada resuelta es de hoy—, así que arrancó de abajo de todo.
        La referencia es el último puesto (`ultimo_puesto`, el tamaño de la
        tabla), y la flecha cuenta desde la primera derivada. Es lo que antes
        se perdía.
      · **Todavía no hay foto de hoy** (los segundos entre la medianoche y el
        primer tick): no hay contra qué comparar, y la flecha no se dibuja. Una
        foto de ayer NO sirve de referencia: diría lo de ayer.
    """
    if not hay_foto:
        return 0
    if (
        player.rank_snapshot is not None
        and player.rank_snapshot_at is not None
        and player.rank_snapshot_at >= inicio_del_dia(now)
    ):
        return player.rank_snapshot - current_rank
    return max(0, ultimo_puesto - current_rank)
