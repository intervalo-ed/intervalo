"""Verifica la mecánica de reclutas del minijuego (game/referrals.py).

Cubre lo que puede salir mal sin que se note: que el porcentaje se pague exacto
en vez de evaporarse en el redondeo, que la XP se acuñe y no se le descuente al
recluta, que nadie se reclute a sí mismo, que un jugador viejo no adopte
reclutador por abrir un link, y que registrarse no borre a la gente que trajiste.

Uso:
    python backend/scripts/check_game_referrals.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_referrals.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from game import referrals  # noqa: E402
from game.aliases import alias_taken, retire_alias  # noqa: E402
from game.deps import link_guest_to_user  # noqa: E402
from models import Base, GameExercise, GamePlayer, User  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402

client = TestClient(main.app, raise_server_exceptions=True)
FAILURES: list[str] = []

API = "/game/derivemos"


def check(condition: bool, label: str) -> None:
    status = "ok" if condition else "FAIL"
    print(f"  [{status}] {label}")
    if not condition:
        FAILURES.append(label)


def alta(**body) -> tuple[str, dict]:
    r = client.post(f"{API}/player", json=body)
    j = r.json()
    return j["guest_token"], j["player"]


def derivada_servida(player_id: int, expected: str = "6*x + 2") -> int:
    """Un ejercicio abierto con derivada conocida, para responder a voluntad."""
    db = database.SessionLocal()
    ex = GameExercise(
        player_id=player_id,
        template_key="t1_kpow",
        prompt_latex="3x^{2} + 2x",
        expected_derivative=expected,
        theta_at_serve=0.0,
        beta_at_serve=-1.6,
        p_hat=0.78,
        status="served",
    )
    db.add(ex)
    db.commit()
    ex_id = ex.id
    db.close()
    return ex_id


def acertar(token: str, player_id: int) -> dict:
    """Resuelve bien una derivada. Devuelve el cuerpo de /answer."""
    ex_id = derivada_servida(player_id)
    return client.post(
        f"{API}/answer",
        headers={"X-Game-Token": token},
        json={
            "exercise_id": ex_id,
            "answer_latex": "6x+2",
            "answer_mathjson": ["Add", ["Multiply", 6, "x"], 2],
        },
    ).json()


def fila(player_id: int) -> GamePlayer:
    db = database.SessionLocal()
    try:
        return db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
    finally:
        db.close()


print("1. el link con ?r= deja anotado quién trajo a quién")
tok_a, jug_a = alta()
tok_b, jug_b = alta(referrer_alias=jug_a["alias"])
check(fila(jug_b["player_id"]).referred_by == jug_a["player_id"], "B queda como recluta de A")
check(fila(jug_a["player_id"]).referred_by is None, "A no queda como recluta de nadie")

print("2. el porcentaje se paga, y se acuña")
xp_a_antes = fila(jug_a["player_id"]).xp
j = acertar(tok_b, jug_b["player_id"])
check(j["correct"], "el recluta resuelve bien")
xp_ganada = j["xp_awarded"]
check(xp_ganada > 0, f"y cobra su XP completa (dio {xp_ganada})")
check(
    fila(jug_b["player_id"]).xp == xp_ganada,
    "al recluta no se le descuenta nada: cobra lo mismo que cobraría sin reclutador",
)
esperado = (xp_ganada * referrals.SHARE_PERCENT) // 100
check(
    fila(jug_a["player_id"]).xp - xp_a_antes == esperado,
    f"al reclutador le entra la parte entera ({esperado} de {xp_ganada})",
)

print("3. el resto no se pierde: la cuenta cierra exacta a la larga")
# Diez respuestas más. Con 10% y XP no múltiplo de diez, cada pago deja un resto;
# lo que se acredita en total tiene que ser el 10% de TODO lo ganado, no la suma
# de diez redondeos hacia abajo.
ganado = xp_ganada
for _ in range(10):
    ganado += acertar(tok_b, jug_b["player_id"])["xp_awarded"]
recibido = fila(jug_a["player_id"]).xp - xp_a_antes
exacto = (ganado * referrals.SHARE_PERCENT) // 100
check(
    recibido == exacto,
    f"acreditado {recibido} = {referrals.SHARE_PERCENT}% de {ganado} (exacto: {exacto})",
)
check(
    fila(jug_b["player_id"]).referral_xp_given == recibido,
    "y la fila del recluta cuenta lo mismo que se pagó",
)

print("4. nadie se recluta a sí mismo")
tok_c, jug_c = alta()
r = client.post(f"{API}/player", json={"referrer_alias": jug_c["alias"]})
propio = r.json()["player"]
check(
    fila(propio["player_id"]).referred_by != propio["player_id"],
    "un alta con el propio @ no se autorreferencia",
)
db = database.SessionLocal()
yo = db.query(GamePlayer).filter(GamePlayer.id == jug_c["player_id"]).first()
check(referrals.resolver(db, yo.alias, salvo=yo.id) is None, "resolver() se niega en seco")
check(referrals.resolver(db, "no-existe-este-alias") is None, "y un @ inexistente da None")
db.close()

print("5. un @ inventado no rompe el alta")
tok_d, jug_d = alta(referrer_alias="fantasma9999")
check(jug_d["player_id"] > 0, "el jugador se crea igual")
check(fila(jug_d["player_id"]).referred_by is None, "y queda sin reclutador")

print("6. quien ya venía jugando no adopta reclutador por abrir un link")
# El mismo token de antes, con un ?r= nuevo: es el caso de alguien que juega hace
# semanas y un día toca el link de un compañero.
client.post(f"{API}/player", json={"referrer_alias": jug_a["alias"]}, headers={"X-Game-Token": tok_c})
check(fila(jug_c["player_id"]).referred_by is None, "sigue sin reclutador")

print("7. la lista solo trae a los que ya resolvieron algo")
r = client.get(f"{API}/leaderboard/recruits", headers={"X-Game-Token": tok_a})
j = r.json()
check(r.status_code == 200, f"responde 200 (dio {r.status_code})")
check(j["share_percent"] == referrals.SHARE_PERCENT, "informa el porcentaje vigente")
check(len(j["entries"]) == 1, f"un solo recluta con actividad (dio {len(j['entries'])})")
check(j["entries"][0]["alias"] == jug_b["alias"], "y es el que jugó")
check(j["entries"][0]["xp_given"] == recibido, "con lo que aportó")
check("xp" not in j["entries"][0], "la XP propia del recluta no viaja")

# Uno que entró por el link y nunca jugó no puede aparecer.
tok_e, jug_e = alta(referrer_alias=jug_a["alias"])
j = client.get(f"{API}/leaderboard/recruits", headers={"X-Game-Token": tok_a}).json()
check(len(j["entries"]) == 1, "el que abrió el link y no jugó no ocupa un renglón")

print("8. la lista de otro jugador no incluye reclutas ajenos")
j = client.get(f"{API}/leaderboard/recruits", headers={"X-Game-Token": tok_c}).json()
check(j["entries"] == [], "quien no reclutó a nadie ve la lista vacía")

print("9. registrarse no borra a los reclutas")
db = database.SessionLocal()
invitado = db.query(GamePlayer).filter(GamePlayer.guest_token == tok_a).first()
# Una cuenta que ya tenía jugador propio: es el merge de verdad, el que borra la
# fila del invitado.
usuario = User(
    clerk_user_id="clerk-reclutas", email="reclutas@test.dev", name="Reclutador"
)
db.add(usuario)
db.commit()
propio_de_la_cuenta = GamePlayer(user_id=usuario.id, alias="reclutador_cuenta")
db.add(propio_de_la_cuenta)
db.commit()
id_cuenta = propio_de_la_cuenta.id
id_invitado = invitado.id
fusionado = link_guest_to_user(db, invitado, usuario)
check(fusionado.id == id_cuenta, "sobrevive la fila de la cuenta")
reclutas = (
    db.query(GamePlayer).filter(GamePlayer.referred_by == id_cuenta).count()
)
huerfanos = db.query(GamePlayer).filter(GamePlayer.referred_by == id_invitado).count()
check(reclutas == 2, f"los dos reclutas pasan a la cuenta (dio {reclutas})")
check(huerfanos == 0, "y ninguno queda apuntando a la fila borrada")
db.close()

print("10. cambiar de @ no mata los links ya repartidos")
# Es el camino NORMAL, no un caso raro: el juego ofrece reclutar a las diez
# resueltas y pide el registro a las doce, y registrarse es cuando se elige el @.
db = database.SessionLocal()
compartidor = db.query(GamePlayer).filter(GamePlayer.id == id_cuenta).first()
viejo_alias = compartidor.alias
compartidor.alias = "eldefinitivo"
retire_alias(db, viejo_alias, compartidor.id)
db.commit()
db.close()

tok_f, jug_f = alta(referrer_alias=viejo_alias)
check(
    fila(jug_f["player_id"]).referred_by == id_cuenta,
    "un link con el @ viejo sigue trayendo reclutas al mismo jugador",
)
tok_g, jug_g = alta(referrer_alias="eldefinitivo")
check(
    fila(jug_g["player_id"]).referred_by == id_cuenta,
    "y el @ nuevo también",
)

print("11. un @ soltado no se lo puede quedar otro")
db = database.SessionLocal()
check(alias_taken(db, viejo_alias), "el @ viejo sigue contando como tomado")
db.close()

print("12. el @ de un invitado fusionado sigue resolviendo")
# El invitado se borra al fusionarse; los links que mandó con SU @ tienen que
# seguir trayendo gente para la cuenta que lo absorbió.
db = database.SessionLocal()
usuario2 = User(clerk_user_id="clerk-fusion", email="fusion@test.dev", name="Fusion")
db.add(usuario2)
db.commit()
cuenta2 = GamePlayer(user_id=usuario2.id, alias="cuenta_que_absorbe")
db.add(cuenta2)
db.commit()
id_cuenta2 = cuenta2.id
invitado2 = db.query(GamePlayer).filter(GamePlayer.guest_token == tok_d).first()
alias_invitado = invitado2.alias
link_guest_to_user(db, invitado2, usuario2)
db.close()

tok_h, jug_h = alta(referrer_alias=alias_invitado)
check(
    fila(jug_h["player_id"]).referred_by == id_cuenta2,
    "el @ del invitado borrado apunta a la cuenta que lo absorbió",
)

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeo(s) fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
