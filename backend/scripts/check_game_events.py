"""Verifica el historial de eventos del minijuego.

Lo que importa acá no es que los eventos salgan, sino que NO salgan de más: el
panel del chat intercala estas líneas con lo que escribe la gente, así que cada
línea de más es un mensaje que se pierde. Casi todo lo que se chequea son los
frenos — umbrales, deduplicación, el presupuesto por persona, y la regla de que
los jugadores sembrados no aparecen con nombre y apellido.

**Ojo con el enfriamiento por persona al escribir un chequeo nuevo.** Dos líneas
seguidas del mismo jugador ya no salen las dos, así que un chequeo que quiera
medir OTRA cosa —la deduplicación, por ejemplo— tiene que sacarlo antes del
enfriamiento con `enfriar()`. Si no, pasa por el motivo equivocado y deja de ver
la regresión que fue escrito para atrapar.

Uso:
    python backend/scripts/check_game_events.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_events.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameEvent, GamePlayer, GameSimState  # noqa: E402
from game import events, ranking, simulation  # noqa: E402

Base.metadata.create_all(bind=database.engine)

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def fresh_player(db, alias, *, university=None, is_bot=False, combo=0, xp=0,
                 theta=0.0, n_updates=0, resueltas=None):
    # `resueltas` sigue a la XP por defecto: quien entra a la tabla de
    # universidades es quien resolvió acá, no quien tiene XP (ver
    # game/events.py :: _university_standings y game/router.py :: RESOLVIO_ACA),
    # porque la XP la puede subir un recluta sin que el reclutador haya derivado.
    # Los casos que necesitan a alguien con XP y cero resueltas lo piden
    # explícito.
    if resueltas is None:
        resueltas = 1 if xp > 0 else 0
    p = GamePlayer(
        alias=alias, university=university, is_bot=is_bot,
        current_combo=combo, xp=xp, theta=theta, n_updates=n_updates,
        exercises_correct=resueltas,
    )
    db.add(p)
    db.commit()
    return p


def enfriar(jugador) -> None:
    """Saca a alguien de su propio enfriamiento, corriendo sus líneas al pasado.

    El feed publica una sola línea por persona cada `COOLDOWN_PERSONA_MINUTES`
    (game/events.py :: _publicar). Un chequeo que quiera medir otro freno —la
    deduplicación de un hito, por ejemplo— tiene que llamar a esto primero, o lo
    que termina midiendo es el enfriamiento y pasa sin probar nada.
    """
    viejo = datetime.utcnow() - timedelta(minutes=events.COOLDOWN_PERSONA_MINUTES + 1)
    for e in db.query(GameEvent).filter(GameEvent.player_id == jugador.id).all():
        e.created_at = viejo
    db.commit()


def envejecer(kind: str, minutos: int) -> None:
    """Corre al pasado las líneas de un tipo, para poder probar qué pasa una vez
    vencida su ventana de deduplicación sin tener que esperarla."""
    viejo = datetime.utcnow() - timedelta(minutes=minutos + 1)
    for e in db.query(GameEvent).filter(GameEvent.kind == kind).all():
        e.created_at = viejo
    db.commit()


db = database.SessionLocal()

print("1. entradas al top: se anuncia entrar, no escalar")
# El ranking necesita gente para que los cortes existan: `MULTIPLO_DEL_CORTE`
# pide el doble del corte compitiendo, y el corte más grande es 50.
relleno = [fresh_player(db, f"relleno{i}", xp=1000 - i) for i in range(120)]
ana = fresh_player(db, "ana")
events.on_answer(db, ana, rank_before=40, rank_after=38, level_before=0, level_after=0)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "top").count() == 0,
    "moverse del 40 al 38 no cruza ningún corte y no se anuncia",
)
events.on_answer(db, ana, rank_before=60, rank_after=48, level_before=0, level_after=0)
db.commit()
top = db.query(GameEvent).filter(GameEvent.kind == "top").first()
check(top is not None and top.text == "{a} entró al top 50.",
      f"entrar al top 50 sí: {top.text if top else '—'}")
check(top is not None and top.emoji == "🚀", "y viene con su emoji")

print("1b. el corte más alto y uno solo")
db.query(GameEvent).delete()
db.commit()
events.on_answer(db, ana, rank_before=150, rank_after=8, level_before=0, level_after=0)
db.commit()
saltos = db.query(GameEvent).filter(GameEvent.kind == "top").all()
check(len(saltos) == 1, f"del puesto 150 al 8 sale UNA línea, no cuatro ({len(saltos)})")
check(saltos and "top 10" in saltos[0].text,
      f"y es la del corte más alto que cruzó: {saltos[0].text if saltos else '—'}")

print("1c. quedarse adentro no vuelve a ser noticia")
antes = db.query(GameEvent).filter(GameEvent.kind == "top").count()
for _ in range(3):
    events.on_answer(db, ana, rank_before=8, rank_after=7, level_before=0, level_after=0)
    db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "top").count() == antes,
      "responder bien sentado adentro del top 10 no anuncia nada")
# Y volver a cruzarlo tampoco, dentro de la ventana: el ping-pong de la misma
# tarde no son dos entradas.
#
# Con ana recién sacada de su enfriamiento: si no, lo único que estaría frenando
# la línea es el presupuesto por persona y este chequeo pasaría sin probar nada
# sobre `DEDUPE_TOP_MINUTES`, que es lo que existe para verificar.
enfriar(ana)
events.on_answer(db, ana, rank_before=30, rank_after=9, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "top").count() == antes,
      f"ni volver a entrar dentro de la ventana ({events.DEDUPE_TOP_MINUTES} min)")

print("1d. un corte que no existe no se anuncia")
db.query(GameEvent).delete()
# Entra al ranking quien resolvió acá, así que apagar `exercises_correct` encoge
# la tabla sin borrar a nadie —y se revierte igual de fácil.
for p in relleno[12:]:
    p.exercises_correct = 0
db.commit()
check(ranking.cuantos_compiten(db) == 12, "quedan doce compitiendo")
events.on_answer(db, ana, rank_before=12, rank_after=9, level_before=0, level_after=0)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "top").count() == 0,
    f"con doce compitiendo, entrar al top 10 no distingue a nadie "
    f"(pide {10 * events.MULTIPLO_DEL_CORTE})",
)
events.on_answer(db, ana, rank_before=9, rank_after=2, level_before=0, level_after=0)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "top").count() == 1,
    "pero el top 3 sí, que con doce sigue dejando afuera a nueve",
)
for p in relleno[12:]:
    p.exercises_correct = 1
db.commit()

print("2. puntero nuevo")
db.query(GameEvent).delete()
db.commit()
events.on_answer(db, ana, rank_before=3, rank_after=1, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "lead").count() == 1, "llegar al 1 se anuncia")
check(
    db.query(GameEvent).filter(GameEvent.kind == "top").count() == 0,
    "y NO se cuenta además como entrada al top 3: es un solo hecho",
)

print("3. rachas: hitos, y una sola vez cada uno")
beto = fresh_player(db, "beto", combo=7)
events.on_answer(db, beto, rank_before=None, rank_after=None, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "streak").count() == 0, "una racha de 7 no es hito")
beto.current_combo = 10
db.commit()
for _ in range(3):
    events.on_answer(db, beto, rank_before=None, rank_after=None, level_before=0, level_after=0)
    db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "streak").count() == 1,
    "el hito 10 se cuenta UNA vez por más que se responda de nuevo",
)

print("4. nivel y registro")
# Beto viene de hacer un hito de racha en la sección anterior, y subir de nivel
# pesa menos que eso: sin sacarlo del enfriamiento la línea no sale, y lo que
# este chequeo mediría es el presupuesto por persona en vez de la clave.
enfriar(beto)
events.on_answer(db, beto, rank_before=None, rank_after=None, level_before=0, level_after=1)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "level").count() == 1, "subir de nivel sale")
# Y la segunda vez TAMBIÉN fuera del enfriamiento, para que lo único que la
# pueda frenar sea la clave.
enfriar(beto)
events.on_answer(db, beto, rank_before=None, rank_after=None, level_before=0, level_after=1)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "level").count() == 1, "subir de nivel se cuenta una vez")
events.on_signup(db, beto)
events.on_signup(db, beto)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "signup").count() == 1, "el registro también")

print("5. los sembrados no aparecen con nombre propio")
bot = fresh_player(db, "bot1", is_bot=True, combo=10)
antes = db.query(GameEvent).count()
events.on_answer(db, bot, rank_before=90, rank_after=40, level_before=0, level_after=2)
events.on_signup(db, bot)
db.commit()
check(db.query(GameEvent).count() == antes, "ni escalada, ni racha, ni nivel, ni registro")

print("6. cafecito")
events.on_boost(db, university="UBA", cafecitos=4, multiplier=1.4, donor_name="Nico")
db.commit()
boost = db.query(GameEvent).filter(GameEvent.kind == "boost").first()
# El texto es plantilla: el nombre y la sigla viajan aparte para que el cliente
# los pueda pintar (tag de universidad, color de nivel).
check(boost is not None and "{a}" in boost.text and "{u0}" in boost.text,
      f"el texto queda con marcadores: {boost.text if boost else '—'}")
check(boost is not None and boost.actor_alias == "Nico" and "×1,4" in boost.text,
      "y dice quién y cuánto")
check(boost is not None and "para la {u0}" in boost.text,
      f"la universidad va con artículo: {boost.text if boost else '—'}")
check(boost is not None and boost.university == "UBA", "y queda atado a la universidad, para resaltarla")
check(boost is not None and boost.actor_level is None,
      "sin nivel: quien dona no es necesariamente un jugador")
events.on_boost(db, university="UTN", cafecitos=1, multiplier=1.1, donor_name=None)
db.commit()
anon = db.query(GameEvent).filter(GameEvent.kind == "boost").order_by(GameEvent.id.desc()).first()
check(anon.actor_alias == "Alguien", f"sin nombre, no se inventa uno: {anon.actor_alias}")
check("un cafecito" in anon.text, "y el singular está bien escrito")

print("7. universidades: el sobrepaso y el 'viene pisando' son TRANSICIONES")
# EL TESTIGO de la regresión. En producción `uni_close` fue 24 de los 71 eventos
# de un día y 43 en 54 horas, contra UN solo sobrepaso real en el mismo rato: el
# feed narraba una carrera que no se corría. Dos cosas lo causaban, y las dos se
# chequean abajo:
#
#   · La clave llevaba el sentido (`close:{abajo}:{arriba}`), así que un par que
#     se pasa de ida y de vuelta tenía DOS claves corriendo sus ventanas por
#     separado. Estaban los dos sentidos del mismo par en la base:
#     ["UNSAM","UNC"] y ["UNC","UNSAM"], ["UTN","UNLP"] y ["UNLP","UTN"].
#   · El aviso describía un ESTADO —"están pegadas"— que dura horas, así que se
#     re-anunciaba cada vez que la ventana se vencía.
db.query(GameEvent).delete()
db.add(GameSimState(id=1, version=0))
db.commit()


def fijar(sigla: str, xp_por_jugador: int) -> None:
    """Le pone a cada jugador de esa universidad exactamente esa experiencia.

    El orden del feed sale de la experiencia HISTÓRICA —`sum(GamePlayer.xp)`, el
    mismo número que muestra la tabla del juego— así que el escenario se arma
    moviendo esa columna y nada más. Antes salía de la XP de la semana, que vive
    en `game_attempts` y no aparece en ninguna pantalla: el feed anunciaba una
    carrera que no se podía ir a mirar, y por eso se podía ser puntero de la
    tabla y estar "a nada de pasar" a alguien al mismo tiempo.

    Se FIJA en vez de sumar para poder escribir los márgenes exactos que los
    umbrales miran: tres jugadores por universidad, así que el total es el triple.
    """
    for p in db.query(GamePlayer).filter(GamePlayer.university == sigla).all():
        p.xp = xp_por_jugador
    db.commit()


def foto() -> dict:
    import json

    estado = db.query(GameSimState).filter(GameSimState.id == 1).first()
    return json.loads(estado.uni_order_json)


def barrer() -> None:
    events.sync_universities(db, min_players=3)
    db.commit()


def cuantos(kind: str) -> int:
    return db.query(GameEvent).filter(GameEvent.kind == kind).count()


for i in range(3):
    fresh_player(db, f"chica{i}", university="CHICA", xp=1000, theta=0.4,
                 n_updates=events.elo.RAMP_UPDATES)
    fresh_player(db, f"grande{i}", university="GRANDE", xp=3000, theta=1.2,
                 n_updates=events.elo.RAMP_UPDATES)
db.commit()

simulation.get_state(db)
barrer()
check(cuantos("uni_pass") == 0,
      "el primer barrido no anuncia nada: no hay foto anterior contra qué comparar")
check(foto()["v"] == 2, f"pero la foto queda guardada, en el formato nuevo (v{foto()['v']})")

# CHICA pasa a GRANDE con margen de sobra: 15.000 contra 9.000.
fijar("CHICA", 5000)
barrer()
passed = db.query(GameEvent).filter(GameEvent.kind == "uni_pass").first()
check(passed is not None and passed.text.startswith("La {u0} le pasó a la {u1}"),
      f"con artículo y en mayúscula al abrir: {passed.text if passed else '—'}")
check(passed is not None and passed.text.endswith("."), "y termina con punto")
check(passed is not None and "esta semana" not in passed.text,
      "sin 'esta semana': la carrera es la de la experiencia que muestra la tabla")
check(passed is not None and passed.university == "CHICA" and passed.university_b == "GRANDE",
      f"el sobrepaso sí, con las dos siglas aparte: {passed.university if passed else '—'} → "
      f"{passed.university_b if passed else '—'}")

print("7b. 'viene pisando' se avisa al ENTRAR, y una sola vez")
db.query(GameEvent).delete()
db.commit()
# GRANDE se le pone al 1%: entra en la banda de disputa.
fijar("GRANDE", 4950)
barrer()
check(cuantos("uni_close") == 1, "entrar en la banda se avisa")
for _ in range(5):
    barrer()
check(cuantos("uni_close") == 1,
      "y quedarse adentro no vuelve a avisar: es una transición, no un estado")
check(foto()["close"] == ["CHICA|GRANDE"],
      f"el par se guarda en una sola dirección, alfabética: {foto()['close']}")

# EL PING-PONG. GRANDE queda arriba por 0,79%, o sea sin salir de la banda. Con
# la clave direccional esto estrenaba clave y era otra línea; y así, cada vuelta.
fijar("GRANDE", 5040)
barrer()
check(cuantos("uni_close") == 1,
      "que el par se dé vuelta no es entrar de nuevo: es el mismo hecho")
check(cuantos("uni_pass") == 0,
      f"y darse vuelta por menos del {int(events.UNI_PASS_MARGEN * 100)}% tampoco es un sobrepaso")

print("7c. histéresis: separarse un poco y volver no es entrar de nuevo")
# 3%: por encima de UNI_CLOSE_RATIO (2%) pero por debajo de UNI_CLOSE_SALIDA (5%).
fijar("GRANDE", 4850)
barrer()
check(foto()["close"] == ["CHICA|GRANDE"],
      f"al {int(events.UNI_CLOSE_RATIO * 100)}-{int(events.UNI_CLOSE_SALIDA * 100)}% "
      "el par sigue contando como pegado")
fijar("GRANDE", 4950)
barrer()
check(cuantos("uni_close") == 1,
      "así que volver a acercarse no dispara una línea nueva")
# Y ahora sí, separarse de verdad (20%) y volver.
fijar("GRANDE", 4000)
barrer()
check(foto()["close"] == [], "al 20% el par deja de estar pegado")
fijar("GRANDE", 4950)
barrer()
check(cuantos("uni_close") == 1,
      f"pero dentro de la ventana ({events.UNI_CLOSE_COOLDOWN_MINUTES} min) la clave "
      "del par lo frena igual: es la red por si la transición falla")
# Pasada la ventana, una entrada nueva sí es una noticia nueva.
envejecer("uni_close", events.UNI_CLOSE_COOLDOWN_MINUTES)
fijar("GRANDE", 4000)
barrer()
fijar("GRANDE", 4950)
barrer()
check(cuantos("uni_close") == 2, "y volver a acercarse pasada la ventana sí avisa")

print("7d. el sobrepaso se anuncia cuando el margen se afirma")
# El bug que la experiencia histórica volvía fatal: el sobrepaso se detectaba
# SOLO en el barrido en que el orden se daba vuelta, y en ese instante el margen
# es ~0, así que el filtro de `UNI_PASS_MARGEN` lo descartaba. En el barrido
# siguiente la foto ya coincidía con el orden nuevo y no se detectaba nunca más:
# un sobrepaso ajustado no se anunciaba tarde, no se anunciaba.
db.query(GameEvent).delete()
db.commit()
fijar("GRANDE", 5050)          # GRANDE pasa a CHICA, pero por 0,99%
barrer()
check(cuantos("uni_pass") == 0, "cruzarse por menos del margen todavía no es noticia")
fijar("GRANDE", 5300)          # ahora sí: 5,66%
barrer()
paso = db.query(GameEvent).filter(GameEvent.kind == "uni_pass").first()
check(paso is not None and paso.university == "GRANDE" and paso.university_b == "CHICA",
      "pero cuando el margen se afirma, el sobrepaso sale igual — aunque el orden "
      "se haya dado vuelta un barrido antes")

print("7e. con la foto vieja no se anuncia una ráfaga")
# Desplegar esto sobre una base con la foto v1 (una lista pelada de siglas) no
# puede anunciar todos los pares de golpe: sin pares conocidos no hay contra qué
# comparar, así que se guarda la foto nueva y ese barrido se queda callado.
import json as _json  # noqa: E402

_estado = db.query(GameSimState).filter(GameSimState.id == 1).first()
_estado.uni_order_json = _json.dumps(["GRANDE", "CHICA"])
db.query(GameEvent).delete()
db.commit()
barrer()
check(db.query(GameEvent).count() == 0, "con la foto vieja no sale ninguna línea")
check(foto()["v"] == 2 and foto()["order"] == ["GRANDE", "CHICA"],
      f"pero la foto avanza igual: si no, el primer barrido es siempre el primero "
      f"y no se detecta nada nunca ({foto().get('order')})")

print("7f. varias parejas parejas se cuentan de a una")
db.query(GameEvent).delete()
db.commit()
for i in range(3):
    fresh_player(db, f"tercera{i}", university="TERCERA", xp=1,
                 theta=1.99, n_updates=events.elo.RAMP_UPDATES)
db.commit()
# Las tres dentro del 1% entre sí: dos parejas en disputa a la vez.
fijar("GRANDE", 5300)
fijar("CHICA", 5275)
fijar("TERCERA", 5250)
barrer()
check(cuantos("uni_close") <= 1, "el barrido anuncia una sola, no llena el feed")

print("7g. el piso deja afuera a las universidades de un jugador")
# 233 contra 219 de experiencia son un 6% de margen que no es una disputa: es
# aritmética. El piso de calificados —el mismo de la tabla— es lo que las saca.
solo = fresh_player(db, "solita", university="CHIQUITA", xp=10_000,
                    theta=1.0, n_updates=events.elo.RAMP_UPDATES)
db.commit()
siglas = [u for u, _ in events._standings_de_universidades(db, 3)]
check("CHIQUITA" not in siglas,
      f"con un solo calificado la universidad no entra en la carrera: {siglas}")
db.delete(solo)
db.commit()

print("7h. la carrera es la MISMA que muestra la tabla")
# El feed anuncia sobrepasos, así que tiene que ordenar por un número que se
# pueda ir a mirar. La tabla suma `GamePlayer.xp` de quien resolvió acá; esto
# tiene que dar lo mismo, o el aviso va a contradecir la pantalla — que es
# exactamente lo que pasaba con la XP de la semana.
from sqlalchemy import func as _func  # noqa: E402

_de_la_tabla = dict(
    db.query(GamePlayer.university, _func.coalesce(_func.sum(GamePlayer.xp), 0))
    .filter(GamePlayer.university.isnot(None), GamePlayer.university != "",
            ranking.RESOLVIO_ACA)
    .group_by(GamePlayer.university)
    .all()
)
_del_feed = dict(events._standings_de_universidades(db, 3))
check(all(_de_la_tabla.get(u) == xp for u, xp in _del_feed.items()),
      f"cada universidad del feed trae la experiencia de la tabla: {_del_feed}")

print("8a. artículos")
from universities import article_for  # noqa: E402
check(article_for("UBA") == "la" and article_for("UNSAM") == "la", "las universidades llevan 'la'")
check(article_for("ITBA") == "el", "los institutos llevan 'el' (ITBA)")
check(article_for(None) == "la", "sin universidad, el default no rompe la oración")
check(all(e.text.rstrip().endswith(".") for e in events.recent(db)),
      "todas las oraciones del feed cierran con punto")

print("7a. el piso del podio es el mismo que el de la tabla")
# `MIN_JUGADORES_UNI` es una copia declarada de `boosts.MIN_PLAYERS_RANKED`:
# boosts importa events, así que traerlo al revés cerraría el ciclo. Mismo caso
# que `_SOURCE_AFORO` en check_aforo.py, y por eso el mismo chequeo.
from game import boosts  # noqa: E402

check(events.MIN_JUGADORES_UNI == boosts.MIN_PLAYERS_RANKED,
      f"events.MIN_JUGADORES_UNI ({events.MIN_JUGADORES_UNI}) == "
      f"boosts.MIN_PLAYERS_RANKED ({boosts.MIN_PLAYERS_RANKED})")

# El otro riesgo del podio es silencioso: si el scope saliera None para quien SÍ
# tiene universidad, el router pasaría puestos en None y el podio no se anunciaría
# nunca sin que nada falle. Por eso se chequea derecho.
_con_uni = fresh_player(db, "conuni", university="UBA")
_sin_uni = fresh_player(db, "sinuni")
check(ranking.scope_de_universidad(_con_uni) is not None,
      "con universidad cargada, el scope existe")
check(ranking.scope_de_universidad(_sin_uni) is None,
      "sin universidad, el scope es None y no una lista vacía")

print("7b. el podio de la universidad")
db.query(GameEvent).delete()
db.commit()
# Una casa de estudios con nueve jugadores: uno menos que el piso.
for i in range(9):
    fresh_player(db, f"sammy{i}", university="UNSAM", xp=50 + i)
db.commit()
petisa = fresh_player(db, "petisa", university="UNSAM", xp=10)
petisa.exercises_correct = 0
db.commit()
check(ranking.cuantos_compiten(db, ranking.scope_de_universidad(petisa)) == 9,
      "la UNSAM tiene nueve compitiendo")
events.on_answer(db, petisa, rank_before=None, rank_after=None, level_before=0,
                 level_after=0, uni_rank_before=5, uni_rank_after=1)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "uni_top").count() == 0,
    f"con nueve, ser el número 1 no es un podio (piso {events.MIN_JUGADORES_UNI})",
)
# El décimo la habilita.
petisa.exercises_correct = 1
db.commit()
events.on_answer(db, petisa, rank_before=None, rank_after=None, level_before=0,
                 level_after=0, uni_rank_before=5, uni_rank_after=1)
db.commit()
podio = db.query(GameEvent).filter(GameEvent.kind == "uni_top").first()
check(podio is not None and podio.text == "{a} es el número 1 de la {u0}.",
      f"con diez sí: {podio.text if podio else '—'}")
check(podio is not None and podio.university == "UNSAM" and podio.emoji == "🏆",
      "con la sigla aparte y su emoji propio")

# El artículo lo decide el nombre completo, no la sigla: «del ITBA», no «de el».
for i in range(10):
    fresh_player(db, f"itba{i}", university="ITBA", xp=70 + i)
db.commit()
tecno = fresh_player(db, "tecno", university="ITBA", xp=5)
db.commit()
events.on_answer(db, tecno, rank_before=None, rank_after=None, level_before=0,
                 level_after=0, uni_rank_before=8, uni_rank_after=3)
db.commit()
instituto = (db.query(GameEvent).filter(GameEvent.kind == "uni_top")
             .order_by(GameEvent.id.desc()).first())
check(instituto is not None and instituto.text == "{a} entró al top 3 del {u0}.",
      f"la contracción sale bien: {instituto.text if instituto else '—'}")

# Y sin universidad no hay podio al que entrar, por más que los puestos lleguen.
db.query(GameEvent).delete()
db.commit()
events.on_answer(db, beto, rank_before=None, rank_after=None, level_before=0,
                 level_after=0, uni_rank_before=5, uni_rank_after=1)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "uni_top").count() == 0,
      "sin universidad cargada no se anuncia ningún podio")

print("8b. las piezas para pintar")
db.query(GameEvent).delete()
db.commit()
ana.theta = 2.4
db.commit()
events.on_answer(db, ana, rank_before=90, rank_after=50, level_before=0, level_after=0)
db.commit()
pintable = db.query(GameEvent).filter(GameEvent.kind == "top").order_by(GameEvent.id.desc()).first()
check(pintable.actor_alias == "@ana", "el nombre viaja con arroba y aparte del texto")
check(pintable.actor_level is not None and pintable.actor_level > 0,
      f"y con el nivel del jugador, que es lo que lo pinta (dio {pintable.actor_level})")
vista = events.recent(db, limit=1)[0]
check(vista.universities == [], "sin universidad, la lista de siglas viene vacía")

print("8. el feed")
# Material propio: las secciones de arriba vacían la tabla, y comparar el orden
# con una sola fila no prueba nada.
events.on_boost(db, university="UBA", cafecitos=1, multiplier=1.1, donor_name="A")
events.on_boost(db, university="UBA", cafecitos=1, multiplier=1.2, donor_name="B")
db.commit()
feed = events.recent(db)
check(len(feed) >= 2, "hay con qué comparar el orden")
check(len(feed) > 0 and feed[0].id > feed[-1].id, "devuelve del más nuevo al más viejo")
check(all(e.emoji for e in feed), "todos traen emoji")
ultimo = feed[0].id
check(events.recent(db, after_id=ultimo) == [], "con after_id al día no devuelve nada")

print("9. barrido de lo viejo")
viejo = db.query(GameEvent).first()
viejo.created_at = datetime.utcnow() - timedelta(days=events.PRUNE_DAYS + 1)
db.commit()
borrados = events.prune(db)
db.commit()
check(borrados == 1, f"se barre lo de más de {events.PRUNE_DAYS} días (borró {borrados})")

print("10. reclutamiento: el registro por link da crédito a quien trajo")
amigador = fresh_player(db, "amigador", university="UBA")
recluta = fresh_player(db, "reclutado")
recluta.referred_by = amigador.id
db.commit()
events.on_signup(db, recluta)
db.commit()
referral = db.query(GameEvent).filter(GameEvent.kind == "referral").first()
check(
    referral is not None and referral.text == "{a} reclutó a {b}.",
    f"el texto trae los dos marcadores: {referral.text if referral else '—'}",
)
check(
    referral is not None and referral.actor_alias == "@amigador",
    "el protagonista es quien trajo, con arroba",
)
check(
    referral is not None and referral.actor_b_alias == "@reclutado",
    "y el segundo marcador es quien llegó, también con arroba",
)
check(referral is not None and referral.actor_level is not None, "el reclutador se pinta con SU nivel")
check(
    referral is not None and referral.player_id == amigador.id,
    "el resaltado 'esto sos vos' es para el reclutador, no para el recluta",
)
check(
    referral is not None and referral.university == "UBA",
    "y queda atado a SU universidad, no a la del recluta (que no tiene)",
)
check(
    db.query(GameEvent)
    .filter(GameEvent.kind == "signup", GameEvent.actor_alias == "@reclutado")
    .count()
    == 0,
    "no se duplica con el signup genérico: el de reclutamiento lo reemplaza",
)
events.on_signup(db, recluta)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "referral").count() == 1,
    "y no se repite si on_signup se vuelve a llamar (idempotente)",
)

print("11. sin reclutador, sigue siendo el signup de siempre")
solito = fresh_player(db, "solito")
events.on_signup(db, solito)
db.commit()
check(
    db.query(GameEvent)
    .filter(GameEvent.kind == "signup", GameEvent.actor_alias == "@solito")
    .count()
    == 1,
    "sin referred_by, el anuncio es el genérico",
)

print("12. paginado hacia atrás: `before_id` trae lo MÁS VIEJO, no lo más nuevo")
# El panel del teléfono pide páginas viejas al llegar arriba de todo. El error
# que hay que atrapar acá es el que se cometió escribiéndolo: si `before_id` cae
# en la rama del sondeo, la respuesta son las líneas más NUEVAS y el scroll
# empieza a repetir lo que ya estaba en pantalla, para siempre.
todos = events.recent(db, limit=100)
check(len(todos) >= 4, f"hay historia con la que probar ({len(todos)} eventos)")
primera = events.recent(db, limit=2)
segunda = events.recent(db, before_id=primera[-1].id, limit=2)
check(
    all(e.id < primera[-1].id for e in segunda),
    "la segunda página está entera por debajo del cursor",
)
check(
    not ({e.id for e in primera} & {e.id for e in segunda}),
    "y no repite nada de la primera",
)
check(
    [e.id for e in primera + segunda] == [e.id for e in todos[:4]],
    "las dos páginas seguidas dicen lo mismo que pedir todo de una",
)
check(
    events.recent(db, before_id=1) == [],
    "con before_id=1 no hay nada: es el valor que manda el cliente para la lista que ya tocó fondo",
)
check(
    len(events.recent(db, limit=events.MAX_LIMIT + 50)) <= events.MAX_LIMIT,
    "el limit sigue acotado por MAX_LIMIT",
)

print("13. el presupuesto por persona")
# EL TESTIGO de la regresión. Esta es la escalera medida en producción: alguien
# hizo cinco líneas en un día (top 50, top 25, racha 25, racha 50, racha 100),
# otro seis, y entre cuatro personas armaron 20 de los 47 eventos del día que no
# eran de universidad — contra 38 mensajes de gente en el mismo rato.
#
# Cada evento por separado obedecía su regla —es una entrada y no un estado, el
# hito se cuenta una vez— y ESE es el punto: son hechos distintos, así que ningún
# umbral los puede ver juntos. El freno tiene que mirar a la PERSONA.
db.query(GameEvent).delete()
db.commit()
escalera = fresh_player(db, "escalera", xp=900)
events.on_answer(db, escalera, rank_before=60, rank_after=48, level_before=0, level_after=0)
db.commit()
for combo, antes, despues, nivel in ((25, 48, 20, 1), (50, 20, 19, 1), (100, 19, 18, 1)):
    escalera.current_combo = combo
    db.commit()
    events.on_answer(db, escalera, rank_before=antes, rank_after=despues,
                     level_before=nivel - 1 if combo == 25 else nivel, level_after=nivel)
    db.commit()
salieron = db.query(GameEvent).filter(GameEvent.player_id == escalera.id).all()
check(len(salieron) == 2,
      f"una sesión entera de la misma persona son dos líneas, no cinco ({len(salieron)})")
check([e.kind for e in salieron] == ["top", "streak"],
      f"y son la ENTRADA y el REMATE, no dos escalones del medio: "
      f"{[e.kind for e in salieron]}")
check(salieron and "100 seguidas" in salieron[-1].text,
      f"el remate es el escalón más alto que llegó a tiempo: "
      f"{salieron[-1].text if salieron else '—'}")

print("13b. dentro de una respuesta gana la más fuerte, no la primera")
# El orden lo decidía el orden en que estaban ESCRITAS las líneas de `on_answer`
# —puntero, podio, racha, nivel—, así que entrar al top 25 y subir de nivel en la
# misma respuesta salían las dos, encabezadas por la de más arriba del archivo.
db.query(GameEvent).delete()
db.commit()
dupla = fresh_player(db, "dupla", xp=800, combo=10)
events.on_answer(db, dupla, rank_before=60, rank_after=20, level_before=0, level_after=1)
db.commit()
salidas = db.query(GameEvent).filter(GameEvent.player_id == dupla.id).all()
check(len(salidas) == 1, f"una sola de las tres que dispararon ({len(salidas)})")
check(salidas and salidas[0].kind == "top",
      f"y es la más fuerte, no la primera escrita: {salidas[0].kind if salidas else '—'}")
check(salidas and salidas[0].strength == events.FUERZA_TOP[25],
      "la fuerza queda guardada: es contra eso que se compara la línea siguiente")

print("13c. lo grande interrumpe; la escalera no")
# El enfriamiento no puede tragarse la noticia más grande que el juego tiene.
db.query(GameEvent).delete()
db.commit()
puntero = fresh_player(db, "puntero", xp=999_999)
events.on_answer(db, puntero, rank_before=60, rank_after=48, level_before=0, level_after=0)
db.commit()
events.on_answer(db, puntero, rank_before=48, rank_after=1, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "lead").count() == 1,
      "llegar al 1 sale aunque se haya hablado de esa persona recién")
check(db.query(GameEvent).filter(GameEvent.player_id == puntero.id).count() == 2,
      "el enfriamiento frena la escalera, no la noticia")

# Y el otro lado: un escalón más alto de la MISMA escalera no alcanza.
db.query(GameEvent).delete()
db.commit()
tibio = fresh_player(db, "tibio", xp=700, combo=50)
events.on_answer(db, tibio, rank_before=None, rank_after=None, level_before=0, level_after=0)
db.commit()
tibio.current_combo = 100
db.commit()
events.on_answer(db, tibio, rank_before=None, rank_after=None, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.player_id == tibio.id).count() == 1,
      f"racha 50 y racha 100 en la misma sesión son una línea (pide "
      f"+{events.SALTO_PARA_MEJORAR} de fuerza y hay "
      f"{events.FUERZA_STREAK[100] - events.FUERZA_STREAK[50]})")

print("13d. callarse no quema la clave")
# La deduplicación se resuelve mirando la TABLA, así que una línea que no se
# escribió no consumió su `dedupe_key`. El freno es un "ahora no" y no un "nunca
# más" — importa porque los hitos de racha y de nivel deduplican para siempre, y
# un freno que quemara la clave los borraría del juego.
enfriar(tibio)
events.on_answer(db, tibio, rank_before=None, rank_after=None, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.player_id == tibio.id).count() == 2,
      "pasado el enfriamiento, el hito que se había callado todavía puede salir")

print("13e. el registro no espera turno, pero arranca el reloj")
db.query(GameEvent).delete()
db.commit()
recien = fresh_player(db, "recienllegado", xp=600)
events.on_signup(db, recien)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "signup").count() == 1,
      "un registro no lo frena nada: es la primera vez que alguien aparece")
events.on_answer(db, recien, rank_before=60, rank_after=48, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.player_id == recien.id).count() == 1,
      "pero sí ancla: 'se sumó @fulano' + '@fulano entró al top 50' es una línea")

print("13f. lo que no es de nadie no frena a nadie")
# `boost`, `uni_pass` y `uni_close` tienen `player_id` en NULL, y por eso quedan
# fuera del mecanismo en las dos direcciones: ni cuentan para el enfriamiento de
# nadie ni lo sufren. Es una propiedad del esquema y no una excepción escrita a
# mano, así que lo que este chequeo protege es que a nadie se le ocurra empezar a
# ponerles un `player_id` "para el resaltado".
events.on_boost(db, university="UBA", cafecitos=2, multiplier=1.2, donor_name="Vero")
db.commit()
_agregados = db.query(GameEvent).filter(
    GameEvent.kind.in_(("boost", "uni_pass", "uni_close"))
).all()
check(_agregados and all(e.player_id is None for e in _agregados),
      f"los eventos de universidad y de cafecito no cuelgan de una persona "
      f"({len(_agregados)} mirados)")

print("14. el puntero no hace ping-pong")
# EL TESTIGO. En producción salieron cinco líneas de puntero en un día por una
# disputa entre dos personas: tres de una y dos de la otra. La clave era
# `lead:{player_id}`, o sea UNA POR PERSONA, así que cada una corría su propia
# ventana y ninguna veía a la otra.
db.query(GameEvent).delete()
db.commit()
uno = fresh_player(db, "unopuntero", xp=500_000)
dos = fresh_player(db, "dospuntero", xp=500_001)
for quien in (uno, dos, uno):
    events.on_answer(db, quien, rank_before=2, rank_after=1, level_before=0, level_after=0)
    db.commit()
_n = db.query(GameEvent).filter(GameEvent.kind == "lead").count()
check(_n == 1, f"tres cambios de mano en la misma tarde son una línea ({_n})")

envejecer("lead", events.LEAD_COOLDOWN_MINUTES)
events.on_answer(db, dos, rank_before=2, rank_after=1, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "lead").count() == 2,
      f"pasada la ventana ({events.LEAD_COOLDOWN_MINUTES} min), un puntero "
      "DISTINTO sí vuelve a ser noticia")

envejecer("lead", events.LEAD_COOLDOWN_MINUTES)
events.on_answer(db, dos, rank_before=2, rank_after=1, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "lead").count() == 2,
      "y el MISMO no: anunciarlo dos veces seguidas es decir dos veces lo mismo")

print("15. el presupuesto del feed, entero")
# El chequeo que mira el problema y no cada freno por separado. La queja no fue
# por un evento: fue que 71 líneas del sistema en 24 horas tapaban 38 mensajes de
# cuatro personas. Acá se reconstruye ese día —cuatro sesiones con su escalera,
# un par de universidades pegadas barrido cien veces, y los registros— y se
# cuenta el total.
#
# Es el único chequeo del archivo que puede fallar porque alguien AGREGÓ un
# emisor nuevo bien hecho, y eso es exactamente lo buscado: sumar una noticia
# obliga a mirar el presupuesto.
db.query(GameEvent).delete()
db.commit()
for n in range(4):
    quien = fresh_player(db, f"jornada{n}", xp=900 - n)
    events.on_answer(db, quien, rank_before=60, rank_after=48, level_before=0, level_after=0)
    db.commit()
    for combo, antes, despues in ((25, 48, 30), (50, 30, 20), (100, 20, 19)):
        quien.current_combo = combo
        db.commit()
        events.on_answer(db, quien, rank_before=antes, rank_after=despues,
                         level_before=0, level_after=0)
        db.commit()
for n in range(6):
    events.on_signup(db, fresh_player(db, f"llegada{n}", xp=5))
db.commit()
for _ in range(100):
    barrer()
_total = db.query(GameEvent).count()
check(_total <= 16,
      f"el día entero entra en dieciséis líneas: cuatro sesiones, cien barridos "
      f"y seis registros dieron {_total}")
check(db.query(GameEvent).filter(GameEvent.kind == "uni_close").count() == 0,
      "y cien barridos de un par que ya estaba pegado no aportan ninguna")

db.close()
print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
