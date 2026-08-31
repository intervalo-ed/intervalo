"""Verifica la guarda anti-repetido al agotar el ciclo de un ítem, y la
política de orden (rampa + ε-exploración) del selector de próximo ejercicio.

Contexto: al agotarse `ItemExerciseCycle.served_external_ids`,
`get_exercise_db` reseteaba el ciclo y sorteaba uniformemente sobre el pool
COMPLETO, ejercicio recién visto incluido — hasta 8,3% de probabilidad de
repetido back-to-back con pool 12 (ver 2026-08-26-motor-de-sesiones.md §3/§9).
El fix guarda el orden real de servido (antes se guardaba `sorted()`, un set
sin orden) y excluye explícitamente al último al resetear.

Uso:
    python backend/scripts/check_exercise_cycle_no_repeat.py

Determinístico: agota el ciclo dos veces seguidas y compara identidades
exactas, no frecuencias. Sale con código 1 si algo falla.
"""
import json
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "ciclo.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, Course, Exercise, ItemExerciseCycle, User  # noqa: E402

Base.metadata.create_all(database.engine)
S = database.SessionLocal

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


import exercise_bank as eb  # noqa: E402

db = S()
db.add(Course(id=1, slug="algebra", name="Álgebra"))
db.add(User(id=1, clerk_user_id="c1", email="a@a.com", name="A"))
db.commit()

POOL = 4
for i in range(POOL):
    db.add(Exercise(
        course_id=1, external_id=f"ex_{i}", belt="white", topic="factoriales",
        exercise_type="FORM", question="q", option_a="a", option_b="b",
        option_c="c", option_d="d", correct_index=0, has_math=False,
        feedback_correct="ok", feedback_incorrect="[]",
    ))
db.commit()


def serve_and_mark(user_id: int) -> str:
    ex = eb.get_exercise_db(1, "white", "factoriales", "FORM", db, user_id)
    eb.mark_exercise_served(user_id, 1, "white", "factoriales", "FORM", ex["external_id"], db)
    db.commit()
    return ex["external_id"]


# ── 1. served_external_ids guarda orden, no un set ordenado alfabéticamente ──
orden_servido = [serve_and_mark(2) for _ in range(POOL)]
cycle = db.query(ItemExerciseCycle).filter(ItemExerciseCycle.user_id == 2).first()
guardado = json.loads(cycle.served_external_ids)
check(
    "served_external_ids preserva el orden de servido",
    guardado == orden_servido,
    f"guardado={guardado} servido={orden_servido}",
)

# ── 2. Al agotar el ciclo, el primero del ciclo nuevo nunca es el último ─────
# Repetir muchas veces para exprimir el sorteo: sembrar un usuario nuevo por
# corrida, agotar el ciclo, y mirar el PRIMER servido del ciclo siguiente.
repeticiones_backtoback = 0
CORRIDAS = 300
for run in range(CORRIDAS):
    uid = 1000 + run
    db.add(User(id=uid, clerk_user_id=f"c{uid}", email=f"u{uid}@a.com", name="U"))
    db.commit()
    servidos = [serve_and_mark(uid) for _ in range(POOL)]  # agota el ciclo exacto
    ultimo = servidos[-1]
    primero_del_reset = serve_and_mark(uid)  # fuerza el reset (POOL+1 pedido)
    if primero_del_reset == ultimo:
        repeticiones_backtoback += 1

check(
    "nunca repite el último servido al resetear el ciclo",
    repeticiones_backtoback == 0,
    f"repeticiones en {CORRIDAS} corridas: {repeticiones_backtoback}",
)

# ── 3. La rampa: primer tercio del ciclo favorece el más fácil ───────────────
db_r = S()
db_r.add(Course(id=2, slug="rampa", name="Rampa"))
db_r.add(User(id=5000, clerk_user_id="cr", email="r@a.com", name="R"))
db_r.commit()
for i in range(6):
    db_r.add(Exercise(
        course_id=2, external_id=f"r_{i}", belt="white", topic="t", exercise_type="FORM",
        question="q", option_a="a", option_b="b", option_c="c", option_d="d",
        correct_index=0, has_math=False, feedback_correct="ok", feedback_incorrect="[]",
        difficulty=float(i), difficulty_n=10,  # r_0 el más fácil, r_5 el más difícil
    ))
db_r.commit()
with patch("exercise_bank.random.random", return_value=0.99):  # nunca explora
    primero = eb.get_exercise_db(2, "white", "t", "FORM", db_r, 5000)
check(
    "en el primer tercio del ciclo (sin explorar) sirve el más fácil",
    primero["external_id"] == "r_0",
    f"sirvió {primero['external_id']}",
)

print()
if fallos:
    print(f"{len(fallos)} chequeo(s) fallaron: " + ", ".join(fallos))
    sys.exit(1)
print("todo ok")
