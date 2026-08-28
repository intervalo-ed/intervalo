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
from models import (  # noqa: E402
    Base,
    GameBoost,
    GameExercise,
    GamePlayer,
    GameTemplateStat,
    User,
)

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
r = client.post("/game/derivemos/player", json={"group_id": "uba042", "utm_source": "uba"})
check(r.status_code == 200, f"POST /player responde 200 (dio {r.status_code})")
body = r.json()
token = body.get("guest_token")
alias = body["player"]["alias"]
check(bool(token), "devuelve guest_token")
check(body["player"]["is_guest"], "is_guest=true")
check(body["player"]["rank"] == 1, f"rank inicial 1 (dio {body['player']['rank']})")

H = {"X-Game-Token": token}
r2 = client.post("/game/derivemos/player", json={}, headers=H)
check(r2.json()["player"]["alias"] == alias, "idempotente con el mismo token")

db = database.SessionLocal()
row = db.query(GamePlayer).filter(GamePlayer.guest_token == token).first()
check(row.first_group_id == "uba042" and row.first_utm_source == "uba", "atribución persistida")

print("2. next + answer")
r = client.post("/game/derivemos/next", headers=H)
check(r.status_code == 200 and r.json()["prompt_latex"], "sirve ejercicio")
check(r.json()["tier"] == 0, f"rampa: primer ejercicio tier 0 (dio {r.json()['tier']})")
check(isinstance(r.json().get("keys"), list), "la fila de teclas viaja en /next")

ex_id = r.json()["exercise_id"]
r = client.post(
    "/game/derivemos/answer",
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
    "/game/derivemos/answer",
    headers=H,
    json={"exercise_id": forced_id, "answer_latex": "6x", "answer_mathjson": ["Multiply", 6, "x"]},
)
j = r.json()
check(not j["correct"] and j["parse_ok"], "respuesta errónea detectada")
check("¿seguro?" in (j["feedback_incorrect"] or ""), "feedback específico del error predecible")
check(j["attempt_number"] == 1 and j["attempts_left"] == 1, "consume el intento 1")
check(j["xp_awarded"] == 0, "sin XP por fallo")

