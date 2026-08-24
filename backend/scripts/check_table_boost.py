"""Verifica el empuje de ejercicios con tabla en las primeras sesiones.

Contexto: el formato tabla (más nuevo, mejor retención) es minoría en el banco
de probabilidad (9 de 206 ítems del blanco). Con sorteo uniforme, una
simulación de 400 primeras sesiones mostraba que el 64% de los usuarios nuevos
no veía ninguna tabla en su primera sesión — justo la sesión donde más importa.

El fix (session_store._table_boost + exercise_bank.get_exercise_db) agrega un
peso decreciente (x6 en la sesión 1, x1 desde la sesión 10) y una garantía en
la sesión 1: el primer slot que pueda dar tabla, la da. El ciclo por ítem
(`served_external_ids`) ya asegura que cada ejercicio del pool se sirve una
sola vez por ciclo, así que el peso solo cambia el ORDEN de aparición, nunca
qué ejercicios entran — no hace falta testear eso acá, solo el peso.

Uso:
    python backend/scripts/check_table_boost.py

Determinístico: nada de esto depende de correr N sesiones y contar frecuencias.
Sale con código 1 si algo falla.
"""
import os
import random
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

BACKEND = Path(__file__).resolve().parent.parent
# NullPool (ver database.py) abre una conexión nueva por statement; ":memory:"
# perdería el esquema entre un INSERT y el siguiente. Un archivo temporal es
# el equivalente real más simple.
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "boost.db"
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
import exercise_bank as eb  # noqa: E402

# ── Fixtures ──────────────────────────────────────────────────────────────────
db = S()
db.add(Course(id=1, slug="probabilidad", name="Probabilidad"))
db.add(User(id=1, clerk_user_id="c1", email="a@a.com", name="A"))
db.commit()

# Un ítem con 3 ejercicios sin tabla y 2 con tabla: sube lo bastante la
# proporción como para que el sorteo uniforme SÍ falle alguna vez sin el boost
# (control de que el test detecta lo que hay que detectar).
for i in range(3):
    db.add(Exercise(
        course_id=1, external_id=f"sin_{i}", belt="white", topic="reglas",
        exercise_type="FORM", question="q", option_a="a", option_b="b",
        option_c="c", option_d="d", correct_index=0, has_math=False,
        feedback_correct="ok", feedback_incorrect="[]",
    ))
for i in range(2):
    db.add(Exercise(
        course_id=1, external_id=f"tab_{i}", belt="white", topic="reglas",
        exercise_type="FORM", question="q", option_a="a", option_b="b",
        option_c="c", option_d="d", correct_index=0, has_math=False,
        feedback_correct="ok", feedback_incorrect="[]",
        table_data='{"rows": []}',
    ))
db.commit()

# ── 1. _table_boost: la curva de decay ───────────────────────────────────────
# n=1 (primera sesión real, "hechas"=0): boost máximo + garantía.
boost, garantizar = st._table_boost(1, 1, db)
check("sesión 1: boost máximo", boost == st.TABLE_BOOST_MAX, f"(boost={boost})")
check("sesión 1: garantiza tabla", garantizar is True)

# Simula sesiones main TERMINADAS para mover el contador de "hechas".
import datetime as dt  # noqa: E402


def _marcar_sesiones_hechas(n: int) -> None:
    db.query(SessionModel).filter(SessionModel.user_id == 1).delete()
    for _ in range(n):
        db.add(SessionModel(
            user_id=1, course_id=1, started_at=dt.datetime.now(dt.UTC),
            finished_at=dt.datetime.now(dt.UTC), exercises_total=1, mode="main",
        ))
    db.commit()


_marcar_sesiones_hechas(9)  # 9 hechas -> esta sería la sesión 10
boost10, gar10 = st._table_boost(1, 1, db)
check("sesión 10: boost neutro (x1)", boost10 == 1.0, f"(boost={boost10})")
check("sesión 10: sin garantía", gar10 is False)

_marcar_sesiones_hechas(4)  # 4 hechas -> sesión 5, a mitad de camino
boost5, gar5 = st._table_boost(1, 1, db)
check("sesión 5: boost intermedio", 1.0 < boost5 < st.TABLE_BOOST_MAX,
      f"(boost={boost5})")
check("sesión 5: sin garantía (solo la 1ª garantiza)", gar5 is False)

_marcar_sesiones_hechas(0)
onb = SessionModel(
    user_id=1, course_id=1, started_at=dt.datetime.now(dt.UTC),
    finished_at=dt.datetime.now(dt.UTC), exercises_total=1, mode="onboarding",
)
db.add(onb)
db.commit()
boost_onb, gar_onb = st._table_boost(1, 1, db)
check("la sesión sintética de onboarding no cuenta como 'hecha'",
      boost_onb == st.TABLE_BOOST_MAX and gar_onb is True,
      f"(boost={boost_onb}, garantiza={gar_onb})")

