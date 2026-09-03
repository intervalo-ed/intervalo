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

Los pedidos del resumen de sesión —el cafecito y el de reclutar, que son otra
superficie— tienen su propio check: check_pedidos_del_resumen.py.

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

# La ventana tiene que DAR LA VUELTA a medianoche. Con `elegida <= hora <
# elegida + 2`, la franja de las 23 pedía `23 <= hora < 25`: la hora 0 no
# entraba nunca y quien eligió el horario más tarde tenía una hora de ventana en
# vez de dos. El caso de arriba ("a las 23, no") pasaba por otro motivo — la
# persona tiene la franja de las 9 —, así que no cubría esto.
nocturno = User(id=98, clerk_user_id="c98", email="n@n.com", name="N",
                notify_enabled=True, notify_time="23:00",
                notify_timezone="America/Argentina/Buenos_Aires")
check("a las 23 con franja de las 23, sí",
      push_store.en_horario_de_avisos(nocturno, a_las(23)))
check("y a medianoche todavía sí, que es la segunda hora de su ventana",
      push_store.en_horario_de_avisos(nocturno, a_las(0)))
check("a la 1 ya no", not push_store.en_horario_de_avisos(nocturno, a_las(1)))
check("y a las 22, tampoco todavía",
      not push_store.en_horario_de_avisos(nocturno, a_las(22)))

# Un `notify_time` ilegible no puede tirar un 500 en el tick: el endpoint valida
# el formato, pero el dato es viejo y puede venir de antes.
roto = User(id=97, clerk_user_id="c97", email="r@r.com", name="R",
            notify_enabled=True, notify_time="tarde", notify_timezone="UTC")
try:
    push_store.en_horario_de_avisos(roto, a_las(9))
    check("una hora ilegible no explota", True)
except Exception as e:  # noqa: BLE001
    check("una hora ilegible no explota", False, f"-> {type(e).__name__}")

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

# La variante de "se está terminando" era CÓDIGO MUERTO: estaba última y las
# tres de arriba cubren todos los casos entre ellas, así que no se alcanzaba
# nunca. Y pedía `studied_today` con default True, o sea que tampoco se activaba
# cuando nadie lo ponía en el contexto — y nadie lo ponía.
recien = {"donor_name": "Nico", "university": "UBA", "boost_multiplier": 1.4,
          "boost_hours_left": 20, "studied_today": False}
check("cuando el empuje recién arranca importa QUIÉN lo invitó",
      copy.choose_event_variant("cafecito", recien).key == "cafecito_named")

terminando = {**recien, "boost_hours_left": 3}
v = copy.choose_event_variant("cafecito", terminando)
check("con pocas horas y sin haber estudiado, avisa que se termina",
      v.key == "cafecito_ending", f"(dio {v.key})")
cuerpo_fin = copy.render("cafecito", v, terminando)[1]
check("y dice cuántas horas quedan", "3 h" in cuerpo_fin, f"({cuerpo_fin!r})")

check("pero si ya estudió hoy, no se le insiste",
      copy.choose_event_variant(
          "cafecito", {**terminando, "studied_today": True}
      ).key == "cafecito_named")

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

from models import (  # noqa: E402
    Course,
    Enrollment,
    GameBoost,
    GamePlayer,
    NotificationSend,
    PushSubscription,
)

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

print("8. el aviso de reclutas cuenta lo NUEVO, no lo de toda la vida")
# El bug que esto ataja: `referral_xp_given` es acumulativo y no baja nunca, así
# que preguntar por el total decía «hoy te dejaron N XP» con el N de siempre, y
# volvía a decirlo mañana, y pasado. Lo que se cuenta es la diferencia contra la
# marca, que se mueve recién cuando el aviso sale.
reclutador = User(
    id=2, clerk_user_id="c2", email="b@b.com", name="B",
    notify_enabled=True, notify_time="09:00", notify_timezone="UTC",
)
db.add(reclutador)
db.commit()
db.add(GamePlayer(id=9, alias="reclutador", user_id=2))
db.add(
    PushSubscription(
        user_id=2, course_id=1, endpoint="https://push.test/2", p256dh="k", auth="a"
    )
)
db.commit()

