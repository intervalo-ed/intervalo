"""Verifica el mail de agradecimiento por reportar un problema en un ejercicio.

Contexto: el mail se manda al día siguiente del reporte (nunca el mismo día,
para no leerse a respuesta automática), en la ventana 8-12 hora local del
usuario — mismo criterio que el mail de racha. Idempotencia por REPORTE
(`exercise_feedback.thanks_sent_at`), no por usuario: si alguien reportó más
de una vez antes de que le toque el mail, todos esos reportes se agrupan en
UN solo envío.

Uso:
    python backend/scripts/check_report_thanks_email.py

Determinístico: el reloj se congela parcheando lifecycle_emails.datetime, así
que nada depende de correr el script a una hora del día en particular. Sale
con código 1 si algo falla.
"""
import os
import sys
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

# La consola de Windows por default usa cp1252, que no representa el emoji del
# asunto (🙏) — sin esto el script no crashea por un bug real, crashea al
# intentar imprimir su propio resultado.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "thanks.db"
).replace("\\", "/")
os.environ.setdefault("EMAIL_UNSUB_SECRET", "test-secret-no-usar-en-prod")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base,
    Course,
    ExerciseFeedback,
    Session as SessionModel,
    User,
)

Base.metadata.create_all(database.engine)
S = database.SessionLocal

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


import lifecycle_emails as le  # noqa: E402

TZ = ZoneInfo("America/Argentina/Buenos_Aires")


class _FrozenDatetime(datetime):
    """Sustituye datetime.now dentro de lifecycle_emails por un instante fijo,
    expresado en la tz que se pida — igual que el datetime real, pero sin
    depender del reloj de la máquina que corre el test."""

    _instant_utc: datetime

    @classmethod
    def now(cls, tz=None):
        if tz is None:
            return cls._instant_utc.replace(tzinfo=None)
        return cls._instant_utc.astimezone(tz)


def _freeze(local_dt: datetime):
    """local_dt: datetime naive interpretado en TZ. Devuelve el patch activo."""
    aware = local_dt.replace(tzinfo=TZ)
    _FrozenDatetime._instant_utc = aware.astimezone(timezone.utc)
    return patch("lifecycle_emails.datetime", _FrozenDatetime)


# ── Fixtures ──────────────────────────────────────────────────────────────────
db = S()
db.add(Course(id=1, slug="analisis", name="Analisis"))
db.add(User(id=1, clerk_user_id="c1", email="a@a.com", name="A",
            timezone="America/Argentina/Buenos_Aires"))
db.add(User(id=2, clerk_user_id="c2", email="b@b.com", name="B",
            timezone="America/Argentina/Buenos_Aires", email_unsubscribed=True))
db.add(SessionModel(id=1, user_id=1, course_id=1, started_at=datetime.utcnow(),
                     exercises_total=1, mode="main"))
db.commit()


def _reportar(user_id: int, fecha_local: tuple[int, int, int], hora_local: int = 15) -> int:
    """Crea un reporte 'respondido' en una fecha/hora local explícitas —
    absoluta, no relativa al reloj real: todo el test vive en enero de 2026,
    coordinado con lo que congela `_freeze`."""
    y, m, d = fecha_local
    local_answered = datetime(y, m, d, hora_local, 0, 0, tzinfo=TZ)
    answered_utc = local_answered.astimezone(timezone.utc).replace(tzinfo=None)
    fb = ExerciseFeedback(
        user_id=user_id, session_id=1, course_id=1,
        exercise_external_id="white_x_LEXI_01", question_type="C",
        value="enunciado_error", shown_at=answered_utc, answered_at=answered_utc,
    )
    db.add(fb)
    db.commit()
    return fb.id

# ── 1. Reporte de HOY, aunque sea de madrugada: nunca sale el mismo día ──────
fb_hoy = _reportar(user_id=1, fecha_local=(2026, 1, 1), hora_local=7)
with _freeze(datetime(2026, 1, 1, 10, 0)):
    due = le.due_report_thanks_emails(db)
check("reporte de hoy no está due (ni en ventana horaria)", due == [],
      f"(due={due})")

db.query(ExerciseFeedback).delete(); db.commit()

# ── 2. Reporte de AYER, dentro de la ventana 8-12 -> due ─────────────────────
_reportar(user_id=1, fecha_local=(2026, 1, 1), hora_local=15)
with _freeze(datetime(2026, 1, 2, 9, 30)):
    due = le.due_report_thanks_emails(db)
check("reporte de ayer, en ventana 8-12: está due", len(due) == 1 and due[0][0].id == 1,
      f"(due={due})")

# ── 3. Mismo reporte, pero FUERA de la ventana (ej. 20:00) -> no due todavía ─
with _freeze(datetime(2026, 1, 2, 20, 0)):
    due = le.due_report_thanks_emails(db)
