"""Verifica reportar y bloquear en el chat (Apple 1.2).

Lo que importa no es que los endpoints contesten 204, sino las reglas:

· Un reporte es de una persona y un mensaje: repetirlo no suma ni vuelve a mandar
  mail. Con tres personas distintas el mensaje se baja solo, para todos.
· Quien reporta deja de ver el mensaje enseguida, aunque no llegue a tres.
· Bloquear esconde lo del autor —lo de antes y lo de después— solo para quien
  bloqueó, y repetirlo no rompe.
· Nadie se reporta ni se bloquea a sí mismo, y un mensaje que no existe da 404.
· Cada reporte NUEVO dispara el aviso por mail, con los datos para actuar.
· Borrar la cuenta se lleva sus reportes y bloqueos (recorre todas las tablas).

Uso:
    python backend/scripts/check_game_moderacion.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_moderacion.db"
).replace("\\", "/")
os.environ["GAME_CHAT_ENABLED"] = "1"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from game import limits as _lim  # noqa: E402
from game import moderacion  # noqa: E402
from models import Base, GameBlock, GameMessage, GameMessageReport, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402

client = TestClient(main.app, raise_server_exceptions=True)
FALLOS: list[str] = []


def check(cond: bool, label: str) -> None:
    print(f"  [{'ok' if cond else 'FAIL'}] {label}")
    if not cond:
        FALLOS.append(label)


# El mail de mentira: anota lo que se mandaría.
avisos: list[dict] = []
moderacion.avisar_del_reporte = lambda **kw: avisos.append(kw)
# El router lo resolvió por atributo del módulo al importarse: está bien, lo llama
# como `moderacion.avisar_del_reporte`.

db = database.SessionLocal()


def jugador() -> dict:
    return {"X-Game-Token": client.post("/game/derivemos/player", json={}).json()["guest_token"]}


def escribir(h: dict, texto: str) -> int:
    _lim.olvidar_todo()
    r = client.post("/game/derivemos/message", json={"text": texto}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["id"]


def ver(h: dict) -> list[str]:
    _lim.olvidar_todo()
    return [m["text"] for m in client.get("/game/derivemos/events", headers=h).json()["messages"]]


def reportar(h: dict, mid: int):
    _lim.olvidar_todo()
    return client.post(f"/game/derivemos/messages/{mid}/report", headers=h)


def bloquear(h: dict, mid: int):
    _lim.olvidar_todo()
    return client.post(f"/game/derivemos/messages/{mid}/block", headers=h)


AUTOR, A, B, C, D = jugador(), jugador(), jugador(), jugador(), jugador()
m1 = escribir(AUTOR, "mensaje feo uno")
m2 = escribir(AUTOR, "mensaje feo dos")
m_ok = escribir(D, "un mensaje bueno")

print("\n1. reportar")
r = reportar(A, m1)
check(r.status_code == 204, f"reportar da 204 (dio {r.status_code})")
check(len(avisos) == 1 and avisos[0]["mensaje_id"] == m1 and avisos[0]["total"] == 1,
      "el primer reporte dispara el mail con el total")
check("mensaje feo uno" in avisos[0]["texto"], "y el mail trae el texto del mensaje")
check("mensaje feo uno" not in ver(A), "quien reporta ya no lo ve")
check("mensaje feo uno" in ver(B), "los demás todavía sí (es un solo reporte)")
reportar(A, m1)
check(len(avisos) == 1, "repetir el reporte no manda otro mail")
check(db.query(GameMessageReport).filter_by(message_id=m1).count() == 1, "ni suma un reporte")

print("\n2. tres reportes distintos lo bajan para todos")
reportar(B, m1)
check("mensaje feo uno" in ver(C), "con dos, sigue visible para un tercero")
reportar(C, m1)
check(len(avisos) == 3 and avisos[-1]["total"] == 3, "cada reporte nuevo manda su mail")
check("mensaje feo uno" not in ver(D) and "mensaje feo uno" not in ver(AUTOR),
      "con tres, nadie lo ve")
db.expire_all()
check(db.get(GameMessage, m1).hidden is True, "y quedó `hidden` en la base")

print("\n3. bloquear")
check("mensaje feo dos" in ver(D), "antes de bloquear, D ve lo del autor")
r = bloquear(D, m2)
check(r.status_code == 204, f"bloquear da 204 (dio {r.status_code})")
check("mensaje feo dos" not in ver(D), "después, D ya no ve lo de antes")
m3 = escribir(AUTOR, "mensaje nuevo del autor")
check("mensaje nuevo del autor" not in ver(D), "ni lo de después")
check("mensaje nuevo del autor" in ver(B), "pero para otro sigue igual")
check("un mensaje bueno" in ver(D), "y D sigue viendo al resto")
check(bloquear(D, m2).status_code == 204 and db.query(GameBlock).count() == 1,
      "bloquear de nuevo no rompe ni duplica")

print("\n4. los bordes")
check(reportar(AUTOR, m3).status_code == 400, "no podés reportar tu propio mensaje")
check(bloquear(AUTOR, m3).status_code == 400, "ni bloquearte a vos mismo")
check(reportar(A, 99999).status_code == 404, "un mensaje que no existe da 404")
check(bloquear(A, 99999).status_code == 404, "bloquear uno que no existe, también")
check(client.post(f"/game/derivemos/messages/{m_ok}/report").status_code == 401,
      "sin identidad, 401")

print("\n5. borrar la cuenta se lleva reportes y bloqueos")
pid_d = db.query(GamePlayer).filter_by(guest_token=D["X-Game-Token"]).first().id
antes = db.query(GameBlock).count()
r = client.delete("/game/derivemos/me", headers=D)
check(r.status_code == 204, f"D borra su cuenta (dio {r.status_code})")
db.expire_all()
check(db.query(GameBlock).filter_by(blocker_id=pid_d).count() == 0 and antes == 1,
      "su bloqueo ya no está")
pid_a = db.query(GamePlayer).filter_by(guest_token=A["X-Game-Token"]).first().id
client.delete("/game/derivemos/me", headers=A)
db.expire_all()
check(db.query(GameMessageReport).filter_by(reporter_id=pid_a).count() == 0,
      "y los reportes de A tampoco")

print()
if FALLOS:
    print(f"FALLARON {len(FALLOS)}:")
    for f in FALLOS:
        print("  -", f)
    sys.exit(1)
print("todo ok")
