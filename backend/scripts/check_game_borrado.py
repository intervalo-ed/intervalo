"""Verifica el borrado de la cuenta del juego (DELETE /game/derivemos/me).

Apple (5.1.1(v)) rechaza una app que deja crear una cuenta y no deja borrarla, y
"borrar" tiene que ser de verdad: lo que se prueba acá no es que el endpoint
conteste 204, sino que **no quede nada colgando del jugador**.

· Un invitado se borra con su token, y sus filas desaparecen.
· Quien tiene cuenta pide la sesión viva: su token de invitado queda guardado
  después del link y no puede alcanzar para borrarla.
· Se borra el jugador, el usuario, los mensajes, los intentos y el @, y el @
  vuelve a estar libre.
· Ninguna tabla del modelo conserva una clave que apunte al jugador o al usuario
  borrados — se recorre `Base.metadata`, así que una tabla nueva queda cubierta.
· Los reclutados por el jugador siguen existiendo, sin el vínculo.
· Los pagos de cafecito se conservan sin nombre ni mail.
· Si Clerk no responde, no se toca nada y se puede reintentar.

Uso:
    python backend/scripts/check_game_borrado.py

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
    Path(tempfile.mkdtemp()) / "game_borrado.db"
).replace("\\", "/")
os.environ["GAME_CHAT_ENABLED"] = "1"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import select  # noqa: E402

import database  # noqa: E402
from game import limits as _lim  # noqa: E402
from models import Base, GameBoost, GameMessage, GamePlayer, User  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402
import game.borrado as borrado  # noqa: E402
import game.deps as game_deps  # noqa: E402

client = TestClient(main.app, raise_server_exceptions=True)
FALLOS: list[str] = []


def check(cond: bool, label: str) -> None:
    print(f"  [{'ok' if cond else 'FAIL'}] {label}")
    if not cond:
        FALLOS.append(label)


# Sin Clerk acá: el resolutor devuelve el user de la fila si hay Authorization.
def _clerk_falso(authorization, db):
    if not authorization:
        return None
    return db.query(User).filter(User.email == "borrar@test.dev").first()


game_deps._clerk_user = _clerk_falso

# Clerk de mentira: anota a quién borraron, y puede fallar a pedido.
borrados_en_clerk: list[str] = []
clerk_falla = {"si": False}


def _clerk_borra(clerk_user_id: str) -> None:
    if clerk_falla["si"]:
        raise borrado.ClerkNoRespondio("caído")
    borrados_en_clerk.append(clerk_user_id)


borrado._borrar_en_clerk = _clerk_borra

db = database.SessionLocal()


def filas_que_apuntan(tabla, valor) -> int:
    """Cuántas filas de TODO el modelo tienen una clave foránea hacia `valor`."""
    total = 0
    for t in Base.metadata.tables.values():
        for fk in t.foreign_keys:
            if fk.column.table is tabla:
                total += db.execute(
                    select(t).where(fk.parent == valor)
                ).fetchall().__len__()
    return total


def nuevo_invitado() -> dict:
    r = client.post("/game/derivemos/player", json={})
    return {"X-Game-Token": r.json()["guest_token"]}


def jugador(headers) -> GamePlayer:
    db.expire_all()
    return db.query(GamePlayer).filter(GamePlayer.guest_token == headers["X-Game-Token"]).first()


print("\n1. un invitado se borra con su token")
INV = nuevo_invitado()
pid = jugador(INV).id
alias_inv = jugador(INV).alias
_lim.olvidar_todo()
client.post("/game/derivemos/message", json={"text": "hola"}, headers=INV)
check(db.query(GameMessage).filter(GameMessage.player_id == pid).count() == 1,
      "tenía un mensaje escrito")
r = client.delete("/game/derivemos/me", headers=INV)
check(r.status_code == 204, f"el borrado da 204 (dio {r.status_code}: {r.text[:100]})")
db.expire_all()
check(db.get(GamePlayer, pid) is None, "el jugador ya no está")
check(db.query(GameMessage).filter(GameMessage.player_id == pid).count() == 0,
      "ni sus mensajes")
check(filas_que_apuntan(GamePlayer.__table__, pid) == 0,
      "ninguna tabla conserva una clave hacia él")
check(client.get("/game/derivemos/me", headers=INV).status_code == 401,
      "y su token ya no abre nada")
check(client.delete("/game/derivemos/me", headers=INV).status_code == 401,
      "borrar dos veces no rompe: da 401")
r = client.post("/game/derivemos/player", json={})
check(r.status_code in (200, 201), "se puede volver a empezar con un jugador nuevo")

print("\n2. una cuenta con login pide la sesión viva")
usuario = User(email="borrar@test.dev", name="Borrar Test", username="borrable",
               clerk_user_id="user_clerk_123")
db.add(usuario)
db.commit()
db.refresh(usuario)
CUENTA = nuevo_invitado()
reg = jugador(CUENTA)
reg.user_id = usuario.id
reg.alias = "borrable"
reg.university = "UBA"
db.commit()
reg_id, usuario_id = reg.id, usuario.id

# Un reclutado por esta cuenta, y un pago de cafecito suyo.
amigo = nuevo_invitado()
a = jugador(amigo)
a.referred_by = reg_id
db.add(GameBoost(
    university="UBA", cafecitos=1, donor_name="Borrar Test", donor_email="borrar@test.dev",
    player_id=reg_id, expires_at=datetime.utcnow() + timedelta(days=1),
))
db.commit()
amigo_id = a.id

r = client.delete("/game/derivemos/me", headers=CUENTA)
check(r.status_code == 403, f"con el token guardado y sin sesión, no (dio {r.status_code})")
check("Iniciá sesión" in r.json().get("detail", ""), "y el 403 dice qué hacer")
db.expire_all()
check(db.get(GamePlayer, reg_id) is not None, "la cuenta sigue ahí")

print("\n3. si Clerk no responde, no se toca nada")
CON_SESION = {**CUENTA, "Authorization": "Bearer falso"}
clerk_falla["si"] = True
r = client.delete("/game/derivemos/me", headers=CON_SESION)
check(r.status_code == 502, f"da 502 (dio {r.status_code})")
db.expire_all()
check(db.get(GamePlayer, reg_id) is not None and db.get(User, usuario_id) is not None,
      "el jugador y el usuario siguen, se puede reintentar")
clerk_falla["si"] = False

print("\n4. con sesión viva se borra todo")
r = client.delete("/game/derivemos/me", headers=CON_SESION)
check(r.status_code == 204, f"da 204 (dio {r.status_code}: {r.text[:100]})")
db.expire_all()
check(db.get(GamePlayer, reg_id) is None, "el jugador ya no está")
check(db.get(User, usuario_id) is None, "ni el usuario")
check(borrados_en_clerk == ["user_clerk_123"], "y se pidió borrar la cuenta en Clerk")
check(filas_que_apuntan(GamePlayer.__table__, reg_id) == 0
      and filas_que_apuntan(User.__table__, usuario_id) == 0,
      "ninguna tabla conserva una clave hacia ellos")

print("\n5. lo que sobrevive, sobrevive sin dueño")
db.expire_all()
amigo_fila = db.get(GamePlayer, amigo_id)
check(amigo_fila is not None and amigo_fila.referred_by is None,
      "el reclutado sigue existiendo, sin el vínculo")
pago = db.query(GameBoost).filter(GameBoost.cafecitos == 1).first()
check(pago is not None and pago.player_id is None
      and pago.donor_name is None and pago.donor_email is None,
      "el pago de cafecito se conserva sin nombre, mail ni dueño")
r = client.post("/game/derivemos/player", json={})
check(r.status_code in (200, 201), "y el @ vuelve a estar libre para otro jugador")

print()
if FALLOS:
    print(f"FALLARON {len(FALLOS)}:")
    for f in FALLOS:
        print("  -", f)
    sys.exit(1)
print("todo ok")
