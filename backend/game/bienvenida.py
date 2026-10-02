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

── Los conteos hablan de un período con nombre ──────────────────────────────

Hay dos clases de hecho:

  · **evento** (pasó o no pasó): los reclutas te dejaron XP, tu universidad
    superó a otra. Ventana = desde el último digest. Sin mínimo: si pasó, se
    cuenta, y 6.644 XP son 6.644 XP.
  · **conteo** (es un número): estudiantes que llegaron, derivadas que se
    resolvieron. Siempre con su período dicho en la oración —«hoy», «esta
    semana», «este mes»— y nunca como un total acumulado ni como «desde tu
    última visita», que es una ventana que solo conoce el servidor.

El período es el MÁS CORTO en el que el número llega a `MIN_CONTEO`. La
escalera no es cosmética: medido el 27/09, en 24 h entraron 8 personas en todo
el juego —UBA 3, UTN 3, UNC 1, UNLP 1— contra 108/97/69/55 en la semana. Sin
ella el renglón diría «hoy llegó 1 estudiante» la mayoría de las veces, que es
peor que no decir nada.

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
from .events_copy import miles

# Cuántos renglones entran. Tres es lo que el diseño fijó; la lista puede volver
# más corta y el cliente dibuja los que haya.
MAX_NOVEDADES = 3

# Debajo de esto, un conteo sube al período siguiente (hoy → semana → mes).
# Cinco es donde el número deja de leerse como «no pasó nada»: «Hoy llegaron 3
# estudiantes» compite mal contra el silencio.
MIN_CONTEO = 5

VENTANA_SEMANAL = timedelta(days=7)
# «Este mes» son los últimos treinta días y no el mes del calendario: el día 2
# el mes del calendario mide dos días y diría menos que la semana.
VENTANA_MENSUAL = timedelta(days=30)

# Cuánto para atrás miran los EVENTOS (hoy, el movimiento del ranking de
# universidades). Sin tope, alguien que vuelve después de tres meses recibe un
# sobrepaso de julio como si fuera una novedad. Los conteos no la usan: llevan
# su propio período.
VENTANA_MAXIMA = timedelta(days=14)

# Solo cuenta quien resolvió algo, que es como cuenta el ranking
# (game/ranking.py :: RESOLVIO_ACA). El puesto de una universidad tiene que
# salir de la misma gente en las dos pantallas.
JUEGA = GamePlayer.exercises_correct > 0

# Los sembrados NO cuentan acá, al revés que en el ranking —que los incluye a
# propósito, para que el primero en llegar tenga a quién escalar—. La diferencia
# es qué se está diciendo: el ranking muestra filas para competir contra, y esta
# pantalla afirma que llegaron TANTOS ESTUDIANTES. Decirle a alguien «hoy
# llegaron 105 estudiantes» cuando cien son fixtures es una mentira barata en el
# primer segundo de la relación.
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


def _periodos(inicio_del_dia: datetime, ahora: datetime):
    """Los tres períodos con nombre, del más corto al más largo."""
    return (
        ("hoy", inicio_del_dia),
        ("semana", ahora - VENTANA_SEMANAL),
        ("mes", ahora - VENTANA_MENSUAL),
    )


def _por_periodo(consulta, columna, periodos) -> dict[str, int]:
    """Cuenta UNA vez y reparte en los tres períodos.

    Eran hasta tres consultas por renglón —una por período, hasta dar con el que
    alcanzaba— y esta pantalla corre en cada arranque. `game_attempts` no tiene
    índice que empiece por `created_at`, así que cada una era una pasada entera
    por la tabla. Con `count(case(...))` es una sola, acotada al período más
    largo.
    """
    cuentas = [func.count(case((columna >= desde, 1))) for _, desde in periodos]
    fila = (
        consulta.with_entities(*cuentas)
        .filter(columna >= min(desde for _, desde in periodos))
        .one()
    )
    return {nombre: int(n or 0) for (nombre, _), n in zip(periodos, fila)}


def _altas(
    db: Session, university: str | None, periodos,
    salvo_id: int | None = None,
) -> dict[str, int]:
    """Cuántos llegaron en cada período; sin universidad, en todo el juego.

    **`salvo_id` no es una optimización.** Para alguien que acaba de llegar, una
    de las altas de hoy ES LA SUYA: sin excluirla, «hoy llegaron 5 estudiantes»
    lo cuenta a él, que es quien lo está leyendo.
    """
    q = db.query(GamePlayer).filter(NO_BOT)
    if university is not None:
        q = q.filter(GamePlayer.university == university)
    if salvo_id is not None:
        q = q.filter(GamePlayer.id != salvo_id)
    return _por_periodo(q, GamePlayer.created_at, periodos)


def _derivadas(db: Session, periodos) -> dict[str, int]:
    """Cuántas derivadas se resolvieron en cada período."""
    q = (
        db.query(GameAttempt)
        .join(GamePlayer, GamePlayer.id == GameAttempt.player_id)
        .filter(NO_BOT, GameAttempt.is_correct.is_(True))
    )
    return _por_periodo(q, GameAttempt.created_at, periodos)


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


