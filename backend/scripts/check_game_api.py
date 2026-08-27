"""Verifica los endpoints del minijuego (Fase 2) con TestClient, sin Clerk.

Cubre: alta de guest e idempotencia, next/answer (parseo inválido sin consumir
intento, feedback específico por error predecible, acierto con XP y rank),
cierre a los 2 intentos, PATCH de perfil (alias 403 para guests), leaderboard
around_me, y el merge guest→user a nivel función (el camino con Clerk real se
prueba a mano en la Fase 4).

Uso:
    python backend/scripts/check_game_api.py

Sale con código 1 si algo falla.
"""

import json
import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_api.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from game import xp as game_xp  # noqa: E402
from models import Base, GameExercise, GamePlayer, User  # noqa: E402

Base.metadata.create_all(bind=database.engine)

# Importar main después de crear el esquema; el lifespan (seed) no corre porque
# no usamos el TestClient como context manager.
import main  # noqa: E402

client = TestClient(main.app, raise_server_exceptions=True)
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    status = "ok" if condition else "FAIL"
    print(f"  [{status}] {label}")
    if not condition:
        FAILURES.append(label)


print("1. alta de guest")
r = client.post("/game/derivadas/player", json={"group_id": "uba042", "utm_source": "uba"})
check(r.status_code == 200, f"POST /player responde 200 (dio {r.status_code})")
body = r.json()
token = body.get("guest_token")
alias = body["player"]["alias"]
check(bool(token), "devuelve guest_token")
check(body["player"]["is_guest"], "is_guest=true")
check(body["player"]["rank"] == 1, f"rank inicial 1 (dio {body['player']['rank']})")

H = {"X-Game-Token": token}
r2 = client.post("/game/derivadas/player", json={}, headers=H)
check(r2.json()["player"]["alias"] == alias, "idempotente con el mismo token")

db = database.SessionLocal()
row = db.query(GamePlayer).filter(GamePlayer.guest_token == token).first()
check(row.first_group_id == "uba042" and row.first_utm_source == "uba", "atribución persistida")

print("2. next + answer")
r = client.post("/game/derivadas/next", headers=H)
check(r.status_code == 200 and r.json()["prompt_latex"], "sirve ejercicio")
check(r.json()["tier"] == 0, f"rampa: primer ejercicio tier 0 (dio {r.json()['tier']})")
check(isinstance(r.json().get("keys"), list), "la fila de teclas viaja en /next")

ex_id = r.json()["exercise_id"]
r = client.post(
    "/game/derivadas/answer",
    headers=H,
    json={"exercise_id": ex_id, "answer_latex": "z", "answer_mathjson": "z"},
)
check(r.status_code == 200 and not r.json()["parse_ok"], "mathjson inválido -> parse_ok=false")
check(r.json()["attempts_left"] == 2, "parseo inválido no consume intento")

# Ejercicio forzado con derivada conocida, para probar el circuito completo.
forced = GameExercise(
    player_id=row.id,
    template_key="t1_kpow",
    prompt_latex="3x^{2} + 2x",
    expected_derivative="6*x + 2",
    common_errors_json=json.dumps(
        [{"expr": "6*x", "feedback": "La constante suelta desaparece... ¿seguro?"}]
    ),
    theta_at_serve=0.0,
    beta_at_serve=-1.6,
    p_hat=0.78,
    status="served",
)
# El served anterior sigue abierto: expirarlo como haría /next.
db.query(GameExercise).filter(GameExercise.player_id == row.id).update({"status": "expired"})
db.add(forced)
db.commit()
forced_id = forced.id
db.close()

r = client.post(
    "/game/derivadas/answer",
    headers=H,
    json={"exercise_id": forced_id, "answer_latex": "6x", "answer_mathjson": ["Multiply", 6, "x"]},
)
j = r.json()
check(not j["correct"] and j["parse_ok"], "respuesta errónea detectada")
check("¿seguro?" in (j["feedback_incorrect"] or ""), "feedback específico del error predecible")
check(j["attempt_number"] == 1 and j["attempts_left"] == 1, "consume el intento 1")
check(j["xp_awarded"] == 0, "sin XP por fallo")