r = client.post(
    "/game/derivemos/answer",
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

# Reintento sobre un ejercicio ya cerrado. Antes daba un 409 pelado; ahora repite
# el resultado que ese ejercicio ya había dado. Es el caso de la conexión que se
# corta después de que el server respondió: el cliente reintenta y no puede
# llevarse un error por una respuesta que estuvo bien y que ya le fue contada.
# Se manda una respuesta DISTINTA y equivocada a propósito: lo que vuelve tiene
# que ser el resultado guardado, no una evaluación nueva.
r = client.post(
    "/game/derivemos/answer",
    headers=H,
    json={"exercise_id": forced_id, "answer_latex": "x", "answer_mathjson": "x"},
)
check(r.status_code == 200, f"reintentar un ejercicio cerrado responde 200 (dio {r.status_code})")
j = r.json()
check(j["correct"] is True, "y repite que estuvo bien, no re-evalua lo que se mando")
check(j["xp_awarded"] == expected_second, f"con la XP que se habia ganado (dio {j['xp_awarded']})")
check(j["attempts_left"] == 0, "y sigue cerrado")

print("3. perfil")
r = client.patch("/game/derivemos/me", headers=H, json={"alias": "pirata123"})
check(r.status_code == 403, "guest no edita alias (403)")
r = client.patch(
    "/game/derivemos/me", headers=H, json={"university": "uba", "career": "T"}
)
check(r.status_code == 200 and r.json()["university"] == "UBA", "universidad canonicalizada")
check(r.json()["career"] == "T", "carrera persistida")
r = client.patch("/game/derivemos/me", headers=H, json={"career": "Otra"})
check(r.status_code == 200 and r.json()["career"] is None, "carrera 'Otra' queda NULL")

print("4. leaderboard")
r_b = client.post("/game/derivemos/player", json={})
token_b = r_b.json()["guest_token"]
r = client.get("/game/derivemos/leaderboard", params={"around_me": True}, headers={"X-Game-Token": token_b})
j = r.json()
check(r.status_code == 200 and j["me"]["rank"] == 2, f"el nuevo con 0 xp va último (rank {j['me']['rank']})")
mine = [e for e in j["entries"] if e["is_current_player"]]
check(len(mine) == 1 and mine[0]["rank"] == j["me"]["rank"], "around_me incluye la fila propia")
r = client.get("/game/derivemos/leaderboard", headers=H)
check(r.json()["entries"][0]["xp"] >= r.json()["entries"][-1]["xp"], "orden xp desc")
check(all("level" in e for e in r.json()["entries"]), "cada fila trae su nivel")

# El jugador A quedó con universidad UBA y carrera NULL (bucket "Otra").
r = client.get("/game/derivemos/leaderboard/summary", headers=H)
j = r.json()
check(r.status_code == 200 and j["players"] == 1, f"summary: 1 jugador con xp (dio {j['players']})")
check(j["exercises"] == 1, f"summary: 1 derivada resuelta (dio {j['exercises']})")
check(j["universities"] == ["UBA"], f"summary: universidades del filtro {j['universities']}")

r = client.get("/game/derivemos/leaderboard", params={"university": "UBA"}, headers=H)
check(r.json()["me"]["rank"] == 1, "filtro por la universidad propia: sigo en el ranking")
r = client.get("/game/derivemos/leaderboard", params={"university": "UTN"}, headers=H)
j = r.json()
check(j["me"]["rank"] is None and j["entries"] == [], "filtro por otra universidad: quedo afuera")
r = client.get("/game/derivemos/leaderboard", params={"career": "Otra"}, headers=H)
check(r.json()["me"]["rank"] == 1, "filtro por bucket de carrera 'Otra'")

r = client.get("/game/derivemos/leaderboard/universities", headers=H)
j = r.json()
check(
    r.status_code == 200 and [row["university"] for row in j["rows"]] == ["UBA"],
    f"ranking por universidad {[row['university'] for row in j['rows']]}",
)
check(j["rows"][0]["careers"]["Otra"] == 1, "agrega por bucket de carrera")

print("5. reset de progreso")
before = client.get("/game/derivemos/me", headers=H).json()
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

r = client.post("/game/derivemos/reset", headers=H)
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
r = client.post("/game/derivemos/next", headers=H)
check(r.json()["tier"] == 0, f"tras reiniciar vuelve a tier 0 (dio {r.json()['tier']})")

def cerrar_abiertos(player_id: int) -> None:
    """Cierra los ejercicios que hayan quedado servidos.

    Hace falta desde que /next devuelve el ejercicio abierto en vez de servir uno
    nuevo (era un salteo gratis, sin el castigo de /skip). El cliente real nunca
    pide uno con otro abierto —responde o saltea primero— pero el armado de estos
    chequeos sí lo hacia.
    """
    db = database.SessionLocal()
    db.query(GameExercise).filter(
        GameExercise.player_id == player_id, GameExercise.status == "served"
    ).update({"status": "expired"}, synchronize_session=False)
    db.commit()
    db.close()


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

cerrar_abiertos(player_id)
ex = client.post("/game/derivemos/next", headers=H).json()
check(ex["tier"] > 0, f"el ejercicio a saltear no es del piso (tier {ex['tier']})")

r = client.post("/game/derivemos/skip", headers=H, json={"exercise_id": ex["exercise_id"]})
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

r = client.post("/game/derivemos/skip", headers=H, json={"exercise_id": ex["exercise_id"]})
check(r.status_code == 409, f"saltear dos veces el mismo da 409 (dio {r.status_code})")

print("7. responder con la tabla abierta")
db = database.SessionLocal()
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
p.theta = 1.2
p.n_updates = 20
p.current_combo = 3
db.commit()
antes = {
    "theta": p.theta,
    "n_updates": p.n_updates,
    "combo": p.current_combo,
    "attempted": p.exercises_attempted,
    "xp": p.xp,
}
db.close()

# Otro ejercicio forzado de derivada conocida: acá lo que se mide es qué se
# mueve y qué no, así que conviene una respuesta correcta sin ambigüedad.
db = database.SessionLocal()
db.query(GameExercise).filter(GameExercise.player_id == player_id).update(
    {"status": "expired"}, synchronize_session=False
)
espiado = GameExercise(
    player_id=player_id,
    template_key="t1_kpow",
    prompt_latex="5x^{2}",
    expected_derivative="10*x",
    common_errors_json="[]",
    theta_at_serve=1.2,
    beta_at_serve=-1.6,
    p_hat=0.78,
    status="served",
)
db.add(espiado)
db.commit()
espiado_id = espiado.id
stat_antes = (
    db.query(GameTemplateStat).filter(GameTemplateStat.template_key == "t1_kpow").first()
)
beta_antes, obs_antes = stat_antes.beta, stat_antes.n_observations
db.close()

r = client.post(
    "/game/derivemos/answer",
    headers=H,
    json={
        "exercise_id": espiado_id,
        "answer_latex": "10x",
        "answer_mathjson": ["Multiply", 10, "x"],
        "peeked": True,
    },
)
j = r.json()
check(j["correct"] is True, f"la respuesta correcta sigue siendo correcta (dio {j['correct']})")
check(
    j["xp_awarded"] == game_xp.XP_PEEKED,
    f"paga XP_PEEKED y no la XP normal (dio {j['xp_awarded']})",
)
check(j["combo_bonus"] == 0, "no paga bonus de combo")

db = database.SessionLocal()
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
check(p.theta == antes["theta"], f"θ no se mueve (dio {p.theta})")
check(p.n_updates == antes["n_updates"], "no cuenta para la rampa (n_updates)")
check(p.current_combo == antes["combo"] + 1, f"la racha sigue subiendo (dio {p.current_combo})")
check(
    p.exercises_attempted == antes["attempted"] + 1,
    "sí cuenta como ejercicio intentado",
)
check(p.xp == antes["xp"] + game_xp.XP_PEEKED, "suma la XP chica")
stat_desp = (
    db.query(GameTemplateStat).filter(GameTemplateStat.template_key == "t1_kpow").first()
)
check(
    stat_desp.beta == beta_antes and stat_desp.n_observations == obs_antes,
    "tampoco mueve la calibración de la plantilla (beta/observaciones)",
)
db.close()

print("8. merge guest→user (nivel función)")
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

print("9. empuje de XP por universidad (cafecitos)")
from datetime import datetime, timedelta  # noqa: E402

from game import boosts as game_boosts
from game import elo as game_elo  # noqa: E402


def _forzar_ejercicio(combo: int) -> int:
    """Sirve a mano un ejercicio de derivada conocida y deja la racha donde se
    quiera. Fijar la racha es lo que hace comparables dos respuestas: si
    `combo_after` cae en un múltiplo de COMBO_INTERVAL aparece el bonus y la XP
    deja de ser la misma."""
    db = database.SessionLocal()
    db.query(GameExercise).filter(GameExercise.player_id == player_id).update(
        {"status": "expired"}, synchronize_session=False
    )
    p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
    p.current_combo = combo
    ex = GameExercise(
        player_id=player_id,
        template_key="t1_kpow",
        prompt_latex="5x^{2}",
        expected_derivative="10*x",
        common_errors_json="[]",
        theta_at_serve=1.2,
        beta_at_serve=-1.6,
        p_hat=0.78,
        status="served",
    )
    db.add(ex)
    db.commit()
    ex_id = ex.id
    db.close()
    return ex_id


def _responder(ex_id: int) -> dict:
    return client.post(
        "/game/derivemos/answer",
        headers=H,
        json={
            "exercise_id": ex_id,
            "answer_latex": "10x",
            "answer_mathjson": ["Multiply", 10, "x"],
        },
    ).json()


# El jugador se muda a la UBA ANTES de que exista ningún empuje: la primera
# carga no marca university_set_at, así que le corresponde.
db = database.SessionLocal()
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
p.university = "UBA"
p.university_set_at = None
db.commit()
db.close()

base = _responder(_forzar_ejercicio(combo=0))
check(base["xp_multiplier"] == 1.0, f"sin empuje el multiplicador es 1.0 (dio {base['xp_multiplier']})")
xp_base = base["xp_awarded"]
check(xp_base > 0, f"la respuesta sin empuje paga XP (dio {xp_base})")

db = database.SessionLocal()
game_boosts.grant(db, university="uba", cafecitos=4, donor_name="Nico")
db.commit()
mult = game_boosts.multiplier_for(db, "UBA")
db.close()
check(abs(mult - 1.4) < 1e-9, f"4 cafecitos dan ×1,4 (dio {mult})")

con = _responder(_forzar_ejercicio(combo=0))
check(
    abs(con["xp_multiplier"] - 1.4) < 1e-9,
    f"la respuesta informa el multiplicador (dio {con['xp_multiplier']})",
)
check(
    con["xp_awarded"] == round(xp_base * 1.4),
    f"la XP viene multiplicada y redondeada ({xp_base} → {con['xp_awarded']})",
)

# El bonus de combo tiene que escalar igual que el total: viaja aparte en la
# respuesta, y un "+15" adentro de un total multiplicado se lee como un error.
con_bonus = _responder(_forzar_ejercicio(combo=game_xp.COMBO_INTERVAL - 1))
check(
    con_bonus["combo_bonus"] == round(game_xp.COMBO_BONUS * 1.4),
    f"el bonus de combo también escala (dio {con_bonus['combo_bonus']})",
)

# Sumar: los cafecitos de la ventana se acumulan, no se pisan.
db = database.SessionLocal()
game_boosts.grant(db, university="UBA", cafecitos=3)
db.commit()
check(
    abs(game_boosts.multiplier_for(db, "UBA") - 1.7) < 1e-9,
    "los cafecitos de la ventana se suman (4+3 → ×1,7)",
)
# Una donación gigante aporta +1,0 y ni un décimo más: 4+3 daban ×1,7 y esta
# suma diez cafecitos contables, no cincuenta.
game_boosts.grant(db, university="UBA", cafecitos=50)
db.commit()
check(
    abs(game_boosts.multiplier_for(db, "UBA") - 2.7) < 1e-9,
    f"una donación de 50 aporta como una de 10 (dio "
    f"{game_boosts.multiplier_for(db, 'UBA')}, esperado 2.7)",
)
db.close()

# Idempotencia: la misma donación no puede pagarse dos veces.
db = database.SessionLocal()
primera = game_boosts.grant(db, university="UBA", cafecitos=1, external_ref="cafecito-777")
db.commit()
segunda = game_boosts.grant(db, university="UBA", cafecitos=1, external_ref="cafecito-777")
db.commit()
check(primera is not None and segunda is None, "external_ref repetido no regala el empuje dos veces")
db.close()

# El pulso lleva el empuje, que es como se entera el cartel.
pulso = client.get("/game/derivemos/leaderboard/pulse", headers=H).json()
uba = [b for b in pulso["boosts"] if b["university"] == "UBA"]
check(len(uba) == 1, f"el pulso trae un solo empuje agregado para la UBA (dio {len(uba)})")
check(uba and uba[0]["donor_name"] == "Nico", "el cartel conserva el nombre de quien donó")
check(
    uba and 0 < uba[0]["expires_in_seconds"] <= game_boosts.BOOST_MINUTES_MAX * 60,
    "el pulso manda segundos restantes, no un instante",
)

# El candado: mudarse de universidad DESPUÉS de que arrancó el empuje no cobra.
db = database.SessionLocal()
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
p.university_set_at = datetime.utcnow()
db.commit()
check(not game_boosts.applies_to(p, db), "quien se muda con el empuje en curso no cobra")
db.close()

mudado = _responder(_forzar_ejercicio(combo=0))
check(
    mudado["xp_multiplier"] == 1.0 and mudado["xp_awarded"] == xp_base,
    f"y su XP vuelve a la normal (dio {mudado['xp_awarded']}, base {xp_base})",
)

# Vencido el empuje, todo vuelve a como estaba.
db = database.SessionLocal()
db.query(GameBoost).update(
    {"expires_at": datetime.utcnow() - timedelta(seconds=1)}, synchronize_session=False
)
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
p.university_set_at = None
db.commit()
check(game_boosts.multiplier_for(db, "UBA") == 1.0, "vencido el empuje vuelve a ×1")
db.close()

vencido = _responder(_forzar_ejercicio(combo=0))
check(vencido["xp_awarded"] == xp_base, f"y la XP también (dio {vencido['xp_awarded']})")

print("10. ranking de universidades por Elo promedio")
db = database.SessionLocal()
# CHICA gana por Elo promedio aunque GRANDE tenga MUCHA más XP total: es
# exactamente la propiedad que se busca, que la tabla mida qué tan difícil
# resuelve cada universidad y no cuántas horas le puso. MINI no llega al mínimo
# de jugadores con Elo y va al fondo, pero NO desaparece.
for uni, n, xp_cada, theta in (("CHICA", 12, 300, 1.5), ("GRANDE", 20, 4000, 0.5),
                               ("MINI", 2, 5000, 2.8)):
    for i in range(n):
        db.add(
            GamePlayer(
                alias=f"percapita_{uni.lower()}_{i}",
                university=uni,
                xp=xp_cada,
                theta=theta,
                n_updates=game_elo.RAMP_UPDATES,
                is_bot=True,
            )
        )
# Un novato de CHICA que todavía no salió de la rampa: NO tiene que arrastrar el
# promedio, porque su θ es el valor semilla y no midió nada todavía.
db.add(GamePlayer(alias="percapita_chica_novato", university="CHICA", xp=10,
                  theta=0.0, n_updates=0, is_bot=True))
db.commit()
db.close()

filas = client.get("/game/derivemos/leaderboard/universities", headers=H).json()["rows"]
por_uni = {r["university"]: r for r in filas}
check(
    por_uni["CHICA"]["rating_avg"] > por_uni["GRANDE"]["rating_avg"],
    f"ordena por Elo: CHICA ({por_uni['CHICA']['rating_avg']}) le gana a "
    f"GRANDE ({por_uni['GRANDE']['rating_avg']})",
)
check(
    por_uni["CHICA"]["rating_avg"] == game_elo.rating_of(1.5),
    f"el novato sin rampa no arrastra el promedio (dio {por_uni['CHICA']['rating_avg']}, "
    f"esperado {game_elo.rating_of(1.5)})",
)
check(
    por_uni["CHICA"]["rated_players"] == 12 and por_uni["CHICA"]["players"] == 13,
    "y se distingue cuántos tienen Elo de cuántos son en total",
)
orden = [r["university"] for r in filas]
check(
    orden.index("CHICA") < orden.index("GRANDE"),
    f"y ese orden es el que se devuelve (dio {orden[:4]})",
)
check(
    por_uni["GRANDE"]["xp"] > por_uni["CHICA"]["xp"],
    "aunque GRANDE tenga muchísima más XP total: la XP ya no compra puesto acá",
)
check(por_uni["MINI"]["ranked"] is False, "MINI no llega al mínimo de jugadores")
check("MINI" in por_uni, "pero igual se devuelve, no desaparece")
check(
    orden.index("MINI") > orden.index("GRANDE"),
    "y va al fondo pese a su promedio altísimo",
)

print("11. telemetría de los llamados a la acción")
# El endpoint es trivial de escribir y trivial de romper en silencio: devuelve
# 204 pase lo que pase, así que un vocabulario mal escrito o un commit que no
# ocurre se ven exactamente igual que el éxito desde el cliente. Por eso el
# chequeo mira la FILA, no el código de respuesta.
from models import GameCtaEvent  # noqa: E402

antes = db.query(GameCtaEvent).count()
r = client.post(
    "/game/derivemos/cta",
    json={"cta": "cafecito", "action": "impression", "placement": "milestone", "solved": 7},
    headers=H,
)
check(r.status_code == 204, f"la impresión devuelve 204 (dio {r.status_code})")
fila = db.query(GameCtaEvent).order_by(GameCtaEvent.id.desc()).first()
check(db.query(GameCtaEvent).count() == antes + 1, "y queda persistida")
check(
    fila is not None and fila.cta == "cafecito" and fila.action == "impression",
    "con el qué y el qué pasó",
)
check(fila is not None and fila.solved == 7, "y con el momento de la partida")
check(
    fila is not None and fila.player_id is not None,
    "atada al jugador que la vio",
)

r = client.post(
    "/game/derivemos/cta",
    json={"cta": "no_existe", "action": "impression"},
    headers=H,
)
check(r.status_code == 204, "un vocabulario desconocido tampoco falla")
check(
    db.query(GameCtaEvent).count() == antes + 1,
    "pero no escribe nada: la telemetría no puede inventar categorías",
)

r = client.post("/game/derivemos/cta", json={"cta": "share", "action": "click"})
check(r.status_code == 401, f"sin jugador no hay telemetría (dio {r.status_code})")

print("12. lo que el parser no entiende")
# Dos cosas que la mecánica ya hacía pero que no dejaban rastro, y sin rastro el
# panel no las puede separar de un error de matemática: la consulta a la tabla
# y el envío que no parsea. Las dos se persisten ahora, y las dos tienen que
# seguir SIN cambiar la mecánica — que es la parte fácil de romper.
from models import GameAttempt as _GA, GameExercise as _GE  # noqa: E402

ex_id = client.post("/game/derivemos/next", headers=H).json()["exercise_id"]
r = client.post(
    "/game/derivemos/answer",
    json={"exercise_id": ex_id, "answer_latex": "))(", "answer_mathjson": None},
    headers=H,
)
body = r.json()
check(r.status_code == 200 and body["parse_ok"] is False, "un envío ilegible responde parse_ok=False")
check(body["attempts_left"] == 2, f"y NO consume intento (quedan {body['attempts_left']})")
db.expire_all()
fallidos = db.query(_GA).filter(_GA.exercise_id == ex_id, _GA.parse_ok.is_(False)).all()
check(len(fallidos) == 1, "pero sí queda registrado")
check(
    fallidos and fallidos[0].attempt_number == 0,
    "con attempt_number en 0, que es lo que lo marca como «no consumió intento»",
)
check(
    db.query(_GE).filter(_GE.id == ex_id).first().status == "served",
    "y el ejercicio sigue abierto",
)

# Y ahora algo que SÍ parsea sobre el MISMO ejercicio: tiene que ser el primer
# intento, no el segundo. (Da igual si acierta: lo que se mide es el contador.)
otra = client.post(
    "/game/derivemos/answer",
    json={
        "exercise_id": ex_id,
        "answer_latex": "999x",
        "answer_mathjson": ["Multiply", 999, "x"],
        "peeked": True,
    },
    headers=H,
).json()
check(
    otra["attempt_number"] == 1,
    f"el envío siguiente sigue siendo el intento 1 (dio {otra['attempt_number']})",
)
db.expire_all()
check(
    db.query(_GE).filter(_GE.id == ex_id).first().peeked is True,
    "y la consulta a la tabla queda marcada en el ejercicio",
)

print("13. dispositivo")
# El header lo manda el cliente y el server lo cree, pero solo dentro del
# vocabulario cerrado: sin esa guarda, un typo del front crearía una categoría
# fantasma en el panel y nadie se enteraría hasta leer una tabla con dos filas
# que dicen casi lo mismo.
from models import GameExercise as _GEx, GamePlayer as _GP  # noqa: E402

HP = dict(H)
HP["X-Game-Platform"] = "android"
cerrar_abiertos(player_id)
ex_id = client.post("/game/derivemos/next", headers=HP).json()["exercise_id"]
db.expire_all()
check(
    db.query(_GEx).filter(_GEx.id == ex_id).first().platform == "android",
    "el ejercicio queda marcado con el aparato que lo pidió",
)

HB = dict(H)
HB["X-Game-Platform"] = "commodore64"
cerrar_abiertos(player_id)
ex_id = client.post("/game/derivemos/next", headers=HB).json()["exercise_id"]
db.expire_all()
check(
    db.query(_GEx).filter(_GEx.id == ex_id).first().platform is None,
    "un valor fuera del vocabulario no crea una categoría fantasma",
)

# El alta es la que fija el aparato de primer contacto, y no se pisa después.
r = client.post(
    "/game/derivemos/player",
    json={},
    headers={"X-Game-Platform": "ios"},
)
nuevo = r.json()
tok2 = nuevo["guest_token"]
p2 = db.query(_GP).filter(_GP.guest_token == tok2).first()
check(p2 is not None and p2.platform == "ios", "el alta guarda el aparato de primer contacto")
client.post(
    "/game/derivemos/next",
    headers={"X-Game-Token": tok2, "X-Game-Platform": "desktop"},
)
db.expire_all()
p2 = db.query(_GP).filter(_GP.guest_token == tok2).first()
check(
    p2.platform == "ios",
    f"y seguir desde otro aparato NO lo pisa (dio {p2.platform})",
)

print("10. la donación siempre cae en algún lado (generosidad)")
from models import GameBoost, GameBoostIntent  # noqa: E402

db = database.SessionLocal()
db.query(GameBoost).delete()
db.query(GameBoostIntent).delete()
db.commit()

# a) sin sigla y sin intenciones -> empuje GLOBAL, no se pierde
creados = game_boosts.resolve_donation(db, cafecitos=2, donor_name="Anónimo")
db.commit()
check(len(creados) == 1 and creados[0].university is None,
      f"sin datos, la donación se vuelve global (dio {[c.university for c in creados]})")
check(game_boosts.multiplier_for(db, None) == 1.2,
      f"y le llega a quien no tiene universidad (dio {game_boosts.multiplier_for(db, None)})")
check(game_boosts.multiplier_for(db, "UNC") == 1.2, "y también a una universidad cualquiera")

# b) la sigla del mensaje manda
db.query(GameBoost).delete(); db.commit()
creados = game_boosts.resolve_donation(db, cafecitos=3, message="soy de la UBA, gracias!")
db.commit()
check([c.university for c in creados] == ["UBA"],
      f"la sigla del mensaje decide (dio {[c.university for c in creados]})")

# c) dos intenciones de universidades distintas -> cobran las DOS
db.query(GameBoost).delete(); db.query(GameBoostIntent).delete(); db.commit()
p_uba = GamePlayer(alias="int_uba", university="UBA")
p_utn = GamePlayer(alias="int_utn", university="UTN")
db.add_all([p_uba, p_utn]); db.commit()
game_boosts.record_intent(db, p_uba)
game_boosts.record_intent(db, p_utn)
db.commit()
creados = game_boosts.resolve_donation(db, cafecitos=5, donor_name="Sofi")
db.commit()
check(sorted(c.university for c in creados) == ["UBA", "UTN"],
      f"ante la duda cobran las dos (dio {sorted(c.university for c in creados)})")
check(game_boosts.multiplier_for(db, "UBA") == 1.5 and game_boosts.multiplier_for(db, "UTN") == 1.5,
      "las dos con el multiplicador entero, no repartido")

# d) las intenciones se consumen: la donación siguiente no las vuelve a usar
creados2 = game_boosts.resolve_donation(db, cafecitos=1)
db.commit()
check([c.university for c in creados2] == [None],
      f"consumidas las intenciones, la próxima es global (dio {[c.university for c in creados2]})")

# e) idempotencia por external_ref
n_antes = db.query(GameBoost).count()
game_boosts.resolve_donation(db, cafecitos=9, external_ref="mp-123")
db.commit()
repetida = game_boosts.resolve_donation(db, cafecitos=9, external_ref="mp-123")
db.commit()
check(repetida == [] and db.query(GameBoost).count() == n_antes + 1,
      "un mail reenviado no regala el empuje dos veces")
db.close()

print("11. la fuerza del café: techo x3 y hay que colaborar")
db = database.SessionLocal()
db.query(GameBoost).delete()
db.commit()

# Una sola donación, por más grande que sea, no pasa de x2.
game_boosts.grant(db, university="UNC", cafecitos=40, donor_name="Rico")
db.commit()
check(
    game_boosts.multiplier_for(db, "UNC") == 2.0,
    f"una persona sola llega a x2 y no más (dio {game_boosts.multiplier_for(db, 'UNC')})",
)
guardado = db.query(GameBoost).filter_by(university="UNC").first()
check(guardado.cafecitos == 40,
      "pero la donación se guarda entera: el feed cuenta los 40 que puso")

# Con una segunda persona sí se llega al techo.
game_boosts.grant(db, university="UNC", cafecitos=12, donor_name="Otra")
db.commit()
check(
    game_boosts.multiplier_for(db, "UNC") == game_boosts.MAX_MULTIPLIER,
    f"entre dos se llega a x{game_boosts.MAX_MULTIPLIER} "
    f"(dio {game_boosts.multiplier_for(db, 'UNC')})",
)

# Duración: media hora, y una hora SOLO al tope del multiplicador.
db.query(GameBoost).delete(); db.commit()
b1 = game_boosts.grant(db, university="UNR", cafecitos=2)
b2 = game_boosts.grant(db, university="UNT", cafecitos=30)
b3 = game_boosts.grant(db, university="UNL",
                       cafecitos=game_boosts.MAX_CAFECITOS_PER_DONATION - 1)
db.commit()
mins = lambda b: round((b.expires_at - b.created_at).total_seconds() / 60)
check(mins(b1) == game_boosts.BOOST_MINUTES,
      f"2 cafecitos duran {mins(b1)} min")
check(mins(b3) == game_boosts.BOOST_MINUTES,
      f"y uno menos que el tope tambien: {mins(b3)} min")
check(mins(b2) == game_boosts.BOOST_MINUTES_MAX,
      f"solo el tope llega a la hora ({mins(b2)} min)")
db.close()

print("12b. pedir otro con uno abierto no es un salteo gratis")
# Antes /next vencia lo que hubiera abierto y servia otro SIN el castigo de
# /skip, que baja el theta y corta la racha. Con la consola abierta eso permitia
# re-tirar hasta que saliera una facil conservando la racha, inflando resueltas,
# XP y puesto. Ahora devuelve el que ya estaba.
cerrar_abiertos(player_id)
db = database.SessionLocal()
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
p.current_combo = 7
db.commit()
db.close()

primero = client.post("/game/derivemos/next", headers=H).json()
segundo = client.post("/game/derivemos/next", headers=H).json()
check(
    segundo["exercise_id"] == primero["exercise_id"],
    "pedir otro con uno abierto devuelve el MISMO, no uno nuevo",
)

db = database.SessionLocal()
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
check(p.current_combo == 7, f"y no toca la racha (dio {p.current_combo})")
db.close()

# Saltear sigue siendo el camino para cambiar de ejercicio, y ese sí cuesta.
r = client.post(
    "/game/derivemos/skip", headers=H, json={"exercise_id": primero["exercise_id"]}
)
check(r.status_code == 200, "saltear sigue dando uno nuevo")
check(r.json()["exercise_id"] != primero["exercise_id"], "y es otro ejercicio")
db = database.SessionLocal()
p = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
check(p.current_combo == 0, "y ese si corta la racha")
db.close()

print("12c. el teclado sobrevive al registro")
# El merge invitado -> usuario reparentaba ejercicios e intentos pero se olvidaba
# unlocked_keys, asi que registrarse borraba toda la progresion del teclado.
from game import keyboard as _kb  # noqa: E402
from game.deps import link_guest_to_user as _link  # noqa: E402

db = database.SessionLocal()
invitado = GamePlayer(guest_token="tok-teclado", alias="tecladito",
                      unlocked_keys="sen,cos", created_at=datetime.utcnow(),
                      last_seen_at=datetime.utcnow())
db.add(invitado)
db.flush()
usuario = User(clerk_user_id="clerk-teclado", email="teclado@test.dev", name="Teclado")
db.add(usuario)
db.flush()
ya_tenia = GamePlayer(user_id=usuario.id, alias="conCuenta", unlocked_keys="ln,pow",
                      created_at=datetime.utcnow(), last_seen_at=datetime.utcnow())
db.add(ya_tenia)
db.commit()
fusionado = _link(db, invitado, usuario)
check(
    _kb.parse_unlocked(fusionado.unlocked_keys) == {"sen", "cos", "ln", "pow"},
    f"el teclado se une, no se pisa (dio {fusionado.unlocked_keys})",
)
db.close()

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")