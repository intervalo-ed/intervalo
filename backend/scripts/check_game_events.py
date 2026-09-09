"""Verifica el historial de eventos del minijuego.

Lo que importa acá no es que los eventos salgan, sino que NO salgan de más: un
feed que anuncia cada respuesta es ruido, y uno que repite el mismo hito en cada
tick es peor. Así que casi todo lo que se chequea son los frenos — umbrales,
deduplicación y la regla de que los jugadores sembrados no aparecen con nombre y
apellido.

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
events.on_answer(db, beto, rank_before=None, rank_after=None, level_before=0, level_after=1)
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

print("7. universidades: sobrepaso y 'viene pisando'")
db.query(GameEvent).delete()
db.add(GameSimState(id=1, version=0))
db.commit()


_ex_uni = [90_000]


def xp_de_la_semana(sigla: str, xp: int) -> None:
    """Le da a cada jugador de esa universidad una respuesta con `xp` de XP.

    El orden del feed pasó a salir de la XP de la SEMANA (game_attempts), no del
    theta promedio: aquel oscilaba con cada respuesta y anunciaba sobrepasos que
    no habían pasado. Así que el escenario se arma moviendo XP y no theta.
    """
    from models import GameAttempt, GameExercise

    ahora = datetime.utcnow()
    for p in db.query(GamePlayer).filter(GamePlayer.university == sigla).all():
        _ex_uni[0] += 1
        db.add(GameExercise(
            id=_ex_uni[0], player_id=p.id, template_key="t1", prompt_latex="x",
            expected_derivative="1", theta_at_serve=0.5, beta_at_serve=-1.0,
            p_hat=0.75, status="answered", created_at=ahora, answered_at=ahora))
        db.add(GameAttempt(
            exercise_id=_ex_uni[0], player_id=p.id, attempt_number=1,
            parse_ok=True, is_correct=True, xp_awarded=xp, created_at=ahora))
    db.commit()


# CHICA arranca abajo; después la damos vuelta.
for i in range(3):
    fresh_player(db, f"chica{i}", university="CHICA", xp=100, theta=0.4,
                 n_updates=events.elo.RAMP_UPDATES)
    fresh_player(db, f"grande{i}", university="GRANDE", xp=300, theta=1.2,
                 n_updates=events.elo.RAMP_UPDATES)
db.commit()
xp_de_la_semana("CHICA", 10)
xp_de_la_semana("GRANDE", 100)

simulation.get_state(db)
events.sync_universities(db, min_players=3)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "uni_pass").count() == 0,
    "el primer barrido no anuncia nada: no hay foto anterior contra qué comparar",
)

# CHICA pasa a GRANDE, y con margen de sobra: 3x310 contra 3x100.
xp_de_la_semana("CHICA", 300)
events.sync_universities(db, min_players=3)
db.commit()
passed = db.query(GameEvent).filter(GameEvent.kind == "uni_pass").first()
check(passed is not None and passed.text.startswith("La {u0} le pasó a la {u1}"),
      f"con artículo y en mayúscula al abrir: {passed.text if passed else '—'}")
check(passed is not None and passed.text.endswith("."), "y termina con punto")
check(passed is not None and passed.university == "CHICA" and passed.university_b == "GRANDE",
      f"el sobrepaso sí, con las dos siglas aparte: {passed.university if passed else '—'} → "
      f"{passed.university_b if passed else '—'}")

# Empatadas: tiene que avisar que una viene pisando, y una sola vez.
# CHICA lleva 930 y GRANDE 300; se le suman 620 para dejarla a 920.
xp_de_la_semana("GRANDE", 206)
events.sync_universities(db, min_players=3)
db.commit()
events.sync_universities(db, min_players=3)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "uni_close").count() == 1,
    f"'viene pisando' se avisa una vez por ventana ({events.UNI_CLOSE_COOLDOWN_MINUTES} min)",
)

# El bug que trajo todo esto: dos universidades pegadas se pasaban una a la otra
# en ticks alternos y cada vuelta era una línea del feed. En producción el orden
# salía del Elo promedio —once puntos de rating sobre mil— así que «la UNC le
# pasó a la UBA» se anunciaba sin que hubiera pasado nada. Ahora un sobrepaso
# pide margen.
db.query(GameEvent).delete()
db.commit()
simulation.get_state(db)
events.sync_universities(db, min_players=3)
db.commit()
db.query(GameEvent).delete()
db.commit()
# Un empujoncito que la deja apenas arriba: menos del margen, no es noticia.
xp_de_la_semana("GRANDE", 5)
events.sync_universities(db, min_players=3)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "uni_pass").count() == 0,
    f"ganar por menos del {int(events.UNI_PASS_MARGEN * 100)}% no es un sobrepaso",
)

# Con tres universidades parejas hay dos parejas en disputa a la vez; el barrido
# tiene que contar solo la más ajustada, no llenar el feed.
db.query(GameEvent).delete()
for i in range(3):
    fresh_player(db, f"tercera{i}", university="TERCERA", xp=880, theta=1.99,
                 n_updates=events.elo.RAMP_UPDATES)
db.commit()
xp_de_la_semana("TERCERA", 305)
events.sync_universities(db, min_players=3)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "uni_close").count() <= 1,
    "con varias parejas parejas, el barrido anuncia una sola",
)

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

db.close()
print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
