"""La pantalla de arranque: qué pasó mientras no estabas, o qué está pasando.

Toda sesión del juego empieza en la misma pantalla (`mobile-flow.tsx` monta
`{kind: "intro"}` siempre), y hasta acá esa pantalla decía «¡Bienvenido!
Resolvé la siguiente derivada para comenzar a jugar» — nueve palabras que no
informan nada, en el lugar más mirado del producto. Este módulo le da algo que
decir.

**No es un sistema de eventos nuevo: es un digest del feed que ya corre.** Los
hechos salen de `game_events` y de cuatro agregaciones, y se escriben con la
misma convención que el feed —oración con huecos (`{a}`, `{u0}`), punto final,
y el emoji aparte para que el cliente lo ponga siempre al final—. Las dos
pantallas comparten renderer en el front por eso.

── Las tres ramas ───────────────────────────────────────────────────────────

Cuál se dibuja lo decide `correct_today`, y no un umbral de horas. Se probó al
revés y no cierra: con una ventana de «menos de un día», alguien que jugó ayer a
las 23 y vuelve hoy a las 8 lleva nueve horas afuera pero cero derivadas hoy, y
la frase «hoy ya resolviste 0» es un renglón roto. Ramificando por el contador
la frase nunca puede decir cero, no hay aritmética de husos —el corte es la
medianoche argentina que el juego ya usa para el tope— y un solo booleano decide
saludo, encabezado y cantidad de renglones.

  · `sigue`   — `correct_today > 0`. Está a mitad del día. Una línea.
  · `vuelve`  — ya jugó antes, hoy no. Hasta tres novedades.
  · `primera` — nunca resolvió nada. Hasta tres, sobre el mundo y su gente.

── La ventana, que es mixta a propósito ─────────────────────────────────────

Hay dos clases de hecho y solo una necesita fallback:

  · **evento** (pasó o no pasó): los reclutas te dejaron XP, tu universidad
    superó a otra. Ventana = desde el último digest. Sin mínimo: si pasó, se
    cuenta, y 6.644 XP son 6.644 XP.
  · **conteo** (es un número): altas de tu universidad. Desde el último digest
    si el número llega a `MIN_CONTEO`; si no, la cifra de siete días con su
    propio rótulo.

El fallback no es cosmético. Medido el 27/09, en 24 h entraron 8 personas en
todo el juego —UBA 3, UTN 3, UNC 1, UNLP 1— contra 108/97/69/55 en la semana.
Sin el mixto, el renglón diría «+1 persona se sumó» la mayoría de las veces, que
es peor que no decir nada.

── Lo que NO se muestra ─────────────────────────────────────────────────────

Nada que le saque algo a la persona —«te pasaron 3 puestos», «se te cayó la
racha»— en la rama `sigue`. Esta pantalla se ve en CADA arranque: un renglón que
señala una pérdida funciona una vez y a la quinta es el motivo por el que no se
vuelve. En `vuelve` se permite a lo sumo uno, y nunca primero.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta

from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from models import GameAttempt, GameEvent, GameGroup, GamePlayer

from . import elo as game_elo
from .events_copy import elegir, miles

# Cuántos renglones entran. Tres es lo que el diseño fijó; la lista puede volver
# más corta y el cliente dibuja los que haya.
MAX_NOVEDADES = 3

# Debajo de esto, un conteo cae a la ventana de siete días. Cinco es donde el
# número deja de leerse como «no pasó nada»: con 3 altas, «+3 personas de la UTN
# se sumaron» compite mal contra el silencio.
MIN_CONTEO = 5

VENTANA_SEMANAL = timedelta(days=7)

# Sin esto, alguien que vuelve después de tres meses recibe «se resolvieron
# 180.000 derivadas», que no se lee como una novedad sino como un almanaque. El
# digest habla de lo reciente.
VENTANA_MAXIMA = timedelta(days=14)

# Solo cuenta quien resolvió algo, que es como cuenta el ranking
# (game/ranking.py :: RESOLVIO_ACA). «Cuánta gente hay» tiene que querer decir lo
# mismo en las dos pantallas.
JUEGA = GamePlayer.exercises_correct > 0

# Los sembrados NO cuentan acá, al revés que en el ranking —que los incluye a
# propósito, para que el primero en llegar tenga a quién escalar—. La diferencia
# es qué se está diciendo: el ranking muestra filas para competir contra, y esta
# pantalla afirma que hay TANTAS PERSONAS. Decirle a alguien «ya hay 371 de la
# UBA jugando» cuando cien son fixtures es una mentira barata en el primer
# segundo de la relación.
#
# Hoy la distinción no cambia ningún número —producción tiene 0 sembrados sobre
# 3.284 jugadores— así que no hay contradicción visible con el ranking. El día
# que se siembre, esta pantalla va a decir menos que el ranking de al lado, y
# eso es lo correcto.
NO_BOT = GamePlayer.is_bot.is_(False)


@dataclass
class Novedad:
    """Un renglón. `texto` lleva los huecos del feed y el emoji va aparte."""

    clave: str
    texto: str
    emoji: str
    puntaje: int
    universities: list[str] = field(default_factory=list)
    actor_alias: str | None = None
    actor_level: int | None = None


@dataclass
class Bienvenida:
    modo: str
    saludo: str
    titulo: str | None
    novedades: list[Novedad]


# ── Las consultas ────────────────────────────────────────────────────────────


def _ventana(player: GamePlayer, ahora: datetime) -> datetime:
    """Desde cuándo mira el digest.

    `digest_seen_at` cuando ya se le mostró alguna vez; si no, `last_seen_at`,
    que para el primer digest de cada uno todavía es una referencia honesta. Y
    nunca más atrás que `VENTANA_MAXIMA`.
    """
    desde = player.digest_seen_at or player.last_seen_at or ahora
    return max(desde, ahora - VENTANA_MAXIMA)


def _altas(db: Session, university: str, desde: datetime) -> int:
    return (
        db.query(func.count(GamePlayer.id))
        .filter(NO_BOT, GamePlayer.university == university,
                GamePlayer.created_at >= desde)
        .scalar()
        or 0
    )


def _derivadas(db: Session, desde: datetime) -> int:
    return (
        db.query(func.count(GameAttempt.id))
        .join(GamePlayer, GamePlayer.id == GameAttempt.player_id)
        .filter(NO_BOT, GameAttempt.is_correct.is_(True),
                GameAttempt.created_at >= desde)
        .scalar()
        or 0
    )


# Cuánta gente hace falta para decir que el juego «está» en una universidad.
#
# Dos, y el uno que se descarta no es un tecnicismo: la universidad se carga a
# mano en un campo libre, así que la cola de una sola persona es mitad
# universidades de verdad (UNCUYO, UNAM, UNJu) y mitad tipeos —«23213r», «Ser
# f», «FQ», «Fcea»—. Contarlas infla el número con basura que nadie puede ver
# para desmentir: medido el 27/09, 31 contra 16.
#
# No arregla la canonicalización, que es otro problema y vive en la carga. Lo
# que hace es no APOYARSE en ella para una afirmación pública.
MIN_PRESENCIA = 2


def _universo(db: Session) -> tuple[int, int]:
    """Cuánta gente juega y en cuántas universidades hay presencia."""
    personas = db.query(func.count(GamePlayer.id)).filter(NO_BOT, JUEGA).scalar() or 0
    unis = (
        db.query(func.count())
        .select_from(
            db.query(GamePlayer.university)
            .filter(NO_BOT, JUEGA, GamePlayer.university.isnot(None),
                    GamePlayer.university != "")
            .group_by(GamePlayer.university)
            .having(func.count(GamePlayer.id) >= MIN_PRESENCIA)
            .subquery()
        )
        .scalar()
        or 0
    )
    return int(personas), int(unis)


def _minutos_desde_la_ultima_alta(
    db: Session, ahora: datetime, salvo_id: int | None = None
) -> int | None:
    """Hace cuánto llegó la última persona, sin contar a quien pregunta.

    Es el único hecho que dice «esto está pasando AHORA» en vez de «esto es
    grande». Aguanta como renglón porque el hueco mediano entre altas es de tres
    minutos (medido sobre los `welcome` de siete días).

    **`salvo_id` no es una optimización, es el bug.** Para alguien que acaba de
    llegar, la fila más nueva de `game_players` ES LA SUYA, así que sin excluirla
    el renglón dice «la última persona se sumó hace menos de un minuto» y esa
    persona es quien lo está leyendo. Se vio en producción a los dos minutos de
    desplegar, y es exactamente la clase de error que no aparece en un fixture:
    hay que ser el más nuevo de la base para pisarlo.
    """
    q = db.query(func.max(GamePlayer.created_at)).filter(NO_BOT)
    if salvo_id is not None:
        q = q.filter(GamePlayer.id != salvo_id)
    ultima = q.scalar()
    if ultima is None:
        return None
    return max(0, int((ahora - ultima).total_seconds() // 60))


def _reclutas(db: Session, player: GamePlayer) -> tuple[int, int]:
    """Cuántos reclutas tiene y cuánta XP le dejaron SIN contarle todavía.

    La diferencia contra `referral_xp_digest_seen` es lo nuevo por este canal.
    Los otros dos canales —push y mail— llevan su propia marca, así que lo que
    ya avisó la notificación no le saca nada a esto ni al revés.
    """
    fila = (
        db.query(
            func.count(GamePlayer.id),
            func.coalesce(func.sum(GamePlayer.referral_xp_given), 0),
        )
        .filter(GamePlayer.referred_by == player.id)
        .one()
    )
    nuevo = int(fila[1]) - int(player.referral_xp_digest_seen or 0)
    return int(fila[0]), max(0, nuevo)


def _sorpasso(db: Session, university: str, desde: datetime) -> GameEvent | None:
    """El movimiento más reciente del ranking de universidades que la involucra.

    Las siglas viven en DOS columnas sueltas (`university` y `university_b`) y
    no en un array, así que hay que mirar las dos: en «la UBA superó a la UTN»
    la universidad de la persona puede ser cualquiera de las dos, y el renglón
    le interesa igual —de un lado es una victoria y del otro una pérdida—.
    """
    return (
        db.query(GameEvent)
        .filter(
            GameEvent.kind.in_(("uni_top", "uni_pass")),
            GameEvent.created_at >= desde,
            or_(GameEvent.university == university,
                GameEvent.university_b == university),
        )
        .order_by(GameEvent.id.desc())
        .first()
    )


def _puesto(db: Session, university: str) -> tuple[int, int] | None:
    """Qué puesto ocupa por Elo promedio, y de cuántas.

    Mismo criterio que `game_university_leaderboard`: solo promedian los que
    salieron de la rampa, y una universidad sin mínimo de jugadores no entra.
    """
    # Con `case` y no con `FILTER (WHERE …)`: los chequeos corren sobre SQLite y
    # es la forma que el resto del archivo ya usa (game/router.py).
    rampa = GamePlayer.n_updates >= game_elo.RAMP_UPDATES
    filas = (
        db.query(
            GamePlayer.university,
            func.avg(case((rampa, GamePlayer.theta))),
            func.count(case((rampa, 1))),
        )
        .filter(NO_BOT, JUEGA, GamePlayer.university.isnot(None),
                GamePlayer.university != "")
        .group_by(GamePlayer.university)
        .all()
    )
    tabla = sorted(
        [(u, float(th)) for u, th, n in filas if th is not None and n >= 5],
        key=lambda f: -f[1],
    )
    for i, (u, _) in enumerate(tabla, 1):
        if u == university:
            return i, len(tabla)
    return None


def universidad_del_link(db: Session, player: GamePlayer) -> str | None:
    """La universidad que se deduce del `?g=` con el que aterrizó.

    El 76,8% de los jugadores llega con uno, y de esos el 100% tiene grupo
    conocido en `game_groups` — así que para tres de cada cuatro sabemos la
    universidad antes de que la carguen. Se usa SOLO para elegir de quién
    hablarle en la pantalla de primera vez; no se le asigna nada.
    """
    if player.university:
        return player.university
    if not player.first_group_id:
        return None
    grupo = db.query(GameGroup).filter(GameGroup.id == player.first_group_id).first()
    return grupo.universidad if grupo else None


# ── Las novedades ────────────────────────────────────────────────────────────


def _n_reclutas(db, player, sem) -> Novedad | None:
    n, xp = _reclutas(db, player)
    if not n or xp <= 0:
        return None
    cuantos = "Tu recluta te dejó" if n == 1 else f"Tus {n} reclutas te dejaron"
    return Novedad("reclutas", f"{cuantos} {miles(xp)} XP.", "🪖", 100)


def _n_sorpasso(db, uni, desde) -> Novedad | None:
    ev = _sorpasso(db, uni, desde)
    if ev is None:
        return None
    # En el mismo orden en que aparecen `{u0}` y `{u1}` en la oración, que es
    # como el feed las manda (ver GameEventOut.universities).
    unis = [u for u in (ev.university, ev.university_b) if u]
    return Novedad("sorpasso", ev.text, ev.emoji, 90, universities=unis)


def _n_altas(db, uni, desde, ahora, sem) -> Novedad | None:
    """El conteo con su fallback: desde tu visita si alcanza, si no la semana."""
    n = _altas(db, uni, desde)
    if n >= MIN_CONTEO:
        cuerpo = elegir(f"{sem}:altas", [
            "{n} personas de la {u0} se sumaron.",
            "Se sumaron {n} personas de la {u0}.",
            "La {u0} sumó {n} personas.",
        ])
        return Novedad("altas", cuerpo.replace("{n}", miles(n)), "👋", 70,
                       universities=[uni])
    semanal = _altas(db, uni, ahora - VENTANA_SEMANAL)
    if semanal < MIN_CONTEO:
        return None
    return Novedad(
        "altas_semana",
        "Esta semana se sumaron " + miles(semanal) + " personas de la {u0}.",
        "👋", 60, universities=[uni])


def _n_gente_de_la_uni(db, uni) -> Novedad | None:
    n = (
        db.query(func.count(GamePlayer.id))
        .filter(NO_BOT, JUEGA, GamePlayer.university == uni)
        .scalar()
        or 0
    )
    if n < MIN_CONTEO:
        return None
    return Novedad("uni_gente", "Ya hay " + miles(n) + " personas de la {u0} jugando.",
                   "👋", 95, universities=[uni])


# Debajo de esto no hay ranking que contar: «va 1ª de 1» es una tabla de una
# fila con un podio encima. Tres es el mínimo en el que el puesto significa algo.
MIN_TABLA = 3


def _n_puesto(db, uni) -> Novedad | None:
    p = _puesto(db, uni)
    if p is None or p[1] < MIN_TABLA:
        return None
    return Novedad("uni_puesto", f"La {{u0}} va {p[0]}ª de {p[1]} en el ranking.",
                   "🏆", 80, universities=[uni])


def _n_derivadas(db, desde, cuando: str) -> Novedad | None:
    n = _derivadas(db, desde)
    if n < MIN_CONTEO:
        return None
    return Novedad("derivadas", f"Se resolvieron {miles(n)} derivadas {cuando}.",
                   "🧩", 40)


def _n_universo(db) -> Novedad | None:
    personas, unis = _universo(db)
    if personas < MIN_CONTEO or unis < 2:
        return None
    return Novedad("universo",
                   f"Ya somos {miles(personas)} en {unis} universidades.", "🏛️", 30)


def _n_ultima_alta(db, ahora, salvo_id=None) -> Novedad | None:
    m = _minutos_desde_la_ultima_alta(db, ahora, salvo_id)
    # Más de dos horas ya no es «ahora mismo», y decirlo sería vender quietud.
    if m is None or m > 120:
        return None
    cuando = "hace menos de un minuto" if m < 1 else (
        "hace un minuto" if m == 1 else f"hace {m} minutos")
    return Novedad("ultima_alta", f"La última persona se sumó {cuando}.", "👋", 35)


# ── El armado ────────────────────────────────────────────────────────────────


def construir(
    db: Session,
    player: GamePlayer,
    correct_today: int,
    inicio_del_dia: datetime,
    ahora: datetime | None = None,
) -> Bienvenida:
    """El payload de la pantalla de arranque.

    `inicio_del_dia` entra por parámetro y no se calcula acá por lo mismo que en
    `game_muro.estado`: el borde del día del juego lo fija el router, y tenerlo
    en dos lugares es tenerlo en uno y medio.
    """
    ahora = ahora or datetime.utcnow()
    sem = f"{player.id}"

    # ── Rama 1 · está a mitad del día ───────────────────────────────────────
    if correct_today > 0:
        cuantas = ("1 derivada" if correct_today == 1
                   else f"{miles(correct_today)} derivadas")
        return Bienvenida(
            modo="sigue",
            saludo="¡Hola, {a}!",
            titulo=None,
            novedades=[Novedad("hoy", f"Hoy ya resolviste {cuantas}.", "🧩", 100)],
        )

    primera = (player.exercises_correct or 0) == 0
    desde = _ventana(player, ahora)
    uni = universidad_del_link(db, player)

    candidatas: list[Novedad | None] = []

    if primera:
        # Nunca resolvió nada: no tiene progreso, ni reclutas, ni puesto. Quedan
        # dos drives —que esto está vivo, y que su gente ya está adentro— así
        # que tres renglones sobre dos drives obligan a que el tercero sea el
        # que dice «ahora mismo» y no un tercer total.
        if uni:
            candidatas += [_n_gente_de_la_uni(db, uni), _n_puesto(db, uni)]
        candidatas += [
            _n_derivadas(db, inicio_del_dia, "hoy"),
            _n_universo(db),
            _n_ultima_alta(db, ahora, player.id),
        ]
        saludo, titulo, modo = "¡Bienvenido!", "Lo que está pasando", "primera"
    else:
        candidatas += [_n_reclutas(db, player, sem)]
        if uni:
            candidatas += [_n_sorpasso(db, uni, desde),
                           _n_altas(db, uni, desde, ahora, sem)]
        candidatas += [
            _n_derivadas(db, desde, "mientras tanto"),
            _n_universo(db),
            _n_ultima_alta(db, ahora, player.id),
        ]
        saludo, titulo, modo = "¡Bienvenido, {a}!", "Mientras no estabas", "vuelve"

    vivas = [n for n in candidatas if n is not None]
    vivas.sort(key=lambda n: -n.puntaje)
    return Bienvenida(modo=modo, saludo=saludo, titulo=titulo,
                      novedades=vivas[:MAX_NOVEDADES])


def marcar_mostrado(db: Session, player: GamePlayer, ahora: datetime | None = None) -> None:
    """Cierra la ventana: lo que se mostró ya se contó.

    Avanza también el canal de reclutas, y por eso se llama DESPUÉS de construir
    el payload y no antes — al revés, el digest se contaría a sí mismo y el
    renglón de reclutas nunca aparecería.
    """
    ahora = ahora or datetime.utcnow()
    total = (
        db.query(func.coalesce(func.sum(GamePlayer.referral_xp_given), 0))
        .filter(GamePlayer.referred_by == player.id)
        .scalar()
        or 0
    )
    player.digest_seen_at = ahora
    player.referral_xp_digest_seen = int(total)