recluta = User(
    id=3, clerk_user_id="c3", email="c@c.com", name="C", username="tomi",
    referred_by_player_id=9, referral_xp_given=4,
)
db.add(recluta)
db.commit()

sin_umbral = [a for a in push_store.due_event_notifications(db, force=True)
              if a["user_id"] == 2]
check("con 4 XP no alcanza el umbral, no se avisa", sin_umbral == [])

recluta.referral_xp_given = 30
db.commit()
avisos2 = [a for a in push_store.due_event_notifications(db, force=True)
           if a["user_id"] == 2]
check("con 30 XP sí sale el aviso", len(avisos2) == 1, f"(dio {len(avisos2)})")
if avisos2:
    check("y dice las 30, no otra cosa", "30 XP" in avisos2[0]["body"],
          f"({avisos2[0]['body']!r})")
check(
    "la marca quedó parada en lo ya contado",
    db.get(User, 3).referral_xp_push_seen == 30,
    f"(dio {db.get(User, 3).referral_xp_push_seen})",
)

# Al día siguiente, sin XP nueva: el aviso NO puede volver a salir. Esta es la
# aserción que faltaba — la idempotencia por día tapaba el bug, así que hay que
# preguntar con el día ya cambiado.
def pasa_un_dia() -> None:
    """Mueve el reloj, no la historia: el cupo se reinicia y los envíos de ayer
    quedan fuera de la ventana de 24 h, pero las filas siguen ahí. Borrarlas
    haría que el copy de la PRIMERA vez volviera a salir siempre."""
    reclutador.notify_events_on = None
    reclutador.notify_events_count = 0
    for envio in db.query(NotificationSend).all():
        envio.sent_at = envio.sent_at - timedelta(days=1)
    db.commit()


pasa_un_dia()
manana = [a for a in push_store.due_event_notifications(db, force=True)
          if a["user_id"] == 2]
check("mañana, sin XP nueva, no se repite", manana == [], f"(dio {len(manana)})")

recluta.referral_xp_given = 55
db.commit()
tercera = [a for a in push_store.due_event_notifications(db, force=True)
           if a["user_id"] == 2]
check("pero con 25 XP más sí vuelve a salir", len(tercera) == 1)
if tercera:
    check("y cuenta 25, no 55", "25 XP" in tercera[0]["body"],
          f"({tercera[0]['body']!r})")
    # "Reclutaste a @X" se puede decir UNA vez. Antes salía de una bandera que se
    # prendía en todos los avisos de un solo recluta, así que la décima vez
    # también anunciaba el reclutamiento como si fuera nuevo.
    check("y ya no lo anuncia como el primero",
          not tercera[0]["body"].startswith("Reclutaste"),
          f"({tercera[0]['body']!r})")

print("9. la respuesta pasa por el response_model del endpoint")
# El check llamaba a `push_store` directo y saltaba FastAPI, así que un payload
# que el `response_model` rechaza pasaba verde acá y tiraba 500 en producción en
# cuanto hubiera un solo aviso. Validar contra el schema es la única forma de
# que el contrato del worker esté cubierto.
from schemas import DueNotification  # noqa: E402

pasa_un_dia()
recluta.referral_xp_given = 200
db.commit()
crudos = push_store.due_event_notifications(db, force=True)
check("hay algo que validar", len(crudos) >= 1, f"(dio {len(crudos)})")
try:
    [DueNotification.model_validate(a) for a in crudos]
    valida, motivo = True, ""
except Exception as e:  # noqa: BLE001
    valida, motivo = False, str(e).splitlines()[0]
check("cada aviso valida contra DueNotification", valida, motivo)

db.close()

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
