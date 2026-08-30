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
from models import Base, GameExercise, GamePlayer  # noqa: E402

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
    # Se le sube el θ a mano, porque errar todo el tiempo
    # NO tiene que ver tiers nuevos: desde que β está anclada a la semilla del
    # tier (elo.effective_beta), la dificultad que recibe cada uno la manda su
    # propio θ y no el ruido de una β que se movía sola. Antes este recorrido
    # llegaba a T3 por ese ruido y desbloqueaba varias teclas; ahora se queda en
    # T0/T1 y desbloquea una, que es el comportamiento correcto y volvía flaky
    # al assert de más abajo.
    #
    # El inventario es lo que se está probando acá, no el generador: hace falta
    # recorrer varios tiers para que haya más de una tecla que acumular, y esta
    # es la forma más corta de garantizarlo sin tener que resolver la derivada.
    #
    # Se responde UNA vez —mal, "x" casi nunca es la derivada— y después se
    # cierra el ejercicio a mano. Las dos cosas hacen falta y por motivos
    # distintos:
    #
    #   · la respuesta, porque es lo único que hace avanzar `n_updates`, y
    #     mientras dura la rampa (elo.RAMP_UPDATES) el tier está limitado por
    #     ahí y no por el θ. Sin responder, el recorrido entero se queda en T0 y
    #     no desbloquea una sola tecla por más que se le suba el θ a mano;
    #   · el cierre escrito en la base, porque errar YA NO cierra el ejercicio
    #     (los intentos son ilimitados desde que existe el «¿Por qué?»), y
    #     /next devuelve el que sigue abierto en vez de servir otro. Saltear
    #     tampoco sirve: sirve el siguiente un tier MÁS ABAJO, así que dieciséis
    #     salteos hunden el recorrido hasta T0, que es justo lo que hay que
    #     evitar.
    client.post(
        "/game/derivemos/answer",
        headers=H,
        json={"exercise_id": ex["exercise_id"], "answer_latex": "x", "answer_mathjson": "x"},
    )
    db = database.SessionLocal()
    fila = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
    fila.theta = min(fila.theta + 0.45, 2.6)
    db.query(GameExercise).filter(GameExercise.id == ex["exercise_id"]).update(
        {"status": "answered"}
    )
    db.commit()
    db.close()

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
