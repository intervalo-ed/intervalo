"""Verifica a quién le sigue saliendo la bienvenida animada del shell.

La regla es de una línea —«hasta que termines tu primera sesión»— y por eso
mismo se rompe callada: lo único que hay que equivocarse es en qué cuenta como
sesión. Las dos trampas están sembradas acá:

  - la sesión de `onboarding` es SINTÉTICA y nace con `finished_at` puesto en el
    mismo insert (session_store.seed_intro_item), así que un "¿tiene alguna
    sesión terminada?" ingenuo le apaga la bienvenida a quien todavía no jugó
    ni un ejercicio de verdad — justo la persona para la que existe;
  - una sesión ABANDONADA (`finished_at IS NULL`) no es una sesión hecha, ni acá
    ni en el panel.

Contar esto mal no se ve probando la app: hay que ser un usuario nuevo para
notarlo, y para cuando alguien lo note el dato ya se perdió. Ver
`session_store.termino_alguna_sesion` y `web/src/lib/nav/bienvenida.ts`.

Uso:
    python backend/scripts/check_bienvenida.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

# La consola de Windows abre en cp1252 y esto imprime acentos.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
# Archivo temporal y no ":memory:": NullPool abre una conexión por statement y
# la base en memoria perdería el esquema entre inserts (ver check_table_boost).
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "bienvenida.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base, Course, Session as SessionModel, User,
)

Base.metadata.create_all(database.engine)
S = database.SessionLocal

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


from metrics.queries import REAL_MODES  # noqa: E402
from session_store import termino_alguna_sesion  # noqa: E402

# ── Escenario ────────────────────────────────────────────────────────────────
# Un usuario por caso, así cada uno se lee solo.
CASOS = {
    1: "recién enrolado, sin ninguna sesión",
    2: "solo la sesión sintética del onboarding",
    3: "una sesión main abandonada",
    4: "una sesión main terminada",
    5: "una sesión practice terminada",
    6: "solo una sesión de QA (mode='test')",
    7: "onboarding + main terminada",
}

INICIO = datetime(2026, 9, 21, 12, 0)

db = S()
db.add(Course(id=1, slug="analisis", name="Análisis"))
db.add(Course(id=2, slug="algebra", name="Álgebra"))
for uid, nombre in CASOS.items():
    db.add(User(id=uid, clerk_user_id=f"c{uid}", email=f"u{uid}@x.com", name=nombre))
db.commit()

sid = 0


def sesion(user: int, mode: str, terminada: bool = True, course: int = 1) -> None:
    global sid
    sid += 1
    db.add(SessionModel(
        id=sid, user_id=user, course_id=course, mode=mode, started_at=INICIO,
        finished_at=INICIO + timedelta(minutes=5) if terminada else None,
        exercises_total=8,
    ))


# u2 y u7: el alta escribe la sesión sintética YA TERMINADA. Si esto dejara de
# ser cierto, el caso 2 dejaría de probar lo que dice probar —así que se
# verifica abajo contra el código de verdad, no solo contra esta fixture.
sesion(2, "onboarding")
sesion(3, "main", terminada=False)
sesion(4, "main")
sesion(5, "practice")
sesion(6, "test")
sesion(7, "onboarding")
sesion(7, "main")
db.commit()

# ── 1. Quién ya vino y quién no ──────────────────────────────────────────────
ESPERADO = {1: False, 2: False, 3: False, 4: True, 5: True, 6: False, 7: True}
for uid, espera in ESPERADO.items():
    real = termino_alguna_sesion(uid, db)
    check(f"{CASOS[uid]} → {'ya vino' if espera else 'le sale la bienvenida'}",
          real == espera, "" if real == espera else f"(dio {real})")

# ── 2. Que la trampa del onboarding siga siendo una trampa ───────────────────
# El caso 2 solo prueba algo mientras la sesión del alta nazca terminada. El día
# que `seed_intro_item` deje de poner `finished_at`, este check tiene que avisar
# que quedó vigilando un fantasma, no pasar en silencio.
sintetica = db.query(SessionModel).filter(SessionModel.user_id == 2).one()
check("la sesión del onboarding nace TERMINADA (si no, el caso 2 no prueba nada)",
      sintetica.finished_at is not None)
check("y por eso un 'alguna sesión terminada' sin filtrar por modo se equivoca",
      db.query(SessionModel.id).filter(
          SessionModel.user_id == 2,
          SessionModel.finished_at.isnot(None),
      ).first() is not None)

# ── 3. Cualquier curso cuenta ────────────────────────────────────────────────
# El home abre en el último curso usado, pero la bienvenida es del shell, no de
# un curso: quien hizo su primera sesión en álgebra ya vino.
sesion(1, "main", course=2)
db.commit()
check("una sesión en otro curso también cuenta", termino_alguna_sesion(1, db))

# ── 4. La definición es la misma que la del panel ────────────────────────────
# No es un detalle de estilo: con dos listas de modos, el embudo podría decir
# que alguien no hizo ninguna sesión mientras la app ya le sacó la bienvenida.
check("los modos que cuentan son los del panel", REAL_MODES == ("main", "practice"))

print()
print("todo ok" if not fallos else f"FALLARON: {fallos}")
sys.exit(1 if fallos else 0)
