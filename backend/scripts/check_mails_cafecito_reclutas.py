"""Verifica los dos mails nuevos: el efecto de un cafecito y el resumen de reclutas.

Lo que importa de estos dos no es que se manden, sino CUÁNDO NO se mandan:

· Un mail que dice «tu cafecito generó 0 XP» es peor que ningún mail.
· Un resumen semanal vacío convierte el canal en ruido y enseña a ignorarlo, que
  es lo último que se quiere de algo que llega una vez por semana.

Y una promesa que el mail del cafecito NO puede hacer: `multiplier_for` colapsa
el empuje global y el dirigido en un número, y los cafecitos de la ventana se
suman a propósito, así que la XP no se puede atribuir a UNA donación. El copy
dice «el empuje de tu universidad», nunca «tu cafecito».

Uso:
    python backend/scripts/check_mails_cafecito_reclutas.py

No manda nada: el envío se intercepta.
"""
import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "mails.db"
).replace("\\", "/")
os.environ.setdefault("EMAIL_UNSUB_SECRET", "test")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, User  # noqa: E402

Base.metadata.create_all(database.engine)

import lifecycle_emails as le  # noqa: E402

fallos: list[str] = []
enviados: list[dict] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok   ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


# Se intercepta el envío: este check no habla con Resend.
def _fake_send(to_email, subject, html, unsubscribe_url, text=None):
    enviados.append({"to": to_email, "subject": subject, "html": html})
    return True


le._send = _fake_send

db = database.SessionLocal()
db.add(User(id=1, clerk_user_id="c1", email="a@a.com", name="Ana Gómez"))
db.commit()
u = db.get(User, 1)

print("1. el mail del cafecito no se manda si no hubo efecto")
check("con 0 XP extra no se manda",
      not le.send_cafecito_efecto_email(db, u, university="UBA", xp_extra=0, estudiantes=0))
check("y no salió nada", len(enviados) == 0)

print("2. con efecto real sí, y dice lo que puede afirmar")
ok = le.send_cafecito_efecto_email(db, u, university="UBA", xp_extra=340, estudiantes=12)
check("se manda", ok and len(enviados) == 1)
mail = enviados[-1]
check("el asunto lleva el número y la universidad",
      "340" in mail["subject"] and "UBA" in mail["subject"], f"({mail['subject']!r})")
check("el cuerpo habla del empuje de la universidad, NO de 'tu cafecito generó'",
      "la UBA sumó 340 XP extra" in mail["html"])
check("y dice entre cuántos se repartió", "12 estudiantes" in mail["html"])

print("3. el empuje global se nombra distinto")
le.send_cafecito_efecto_email(db, u, university=None, xp_extra=90, estudiantes=5)
mail = enviados[-1]
check("sin universidad dice 'todo Intervalo'", "todo Intervalo" in mail["subject"])

print("4. el resumen de reclutas no se manda vacío")
antes = len(enviados)
check("sin XP en la semana no se manda",
      not le.send_reclutas_semanal_email(db, u, xp_semana=0, filas=[]))
check("con XP pero sin filas tampoco",
      not le.send_reclutas_semanal_email(db, u, xp_semana=10, filas=[]))
check("y no salió nada", len(enviados) == antes)

print("5. con movimiento, el listado va ordenado y completo")
filas = [("lucia.m", "UBA", 120), ("tomifer", "UTN", 64), ("nachoq", "UBA", 31)]
ok = le.send_reclutas_semanal_email(db, u, xp_semana=215, filas=filas)
check("se manda", ok)
mail = enviados[-1]
check("el asunto lleva el total", "215 XP" in mail["subject"], f"({mail['subject']!r})")
check("el destacado dice de cuántas personas", "de 3 personas" in mail["html"])
for alias, uni, xp in filas:
    check(f"la fila de @{alias} está", f"@{alias}" in mail["html"] and f"{xp} XP" in mail["html"])
check("va como tabla y no como flex, que los clientes de correo no soportan",
      "<table" in mail["html"])
check("y el botón dice Ver", ">Ver<" in mail["html"])

db.close()

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
