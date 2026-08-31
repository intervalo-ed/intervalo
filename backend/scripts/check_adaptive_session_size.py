"""Verifica la rampa de tamaño de sesión y la reconstrucción de sesión desde
`served_external_ids` (en vez de re-sortear con build_session).

Contexto: 2026-08-26-motor-de-sesiones.md §4/§8 (rampa) y §4-bis (identidad de
lo servido). Ver session_store._adaptive_session_size y
session_store._reconstruct_session_state.

Uso:
    python backend/scripts/check_adaptive_session_size.py

Determinístico: siembra sesiones a mano con resultados fijos. Sale con código
1 si algo falla.
"""
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "rampa.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, Course, Exercise, Session as SessionModel, User  # noqa: E402

Base.metadata.create_all(database.engine)
S = database.SessionLocal

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


import session_store as st  # noqa: E402

db = S()
db.add(Course(id=1, slug="algebra", name="Álgebra"))
db.add(User(id=1, clerk_user_id="c1", email="a@a.com", name="A"))
db.commit()


def add_main_session(finished: bool, abandoned: bool, when: datetime) -> None:
    db.add(SessionModel(
        user_id=1, course_id=1, mode="main", started_at=when,
        finished_at=when + timedelta(minutes=5) if finished else None,
        abandoned=abandoned, exercises_total=3,
    ))
    db.commit()


now = datetime.utcnow()

# ── 1. Sesión 1: sin historial ⇒ 3 ───────────────────────────────────────────
check("sesión 1 (sin historial) -> 3", st._adaptive_session_size(1, 1, db) == 3)

# ── 2. Sesiones 2 y 3 ⇒ 4 ────────────────────────────────────────────────────
add_main_session(finished=True, abandoned=False, when=now - timedelta(days=2))
check("sesión 2 (1 previa) -> 4", st._adaptive_session_size(1, 1, db) == 4)
add_main_session(finished=True, abandoned=False, when=now - timedelta(days=1, hours=12))
check("sesión 3 (2 previas) -> 4", st._adaptive_session_size(1, 1, db) == 4)

# ── 3. De la 4ª en más: 5, sube con la racha, techo 8 ────────────────────────
add_main_session(finished=True, abandoned=False, when=now - timedelta(days=1))
check("sesión 4 (3 previas terminadas) -> 5", st._adaptive_session_size(1, 1, db) == 5)

for i in range(3):
    add_main_session(finished=True, abandoned=False, when=now - timedelta(hours=10 - i))
check("racha de 3 más -> sube a 6", st._adaptive_session_size(1, 1, db) == 6)

for _ in range(20):
    add_main_session(finished=True, abandoned=False, when=now)
check("racha larga -> techo en 8", st._adaptive_session_size(1, 1, db) == 8)

# ── 4. Tras abandonar, vuelve a 3 ─────────────────────────────────────────────
add_main_session(finished=False, abandoned=True, when=now)
check("tras abandonar -> vuelve a 3", st._adaptive_session_size(1, 1, db) == 3)

# ── 5. Reconstrucción desde served_external_ids (sin re-sortear) ────────────
for i in range(3):
    db.add(Exercise(
        course_id=1, external_id=f"srv_{i}", belt="white", topic="t", exercise_type="FORM",
        question=f"pregunta {i}", option_a="a", option_b="b", option_c="c", option_d="d",
        correct_index=0, has_math=False, feedback_correct="ok", feedback_incorrect="\"no importa\"",
    ))
db.commit()

sess = SessionModel(
    user_id=1, course_id=1, mode="main", started_at=now, exercises_total=3,
    served_external_ids=json.dumps(["srv_2", "srv_0", "srv_1"]),
)
db.add(sess)
db.commit()

reconstruido = st._reconstruct_session_state(sess.id, 1, 1, db)
ids_reconstruidos = [ex.external_id for ex in reconstruido.exercises]
check(
    "reconstruye en el mismo orden servido, sin re-sortear ítems",
    ids_reconstruidos == ["srv_2", "srv_0", "srv_1"],
    f"reconstruido={ids_reconstruidos}",
)

print()
if fallos:
    print(f"{len(fallos)} chequeo(s) fallaron: " + ", ".join(fallos))
    sys.exit(1)
print("todo ok")