r = client.post(
    "/game/derivadas/answer",
    headers=H,
    json={
        "exercise_id": forced_id,
        "answer_latex": "2(3x+1)",
        # Forma equivalente 2·(3x+1) = 6x+2: la equivalencia numérica la acepta.
        "answer_mathjson": ["Multiply", 2, ["Add", ["Multiply", 3, "x"], 1]],
    },
)
j = r.json()
check(j["correct"], "acierta al 2º intento con forma equivalente")
expected_second = game_xp.XP_BY_ATTEMPT[2]
check(
    j["xp_awarded"] == expected_second,
    f"XP de 2º intento = {expected_second} (dio {j['xp_awarded']})",
)
check(j["attempts_left"] == 0, "ejercicio cerrado")

r = client.post(
    "/game/derivadas/answer",
    headers=H,
    json={"exercise_id": forced_id, "answer_latex": "x", "answer_mathjson": "x"},
)
check(r.status_code == 409, "responder un ejercicio cerrado -> 409")

print("3. perfil")
r = client.patch("/game/derivadas/me", headers=H, json={"alias": "pirata123"})
check(r.status_code == 403, "guest no edita alias (403)")
r = client.patch(
    "/game/derivadas/me", headers=H, json={"university": "uba", "career": "T"}
)
check(r.status_code == 200 and r.json()["university"] == "UBA", "universidad canonicalizada")
check(r.json()["career"] == "T", "carrera persistida")
r = client.patch("/game/derivadas/me", headers=H, json={"career": "Otra"})
check(r.status_code == 200 and r.json()["career"] is None, "carrera 'Otra' queda NULL")

print("4. leaderboard")
r_b = client.post("/game/derivadas/player", json={})
token_b = r_b.json()["guest_token"]
r = client.get("/game/derivadas/leaderboard", params={"around_me": True}, headers={"X-Game-Token": token_b})
j = r.json()
check(r.status_code == 200 and j["me"]["rank"] == 2, f"el nuevo con 0 xp va último (rank {j['me']['rank']})")
mine = [e for e in j["entries"] if e["is_current_player"]]
check(len(mine) == 1 and mine[0]["rank"] == j["me"]["rank"], "around_me incluye la fila propia")
r = client.get("/game/derivadas/leaderboard", headers=H)
check(r.json()["entries"][0]["xp"] >= r.json()["entries"][-1]["xp"], "orden xp desc")
check(all("level" in e for e in r.json()["entries"]), "cada fila trae su nivel")

# El jugador A quedó con universidad UBA y carrera NULL (bucket "Otra").
r = client.get("/game/derivadas/leaderboard/summary", headers=H)
j = r.json()
check(r.status_code == 200 and j["players"] == 1, f"summary: 1 jugador con xp (dio {j['players']})")
check(j["exercises"] == 1, f"summary: 1 derivada resuelta (dio {j['exercises']})")
check(j["universities"] == ["UBA"], f"summary: universidades del filtro {j['universities']}")

r = client.get("/game/derivadas/leaderboard", params={"university": "UBA"}, headers=H)
check(r.json()["me"]["rank"] == 1, "filtro por la universidad propia: sigo en el ranking")
r = client.get("/game/derivadas/leaderboard", params={"university": "UTN"}, headers=H)
j = r.json()
check(j["me"]["rank"] is None and j["entries"] == [], "filtro por otra universidad: quedo afuera")
r = client.get("/game/derivadas/leaderboard", params={"career": "Otra"}, headers=H)
check(r.json()["me"]["rank"] == 1, "filtro por bucket de carrera 'Otra'")

r = client.get("/game/derivadas/leaderboard/universities", headers=H)
j = r.json()
check(
    r.status_code == 200 and [row["university"] for row in j["rows"]] == ["UBA"],
    f"ranking por universidad {[row['university'] for row in j['rows']]}",
)
check(j["rows"][0]["careers"]["Otra"] == 1, "agrega por bucket de carrera")

print("5. reset de progreso")
before = client.get("/game/derivadas/me", headers=H).json()
check(before["xp"] > 0 and before["exercises_attempted"] > 0, "hay progreso que borrar")
db = database.SessionLocal()
# `row` viene de una sesión ya cerrada: se vuelve a resolver por token.
player_id = db.query(GamePlayer).filter(GamePlayer.guest_token == token).first().id
open_ex = GameExercise(
    player_id=player_id,
    template_key="t1_kpow",
    prompt_latex="x^{2}",
    expected_derivative="2*x",
    common_errors_json="[]",
    theta_at_serve=0.0,
    beta_at_serve=-1.6,
    p_hat=0.78,
    status="served",
)
db.add(open_ex)
db.commit()
open_id = open_ex.id
db.close()