def _n_mio(player) -> Novedad | None:
    """Lo único que esta pantalla dice sobre LA PERSONA que la está leyendo.

    Las seis candidatas de `vuelve` hablaban del mundo —reclutas, sorpasso,
    altas, derivadas, universo, última alta— y ninguna de quién abre la app: a
    los dos días de estar en producción, el reclamo fue exactamente ese. Alguien
    que vuelve leía tres hechos sobre los demás y nada sobre lo suyo.

    **Lo acumulado y no lo de hoy.** En esta rama lo de hoy es cero por
    definición —si no, sería `sigue`— y «hoy resolviste 0» es justo el renglón
    que la ramificación por contador existe para no escribir.

    Y un total y no un puesto: el puesto puede haber BAJADO mientras no estaba,
    y esta pantalla no señala pérdidas (ver la cabecera). Lo que lleva resuelto
    no baja nunca.
    """
    n = int(player.exercises_correct or 0)
    if n <= 0:
        return None
    texto = ("Llevás 1 derivada resuelta." if n == 1
             else f"Llevás {miles(n)} derivadas resueltas.")
    return Novedad("mio", texto, "💪", 95)


def _n_reclutas(db, player) -> Novedad | None:
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


_ALTAS = {
    "hoy": "Hoy llegaron {n} estudiantes",
    "semana": "Esta semana llegaron {n} estudiantes",
    "mes": "Este mes llegaron {n} estudiantes",
}


def _n_altas(db, uni, inicio_del_dia, ahora, puntaje, salvo_id=None) -> Novedad | None:
    """Cuántos estudiantes llegaron, en el período más corto que alcance.

    Con universidad habla de la suya; si la suya no llega al mínimo ni en el
    mes —o no se sabe cuál es—, habla de todo el juego.

    **La pantalla lo llama siempre sin universidad** (ver `construir`). Con la
    sigla, «Esta semana llegaron 97 estudiantes de la UTN» no entraba en un
    renglón de la caja, y quedaba pegado a «La UTN va 2ª en el ranking»: dos
    renglones seguidos nombrando a la misma universidad. La sigla la lleva el
    del puesto, y este cuenta el juego entero. El camino con universidad queda
    porque es el mismo código y está chequeado; hoy no lo usa nadie.
    """
    periodos = _periodos(inicio_del_dia, ahora)
    for de_quien in ([uni, None] if uni else [None]):
        cuentas = _altas(db, de_quien, periodos, salvo_id)
        for periodo, _ in periodos:
            n = cuentas[periodo]
            if n < MIN_CONTEO:
                continue
            texto = _ALTAS[periodo].replace("{n}", miles(n))
            if de_quien:
                return Novedad(f"altas_{periodo}", texto + " de la {u0}.", "🎓",
                               puntaje, universities=[de_quien])
            return Novedad(f"altas_{periodo}", texto + ".", "🎓", puntaje)
    return None


# Debajo de esto no hay ranking que contar: «va 1ª de 1» es una tabla de una
# fila con un podio encima. Tres es el mínimo en el que el puesto significa algo.
MIN_TABLA = 3


def _n_puesto(db, uni) -> Novedad | None:
    p = _puesto(db, uni)
    if p is None or p[1] < MIN_TABLA:
        return None
    return Novedad("uni_puesto", f"La {{u0}} va {p[0]}ª en el ranking.",
                   "🏆", 80, universities=[uni])


_DERIVADAS = {"hoy": "hoy", "semana": "esta semana", "mes": "este mes"}


def _n_derivadas(db, inicio_del_dia, ahora) -> Novedad | None:
    periodos = _periodos(inicio_del_dia, ahora)
    cuentas = _derivadas(db, periodos)
    for periodo, _ in periodos:
        n = cuentas[periodo]
        if n >= MIN_CONTEO:
            return Novedad(
                "derivadas",
                f"Se resolvieron {miles(n)} derivadas {_DERIVADAS[periodo]}.",
                "🧩", 40)
    return None


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
        # dos drives —que esto está vivo, y que su gente ya está adentro—.
        #
        # Hubo un renglón más, «La última persona se sumó hace N minutos», que
        # era el que decía «ahora mismo». Se sacó el 02/10 por decisión de
        # producto: sin universidad conocida esta rama da dos renglones y no
        # tres, y está bien que así sea.
        #
        # Y hubo dos totales —«Ya hay N personas de la UTN jugando», «Ya somos
        # N en M universidades»— que se fueron el mismo día: los conteos hablan
        # de un período, no de un acumulado.
        candidatas += [_n_altas(db, None, inicio_del_dia, ahora, 95, player.id)]
        if uni:
            candidatas += [_n_puesto(db, uni)]
        candidatas += [_n_derivadas(db, inicio_del_dia, ahora)]
        saludo, titulo, modo = "¡Bienvenido!", "Lo que está pasando", "primera"
    else:
        # El propio va PRIMERO entre los que hablan de la persona —debajo de los
        # reclutas, que también son suyos y además son XP recién llegada— y por
        # encima de todo lo que habla del mundo.
        candidatas += [_n_reclutas(db, player), _n_mio(player)]
        if uni:
            candidatas += [_n_sorpasso(db, uni, desde)]
        candidatas += [
            _n_altas(db, None, inicio_del_dia, ahora, 70, player.id),
            _n_derivadas(db, inicio_del_dia, ahora),
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
