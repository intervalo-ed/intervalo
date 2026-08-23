"""Verifica que los get-or-create toleren la creación concurrente.

En producción (23/8/2026) `/user/progress` devolvía 500 con UniqueViolation
sobre `unique_user_course_progress`: el dashboard pide los tres cursos en
paralelo y el alta de onboarding siembra units al mismo tiempo, así que dos
requests del mismo usuario llegaban juntas al INSERT.

En vez de depender del timing (que no reproduce nada de forma confiable), acá
la fila rival se inserta EXACTAMENTE en la ventana de la carrera: entre el
SELECT que no la encuentra y el INSERT que la crea. Determinístico.

Uso:
    python backend/scripts/check_race_get_or_create.py

Corre sobre un sqlite temporal en modo WAL (deja un writer concurrente con
lectores, como Postgres). Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "race.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from sqlalchemy import event  # noqa: E402

import database  # noqa: E402


@event.listens_for(database.engine, "connect")
def _wal(dbapi_conn, _rec):
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.close()


from models import Base, Course, CourseProgress, UnitState, User  # noqa: E402

import auth  # noqa: E402
import session_store as st  # noqa: E402

Base.metadata.create_all(database.engine)
S = database.SessionLocal

boot = S()
boot.add(Course(id=1, slug="analisis", name="Analisis"))
boot.add(Course(id=2, slug="algebra", name="Algebra"))
boot.add(User(id=1, clerk_user_id="clerk_1", email="a@a.com", name="A"))
boot.commit()
boot.close()

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


# ── course_progress ──────────────────────────────────────────────────────────
db = S()
original_slug = st._get_course_slug
rival: dict[str, int] = {}


def slug_con_rival(course_id, _db):
    """Se llama justo entre el SELECT y el INSERT: la ventana de la carrera."""
    otra = S()
    cp = CourseProgress(user_id=1, course_id=1, iteration=1, active_cap=7)
    otra.add(cp)
    otra.commit()
    rival["id"] = cp.id
    otra.close()
    st._get_course_slug = original_slug
    return original_slug(course_id, _db)


st._get_course_slug = slug_con_rival
try:
    cp = st._get_course_progress(1, 1, db)
    check("course_progress sobrevive la carrera", True)
    check(
        "devuelve la fila del ganador",
        cp is not None and cp.id == rival["id"] and cp.active_cap == 7,
    )
except Exception as exc:
    check("course_progress sobrevive la carrera", False, f"-> {type(exc).__name__}: {exc}")
finally:
    st._get_course_slug = original_slug

total = db.query(CourseProgress).filter(
    CourseProgress.user_id == 1, CourseProgress.course_id == 1
).count()
check("queda una sola fila", total == 1, f"(hay {total})")

try:
    db.query(User).first()
    check("la sesión sigue usable", True)
except Exception as exc:
    check("la sesión sigue usable", False, f"-> {exc}")
db.close()

db = S()
check("crea la fila cuando no hay carrera",
      st._get_course_progress(1, 2, db) is not None)
db.close()

# ── unit_states duplicadas ───────────────────────────────────────────────────
db = S()
unit = dict(user_id=1, course_id=1, belt="white", topic="definition",
            exercise_type="LEXI", phase="learning", step_index=0,
            ease_factor=2.5, interval_days=1, repetitions=0, attempted=False)
db.add(UnitState(**unit))
db.commit()

# Lo que de verdad hay que proteger: el caller llega con cambios propios sin
# guardar (acá, el update SM-2 de una respuesta). El choque tiene que revertir
# SOLO el insert duplicado y dejar el update en pie — si se perdiera, el
# usuario respondería un ejercicio y su progreso se evaporaría en silencio.
fila = db.query(UnitState).first()
fila.repetitions = 42
with st._tolerating_duplicates(db) as conflicto:
    db.add(UnitState(**unit))
check("detecta el choque", conflicto.error is not None)
db.commit()

total = db.query(UnitState).count()
check("no duplicó la unit", total == 1, f"(hay {total})")
check("el cambio pendiente del caller sobrevive",
      db.query(UnitState).first().repetitions == 42,
      f"(repetitions={db.query(UnitState).first().repetitions})")
try:
    db.query(User).first()
    check("la sesión sigue usable tras el duplicado", True)
except Exception as exc:
    check("la sesión sigue usable tras el duplicado", False, f"-> {exc}")
db.close()

# ── alta JIT de Clerk ────────────────────────────────────────────────────────
db = S()
orig_assign = auth.assign_unique_username


def assign_con_rival(_db, full_name):
    otra = S()
    otra.add(User(clerk_user_id="clerk_2", email="b@b.com", name="B", username="b"))
    otra.commit()
    otra.close()
    auth.assign_unique_username = orig_assign
    return orig_assign(_db, full_name)


auth.assign_unique_username = assign_con_rival
try:
    user = auth.get_or_create_user_from_clerk(
        db, auth.ClerkClaims(sub="clerk_2", email="b@b.com", name="B")
    )
    check("alta JIT sobrevive la carrera", True)
    check("devuelve el usuario del ganador",
          user is not None and user.clerk_user_id == "clerk_2")
except Exception as exc:
    check("alta JIT sobrevive la carrera", False, f"-> {type(exc).__name__}: {exc}")
finally:
    auth.assign_unique_username = orig_assign

total = db.query(User).filter(User.email == "b@b.com").count()
check("un solo usuario creado", total == 1, f"(hay {total})")
db.close()

print()
print("todo ok" if not fallos else f"FALLARON: {fallos}")
sys.exit(1 if fallos else 0)
