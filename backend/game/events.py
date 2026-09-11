"""Historial de eventos del juego — qué merece ser noticia y cómo se cuenta.

Las líneas las escribe SOLO el sistema —ninguna la escribe un usuario— pero no
viven solas: el panel del chat las intercala con lo que dice la gente, en una
sola lista (web/.../chat-panel.tsx). O sea que cada línea de más acá es un
mensaje que allá se pierde, y por eso el ruido es EL problema del módulo. Cuatro
cosas lo frenan:

  · **Umbrales.** Una racha de tres no es noticia; una de diez sí. Entrar al
    top 10 lo es; ganar diez puestos en el fondo de la tabla no, porque abajo
    está todo amontonado y diez puestos son dos respuestas.
  · **`dedupe_key`.** El hito de racha 25 de alguien se cuenta UNA vez, no en
    cada respuesta que lo mantenga. Lo mismo el registro, o el aviso de que una
    universidad viene pisándole los talones a otra.
  · **Una línea por persona.** Lo que ningún umbral puede ver: cinco hechos
    DISTINTOS de la misma persona en veinte minutos son cinco líneas, cada una
    cumpliendo su regla. El freno está en `_publicar`, mira a la persona y no al
    hecho, y elige la noticia más fuerte en vez de la primera que disparó.
  · **Solo gente real.** Los jugadores sembrados mueven el ranking (ver
    simulation.py) pero no generan eventos con nombre y apellido: que un número
    suba es una cosa, y afirmar "@fulano pasó a doce personas" cuando @fulano no
    existe es otra bastante peor. Los eventos de UNIVERSIDAD sí los incluyen,
    porque ahí lo que se afirma es un agregado, que es cierto.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from models import GameEvent, GamePlayer, GameSimState
from universities import article_for

from . import elo, ranking

# Cuántas líneas trae el feed de arranque: lo que llena la primera pantalla con
# margen para scrollear un poco antes de tener que pedir más.
FEED_LIMIT = 40

# Y cuánto se puede pedir de una sola vez. Es el techo de `limit`, no su valor:
# el panel pide de a poco y para atrás (ver `before_id`), pero nada de eso puede
# terminar en un `SELECT` sin freno si algún día alguien manda `limit=100000`.
MAX_LIMIT = 100

# Los cortes del ranking que son noticia al ENTRAR.
#
# Reemplazan a la escalada por puestos («pasó a 17 personas de una»), que era el
# 83% del feed: 609 de 731 eventos en un día de producción, y 33 de las últimas
# 40 líneas —o sea la primera pantalla entera— cubriendo veintiocho minutos.
# Todo lo demás que el juego tiene para contar vivía menos de media hora.
#
# El umbral viejo era barato por una razón estructural y no por estar mal
# elegido: en el fondo de la tabla la gente está amontonada, así que la mediana
# de una escalada eran diez puestos y la mitad no llegaba a diez. Pasar a diez
# personas que tienen 20 XP no es una hazaña, es aritmética.
#
# Sin el 1: ese es `lead`, que ya tiene su propia frase y su propia corona.
CORTES_DEL_RANKING = (3, 10, 25, 50)

# Y los de adentro de la universidad. Solo dos, y no un top 10: en una casa de
# estudios de doce jugadores el top 10 son casi todos, que es el mismo problema
# que `MULTIPLO_DEL_CORTE` resuelve para el ranking global.
CORTES_DE_UNIVERSIDAD = (1, 3)

# Cuánta gente tiene que competir para que un corte signifique algo: el doble del
# corte. Entrar al top 50 con 51 jugadores en la tabla es «no sos el último», y
# anunciarlo es exactamente el ruido que este módulo existe para frenar. Con el
# doble, el corte deja afuera por lo menos a la mitad del juego.
MULTIPLO_DEL_CORTE = 2

# Cuántos jugadores necesita una universidad para que su podio sea un podio.
#
# Escrito acá y no importado de game/boosts.py —donde la misma regla se llama
# `MIN_PLAYERS_RANKED`— porque boosts importa events: traerlo al revés cierra el
# ciclo. Es el mismo caso que `_SOURCE_AFORO`, y como aquel, el check verifica
# que los dos digan lo mismo. Sin el piso, «@fulano es el número 1 de la UNR»
# sale con un solo jugador en la UNR, y eso no es un logro: es una tautología.
MIN_JUGADORES_UNI = 10

# Hitos de racha que se cuentan. No es "cada 5": una racha de 5 la tiene
# cualquiera, y el feed se llenaría de rachas.
STREAK_MILESTONES = (10, 25, 50, 100, 250)

# Dos universidades "se vienen pisando" cuando las separa menos de esto, en
# proporción de la experiencia de la de adelante.
#
# Es el MISMO número que `UNI_PASS_MARGEN`, y no por casualidad: la banda de
# disputa es exactamente la zona donde el sobrepaso todavía no se puede afirmar.
# Por encima hay alguien adelante y se cuenta el sobrepaso; por debajo están
# empatadas y lo que se cuenta es que están empatadas.
UNI_CLOSE_RATIO = 0.02

# Y dejan de venirse pisando recién con el doble y medio de eso.
#
# Dos umbrales y no uno porque el aviso es una TRANSICIÓN: se cuenta al ENTRAR a
# la banda, no mientras dure. Con un solo número, un par parado en el 2,0% entra
# y sale con cada barrido y "entró" vuelve a valer una línea por tick — el mismo
# ruido con otro nombre.
UNI_CLOSE_SALIDA = 0.05

# El piso de repetición del aviso, y ahora es del PAR y no de cada dirección.
#
# Eran treinta minutos por dirección, o sea una línea cada quince: la clave
# llevaba el sentido (`close:{abajo}:{arriba}`), así que un par que se pasa de
# ida y de vuelta tenía DOS claves corriendo sus ventanas por separado. Medido en
# producción, eso fue 43 avisos en 54 horas contra UN sobrepaso real, con los dos
# sentidos del mismo par en la base.
#
# Seis horas, y no es esto lo que frena el ruido —de eso se ocupa la transición—:
# es la red por si la transición falla.
UNI_CLOSE_COOLDOWN_MINUTES = 6 * 60

# Lo mismo para el sobrepaso. Compartía la ventana del aviso de arriba, que ya
# era confuso cuando las dos valían treinta y sería un error el día que una de
# las dos cambie.
UNI_PASS_COOLDOWN_MINUTES = 6 * 60

# Cuánto dura la corona antes de que un puntero nuevo vuelva a ser noticia.
#
# La clave es del HECHO y no de cada persona (ver `_puntero_es_noticia`), así que
# esta ventana la comparten todos: tres cambios de mano en la misma tarde son una
# línea, no tres.
LEAD_COOLDOWN_MINUTES = 180

# Los eventos viejos no se muestran ni sirven; se barren en el mismo tick que
# mueve la simulación.
PRUNE_DAYS = 7

# Cuánto tarda un corte del ranking en volver a ser noticia para la misma
# persona.
#
# Con ventana y no «una sola vez para siempre»: caerse del top 10 y volver tres
# semanas después es una noticia de verdad, y el ping-pong de la misma tarde no
# lo es. Atado a `PRUNE_DAYS` a propósito —la deduplicación se resuelve mirando
# la tabla, así que una ventana más larga que lo que se guarda no se cumpliría y
# nadie se enteraría.
DEDUPE_TOP_MINUTES = PRUNE_DAYS * 24 * 60

# ── Una línea por persona, y que sea la que vale ──────────────────────────────

# Cuánto tiene que pasar entre dos líneas del feed SOBRE LA MISMA PERSONA.
#
# No es un umbral más: es el freno al problema que NINGÚN umbral puede ver. Cada
# evento por separado obedece su regla —es una entrada y no un estado, el hito se
# cuenta una vez— y aun así una sesión de veinte minutos produce cinco líneas,
# porque son cinco hechos DISTINTOS de la misma persona. Medido en producción:
# alguien puso 5 líneas en un día (top 50, top 25, racha 25, racha 50 y racha
# 100), otro 6, y entre cuatro personas armaron 20 de los 47 eventos del día que
# no eran de universidad — contra 38 mensajes de gente en el mismo rato.
#
# Veinte minutos y no una hora: una sesión de juego dura menos que eso, así que
# la ventana cubre la sesión entera —que es la unidad de ruido— sin tragarse la
# sesión de la tarde, que sí es otra noticia.
COOLDOWN_PERSONA_MINUTES = 20

# Cuánto pesa cada noticia. Es lo que decide cuál de las cinco cosas que puede
# disparar una misma respuesta es LA línea.
#
# Números y no un orden por `kind`, porque la fuerza depende del CORTE: entrar al
# top 10 del juego entero pesa más que ser el número 1 de una universidad de
# doce, pero ser el número 1 de tu universidad pesa más que entrar al top 50 del
# juego. Un ranking por tipo no puede decir eso.
#
# Que la racha de 100 pese más que entrar al top 25 es una opinión, no un dato.
# Está escrita en un solo lugar y se cambia sin tocar una línea de lógica; lo que
# el check fija son las relaciones que importan, no los números.
FUERZA_LEAD = 100
FUERZA_SIGNUP = 95
FUERZA_TOP = {3: 90, 10: 80, 25: 60, 50: 50}
FUERZA_UNI_TOP = {1: 70, 3: 55}
FUERZA_STREAK = {10: 30, 25: 45, 50: 58, 100: 75, 250: 85}
FUERZA_LEVEL = 40

# Lo que es noticia pase lo que pase: el puntero nuevo, la entrada al top 3 y la
# racha de 250. Las tres son raras —cinco, dos y cero por día en producción— y
# ninguna es parte de una escalera, que es lo que las hace seguras como
# excepción. Sin este piso, alguien que sube de nivel y tres minutos después
# llega al número 1 del juego pierde la noticia más grande que el juego tiene.
FUERZA_INTERRUMPE = 85

# Y lo que alcanza para MEJORAR lo ya dicho.
#
# Sin este segundo número el enfriamiento no frena una escalera: una escalera es
# por definición creciente, así que "más fuerte que lo último" la deja pasar casi
# entera (50 → 60 → 45 → 58 → 75 serían tres líneas y no dos). Con un salto de
# 25, de la escalera medida quedan la entrada y el remate, y se caen los tres
# escalones del medio.
#
# El techo que esto pone es duro y se puede contar: partiendo del piso (30) hay
# lugar para 30, 55, 80 y nada más — o sea TRES líneas por ventana en el peor
# caso imaginable, más el puntero.
SALTO_PARA_MEJORAR = 25

EMOJI = {
    "boost": "☕",
    "signup": "🎓",
    "referral": "🪖",
    "top": "🚀",
    "uni_top": "🏆",
    "streak": "🔥",
    "lead": "👑",
    "level": "⚡",
    "uni_pass": "🏛️",
    "uni_close": "👀",
}


@dataclass(frozen=True)
class EventView:
    id: int
    kind: str
    text: str
    emoji: str
    actor_alias: str | None
    actor_level: int | None
    actor_b_alias: str | None
    universities: list[str]
    university: str | None
    university_b: str | None
    player_id: int | None
    seconds_ago: int


def _now() -> datetime:
    return datetime.utcnow()


def emit(
    db: Session,
    kind: str,
    text: str,
    actor_alias: str | None = None,
    actor_level: int | None = None,
    actor_b_alias: str | None = None,
    player_id: int | None = None,
    university: str | None = None,
    university_b: str | None = None,
    dedupe_key: str | None = None,
    dedupe_minutes: int | None = None,
    strength: int | None = None,
    now: datetime | None = None,
) -> GameEvent | None:
    """Registra un evento. Devuelve None si la clave de deduplicación ya se usó.

    `text` viene con marcadores en vez de con los nombres puestos: `{a}` para el
    protagonista, `{b}` para un segundo protagonista (si lo hay) y `{u0}`/`{u1}`
    para las siglas. El cliente los reemplaza por la tag de la universidad y por
    el nombre pintado con el color de su nivel — con la oración ya resuelta eso
    no se puede hacer sin adivinar dónde empieza cada cosa.

    `dedupe_minutes=None` significa "una sola vez para siempre" (un registro, un
    hito de racha). Con un número, la clave se puede volver a usar pasada esa
    ventana (una universidad que vuelve a acercarse a otra).

    `strength` es cuánto pesa la noticia, y se guarda para que el freno por
    persona pueda comparar la línea siguiente contra esta. Esta función NO aplica
    ese freno a propósito: es la que usan `on_boost`, `on_aforo` y
    `sync_universities`, que no son de nadie y no deben esperar turno. Quien
    frena es `_publicar`.
    """
    now = now or _now()
    if dedupe_key is not None:
        q = db.query(GameEvent.id).filter(GameEvent.dedupe_key == dedupe_key)
        if dedupe_minutes is not None:
            q = q.filter(GameEvent.created_at > now - timedelta(minutes=dedupe_minutes))
        if q.first() is not None:
            return None

    event = GameEvent(
        kind=kind,
        text=text,
        emoji=EMOJI.get(kind, "•"),
        actor_alias=actor_alias,
        actor_level=actor_level,
        actor_b_alias=actor_b_alias,
        player_id=player_id,
        university=university,
        university_b=university_b,
        dedupe_key=dedupe_key,
        strength=strength,
        created_at=now,
    )
    db.add(event)
    # El flush es lo que hace que la deduplicación funcione dentro de una misma
    # transacción: las sesiones del proyecto van con `autoflush=False`
    # (database.py), así que sin esto la fila recién agregada es invisible para
    # la consulta del `emit` siguiente y el mismo hecho entra dos veces —una sola
    # respuesta puede disparar racha y nivel juntos, y `/player` llama a
    # `on_signup` en cada arranque de sesión.
    #
    # No cubre dos transacciones simultáneas: para eso haría falta un UNIQUE. No
    # vale la pena — lo peor que pasa es una línea repetida en un feed.
    db.flush()
    return event


def recent(
    db: Session,
    after_id: int = 0,
    limit: int = FEED_LIMIT,
    before_id: int = 0,
) -> list[EventView]:
    """Los últimos eventos, del más nuevo al más viejo.

    Con `after_id` devuelve solo lo que el cliente todavía no vio, que es lo que
    hace que el sondeo cueste casi nada cuando no pasa nada.

    Con `before_id` mira para el otro lado: lo que hay MÁS VIEJO que esa línea.
    Es lo que pide el panel al llegar arriba de todo scrolleando. Los dos son
    excluyentes —son dos direcciones, no dos filtros— y el llamador elige uno.

    El tope se acota contra `MAX_LIMIT` y no contra `FEED_LIMIT`: aquel es el
    tamaño de la primera pantalla, este es lo máximo que se puede pedir de una.
    Mientras fueron el mismo número, pedir más de cuarenta era imposible aunque
    el parámetro existiera.
    """
    now = _now()
    q = db.query(GameEvent)
    if before_id:
        q = q.filter(GameEvent.id < before_id)
    elif after_id:
        q = q.filter(GameEvent.id > after_id)
    rows = q.order_by(GameEvent.id.desc()).limit(max(1, min(limit, MAX_LIMIT))).all()
    return [
        EventView(
            id=r.id,
            kind=r.kind,
            text=r.text,
            emoji=r.emoji,
            actor_alias=r.actor_alias,
            actor_level=r.actor_level,
            actor_b_alias=r.actor_b_alias,
            # En el mismo orden en que aparecen {u0} y {u1} en el texto.
            universities=[u for u in (r.university, r.university_b) if u],
            university=r.university,
            university_b=r.university_b,
            player_id=r.player_id,
            # Segundos y no un instante, por la misma razón que en boosts.py:
            # los datetime del proyecto son naive UTC y compararlos contra el
            # reloj del cliente es pedir un bug de zonas horarias.
            seconds_ago=max(0, int((now - r.created_at).total_seconds())),
        )
        for r in rows
    ]


# --- emisores ---------------------------------------------------------------

def _real(player: GamePlayer) -> bool:
    """¿Es una persona? Los sembrados no generan eventos con nombre propio."""
    return not bool(player.is_bot)


def on_signup(db: Session, player: GamePlayer) -> None:
    """Alguien dejó de ser invitado y se registró.

    Si entró por el link de alguien (`referred_by`, ver game/referrals.py), el
    anuncio es del RECLUTADOR y no del genérico: "{a} reclutó a {b}" cuenta más
    que "{b} se sumó al juego" —nombra el mérito de traerlo, no solo el hecho de
    haber llegado— así que reemplaza al signup de siempre en vez de sumarse a él.
    Sin reclutador, sigue siendo el anuncio genérico.

    **El registro no espera turno.** Es el único emisor de persona que llama a
    `emit` derecho y no pasa por `_publicar`: son seis por día contando reclutas,
    es la única línea que dice que el juego tiene gente NUEVA, y —con un puñado
    de personas activas— de las pocas que no habla de alguien que ya está en el
    chat.

    Lo que sí hace es ANCLAR el enfriamiento: la fila lleva `player_id`, así que
    `_fuerza_reciente` la ve y eso evita el combo «se sumó @fulano» + «@fulano
    entró al top 50» treinta segundos después. Ojo con el reclutamiento: ahí el
    `player_id` es del RECLUTADOR, así que quien trae tres personas en diez
    minutos produce una línea y no tres. Es deliberado, y es el mismo criterio.
    """
    if not _real(player):
        return
    if player.referred_by is not None:
        referente = db.query(GamePlayer).filter(GamePlayer.id == player.referred_by).first()
        if referente is not None:
            emit(
                db,
                "referral",
                "{a} reclutó a {b}.",
                actor_alias=f"@{referente.alias}",
                actor_level=elo.level_of(referente.theta),
                actor_b_alias=f"@{player.alias}",
                # El protagonista del festejo es quien trajo, no quien llegó.
                player_id=referente.id,
                university=referente.university,
                # Una sola vez por RECLUTA, para siempre: el link guest→user es
                # idempotente y se puede volver a llamar.
                dedupe_key=f"signup:{player.id}",
                strength=FUERZA_SIGNUP,
            )
            return
    emit(
        db,
        "signup",
        "{a} se sumó al juego.",
        actor_alias=f"@{player.alias}",
        actor_level=elo.level_of(player.theta),
        player_id=player.id,
        university=player.university,
        # Una sola vez por jugador, para siempre: el link guest→user es
        # idempotente y se puede volver a llamar.
        dedupe_key=f"signup:{player.id}",
        strength=FUERZA_SIGNUP,
    )


def on_aforo(
    db: Session,
    university: str,
    personas: int,
    multiplier: float,
    horas: int,
) -> None:
    """Una universidad llegó al aforo del día y se ganó el empuje.

    Sin `actor_alias`: no lo hizo nadie en particular, lo hicieron diez. La
    frase nombra a la universidad y no a una persona, que es exactamente la
    diferencia con `on_boost` — ahí hay alguien que puso plata y merece que se
    lo vea.
    """
    art = article_for(university).capitalize()
    mult = f"×{multiplier:.1f}".replace(".", ",")
    reloj = "una hora" if horas == 1 else f"{horas} horas"
    emit(
        db,
        "boost",
        f"{art} {{u0}} llegó a {personas} personas nuevas hoy: {mult} por {reloj}. 🎉",
        university=university,
    )


def on_boost(
    db: Session,
    university: str | None,
    cafecitos: int,
    multiplier: float,
    donor_name: str | None,
) -> None:
    """Alguien invitó cafecitos. `university=None` es el empuje global."""
    quien = donor_name.strip() if donor_name and donor_name.strip() else "Alguien"
    cuantos = "un cafecito" if cafecitos == 1 else f"{cafecitos} cafecitos"
    mult = f"×{multiplier:.1f}".replace(".", ",")
    if university is None:
        # La donación que no se pudo atribuir no se pierde: la cobra todo el
        # mundo, y el feed lo cuenta como lo que es, un regalo para todos.
        emit(
            db,
            "boost",
            f"{{a}} invitó {cuantos} para TODOS: {mult} para todo el juego.",
            actor_alias=quien,
        )
        return
    art = article_for(university)
    emit(
        db,
        "boost",
        f"{{a}} invitó {cuantos} para {art} {{u0}}: {mult} para toda la universidad.",
        # Sin nivel a propósito: quien dona escribe su nombre en Cafecito y no es
        # necesariamente un jugador, así que el nombre va destacado pero sin el
        # color de un nivel que no le corresponde.
        actor_alias=quien,
        university=university,
    )


def _de(university: str) -> str:
    """«de la UBA», «del ITBA».

    No se puede armar pegando `article_for` detrás de un "de": «de el ITBA» no
    existe en castellano, y la contracción es justamente lo que el catálogo no
    tiene por qué saber.
    """
    return "del" if article_for(university) == "el" else "de la"


@dataclass(frozen=True)
class _Candidato:
    """Una línea que PODRÍA salir. La arma el emisor y la elige `_publicar`."""

    fuerza: int
    kind: str
    text: str
    dedupe_key: str
    actor_level: int
    university: str | None = None
    dedupe_minutes: int | None = None


def _fuerza_reciente(db: Session, player_id: int, now: datetime) -> int | None:
    """La noticia más fuerte que se contó de esta persona en la ventana.

    `None` significa "no se contó ninguna", que NO es lo mismo que cero.

    Se mira `player_id` y no el alias: es la columna que ya está indexada y la
    que sobrevive a un cambio de nombre. Y tiene un efecto de borde que es
    exactamente el que se quiere: `boost`, `uni_pass` y `uni_close` tienen
    `player_id` en NULL, así que ni cuentan para el enfriamiento de nadie ni lo
    sufren. No son de nadie.

    El MAX y no la última: dentro de una ventana la fuerza solo puede subir —es
    lo que `_publicar` garantiza— así que las dos coinciden; pero escrito como
    MAX la regla sigue valiendo aunque alguien agregue mañana un emisor que no
    pase por acá.

    Las filas anteriores a la migración 0077 tienen `strength` en NULL y cuentan
    como cero, o sea que frenan poco. Es el lado seguro del error —el feed se
    parece al de antes, no a uno mudo— y se resuelve solo en una semana
    (`PRUNE_DAYS`).
    """
    corte = now - timedelta(minutes=COOLDOWN_PERSONA_MINUTES)
    cuantas, maxima = (
        db.query(func.count(GameEvent.id), func.max(GameEvent.strength))
        .filter(GameEvent.player_id == player_id, GameEvent.created_at > corte)
        .first()
    )
    if not cuantas:
        return None
    return int(maxima or 0)


def _publicar(
    db: Session,
    player: GamePlayer,
    candidatos: list[_Candidato],
    now: datetime,
) -> GameEvent | None:
    """De todo lo que esta respuesta pudo volver noticia, publica UNA cosa.

    Dos reglas, y las dos hacen falta:

      · **Dentro de una respuesta gana la más fuerte, no la primera.** Antes el
        orden lo decidía el orden en que estaban ESCRITAS las líneas de
        `on_answer` —puntero, podio, racha, nivel— así que subir de nivel y
        entrar al top 10 en la misma respuesta salían las dos, encabezadas por la
        que estaba escrita más arriba del archivo.
      · **Entre respuestas hay enfriamiento.** Si ya se habló de esta persona en
        los últimos `COOLDOWN_PERSONA_MINUTES`, la línea nueva se calla salvo que
        sea de las que interrumpen o que MEJORE lo dicho por
        `SALTO_PARA_MEJORAR`.

    Callarse **no quema la clave**: la deduplicación se resuelve mirando la tabla
    y la fila no llegó a existir, así que el hito sigue disponible si la
    condición vuelve a darse. Para una racha, en la práctica, no vuelve —el combo
    ya avanzó— y ESO es lo buscado: de una escalera queda el escalón más alto que
    llegó a tiempo, no los cinco.

    El recorrido va de más fuerte a más débil y corta en la primera que `emit`
    acepta: si la más fuerte ya se contó esta semana (`dedupe_key`), la que sigue
    todavía puede ser noticia.
    """
    if not candidatos:
        return None
    anterior = _fuerza_reciente(db, player.id, now)
    for cand in sorted(candidatos, key=lambda c: c.fuerza, reverse=True):
        if anterior is not None and not (
            cand.fuerza >= FUERZA_INTERRUMPE
            or cand.fuerza >= anterior + SALTO_PARA_MEJORAR
        ):
            # Las que siguen son todavía más débiles: no hace falta probarlas.
            return None
        evento = emit(
            db,
            cand.kind,
            cand.text,
            actor_alias=f"@{player.alias}",
            actor_level=cand.actor_level,
            player_id=player.id,
            university=cand.university,
            dedupe_key=cand.dedupe_key,
            dedupe_minutes=cand.dedupe_minutes,
            strength=cand.fuerza,
            now=now,
        )
        if evento is not None:
            return evento
    return None


def _entrada_al_top(
    db: Session,
    player: GamePlayer,
    rank_before: int | None,
    rank_after: int | None,
) -> _Candidato | None:
    """«{a} entró al top N»: lo que reemplazó a la escalada por puestos.

    Tres reglas, y cada una tapa una forma distinta de volverlo ruido:

      · **Es una ENTRADA**, no un estado. Pide `rank_before > corte >= rank_after`,
        así que responder bien sentado adentro del top 10 no anuncia nada.
      · **Se cuenta el corte más alto y nada más.** Quien salta del puesto 150 al
        40 dice «entró al top 50», no además «al top 100»: es un solo hecho.
      · **El corte tiene que existir.** Con menos de `MULTIPLO_DEL_CORTE` × N
        compitiendo, entrar al top N no distingue a nadie. El COUNT sale una sola
        vez y solo cuando ya hubo un cruce, que es una de cada veinticinco
        respuestas correctas — medido en producción, 18 eventos por día contra
        470 respuestas.

    Devuelve un candidato en vez de emitir: cuál de todo lo que disparó esta
    respuesta llega al feed lo decide `_publicar`, que las ve a todas.
    """
    if rank_before is None or rank_after is None:
        return None
    compiten: int | None = None
    for corte in CORTES_DEL_RANKING:
        if not rank_before > corte >= rank_after:
            continue
        if compiten is None:
            compiten = ranking.cuantos_compiten(db)
        if compiten < corte * MULTIPLO_DEL_CORTE:
            # Los cortes siguientes son más grandes y piden todavía más gente,
            # así que si este no llega, ninguno llega.
            return None
        return _Candidato(
            fuerza=FUERZA_TOP[corte],
            kind="top",
            text=f"{{a}} entró al top {corte}.",
            actor_level=elo.level_of(player.theta),
            # La sigla viaja aunque el texto no la nombre: es lo que hace que la
            # línea se resalte para los compañeros de esa universidad.
            university=player.university,
            dedupe_key=f"top:{player.id}:{corte}",
            dedupe_minutes=DEDUPE_TOP_MINUTES,
        )
    return None


def _entrada_al_podio(
    db: Session,
    player: GamePlayer,
    rank_before: int | None,
    rank_after: int | None,
) -> _Candidato | None:
    """«{a} es el número 1 de la UBA» / «entró al top 3 del ITBA».

    La versión chica de la de arriba, y la que más tracción tiene: el ranking
    general lo encabezan siempre los mismos, pero el podio de una universidad se
    disputa entre gente que se conoce.

    El piso de `MIN_JUGADORES_UNI` es lo único que la separa de ser una
    tautología — hoy lo pasan tres casas de estudios de siete.
    """
    scope = ranking.scope_de_universidad(player)
    if scope is None or rank_before is None or rank_after is None:
        return None
    uni = (player.university or "").strip()
    for corte in CORTES_DE_UNIVERSIDAD:
        if not rank_before > corte >= rank_after:
            continue
        if ranking.cuantos_compiten(db, scope) < MIN_JUGADORES_UNI:
            return None
        texto = (
            f"{{a}} es el número 1 {_de(uni)} {{u0}}."
            if corte == 1
            else f"{{a}} entró al top {corte} {_de(uni)} {{u0}}."
        )
        return _Candidato(
            fuerza=FUERZA_UNI_TOP[corte],
            kind="uni_top",
            text=texto,
            actor_level=elo.level_of(player.theta),
            university=uni,
            # La sigla entra en la clave: quien se cambia de universidad entra a
            # un podio nuevo, y ese sí es un hecho nuevo.
            dedupe_key=f"unitop:{player.id}:{uni}:{corte}",
            dedupe_minutes=DEDUPE_TOP_MINUTES,
        )
    return None


def _puntero_es_noticia(db: Session, player: GamePlayer) -> bool:
    """¿Vale la pena contar que hay puntero nuevo?

    La ventana sola no alcanza y la identidad sola tampoco:

      · **Ventana global.** La clave era `lead:{player_id}`, o sea una POR
        PERSONA: dos que se pasan el 1 de ida y de vuelta tienen dos claves y
        cada una corre su propia hora. En producción eso fueron cinco líneas en
        un día por una disputa entre dos. Con la clave del HECHO —`"lead"` a
        secas— tres cambios de puntero en la misma tarde son una línea.
      · **Y que no sea el mismo de la vez pasada.** Sin esto, A toma el 1, B se
        lo saca, A lo recupera pasada la ventana, y el feed anuncia a A dos veces
        sin haber nombrado nunca a B. Para quien lee, el puntero no cambió.

    La ventana la sigue aplicando `emit` con `dedupe_key="lead"` —que además
    cubre dos transacciones simultáneas, cosa que esta función no—; acá vive solo
    la identidad.
    """
    ultimo = (
        db.query(GameEvent)
        .filter(GameEvent.kind == "lead")
        .order_by(GameEvent.id.desc())
        .first()
    )
    return ultimo is None or ultimo.player_id != player.id


def on_answer(
    db: Session,
    player: GamePlayer,
    rank_before: int | None,
    rank_after: int | None,
    level_before: int,
    level_after: int,
    uni_rank_before: int | None = None,
    uni_rank_after: int | None = None,
) -> None:
    """Todo lo que una sola respuesta correcta puede volver noticia — y de todo
    eso, UNA línea.

    Los cuatro puestos llegan calculados de afuera y no se leen acá: el router ya
    los cuenta para armar la respuesta del endpoint, y volver a contarlos sería
    pagar los mismos COUNT dos veces en el camino más caliente del juego. Los de
    universidad vienen en None cuando la persona no cargó ninguna.

    Lo que cambió respecto de la versión que emitía a medida que encontraba: acá
    se JUNTAN los candidatos y elige `_publicar`. El comentario que decía que el
    podio de la universidad «va aparte y NO entra en el elif» describía una
    decisión que ya no se toma acá: sigue siendo otra tabla y otra noticia, pero
    ahora COMPITE, así que quien llega al número 1 del juego entero tiene eso
    contado y no además que llegó al de su casa de estudios.

    Costo en el camino caliente: cero. Salvo que haya por lo menos un candidato
    —una de cada catorce respuestas correctas, medido— esto sale por el
    `if not candidatos` de `_publicar` sin tocar la base.
    """
    if not _real(player):
        return

    now = _now()
    nivel = elo.level_of(player.theta)
    candidatos: list[_Candidato] = []

    # Puntero nuevo, que es la noticia más grande que el juego tiene.
    if rank_after == 1 and (rank_before or 0) > 1:
        if _puntero_es_noticia(db, player):
            candidatos.append(
                _Candidato(
                    fuerza=FUERZA_LEAD,
                    kind="lead",
                    text="{a} es el nuevo número 1.",
                    actor_level=nivel,
                    university=player.university,
                    dedupe_key="lead",
                    dedupe_minutes=LEAD_COOLDOWN_MINUTES,
                )
            )
    else:
        entrada = _entrada_al_top(db, player, rank_before, rank_after)
        if entrada is not None:
            candidatos.append(entrada)

    podio = _entrada_al_podio(db, player, uni_rank_before, uni_rank_after)
    if podio is not None:
        candidatos.append(podio)

    if player.current_combo in STREAK_MILESTONES:
        candidatos.append(
            _Candidato(
                fuerza=FUERZA_STREAK[player.current_combo],
                kind="streak",
                text=f"{{a}} lleva {player.current_combo} seguidas sin errar.",
                actor_level=nivel,
                university=player.university,
                dedupe_key=f"streak:{player.id}:{player.current_combo}",
            )
        )

    if level_after > level_before:
        candidatos.append(
            _Candidato(
                fuerza=FUERZA_LEVEL,
                kind="level",
                text="{a} desbloqueó derivadas más difíciles.",
                actor_level=level_after,
                university=player.university,
                dedupe_key=f"level:{player.id}:{level_after}",
            )
        )

    _publicar(db, player, candidatos, now)


# --- universidades -------------------------------------------------------------

# Cuánto tiene que superar una universidad a la otra para que el sobrepaso sea
# noticia y no ruido de redondeo. Un 2% de la experiencia de la de adelante: por
# debajo están empatadas, y anunciar un empate como sobrepaso es lo que convierte
# al feed en algo que se ignora.
#
# Vale el mismo número que `UNI_CLOSE_RATIO`, y no conviene bajarlos a una sola
# constante: son dos preguntas distintas que hoy se contestan con el mismo corte
# —cuándo se puede AFIRMAR que una pasó a la otra, y cuándo vale contar que están
# pegadas— y con un solo nombre mover una movería la otra sin que nadie lo pida.
UNI_PASS_MARGEN = 0.02

# La versión del formato de la foto que vive en `GameSimState.uni_order_json`:
#
#   {"v": 2,
#    "order": ["UNSAM", "UNC", "UBA", "UNLP", "UTN"],
#    "lead":  {"UBA|UNLP": "UBA", "UNC|UNSAM": "UNSAM"},
#    "close": ["UBA|UNLP"]}
#
# `lead` y `close` se llavean por PAR NO ORDENADO —las dos siglas alfabéticas
# unidas por "|"— y ahí está el arreglo del ping-pong: «la UNC viene atrás de la
# UNSAM» y «la UNSAM viene atrás de la UNC» son el MISMO hecho, y guardarlos como
# dos claves distintas era el bug entero.
#
# La versión 1 era una lista pelada de siglas y se sigue leyendo: si lo que hay
# es una lista, es `order` y NO HAY pares conocidos — que es distinto de "la foto
# dice que no había ninguno". Ese barrido guarda la foto nueva y no anuncia nada,
# que es el mismo recaudo que `if not previous` ya tenía: sin él, el primer
# barrido después del deploy ve todos los pares como recién entrados y los
# anuncia de golpe.
#
# Volver atrás es inofensivo: el código viejo hace `enumerate` sobre lo que
# encuentra, no matchea ninguna sigla contra "v"/"order"/"lead"/"close", y no
# anuncia nada hasta que él mismo reescriba la foto en v1.
_FOTO_VERSION = 2


def _par(a: str, b: str) -> str:
    """La clave canónica de un par de universidades, sin dirección."""
    return "|".join(sorted((a, b)))


def _leer_foto(
    state: GameSimState,
) -> tuple[list[str], dict[str, str] | None, set[str] | None]:
    """(orden, quién iba adelante en cada par, qué pares estaban pegados).

    `None` en los dos últimos significa "no hay foto en el formato nuevo
    todavía", que no es lo mismo que "no había ningún par". Es la diferencia
    entre callarse un barrido y anunciar una ráfaga.
    """
    if not state.uni_order_json:
        return [], None, None
    try:
        data = json.loads(state.uni_order_json)
    except ValueError:
        return [], None, None
    if isinstance(data, list):  # la foto v1: una lista pelada de siglas
        return data, None, None
    return (
        list(data.get("order") or []),
        dict(data.get("lead") or {}),
        set(data.get("close") or []),
    )


def _standings_de_universidades(
    db: Session, min_calificados: int
) -> list[tuple[str, float]]:
    """(sigla, experiencia) de las universidades, de mayor a menor.

    **La MISMA experiencia que muestra la tabla del juego**: `sum(GamePlayer.xp)`
    con el filtro `ranking.RESOLVIO_ACA`, o sea la consulta de
    `router.py :: game_university_leaderboard` sin la parte del Elo. El feed
    anuncia sobrepasos, así que tiene que ordenar por algo que se pueda ir a
    mirar.

    Ordenaba por XP DE LA SEMANA, que no aparece en ninguna pantalla: ni la tabla
    por defecto (Elo promedio) ni su otra pestaña, «experiencia», que es esta
    misma suma. Lo que se midió en producción fue anunciar que la UNSAM estaba a
    nada de pasar a la UNC mientras la UNSAM encabezaba las DOS vistas que
    existen —82.296 de experiencia contra 76.116, y 1063 de Elo contra 1037—. Un
    aviso que contradice la pantalla no se lee como un matiz: se lee como que el
    juego está roto.

    Que la experiencia histórica se mueva despacio no es un defecto del criterio.
    Fue el argumento para irse a la semana —"la acumulada no cambia nunca, así
    que no habría sobrepaso que contar"— y es justo al revés: es lo que hace que
    un sobrepaso SEA una noticia en vez del temblor de una métrica que oscila. El
    día que la UNLP alcance a la UBA —3,7% de distancia cuando esto se escribió—
    va a haber una línea, y se va a poder verificar en la tabla.

    El piso se cuenta sobre los CALIFICADOS y no sobre todos, que es lo que
    `MIN_PLAYERS_RANKED` significa en boosts.py y en la tabla. Así las
    universidades de las que el feed habla son exactamente las que la tabla
    muestra arriba, y no las que manda apagadas al pie: es lo que deja afuera a
    las de un solo jugador, donde 233 contra 219 de experiencia dan un 6% de
    margen que no es una disputa sino aritmética.

    `ranking.CALIFICADO` y no un `case` propio, por lo mismo que `RESOLVIO_ACA`:
    quién está calificado se decide en un solo lugar (`elo.RAMP_UPDATES`), y con
    tres respuestas el theta todavía es ruido.

    Los sembrados NO se excluyen, igual que en la tabla. Lo que se afirma es un
    agregado y el número es exactamente el que está en pantalla.
    """
    rows = (
        db.query(
            GamePlayer.university,
            func.coalesce(func.sum(ranking.CALIFICADO), 0),
            func.coalesce(func.sum(GamePlayer.xp), 0),
        )
        .filter(
            GamePlayer.university.isnot(None),
            GamePlayer.university != "",
            ranking.RESOLVIO_ACA,
        )
        .group_by(GamePlayer.university)
        .all()
    )
    standings = [
        (uni, float(xp))
        for uni, calificados, xp in rows
        if int(calificados or 0) >= min_calificados and xp > 0
    ]
    standings.sort(key=lambda r: r[1], reverse=True)
    return standings


def sync_universities(db: Session, min_players: int, now: datetime | None = None) -> None:
    """Compara la tabla de universidades contra la foto anterior y cuenta lo que
    cambió: quién pasó a quién, y quién se le vino encima a quién.

    Se llama desde el tick de la simulación, que ya corre cada 10 s empujado por
    el tráfico — no hace falta ni worker ni cron.

    Las dos noticias son TRANSICIONES y no estados, y eso es lo que arregló el
    aviso más ruidoso que el feed llegó a tener: 43 líneas en 54 horas contra UN
    sobrepaso real, porque «está a nada de pasar» describía una situación que
    dura horas y se re-anunciaba cada media ventana.

      · **«le pasó a»** sale cuando cambia el líder CONFIRMADO de un par, y
        confirmado quiere decir adelante por más de `UNI_PASS_MARGEN`. Dentro de
        la banda se conserva el líder anterior.
      · **«está a nada de pasar a»** sale cuando un par ENTRA en la banda
        (`UNI_CLOSE_RATIO`), y no vuelve a salir hasta que primero se separen más
        de `UNI_CLOSE_SALIDA`.

    Que el líder se guarde POR PAR, y no como un orden, es lo que hace que el
    sobrepaso exista. La versión anterior lo detectaba solo en el barrido en que
    el orden se daba vuelta — y en ese instante el margen es ~0, así que el
    filtro del margen lo descartaba; en el barrido siguiente la foto ya coincidía
    con el orden nuevo y no se detectaba nunca más. Un sobrepaso ajustado no se
    anunciaba tarde: no se anunciaba.
    """
    now = now or _now()
    standings = _standings_de_universidades(db, min_players)
    order = [uni for uni, _ in standings]

    state = db.query(GameSimState).filter(GameSimState.id == 1).first()
    if state is None:
        return
    _previous, lider_antes, pegados_antes = _leer_foto(state)

    # Par por par. Con cinco universidades calificadas son diez pares, así que
    # recorrerlos todos sale gratis — y no hace falta cuidar la adyacencia: para
    # que B pase a A tiene que cruzarla, así que un sobrepaso entre no vecinas no
    # existe.
    lider_ahora: dict[str, str] = {}
    pegados_ahora: set[str] = set()
    sobrepasos: list[tuple[str, str]] = []
    entrantes: list[tuple[float, str, str]] = []

    for i, (arriba, xp_arriba) in enumerate(standings):
        if xp_arriba <= 0:
            continue
        for abajo, xp_abajo in standings[i + 1:]:
            par = _par(arriba, abajo)
            margen = (xp_arriba - xp_abajo) / xp_arriba
            previo = (lider_antes or {}).get(par)

            # Quién va adelante, con histéresis: adentro de la banda no se puede
            # afirmar nada, así que se conserva lo último que sí se pudo.
            if margen > UNI_PASS_MARGEN:
                lider_ahora[par] = arriba
                if previo is not None and previo != arriba:
                    sobrepasos.append((arriba, abajo))
            elif previo is not None:
                lider_ahora[par] = previo

            # Y la banda de disputa, que es exactamente la zona donde el
            # sobrepaso todavía no se puede afirmar.
            estaba = pegados_antes is not None and par in pegados_antes
            if margen <= UNI_CLOSE_RATIO or (estaba and margen <= UNI_CLOSE_SALIDA):
                pegados_ahora.add(par)
            if margen <= UNI_CLOSE_RATIO and not estaba:
                entrantes.append((margen, abajo, arriba))

    # La foto se guarda ACÁ, antes de cualquiera de los `return` que siguen. Si
    # se mueve abajo de uno, el barrido se queda sin referencia: el primero pasa
    # a ser siempre el primero, no se detecta nada nunca, y nada falla.
    state.uni_order_json = json.dumps(
        {
            "v": _FOTO_VERSION,
            "order": order,
            "lead": lider_ahora,
            "close": sorted(pegados_ahora),
        }
    )

    # Sin foto anterior no hay contra qué comparar. Un par que aparece por
    # primera vez —una universidad que recién cruza el piso de calificados—
    # queda anotado arriba sin anunciar nada, por lo mismo: `previo is None`.
    if lider_antes is None:
        return

    for gana, pierde in sobrepasos:
        # "la UNSAM le pasó a la UNL" / "el ITBA…": el artículo lo decide el
        # nombre completo de cada casa de estudios, no la sigla.
        a0, a1 = article_for(gana).capitalize(), article_for(pierde)
        emit(
            db,
            "uni_pass",
            f"{a0} {{u0}} le pasó a {a1} {{u1}} en experiencia.",
            university=gana,
            university_b=pierde,
            dedupe_key=f"pass:{_par(gana, pierde)}",
            dedupe_minutes=UNI_PASS_COOLDOWN_MINUTES,
            now=now,
        )

    # Las que ACABAN de venirse encima. Una sola por barrido, la más ajustada:
    # con el ranking parejo puede haber varias parejas entrando a la vez, y
    # medido en la base de desarrollo eso metía tres líneas iguales en un mismo
    # tick — el aviso deja de ser una noticia y tapa lo que sí lo es.
    if pegados_antes is None:
        return
    for _margen, abajo, arriba in sorted(entrantes)[:1]:
        a0, a1 = article_for(abajo).capitalize(), article_for(arriba)
        emit(
            db,
            "uni_close",
            f"{a0} {{u0}} está a nada de pasar a {a1} {{u1}} en experiencia.",
            university=abajo,
            university_b=arriba,
            # Del PAR, sin dirección: ida y vuelta son el mismo hecho. Con la
            # clave direccional un par que se pasaba de ida y de vuelta tenía DOS
            # ventanas corriendo en paralelo, o sea una línea cada quince minutos
            # mientras durara — que es de donde salieron las 43 en 54 horas.
            dedupe_key=f"close:{_par(abajo, arriba)}",
            dedupe_minutes=UNI_CLOSE_COOLDOWN_MINUTES,
            now=now,
        )


def prune(db: Session, now: datetime | None = None) -> int:
    """Barre lo viejo. Devuelve cuántas filas se fueron."""
    now = now or _now()
    return (
        db.query(GameEvent)
        .filter(GameEvent.created_at < now - timedelta(days=PRUNE_DAYS))
        .delete(synchronize_session=False)
    )
