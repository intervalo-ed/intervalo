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
from game import events, simulation  # noqa: E402

Base.metadata.create_all(bind=database.engine)

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def fresh_player(db, alias, *, university=None, is_bot=False, combo=0, xp=0,
                 theta=0.0, n_updates=0):
    p = GamePlayer(
        alias=alias, university=university, is_bot=is_bot,
        current_combo=combo, xp=xp, theta=theta, n_updates=n_updates,
    )
    db.add(p)
    db.commit()
    return p


db = database.SessionLocal()

print("1. escaladas: solo las grandes son noticia")
ana = fresh_player(db, "ana")
events.on_answer(db, ana, rank_before=40, rank_after=38, level_before=0, level_after=0)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "climb").count() == 0,
    f"pasar a 2 personas no se anuncia (umbral {events.CLIMB_MIN})",
)
events.on_answer(db, ana, rank_before=40, rank_after=28, level_before=0, level_after=0)
db.commit()
climb = db.query(GameEvent).filter(GameEvent.kind == "climb").first()
check(climb is not None and "12 personas" in climb.text, f"pasar a 12 sí: {climb.text if climb else '—'}")
check(climb is not None and climb.emoji == "🚀", "y viene con su emoji")

print("2. puntero nuevo")
events.on_answer(db, ana, rank_before=3, rank_after=1, level_before=0, level_after=0)
db.commit()
check(db.query(GameEvent).filter(GameEvent.kind == "lead").count() == 1, "llegar al 1 se anuncia")
check(
    db.query(GameEvent).filter(GameEvent.kind == "climb").count() == 1,
    "y NO se cuenta además como escalada: es un solo hecho",
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
# CHICA arranca abajo; después la damos vuelta.
for i in range(3):
    fresh_player(db, f"chica{i}", university="CHICA", xp=100, theta=0.4,
                 n_updates=events.elo.RAMP_UPDATES)
    fresh_player(db, f"grande{i}", university="GRANDE", xp=300, theta=1.2,
                 n_updates=events.elo.RAMP_UPDATES)
db.commit()

simulation.get_state(db)
events.sync_universities(db, min_players=3)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "uni_pass").count() == 0,
    "el primer barrido no anuncia nada: no hay foto anterior contra qué comparar",
)

for p in db.query(GamePlayer).filter(GamePlayer.university == "CHICA").all():
    p.theta = 2.0
db.commit()
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
for p in db.query(GamePlayer).filter(GamePlayer.university == "GRANDE").all():
    p.theta = 1.98
db.commit()
events.sync_universities(db, min_players=3)
db.commit()
events.sync_universities(db, min_players=3)
db.commit()
check(
    db.query(GameEvent).filter(GameEvent.kind == "uni_close").count() == 1,
    f"'viene pisando' se avisa una vez por ventana ({events.UNI_CLOSE_COOLDOWN_MINUTES} min)",
)

# Con tres universidades parejas hay dos parejas en disputa a la vez; el barrido
# tiene que contar solo la más ajustada, no llenar el feed.
db.query(GameEvent).delete()
for i in range(3):
    fresh_player(db, f"tercera{i}", university="TERCERA", xp=880, theta=1.99,
                 n_updates=events.elo.RAMP_UPDATES)
db.commit()
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

print("8b. las piezas para pintar")
ana.theta = 2.4
db.commit()
events.on_answer(db, ana, rank_before=90, rank_after=50, level_before=0, level_after=0)
db.commit()
pintable = db.query(GameEvent).filter(GameEvent.kind == "climb").order_by(GameEvent.id.desc()).first()
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

db.close()
print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
