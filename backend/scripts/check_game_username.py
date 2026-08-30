"""Verifica la edición gratis del @ de un invitado (game.router :: patch_me).

Cubre lo que puede salir mal sin que se note: que un invitado recién creado
pueda elegir su @ una sola vez sin pasar por Clerk, que un intento fallido
(inválido o tomado) no le queme esa oportunidad, que una segunda edición
exitosa vuelva a pedir registro, y que un usuario registrado sin sesión de
Clerk siga sin poder tocar su @ (la guarda de siempre, sin tocar).

Uso:
    python backend/scripts/check_game_username.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_username.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from game.deps import link_guest_to_user  # noqa: E402
from models import Base, GamePlayer, User  # noqa: E402

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


def alta() -> tuple[str, dict]:
    r = client.post(f"{API}/player", json={})
    j = r.json()
    return j["guest_token"], j["player"]


def patch_alias(token: str, alias: str):
    return client.patch(
        f"{API}/me", headers={"X-Game-Token": token}, json={"alias": alias}
    )


def fila(player_id: int) -> GamePlayer:
    db = database.SessionLocal()
    try:
        return db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
    finally:
        db.close()


print("1. un invitado nuevo arranca con la edición gratis disponible")
tok_a, jug_a = alta()
check(jug_a["alias_is_generated"] is True, "alias_is_generated viene en True")
check(fila(jug_a["player_id"]).alias_is_generated is True, "y así en la fila")

print("2. un intento inválido no quema la oportunidad")
r = patch_alias(tok_a, "ab")  # menos de 3 caracteres
check(r.status_code == 422, f"da 422 (dio {r.status_code})")
check(fila(jug_a["player_id"]).alias_is_generated is True, "el freebie sigue disponible")

print("3. un intento contra un @ ya tomado tampoco lo quema")
tok_b, jug_b = alta()
r = patch_alias(tok_a, jug_b["alias"])
check(r.status_code == 409, f"da 409 (dio {r.status_code})")
check(fila(jug_a["player_id"]).alias_is_generated is True, "el freebie sigue disponible")

print("4. un invitado puede elegir su @ una vez, sin Authorization")
r = patch_alias(tok_a, "elegidopropio")
check(r.status_code == 200, f"da 200 (dio {r.status_code})")
check(r.json()["alias"] == "elegidopropio", "el @ queda como se pidió")
check(r.json()["alias_is_generated"] is False, "y la respuesta ya informa el freebie gastado")
check(fila(jug_a["player_id"]).alias_is_generated is False, "y así en la fila")

print("5. una segunda vez vuelve a pedir registro")
r = patch_alias(tok_a, "otroalias")
check(r.status_code == 403, f"da 403 (dio {r.status_code})")
check(r.json()["detail"] == "Registrate para elegir tu @.", "con el mensaje de siempre")
check(fila(jug_a["player_id"]).alias == "elegidopropio", "y el @ no cambió")

print("6. un usuario registrado sin sesión de Clerk sigue sin poder tocar su @")
db = database.SessionLocal()
usuario = User(clerk_user_id="clerk-username-check", email="username@test.dev", name="U")
db.add(usuario)
db.commit()
invitado_c = db.query(GamePlayer).filter(GamePlayer.guest_token == tok_b).first()
fusionado = link_guest_to_user(db, invitado_c, usuario)
guest_token_conservado = fusionado.guest_token
db.close()
check(guest_token_conservado == tok_b, "el guest_token se conserva tras vincular la cuenta")

r = patch_alias(tok_b, "loquesea")
check(r.status_code == 403, f"da 403 (dio {r.status_code})")
check(
    r.json()["detail"] == "Iniciá sesión de nuevo para cambiar tu @.",
    "con el mensaje de usuario registrado, no el de invitado",
)

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeo(s) fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