# ── 2. require_table: fuerza tabla cuando el pool la tiene ──────────────────
db.query(SessionModel).filter(SessionModel.user_id == 1).delete()
db.commit()
vistos_con_tabla = set()
for _ in range(15):
    ex = eb.get_exercise_db(1, "white", "reglas", "FORM", db, user_id=1,
                             require_table=True)
    vistos_con_tabla.add(bool(ex.get("table")))
check("require_table siempre devuelve un ejercicio con tabla",
      vistos_con_tabla == {True}, f"(vistos: {vistos_con_tabla})")

# Sin require_table, en algún momento de 30 tiradas uniformes SIN boost tiene
# que salir un ejercicio sin tabla (2 de 5 son con tabla: 60% de las tiradas
# individuales le pegan a "sin tabla" — si esto no pasa nunca en 30 intentos
# es indicio de que el mock de random está mal armado, no del código real).
vistos_normal = set()
for _ in range(30):
    ex = eb.get_exercise_db(1, "white", "reglas", "FORM", db, user_id=1)
    vistos_normal.add(bool(ex.get("table")))
check("sorteo normal (sin boost) sirve ambos tipos", vistos_normal == {True, False},
      f"(vistos: {vistos_normal})")

# ── 3. table_boost pesa el sorteo, no lo determina ───────────────────────────
# Determinístico: se intercepta random.choices para inspeccionar los PESOS que
# recibe, no el resultado — sin depender de tiradas.
capturado = {}
random_choices_real = random.choices


def _choices_espia(seq, weights=None, k=1):
    capturado["weights"] = weights
    capturado["items"] = list(seq)
    return random_choices_real(seq, weights=weights, k=k)


with patch("random.choices", side_effect=_choices_espia):
    eb.get_exercise_db(1, "white", "reglas", "FORM", db, user_id=1,
                        table_boost=6.0)

pesos = capturado.get("weights")
items = capturado.get("items")
check("con boost>1 se llama a random.choices (no random.choice)", pesos is not None)
if pesos is not None:
    peso_por_tabla = {bool(it.table_data): w for it, w in zip(items, pesos)}  # noqa: E501 (fila ORM: sigue siendo .table_data)
    check("los ejercicios con tabla pesan TABLE_BOOST",
          peso_por_tabla.get(True) == 6.0, f"(pesos: {peso_por_tabla})")
    check("los ejercicios sin tabla pesan 1", peso_por_tabla.get(False) == 1.0,
          f"(pesos: {peso_por_tabla})")

# boost<=1 no debe activar el camino ponderado (mismo comportamiento de antes).
capturado.clear()
with patch("random.choices", side_effect=_choices_espia):
    eb.get_exercise_db(1, "white", "reglas", "FORM", db, user_id=1, table_boost=1.0)
check("boost=1.0 no activa random.choices (sigue siendo random.choice puro)",
      "weights" not in capturado)

# ── 4. Agnóstico del curso: unidad sin ningún ejercicio con tabla ───────────
db.add(Exercise(
    course_id=1, external_id="sin_tabla_unica", belt="white", topic="factoriales",
    exercise_type="RESL", question="q", option_a="a", option_b="b",
    option_c="c", option_d="d", correct_index=0, has_math=False,
    feedback_correct="ok", feedback_incorrect="[]",
))
db.commit()
ex = eb.get_exercise_db(1, "white", "factoriales", "RESL", db, user_id=1,
                         table_boost=6.0, require_table=True)
check("unidad sin tablas no explota con require_table=True",
      ex.get("external_id") == "sin_tabla_unica")

# ── 5. Integración: create_session_db respeta el ciclo (ver docstring) ──────
# El ciclo por ítem ya está probado en otro lado; acá solo se confirma que el
# boost no lo interfiere: dos ciclos completos de la unidad "reglas/FORM"
# sirven cada external_id exactamente 2 veces (una por ciclo), sin overrides.
db.query(SessionModel).filter(SessionModel.user_id == 1).delete()
db.commit()
import collections  # noqa: E402
conteo: collections.Counter = collections.Counter()
for _ in range(10):  # 2 ciclos completos del pool de 5
    ex = eb.get_exercise_db(1, "white", "reglas", "FORM", db, user_id=1,
                             table_boost=6.0)
    conteo[ex["external_id"]] += 1
    eb.mark_exercise_served(1, 1, "white", "reglas", "FORM", ex["external_id"], db)
check("el boost no rompe el ciclo: cada ítem servido exactamente 2 veces",
      set(conteo.values()) == {2}, f"(conteo: {dict(conteo)})")

print()
print("todo ok" if not fallos else f"FALLARON: {fallos}")
sys.exit(1 if fallos else 0)