check("reporte de ayer, fuera de ventana: NO está due", due == [], f"(due={due})")

db.query(ExerciseFeedback).delete(); db.commit()

# ── 4. Dos reportes del mismo usuario, ambos vencidos -> UN solo envío ──────
id_a = _reportar(user_id=1, fecha_local=(2026, 1, 1), hora_local=9)
id_b = _reportar(user_id=1, fecha_local=(2026, 1, 2), hora_local=18)
with _freeze(datetime(2026, 1, 3, 10, 0)):
    due = le.due_report_thanks_emails(db)
check("dos reportes pendientes del mismo usuario: un solo grupo", len(due) == 1,
      f"(due={due})")
if due:
    ids_agrupados = sorted(due[0][1])
    check("el grupo incluye los dos reportes", ids_agrupados == sorted([id_a, id_b]),
          f"(ids={ids_agrupados}, esperado={sorted([id_a, id_b])})")

# ── 5. Usuario desuscripto: nunca aparece, aunque el reporte esté vencido ──
_reportar(user_id=2, fecha_local=(2026, 1, 1), hora_local=9)
with _freeze(datetime(2026, 1, 4, 10, 0)):
    due = le.due_report_thanks_emails(db)
check("usuario desuscripto queda afuera", all(u.id != 2 for u, _ in due),
      f"(due={[u.id for u, _ in due]})")

db.query(ExerciseFeedback).delete(); db.commit()

# ── 6. Ya agradecido (thanks_sent_at seteado): no vuelve a salir ────────────
fb_id = _reportar(user_id=1, fecha_local=(2026, 1, 1), hora_local=9)
db.query(ExerciseFeedback).filter(ExerciseFeedback.id == fb_id).update(
    {"thanks_sent_at": datetime.utcnow()}
)
db.commit()
with _freeze(datetime(2026, 1, 2, 10, 0)):
    due = le.due_report_thanks_emails(db)
check("reporte ya agradecido no vuelve a salir", due == [], f"(due={due})")

db.query(ExerciseFeedback).delete(); db.commit()

# ── 7. send_report_thanks_email marca thanks_sent_at solo si el envío OK ────
id1 = _reportar(user_id=1, fecha_local=(2026, 1, 1), hora_local=9)
id2 = _reportar(user_id=1, fecha_local=(2026, 1, 1), hora_local=11)
user1 = db.query(User).filter(User.id == 1).first()

with patch("lifecycle_emails._send", return_value=True) as mock_send:
    ok = le.send_report_thanks_email(db, user1, [id1, id2])
check("send_report_thanks_email devuelve True si _send OK", ok is True)
check("se llamó a _send exactamente una vez (un solo mail, no dos)",
      mock_send.call_count == 1, f"(llamadas={mock_send.call_count})")
subject_usado = mock_send.call_args[0][1]
check("el asunto tiene el nombre y el emoji acordado",
      subject_usado == "¡Gracias A! 🙏", f"(asunto={subject_usado!r})")

marcados = db.query(ExerciseFeedback).filter(
    ExerciseFeedback.id.in_([id1, id2]),
    ExerciseFeedback.thanks_sent_at.isnot(None),
).count()
check("los dos reportes quedan marcados como agradecidos", marcados == 2,
      f"(marcados={marcados})")

# ── 8. Si el envío falla, NO se marca (para que se reintente el próximo tick)
db.query(ExerciseFeedback).delete(); db.commit()
id3 = _reportar(user_id=1, fecha_local=(2026, 1, 1), hora_local=9)
with patch("lifecycle_emails._send", return_value=False):
    ok = le.send_report_thanks_email(db, user1, [id3])
check("send_report_thanks_email devuelve False si _send falla", ok is False)
sin_marcar = db.query(ExerciseFeedback).filter(
    ExerciseFeedback.id == id3, ExerciseFeedback.thanks_sent_at.is_(None)
).count()
check("un envío fallido NO marca el reporte (se reintenta después)",
      sin_marcar == 1, f"(sin_marcar={sin_marcar})")

# ── 9. Integración: run_lifecycle_emails reporta el contador nuevo ──────────
db.query(ExerciseFeedback).delete(); db.commit()
_reportar(user_id=1, fecha_local=(2026, 1, 1), hora_local=9)
with _freeze(datetime(2026, 1, 2, 9, 0)), patch("lifecycle_emails._send", return_value=True):
    resultado = le.run_lifecycle_emails(db)
check("run_lifecycle_emails devuelve report_thanks_sent", "report_thanks_sent" in resultado,
      f"(resultado={resultado})")
check("report_thanks_sent contó el envío", resultado.get("report_thanks_sent") == 1,
      f"(resultado={resultado})")

print()
print("todo ok" if not fallos else f"FALLARON: {fallos}")
sys.exit(1 if fallos else 0)
