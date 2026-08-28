"""Verifica el teclado acumulativo de punta a punta, contra la API.

El inventario de teclas es la primera cosa del juego que PERSISTE entre
ejercicios, así que el modo de fallar no es "calcula mal" sino "calcula bien y
no lo guarda" — que es exactamente lo que pasó la primera vez: `_exercise_out`
desbloqueaba, pero el endpoint commiteaba ANTES de llamarlo y la escritura se
perdía. Un test de la función pura no lo habría visto nunca; hace falta pedir
ejercicios de verdad y mirar la fila después.

Uso:
    python backend/scripts/check_game_unlocks.py
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_unlocks.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from models import Base, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402

client = TestClient(main.app)
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def unlocked_column(player_id: int) -> str:
    db = database.SessionLocal()
    try:
        return db.query(GamePlayer).filter(GamePlayer.id == player_id).first().unlocked_keys
    finally:
        db.close()


print("1. el inventario se acumula y se persiste")
token = client.post("/game/derivemos/player", json={}).json()["guest_token"]
H = {"X-Game-Token": token}
db = database.SessionLocal()
player_id = db.query(GamePlayer).filter(GamePlayer.guest_token == token).first().id
db.close()

from game.router import MAX_ATTEMPTS  # noqa: E402

sizes: list[int] = []
anunciadas: set[str] = set()
print(f"     {'ejercicio':24} {'nuevas':12} inventario")
for _ in range(16):
    ex = client.post("/game/derivemos/next", headers=H).json()
    sizes.append(len(ex["keys"]))
    print(
        f"     {ex['prompt_latex'][:22]:24} {','.join(ex['new_keys']) or '-':12} "
        f"{','.join(ex['keys']) or '(vacío)'}"
    )
    # Lo nuevo tiene que estar en el inventario, y no puede repetirse nunca.
    if not set(ex["new_keys"]).issubset(ex["keys"]):
        FAILURES.append("new_keys no es subconjunto de keys")
    if anunciadas & set(ex["new_keys"]):
        FAILURES.append("una tecla se anunció como nueva dos veces")
    anunciadas |= set(ex["new_keys"])
    # Se responde para que el Elo avance y vayan apareciendo tiers nuevos. Van
    # los DOS intentos: "x" casi nunca es la derivada, y con uno solo el
    # ejercicio queda abierto — y desde que /next devuelve el que ya estaba en
    # vez de servir otro (era un salteo gratis), el recorrido no avanzaría.
    for _ in range(MAX_ATTEMPTS):
        client.post(
            "/game/derivemos/answer",
            headers=H,
            json={"exercise_id": ex["exercise_id"], "answer_latex": "x", "answer_mathjson": "x"},
        )

check(all(b >= a for a, b in zip(sizes, sizes[1:])), "el inventario nunca encoge entre pedidos")
columna = unlocked_column(player_id)
check(columna != "", f"queda PERSISTIDO en la fila (dio {columna!r})")
check(
    set(columna.split(",")) == anunciadas,
    "lo persistido es exactamente lo que se anunció como nuevo",
)
check(len(anunciadas) > 1, f"se desbloqueó más de una tecla en el recorrido ({len(anunciadas)})")

print("2. saltear también desbloquea")
antes = unlocked_column(player_id)
ex = client.post("/game/derivemos/next", headers=H).json()
client.post("/game/derivemos/skip", headers=H, json={"exercise_id": ex["exercise_id"]})
check(
    set(antes.split(",")) <= set(unlocked_column(player_id).split(",")),
    "saltear no pierde lo desbloqueado",
)

print("3. reiniciar vacía el teclado")
client.post("/game/derivemos/reset", headers=H)
check(unlocked_column(player_id) == "", "tras el reset el inventario queda vacío")
ex = client.post("/game/derivemos/next", headers=H).json()
check(
    len(ex["keys"]) == len(ex["new_keys"]),
    "y todo lo que aparece después vuelve a contar como nuevo",
)

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
