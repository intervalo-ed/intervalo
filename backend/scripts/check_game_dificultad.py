"""Verifica la palanca de dificultad (game/dificultad.py).

La palanca decide qué se le sirve a cada uno, así que se puede romper de formas
que no dan error y que solo se ven semanas después en el ranking o en el panel.
Cada sección tapa un agujero concreto:

  - **las nueve posiciones existen y se ordenan.** θ crece con la posición, el
    color (nivel) no baja, y ninguna cae donde el catálogo no tiene qué servir;
  - **elegir más abajo sirve más difícil de verdad.** Sin esto la palanca es un
    adorno que el panel mediría como «sin efecto»;
  - **apagada, o sin elegir, es el motor de siempre.** Al byte: la misma
    plantilla con la misma semilla;
  - **la rampa y el salteo siguen mandando.** La palanca no los afloja;
  - **θ real se mueve y la β de la plantilla NO.** Es la mitad del diseño: sin
    esto quien se pone en lo más difícil hunde las β para todos;
  - **el p̂ guardado es contra θ real**, que es lo que mide la calibración;
  - **el contrato**: acepta 0 a 8 y null, rechaza lo demás, `/reset` la borra y
    con el interruptor apagado ni se ofrece ni se acepta.

Uso:
    python backend/scripts/check_game_dificultad.py

Sale con código 1 si algo falla.
"""

import os
import random
import statistics
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_dificultad.db"
).replace("\\", "/")
os.environ["DIFICULTAD_ENABLED"] = "1"
# Este check mide la palanca, no las ayudas de la rampa.
os.environ["RAMPA_ENABLED"] = "0"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from game import dificultad, elo, generator  # noqa: E402
from game.templates import TEMPLATE_BY_KEY  # noqa: E402
from models import Base, GameExercise, GamePlayer, GameTemplateStat  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402

client = TestClient(main.app, raise_server_exceptions=True)
db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str, extra: str = "") -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}{(' ' + extra) if extra else ''}")
    if not condition:
        FAILURES.append(label)


def jugador(pid: int, theta: float, pos: int | None, attempts: int = 60) -> GamePlayer:
    p = GamePlayer(id=pid, alias=f"p{pid}", guest_token=f"t{pid}", theta=theta,
                   n_updates=60, exercises_attempted=attempts, dificultad=pos)
    db.add(p)
    db.commit()
    return p


# ── 1 · Las posiciones ──────────────────────────────────────────────────────
print("1. las nueve posiciones")
th = dificultad.THETA_DE_POSICION
check(len(th) == dificultad.POSICIONES == 9, "hay nueve", f"({len(th)})")
check(all(a < b for a, b in zip(th, th[1:])), "θ crece con la posición")
niveles = [dificultad.nivel_de_posicion(k) for k in range(9)]
check(all(a <= b for a, b in zip(niveles, niveles[1:])), "y el nivel (el color) no baja",
      f"({niveles})")
check(niveles[0] == 0 and niveles[-1] == 3, "la primera es blanca y la última marrón")
# Ninguna posición puede caer donde no hay qué servir. Con las SEMILLAS (el check
# no ve producción) alguna posición puede quedarse sin nada adentro de la banda
# exacta; lo que se exige es que el selector tenga algo a menos de 0,12 del
# centro, que es lo que el rescate de `pick_template` sirve.
semilla = {t.key: elo.BETA_SEED[t.tier] for t in generator.TEMPLATES}
for k, t in enumerate(th):
    cerca = min(abs(elo.predict(t, b) - elo.TARGET_MID) for b in semilla.values())
    check(cerca <= 0.12, f"la posición {k} (θ {t}) tiene algo cerca del centro de la banda",
          f"(a {cerca:.3f})")
check(dificultad.es_posicion(0) and dificultad.es_posicion(8), "0 y 8 son posiciones")
check(not any(dificultad.es_posicion(v) for v in (-1, 9, True, 1.5, "3", None)),
      "y -1, 9, bool, float, texto y None no")

# ── 2 · Elegir más abajo sirve más difícil ──────────────────────────────────
print("\n2. lo que cada posición sirve")
bajo = jugador(1, 1.2, 0)
alto = jugador(2, 1.2, 8)
sin = jugador(3, 1.2, None)
tiers = {1: [], 2: [], 3: []}
for _ in range(120):
    for pid, pl in ((1, bajo), (2, alto), (3, sin)):
        tpl, _, _ = generator.pick_template(db, pl, random.Random(_ * 7 + pid))
        tiers[pid].append(tpl.tier)
m = {k: statistics.fmean(v) for k, v in tiers.items()}
check(m[1] < m[3] < m[2], "posición 0 < motor < posición 8 en tier medio",
      f"(0: {m[1]:.2f}, motor: {m[3]:.2f}, 8: {m[2]:.2f})")
check(m[2] - m[1] > 2.0, "y la diferencia entre extremos es de más de dos tiers",
      f"({m[2] - m[1]:.2f})")

# ── 3 · Apagada o sin elegir: el motor de siempre ───────────────────────────
print("\n3. apagada o sin elegir")
a = [generator.pick_template(db, sin, random.Random(5 + i))[0].key for i in range(40)]
os.environ["DIFICULTAD_ENABLED"] = "0"
b = [generator.pick_template(db, alto, random.Random(5 + i))[0].key for i in range(40)]
c = [generator.pick_template(db, sin, random.Random(5 + i))[0].key for i in range(40)]
check(a == b == c, "apagada: quien eligió y quien no reciben exactamente lo mismo")
check(dificultad.theta_de_juego(alto) == alto.theta, "θ de juego es el real")
os.environ["DIFICULTAD_ENABLED"] = "1"
check(dificultad.habilitado(), "y se vuelve a prender")
del os.environ["DIFICULTAD_ENABLED"]
check(not dificultad.habilitado(), "sin la variable, arranca APAGADA")
os.environ["DIFICULTAD_ENABLED"] = "1"