r = client.post("/game/derivadas/reset", headers=H)
j = r.json()
check(r.status_code == 200 and j["xp"] == 0, f"XP a cero (dio {j['xp']})")
check(
    j["exercises_correct"] == 0 and j["exercises_attempted"] == 0 and j["combo"] == 0,
    "contadores a cero",
)
check(j["best_rank"] is None, "mejor puesto olvidado")
check(j["university"] == before["university"] and j["alias"] == before["alias"], "identidad intacta")
db = database.SessionLocal()
fresh = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
check(fresh.theta == 0.0 and fresh.n_updates == 0, "Elo reiniciado (vuelve a la rampa)")
check(
    db.query(GameExercise).filter(GameExercise.id == open_id).first().status == "expired",
    "el ejercicio abierto queda expirado",
)
db.close()
r = client.post("/game/derivadas/next", headers=H)
check(r.json()["tier"] == 0, f"tras reiniciar vuelve a tier 0 (dio {r.json()['tier']})")

print("6. saltear")
# Se lo empuja fuera de la rampa y a un θ medio para que la servida no sea T0:
# saltear desde el piso no tendría nada más fácil que ofrecer.
db = database.SessionLocal()
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
p.theta = 1.6
p.n_updates = 20
p.current_combo = 4
db.commit()
theta_before = p.theta
attempted_before = p.exercises_attempted
db.close()

ex = client.post("/game/derivadas/next", headers=H).json()
check(ex["tier"] > 0, f"el ejercicio a saltear no es del piso (tier {ex['tier']})")

r = client.post("/game/derivadas/skip", headers=H, json={"exercise_id": ex["exercise_id"]})
check(r.status_code == 200, f"POST /skip responde 200 (dio {r.status_code})")
nxt = r.json()
check(nxt["exercise_id"] != ex["exercise_id"], "devuelve un ejercicio nuevo")
check(nxt["tier"] < ex["tier"], f"el nuevo es más fácil ({ex['tier']} -> {nxt['tier']})")

db = database.SessionLocal()
after = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
drop = theta_before - after.theta
check(abs(drop - 0.15) < 1e-9, f"θ baja 0.15 exactas (dio {drop:.4f})")
check(after.current_combo == 0, "corta la racha")
check(after.exercises_attempted == attempted_before, "no suma a los ejercicios intentados")
check(
    db.query(GameExercise).filter(GameExercise.id == ex["exercise_id"]).first().status == "skipped",
    "el salteado queda en 'skipped', no 'expired'",
)
db.close()

r = client.post("/game/derivadas/skip", headers=H, json={"exercise_id": ex["exercise_id"]})
check(r.status_code == 409, f"saltear dos veces el mismo da 409 (dio {r.status_code})")

print("7. merge guest→user (nivel función)")
from game.deps import link_guest_to_user  # noqa: E402

db = database.SessionLocal()
user = User(email="merge@test.dev", name="Merge Test", username="mergetest")
db.add(user)
db.commit()
guest_a = db.query(GamePlayer).filter(GamePlayer.guest_token == token).first()
xp_a = guest_a.xp
linked = link_guest_to_user(db, guest_a, user)
check(linked.user_id == user.id and linked.xp == xp_a, "link directo conserva xp")
check(link_guest_to_user(db, linked, user).id == linked.id, "link idempotente")

guest_b = db.query(GamePlayer).filter(GamePlayer.guest_token == token_b).first()
guest_b.xp = 7
guest_b.exercises_correct = 2
db.commit()
merged = link_guest_to_user(db, guest_b, user)
check(merged.id == linked.id, "sobrevive la fila del user")
check(merged.xp == xp_a + 7, f"XP sumado en el merge (dio {merged.xp})")
check(
    db.query(GamePlayer).filter(GamePlayer.guest_token == token_b).first() is None,
    "la fila guest mergeada se borra",
)
db.close()

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
