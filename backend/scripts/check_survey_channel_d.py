"""Verifica el canal D (interés) de la micro-encuesta post-ejercicio.

Contexto: D se suma a A (dificultad) y B (explicación) compartiendo el mismo
cupo anti-fatiga. Lo que hace falta comprobar no es que D "aparezca", sino dos
cosas que son fáciles de romper sin darse cuenta:

  1. Las reglas anti-fatiga cuentan a D como a cualquier otro canal
     (kill-switch de skips, y nunca el mismo ítem al mismo usuario). La
     alternancia entre sesiones se sacó el 2026-08-31 (descartaba 574 de 1.040
     sesiones sin evidencia de fatiga — ver 2026-08-26-motor-de-sesiones.md
     §7/§9): una sesión anterior con encuesta YA NO bloquea la siguiente.
  2. El targeting, en cambio, cuenta por canal. Un ítem con varios votos de
     dificultad NO está "cubierto" para interés: son preguntas distintas. Si
     ese contador volviera a ser global, el dataset del canal norte quedaría
     concentrado en los ítems que por azar nunca cayeron en A.

Uso:
    python backend/scripts/check_survey_channel_d.py

Determinístico: usa una SQLite temporal y fija la semilla del random donde el
resultado depende del sorteo. Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "survey_d.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
import feedback_survey as fs  # noqa: E402
from models import (  # noqa: E402
    Base,
    Course,
    Exercise,
    ExerciseFeedback,
    Session as SessionModel,
    User,
)

failures: list[str] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    print(f"  {'OK  ' if ok else 'FALLA'}  {name}{'' if ok else f'  -> {detail}'}")
    if not ok:
        failures.append(name)


class FakeSlot:
    """Espeja lo que assign_survey usa de un ExerciseInSession."""

    def __init__(self, idx: int, external_id: str, explanation: str | None = None):
        self.exercise_id = f"ex_{idx:03d}"
        self.external_id = external_id
        self.explanation = explanation


def fresh_db():
    Base.metadata.drop_all(bind=database.engine)
    Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    course = Course(slug="analisis", name="Análisis")
    db.add(course)
    db.flush()
    user = User(email="qa@intervalo.test", name="QA")
    db.add(user)
    db.flush()
    for i in range(6):
        db.add(
            Exercise(
                course_id=course.id,
                external_id=f"item_{i}",
                belt="white",
                topic="t",
                exercise_type="LEXI",
                question="q",
                option_a="a",
                option_b="b",
                option_c="c",
                option_d="d",
                correct_index=0,
                feedback_correct="bien",
                feedback_incorrect="mal",
            )
        )
    db.commit()
    return db, user.id, course.id


def slots(n: int = 5, explanation: str | None = None) -> list[FakeSlot]:
    return [FakeSlot(i, f"item_{i}", explanation) for i in range(n)]


def add_session(db, user_id: int, course_id: int, started_at: datetime) -> int:
    s = SessionModel(
        user_id=user_id, course_id=course_id, started_at=started_at, exercises_total=5
    )
    db.add(s)
    db.commit()
    return s.id


def add_feedback(db, *, user_id, session_id, course_id, item, qtype, answered=True, shown_at=None):
    db.add(
        ExerciseFeedback(
            user_id=user_id,
            session_id=session_id,
            course_id=course_id,
            exercise_external_id=item,
            question_type=qtype,
            shown_at=shown_at or datetime.utcnow(),
            answered_at=datetime.utcnow() if answered else None,
        )
    )
    db.commit()


# ── 1. Pesos: quién sale y en qué proporción ─────────────────────────────────
print("\nPesos de canal")

original_weights = dict(fs.SURVEY_WEIGHTS)
fs.SURVEY_WEIGHTS = {"D": 0.60, "A": 0.25, "B": 0.15}
N = 40000

mix_expl = Counter(fs._pick_channel(slots(explanation="porque sí")) for _ in range(N))
pct = {k: 100 * v / N for k, v in mix_expl.items()}
check(
    "con explicación reparte ~60/25/15",
    all(abs(pct.get(k, 0) - want) < 1.5 for k, want in (("D", 60), ("A", 25), ("B", 15))),
    str({k: round(v, 1) for k, v in pct.items()}),
)

mix_plain = Counter(fs._pick_channel(slots()) for _ in range(N))
pct = {k: 100 * v / N for k, v in mix_plain.items()}
check("sin explicación nunca sale B", "B" not in mix_plain, str(dict(mix_plain)))
check(
    "el peso de B se reparte proporcional (70/30), no todo a D",
    abs(pct.get("D", 0) - 70.6) < 1.5 and abs(pct.get("A", 0) - 29.4) < 1.5,
    str({k: round(v, 1) for k, v in pct.items()}),
)

os.environ["SURVEY_FORCE_CHANNEL"] = "D"
check("SURVEY_FORCE_CHANNEL fuerza el canal", fs._pick_channel(slots()) == "D")
os.environ["SURVEY_FORCE_CHANNEL"] = "no-existe"
check(
    "un SURVEY_FORCE_CHANNEL inválido se ignora",
    fs._pick_channel(slots(explanation="x")) in fs.SURVEY_TYPES,
)
del os.environ["SURVEY_FORCE_CHANNEL"]

# ── 2. Reglas anti-fatiga: D cuenta como cualquier canal ─────────────────────
print("\nAnti-fatiga (D cuenta igual que A y B)")

db, uid, cid = fresh_db()
prev = add_session(db, uid, cid, datetime.utcnow() - timedelta(hours=2))
add_feedback(db, user_id=uid, session_id=prev, course_id=cid, item="item_1", qtype="D")
check(
    "sin alternancia: una sesión anterior con D YA NO bloquea la siguiente",
    fs.assign_survey(uid, cid, slots(), db) is not None,
)

db, uid, cid = fresh_db()
old = datetime.utcnow() - timedelta(days=1)
for i in range(fs.SKIP_STREAK_LEN):
    sid = add_session(db, uid, cid, old)
    add_feedback(
        db, user_id=uid, session_id=sid, course_id=cid,
        item=f"item_{i}", qtype="D", answered=False, shown_at=old,
    )
# La última sesión creada es la anterior y tiene encuesta, así que además de la
# pausa por skips dispararía la alternancia. Se comprueba la pausa directo.
check("kill-switch: 3 skips seguidos de D pausan las encuestas", fs._in_skip_pause(uid, db))

db, uid, cid = fresh_db()
sid = add_session(db, uid, cid, datetime.utcnow() - timedelta(days=3))
add_feedback(db, user_id=uid, session_id=sid, course_id=cid, item="item_2", qtype="D")
check(
    "cross-canal: un ítem preguntado por D no se vuelve a preguntar por A",
    "item_2" in fs._already_asked_items(uid, db),
)

# ── 3. Targeting: el contador es por canal ───────────────────────────────────
print("\nTargeting por canal")

db, uid, cid = fresh_db()
# Otro usuario ya votó A muchas veces sobre item_1. Para el canal D ese ítem
# sigue virgen, así que tiene que poder salir sorteado.
other = User(email="otro@intervalo.test", name="Otro")
db.add(other)
db.commit()
sid_other = add_session(db, other.id, cid, datetime.utcnow() - timedelta(days=5))
for _ in range(8):
    add_feedback(
        db, user_id=other.id, session_id=sid_other, course_id=cid,
        item="item_1", qtype="A",
    )

os.environ["SURVEY_FORCE_CHANNEL"] = "D"
picked = {fs.assign_survey(uid, cid, slots(), db)["exercise_id"] for _ in range(200)}
check(
    "un ítem con 8 votos de A sigue siendo candidato para D",
    "ex_001" in picked,
    f"sorteados: {sorted(picked)}",
)

# Y al revés: con el canal A, ese ítem sí está saturado y no debería salir
# mientras haya otros con menos votos.
os.environ["SURVEY_FORCE_CHANNEL"] = "A"
picked_a = {fs.assign_survey(uid, cid, slots(), db)["exercise_id"] for _ in range(200)}
check(
    "para A, en cambio, ese ítem queda fuera del pool de menor volumen",
    "ex_001" not in picked_a,
    f"sorteados: {sorted(picked_a)}",
)
del os.environ["SURVEY_FORCE_CHANNEL"]

# ── 4. Nunca el primero ni el último ─────────────────────────────────────────
print("\nBordes de la sesión")

db, uid, cid = fresh_db()
os.environ["SURVEY_FORCE_CHANNEL"] = "D"
picked = {fs.assign_survey(uid, cid, slots(5), db)["exercise_id"] for _ in range(300)}
check(
    "nunca cae en el primer ni en el último ejercicio",
    picked <= {"ex_001", "ex_002", "ex_003"},
    f"sorteados: {sorted(picked)}",
)
check("con menos de 3 ejercicios no hay encuesta", fs.assign_survey(uid, cid, slots(2), db) is None)
del os.environ["SURVEY_FORCE_CHANNEL"]

db, uid, cid = fresh_db()
os.environ["SURVEY_FORCE_CHANNEL"] = "D"
# Sesión de tamaño 3 (rampa adaptativa, arranca ahí): "nunca el último" con la
# regla vieja de exercises[1:-1] solo dejaba ex_001 como candidato.
picked = {fs.assign_survey(uid, cid, slots(3), db)["exercise_id"] for _ in range(300)}
check(
    "con sesión de 3, el último ejercicio también es candidato",
    picked == {"ex_001", "ex_002"},
    f"sorteados: {sorted(picked)}",
)
del os.environ["SURVEY_FORCE_CHANNEL"]

# ── 5. Whitelist del chip de razón ───────────────────────────────────────────
print("\nWhitelist de la razón")

check(
    "una razón válida para el polo se conserva",
    fs.validate_reason("D", "interesante", "me_hizo_pensar") == "me_hizo_pensar",
)
check(
    "una razón del polo opuesto se descarta",
    fs.validate_reason("D", "interesante", "pura_cuenta") is None,
)
check(
    "el neutro no admite razón",
    fs.validate_reason("D", "justo", "me_hizo_pensar") is None,
)
check("una razón inventada se descarta", fs.validate_reason("D", "aburrido", "cualquiera") is None)
check("sin razón devuelve None", fs.validate_reason("D", "aburrido", None) is None)
check(
    "los otros canales nunca guardan razón",
    fs.validate_reason("A", "justo", "me_hizo_pensar") is None,
)

fs.SURVEY_WEIGHTS = original_weights

print()
if failures:
    print(f"{len(failures)} chequeo(s) fallaron: {', '.join(failures)}")
    sys.exit(1)
print("Todos los chequeos pasaron.")
