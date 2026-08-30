"""Verifica game/stats.py (el panel de estadísticas que abre la tecla `p`)
contra un escenario armado a mano.

Cubre las partes que un test superficial no agarra:
  - el Elo de desbloqueo de una fila con VARIAS plantillas se promedia en
    espacio θ, no promediando ratings ya redondeados;
  - las tres filas sin plantilla (inv_x, sqrt_x, tan_x) dan `unlock_elo=None`
    siempre, sin importar qué haya en game_template_stats;
  - el accuracy PERSONAL de una fila toma los últimos 10 intentos LIMPIOS por
    FECHA (no los primeros 10, no los 12 sin recortar);
  - un intento con la tabla abierta (`peeked`) o que no parseó (`parse_ok`)
    NUNCA entra en esa ventana, aunque sea el más reciente;
  - los bots y los jugadores con `exercises_correct < UMBRAL_ESTADISTICAS` no
    cuentan para el histograma;
  - el endpoint respeta el gate de visibilidad (403 antes de la derivada 10).

Uso:
    python backend/scripts/check_game_stats.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

# La consola de Windows abre en cp1252 y este check imprime "≈"/acentos; sin
# esto un check que falla muere con UnicodeEncodeError y tapa el error real.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_stats.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base, GameAttempt, GameExercise, GamePlayer, GameTemplateStat,
)

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import elo  # noqa: E402
from game import stats as game_stats  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


BASE = datetime(2026, 8, 20, 12, 0)


def T(dia: int) -> datetime:
    return BASE + timedelta(days=dia)


# ── Jugadores calificados de relleno, para pasar MIN_HISTOGRAM_PLAYERS ──────
# 20 jugadores no-bot con exercises_correct >= 10 (calificados) y thetas
# repartidos, más uno con exercises_correct < 10 (NO calificado, aunque tenga
# un theta cualquiera) y un bot con exercises_correct alto (tampoco cuenta).
for i in range(20):
    db.add(GamePlayer(
        alias=f"relleno{i}", theta=(i - 10) * 0.2, xp=100,
        exercises_correct=10 + i, exercises_attempted=15 + i,
        is_bot=False, created_at=T(0),
    ))
db.add(GamePlayer(
    alias="novato", theta=5.0, xp=10,
    exercises_correct=3, exercises_attempted=5,
    is_bot=False, created_at=T(0),
))
db.add(GamePlayer(
    alias="bot-sembrado", theta=5.0, xp=999,
    exercises_correct=999, exercises_attempted=999,
    is_bot=True, created_at=T(0),
))

FOCO = GamePlayer(
    alias="foco", theta=1.0, xp=500,
    exercises_correct=42, exercises_attempted=60,
    best_combo=7, best_rank=3,
    is_bot=False, created_at=T(-30),
)
db.add(FOCO)
db.flush()


def plantilla(key: str, tier: int) -> int:
    """Un ejercicio SERVIDO de esta plantilla para `FOCO`. Devuelve su id."""
    ex = GameExercise(
        player_id=FOCO.id, template_key=key, prompt_latex="x",
        expected_derivative="1", theta_at_serve=0.0, beta_at_serve=0.0,
        p_hat=0.75, status="answered",
    )
    db.add(ex)
    db.flush()
    return ex.id


def intento(exercise_id: int, correcto: bool, cuando: datetime, *,
            attempt_number: int = 1, parse_ok: bool = True,
            response_ms: int | None = None) -> None:
    db.add(GameAttempt(
        exercise_id=exercise_id, player_id=FOCO.id,
        attempt_number=attempt_number, is_correct=correcto, parse_ok=parse_ok,
        created_at=cuando, response_ms=response_ms,
    ))


print("1. accuracy personal: últimos 10 LIMPIOS por fecha, no los primeros ni los 12 sin recortar")
# 12 intentos limpios de t3_exp (fila "e_x"), en orden CRONOLÓGICO:
#   idx 1-2   (más viejos, se descartan si se toman los últimos 10): True, True
#   idx 3-10  (compartidos por cualquier ventana de 10):              5×True, 3×False
#   idx 11-12 (más nuevos, tienen que ENTRAR):                        False, False
# - últimos 10 (correcto) = idx3..12 = 5 True de 10  → 50%
# - primeros 10 (bug)     = idx1..10 = 7 True de 10  → 70%
# - los 12 sin recortar (bug) = 7 True de 12         → 58%
patron = [True, True, True, True, True, True, True, False, False, False, False, False]
assert len(patron) == 12
# Tiempos de respuesta, mismo índice que `patron`. idx1-2 (fuera de la
# ventana) llevan un valor absurdo (99999 ms) para que, si el recorte a los
# últimos 10 fallara, el promedio se dispare y el chequeo lo note. idx8 va en
# None: un intento SIN tiempo registrado tiene que quedar afuera del promedio
# sin bajar la cuenta de cuántos hay (eso lo sigue contando `sample`).
tiempos_ms = [99999, 99999, 1000, 1000, 1000, 1000, 1000, None, 3000, 3000, 3000, 3000]
assert len(tiempos_ms) == 12
for n, (correcto, ms) in enumerate(zip(patron, tiempos_ms), start=1):
    ex_id = plantilla("t3_exp", tier=3)
    intento(ex_id, correcto, T(n), response_ms=ms)

# Un intento MÁS reciente que los 12, pero con la tabla abierta: si el filtro
# de `peeked` fallara, este entraría a la ventana en lugar del idx-12 y el
# resultado cambiaría (además de contar un "resolvió" que en realidad copió).
ex_peeked = GameExercise(
    player_id=FOCO.id, template_key="t3_exp", prompt_latex="x",
    expected_derivative="1", theta_at_serve=0.0, beta_at_serve=0.0,
    p_hat=0.75, status="answered", peeked=True,
)
db.add(ex_peeked)
db.flush()
intento(ex_peeked.id, True, T(13), response_ms=99999)

# Ídem, pero el que falla es parse_ok: un intento que no se pudo interpretar
# no es una respuesta (regla no-negociable del proyecto).
ex_sin_parsear = plantilla("t3_exp", tier=3)
intento(ex_sin_parsear, True, T(14), parse_ok=False, response_ms=99999)

db.flush()
db.commit()

personal = game_stats._personal_accuracy(db, FOCO.id)
e_x = personal["e_x"]
check(e_x.sample == 10, f"e_x.sample == 10 (dio {e_x.sample})")
check(e_x.accuracy == 50, f"e_x.accuracy == 50 (dio {e_x.accuracy}) — toma los ÚLTIMOS 10, no los primeros")

# Ventana (idx3..12): 5×1000 + None + 4×3000, ignorando los 99999 de afuera y
# el None de adentro. round(17000 / 9) = 1889.
esperado_ms = round((5 * 1000 + 4 * 3000) / 9)
check(
    e_x.avg_response_ms == esperado_ms,
    f"e_x.avg_response_ms == {esperado_ms} (dio {e_x.avg_response_ms}) — "
    "ignora los 99999 de fuera de la ventana y el None de adentro",
)

print("2. filas sin plantilla: unlock_elo siempre None")
unlock = game_stats._unlock_ratings(db)
for slug in ("inv_x", "sqrt_x", "tan_x"):
    check(unlock[slug] is None, f"{slug}.unlock_elo is None (dio {unlock[slug]})")

print("3. Elo de desbloqueo de una fila con varias plantillas: promedio en θ, no en rating redondeado")
# "prod" junta 5 plantillas de tier 4; se les pone n_players=0 salvo a dos, con
# betas bien distintas, para que promediar EN RATING (redondeando cada una
# antes) pueda dar un entero distinto de promediar EN θ (redondeando una sola
# vez al final). Las otras tres quedan en la semilla del tier (beta=0, n=0).
db.add(GameTemplateStat(template_key="t4_pow_sin", tier=4, beta=-1.0, n_players=12))
db.add(GameTemplateStat(template_key="t4_pow_exp", tier=4, beta=2.0, n_players=12))
db.commit()

from game.templates import TEMPLATE_BY_KEY  # noqa: E402

keys_prod = game_stats.ROW_TEMPLATES["prod"]
thetas = []
for key in keys_prod:
    st = db.query(GameTemplateStat).filter(GameTemplateStat.template_key == key).first()
    tier = TEMPLATE_BY_KEY[key].tier
    beta = st.beta if st is not None else elo.BETA_SEED.get(tier, 0.0)
    n_players = st.n_players if st is not None else 0
    thetas.append(game_stats._unlock_theta(beta, tier, n_players))
esperado_promediando_en_theta = elo.rating_of(sum(thetas) / len(thetas))
esperado_promediando_ratings = round(
    sum(elo.rating_of(t) for t in thetas) / len(thetas)
)

unlock = game_stats._unlock_ratings(db)
check(
    unlock["prod"] == esperado_promediando_en_theta,
    f"prod.unlock_elo == {esperado_promediando_en_theta} (promedio en θ), dio {unlock['prod']}",
)
if esperado_promediando_en_theta != esperado_promediando_ratings:
    check(
        unlock["prod"] != esperado_promediando_ratings,
        f"y de paso difiere del promedio-en-rating ({esperado_promediando_ratings}), como se esperaba",
    )

print("4. histograma: bots y jugadores bajo el umbral no cuentan")
hist = game_stats._histograma(db, FOCO)
check(hist["enough"], f"con 21 calificados (20 relleno + foco) alcanza MIN_HISTOGRAM_PLAYERS (dio enough={hist['enough']}, n={hist['n_players']})")
check(hist["n_players"] == 21, f"n_players == 21, ni el novato (3) ni el bot cuentan (dio {hist['n_players']})")

print("5. el endpoint respeta el gate de visibilidad")
Base.metadata.create_all(bind=database.engine)
client = TestClient(main.app, raise_server_exceptions=True)

bajo_umbral = GamePlayer(alias="recien-empieza", theta=0.0, xp=0,
                          exercises_correct=5, exercises_attempted=8, is_bot=False)
db.add(bajo_umbral)
db.commit()
token = "tok-" + bajo_umbral.alias
bajo_umbral.guest_token = token
db.commit()

r = client.get("/game/derivemos/stats", headers={"X-Game-Token": token})
check(r.status_code == 403, f"jugador con 5 correctas: /stats da 403 (dio {r.status_code})")

FOCO.guest_token = "tok-foco"
db.commit()
r2 = client.get("/game/derivemos/stats", headers={"X-Game-Token": "tok-foco"})
check(r2.status_code == 200, f"jugador con 42 correctas: /stats da 200 (dio {r2.status_code})")
body = r2.json()
check(len(body["rows"]) == 14, f"14 filas en la respuesta (dio {len(body['rows'])})")
check(body["general"]["exercises_correct"] == 42, "general.exercises_correct viaja bien")
fila_e_x = next(f for f in body["rows"] if f["slug"] == "e_x")
check(fila_e_x["accuracy"] == 50, f"la fila e_x del endpoint también da 50% (dio {fila_e_x['accuracy']})")
check(
    fila_e_x["avg_response_ms"] == esperado_ms,
    f"y el mismo avg_response_ms ({esperado_ms}), dio {fila_e_x['avg_response_ms']}",
)

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