# ── 4 · La rampa y el salteo siguen mandando ────────────────────────────────
print("\n4. la rampa y el salteo")
nuevo = jugador(4, 0.0, 8, attempts=3)
tope = elo.max_tier_de(nuevo.exercises_attempted)
check(tope is not None, "con 3 respuestas hay tope de rampa", f"({tope})")
mx = max(generator.pick_template(db, nuevo, random.Random(i))[0].tier for i in range(60))
check(mx <= tope, "y la posición 8 no lo afloja", f"(sirvió hasta T{mx}, tope T{tope})")
mx = max(generator.pick_template(db, alto, random.Random(i), max_tier=2)[0].tier for i in range(60))
check(mx <= 2, "el tope del salteo tampoco", f"(T{mx})")

# ── 5 · p̂ guardado contra θ real ────────────────────────────────────────────
print("\n5. lo que queda registrado")
tpl, stat, p_hat = generator.pick_template(db, alto, random.Random(1))
esperado = elo.predict(alto.theta, generator.beta_of(stat))
check(abs(p_hat - esperado) < 1e-9, "p̂ es contra θ real, no contra la posición",
      f"({p_hat:.3f} contra {esperado:.3f})")
check(p_hat < 0.5, "y con la posición 8 es bajo, que es lo que el motor cree de verdad",
      f"({p_hat:.3f})")

# ── 6 · θ real se mueve, la β no ────────────────────────────────────────────
print("\n6. θ real y β")
r = client.post("/game/derivemos/player", json={})
token = r.json()["guest_token"]
H = {"X-Game-Token": token}
pid = r.json()["player"]["player_id"]
p = db.get(GamePlayer, pid)
p.exercises_attempted = 40
p.n_updates = 40
p.theta = 1.0
db.commit()


def beta_de(clave: str) -> float | None:
    db.expire_all()
    st = db.query(GameTemplateStat).filter(GameTemplateStat.template_key == clave).first()
    return st.beta if st else None


def responder(con_posicion: int | None) -> tuple[float, float, float, float]:
    """Acierta `3x² + 2x` y devuelve (θ antes, θ después, β antes, β después)."""
    p = db.get(GamePlayer, pid)
    p.dificultad = con_posicion
    db.query(GameExercise).filter(GameExercise.player_id == pid).update({"status": "expired"})
    ej = GameExercise(player_id=pid, template_key="t1_kpow", prompt_latex="3x^{2} + 2x",
                      expected_derivative="6*x + 2", common_errors_json="[]",
                      theta_at_serve=p.theta, beta_at_serve=-1.2, p_hat=0.8, status="served")
    db.add(ej)
    db.commit()
    th0, b0 = db.get(GamePlayer, pid).theta, beta_de("t1_kpow")
    r = client.post("/game/derivemos/answer", headers=H, json={
        "exercise_id": ej.id, "answer_latex": "6x+2",
        "answer_mathjson": ["Add", ["Multiply", 6, "x"], 2]})
    assert r.json()["correct"], r.json()
    db.expire_all()
    return th0, db.get(GamePlayer, pid).theta, b0, beta_de("t1_kpow")


th0, th1, b0, b1 = responder(None)
check(th1 != th0 and b1 != b0, "sin posición: se mueven θ y la β (el motor de siempre)",
      f"(θ {th0:.3f}→{th1:.3f}, β {b0}→{b1:.3f})")
th0, th1, b0, b1 = responder(8)
check(th1 != th0, "con posición: θ real SE MUEVE", f"({th0:.3f}→{th1:.3f})")
check(b1 == b0, "con posición: la β NO", f"({b0:.3f}→{b1:.3f})")

# ── 7 · El contrato ─────────────────────────────────────────────────────────
print("\n7. el contrato")
me = client.get("/game/derivemos/me", headers=H).json()
check(me["dificultad_disponible"] is True, "/me dice que está disponible")
for v in (0, 4, 8):
    rr = client.patch("/game/derivemos/me", headers=H, json={"dificultad": v})
    check(rr.status_code == 200 and rr.json()["dificultad"] == v, f"PATCH acepta {v}")
for v in (-1, 9, 100):
    rr = client.patch("/game/derivemos/me", headers=H, json={"dificultad": v})
    check(rr.status_code == 422, f"PATCH rechaza {v}", f"(dio {rr.status_code})")
rr = client.patch("/game/derivemos/me", headers=H, json={"dificultad": None})
check(rr.status_code == 200 and rr.json()["dificultad"] is None, "null vuelve al motor")
rr = client.patch("/game/derivemos/me", headers=H, json={"career": "T"})
client.patch("/game/derivemos/me", headers=H, json={"dificultad": 5})
rr = client.patch("/game/derivemos/me", headers=H, json={"career": "T"})
check(rr.json()["dificultad"] == 5, "tocar otro campo no borra la posición")
rr = client.post("/game/derivemos/reset", headers=H)
check(rr.json()["dificultad"] is None, "/reset la borra")
os.environ["DIFICULTAD_ENABLED"] = "0"
me = client.get("/game/derivemos/me", headers=H).json()
check(me["dificultad_disponible"] is False and me["dificultad"] is None,
      "apagada: /me no la ofrece")
rr = client.patch("/game/derivemos/me", headers=H, json={"dificultad": 3})
check(rr.status_code == 404, "y el PATCH no la acepta", f"(dio {rr.status_code})")
os.environ["DIFICULTAD_ENABLED"] = "1"

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    raise SystemExit(1)
print("todos los chequeos pasaron")
