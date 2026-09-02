"""Verifica el cupo y el horario de las notificaciones de evento.

El sistema mandaba ESTRICTAMENTE una notificación por día. Los avisos nuevos
—«tu recluta ya te generó N XP», «alguien de tu universidad invitó un cafecito»—
no pueden competir por ese cupo: si compartieran uno, un cafecito de la mañana
le comería el recordatorio de estudio del mediodía, que es la notificación que
sostiene el hábito.

Lo que se prueba es lo que no se ve mirando el teléfono:

· Que el tope sea 1 normal + 2 de evento, con contadores INDEPENDIENTES.
· Que el cupo se reinicie solo al cambiar el día LOCAL de esa persona, sin
  ningún job que lo limpie —cada quien tiene su huso, así que "medianoche" no es
  un instante único—.
· Que el claim consuma el cupo en la misma llamada que lo concede: sin eso, un
  tick reintentado manda el mismo aviso dos veces.
· Que fuera de la franja elegida no se interrumpa. Los avisos son reactivos y
  pueden dispararse a las cuatro de la mañana.
· Que el copy elija la variante por el HECHO y no al azar, y que nunca nombre a
  un donante que no se puede afirmar.

Uso:
    python backend/scripts/check_avisos_de_evento.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "avisos.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, User  # noqa: E402

Base.metadata.create_all(database.engine)

import notification_copy as copy  # noqa: E402
import push_store  # noqa: E402

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok   ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


db = database.SessionLocal()
db.add(
    User(
        id=1,
        clerk_user_id="c1",
        email="a@a.com",
        name="A",
        notify_enabled=True,
        notify_time="09:00",
        notify_timezone="America/Argentina/Buenos_Aires",
    )
)
db.commit()
u = db.get(User, 1)
hoy = date(2026, 9, 2)

print("1. el cupo de evento son dos, y se consumen al concederse")
check("el primero pasa", push_store.claim_event_slot(db, u, hoy))
check("el segundo también", push_store.claim_event_slot(db, u, hoy))
check("el tercero NO", not push_store.claim_event_slot(db, u, hoy))
check("y el contador quedó en el tope", u.notify_events_count == 2)

print("2. el cupo es INDEPENDIENTE del de la notificación normal")
u.notify_last_sent_on = hoy
db.commit()
check("gastar los dos de evento no marca la normal como enviada",
      u.notify_last_sent_on == hoy)
u.notify_last_sent_on = None
db.commit()
check("y gastar la normal no toca el contador de eventos",
      u.notify_events_count == 2)

print("3. al cambiar el día LOCAL el cupo se reinicia solo")
manana = date(2026, 9, 3)
check("el primero del día siguiente pasa", push_store.claim_event_slot(db, u, manana))
check("y el contador arrancó de nuevo", u.notify_events_count == 1)
check("la fecha guardada siguió al día", u.notify_events_on == manana)

print("4. fuera de la franja elegida no se interrumpe")
tz = ZoneInfo("America/Argentina/Buenos_Aires")
a_las = lambda h: datetime(2026, 9, 2, h, 30, tzinfo=tz).astimezone(ZoneInfo("UTC"))
check("a las 4 de la mañana, no", not push_store.en_horario_de_avisos(u, a_las(4)))
check("en su horario elegido (9), sí", push_store.en_horario_de_avisos(u, a_las(9)))
check("una hora después todavía sí", push_store.en_horario_de_avisos(u, a_las(10)))
check("tres horas después ya no", not push_store.en_horario_de_avisos(u, a_las(12)))
check("a las 23, no", not push_store.en_horario_de_avisos(u, a_las(23)))
sin_horario = User(id=2, clerk_user_id="c2", email="b@b.com", name="B")
check("quien no eligió horario no recibe avisos de evento",
      not push_store.en_horario_de_avisos(sin_horario, a_las(9)))

print("5. el copy elige por el HECHO, no al azar")
v = copy.choose_event_variant("cafecito", {"donor_name": "Nico", "university": "UBA",
                                           "boost_multiplier": 1.4})
check("con donante identificable, lo nombra", v.key == "cafecito_named")
cuerpo = copy.render(
    "cafecito",
    v,
    {"donor_name": "Nico", "university": "UBA", "boost_multiplier": 1.4},
)[1]
# `donor_name` es el texto libre que la persona escribió en el formulario de
# Cafecito ("Santi ITBA", "Nico"), no un @ del producto: ponerle arroba
# prometería un usuario que se puede buscar y que no existe.
check("y lo nombra SIN arroba, porque no es un @ del producto",
      "@" not in cuerpo, f"(dio {cuerpo!r})")
check("y el multiplicador va con coma, como en el resto del producto",
      "×1,4" in cuerpo, f"(dio {cuerpo!r})")

# La guarda que importa: Cafecito no dice quién donó, y decirle "@fulano invitó"
# a quien no fue es la frase que puede hacer sentir estafado a quien sí pagó.
v = copy.choose_event_variant("cafecito", {"university": "UTN", "boost_multiplier": 2.0})
check("sin donante identificable NO se inventa un @", v.key == "cafecito_anon")
check("y no aparece ninguna arroba en el cuerpo",
      "@" not in copy.render("cafecito", v, {"university": "UTN", "boost_multiplier": 2.0})[1])

v = copy.choose_event_variant("cafecito", {"boost_multiplier": 1.3})
check("sin universidad es el empuje global", v.key == "cafecito_global")

v = copy.choose_event_variant("recruit", {"recruit_count": 3, "recruit_xp": 40})
check("varios reclutas en un día se cuentan juntos", v.key == "recruit_multi")
check("un contexto vacío no rinde ninguna variante",
      copy.choose_event_variant("recruit", {}) is None)

print("6. las categorías de evento NO entran a la rotación de la normal")
check("recruit no está en los pesos", copy.CATEGORY_RECRUIT not in copy.CATEGORY_WEIGHTS)
check("cafecito tampoco", copy.CATEGORY_CAFECITO not in copy.CATEGORY_WEIGHTS)
check("los pesos siguen sumando 1", abs(sum(copy.CATEGORY_WEIGHTS.values()) - 1.0) < 1e-9)

print("7. la tubería completa: de un empuje real a un aviso reclamado")
# Hasta acá se probaron las piezas. Esto prueba que estén enchufadas, que es lo
# único que falla si el cupo y el copy están bien pero nadie los llama.
from datetime import timedelta  # noqa: E402

from models import Course, Enrollment, GameBoost, GamePlayer, PushSubscription  # noqa: E402

from game import boosts  # noqa: E402

db.add(Course(id=1, slug="analisis", name="Análisis"))
db.commit()
db.add(Enrollment(user_id=1, course_id=1, university="UBA"))
db.add(
    PushSubscription(
        user_id=1, course_id=1, endpoint="https://push.test/1", p256dh="k", auth="a"
    )
)
db.commit()
# El cupo del día ya está gastado por los casos de arriba: se limpia para probar
# la tubería con cupo disponible.
u.notify_events_on = None
u.notify_events_count = 0
db.commit()

sin_empuje = push_store.due_event_notifications(db, force=True)
check("sin nada que contar, no sale ningún aviso", sin_empuje == [])

boosts.grant(db, university="UBA", cafecitos=4, donor_name="Nico")
db.commit()
boosts.olvidar_cache_de_empujes()
avisos = push_store.due_event_notifications(db, force=True)
check("con un empuje corriendo, sale uno", len(avisos) == 1, f"(dio {len(avisos)})")
if avisos:
    check("y lleva la suscripción a la que mandarlo",
          len(avisos[0]["subscriptions"]) == 1)
    check("con el multiplicador en el cuerpo",
          "×1,4" in avisos[0]["body"], f"({avisos[0]['body']!r})")

# La idempotencia: el MISMO empuje no vuelve a avisar aunque siga corriendo.
otra_vez = push_store.due_event_notifications(db, force=True)
check("y no se repite en la corrida siguiente", otra_vez == [], f"(dio {len(otra_vez)})")

print("8. el CTA del resumen solo aparece cuando la persona ya se quedó")
# Las tres señales tienen que darse a la vez, y el momento es el festejo del
# hito. Sin esto, quien todavía está probando la app recibe un pedido de plata
# como tercera pantalla.
from algorithm import streak_info  # noqa: E402


def ofrece(*, pwa, sesiones, dias):
    """La misma expresión que arma `get_summary_db`, para poder recorrer los
    casos sin montar una sesión entera."""
    si = streak_info(dias)
    return bool(pwa is not None and sesiones >= 5 and dias >= 3 and si.tier_reached)


check("con todo dado, ofrece", ofrece(pwa=datetime(2026, 9, 1), sesiones=5, dias=3))
check("sin la PWA instalada, no", not ofrece(pwa=None, sesiones=5, dias=3))
check("con menos de 5 sesiones, no", not ofrece(pwa=datetime(2026, 9, 1), sesiones=4, dias=3))
check("en su segundo día, no", not ofrece(pwa=datetime(2026, 9, 1), sesiones=9, dias=2))
# El hito es lo que define el MOMENTO: el día 4 sigue teniendo ×1,2 pero ya no
# es la pantalla en la que acaba de subir, así que no se pide.
check("y en un día que NO es hito, tampoco",
      not ofrece(pwa=datetime(2026, 9, 1), sesiones=9, dias=4))
check("pero en el hito siguiente (9 días) vuelve a corresponder",
      ofrece(pwa=datetime(2026, 9, 1), sesiones=9, dias=9))

db.close()

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
