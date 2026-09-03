"""Verifica el CABLEADO del resumen de sesión, no sus piezas sueltas.

`get_summary_db` es la función más cargada de efectos secundarios del backend:
cierra la sesión, cuenta el día de racha, decide y anota el pedido, y encima
arma el payload. Cada una de esas cosas tenía su propio check —o ninguno— pero
nadie llamaba a la función entera, así que todo lo que fallaba en el enchufe
pasaba verde.

Lo que se prueba acá:

· Que el reparto de la XP extra sea honesto. Desde que el cafecito multiplica
  también en clásico, `xp_earned - xp_base` dejó de ser "el bonus de tu racha" y
  pasó a ser la suma de los dos. El resumen lo mostraba entero al lado del
  multiplicador de racha, así que con un empuje corriendo la pantalla enseñaba
  una cuenta que no cerraba con ninguno de los dos.
· Que la racha cuente UNA vez por día por más veces que se pida el resumen. Es
  el número que alimenta `streak_multiplier`, o sea que un día de más es XP de
  más para siempre.
· Que `finished_at` sea el instante real de cierre y no la hora de la última
  visita: con él se mide la duración de la sesión.
· Que el pedido persistido sobreviva a un refetch sin apagarse con la persona
  mirándolo, y sin contar como un pedido nuevo.

La REGLA de qué pedido corresponde vive en summary_asks.py y tiene su propio
check (check_pedidos_del_resumen.py); acá se prueba que alguien la llame y anote
el resultado.

Uso:
    python backend/scripts/check_resumen_de_sesion.py

Sale con código 1 si algo falla.
"""
import json
import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "resumen.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base,
    Course,
    Enrollment,
    Exercise,
    GameBoost,
    Session as SessionModel,
    User,
)

Base.metadata.create_all(database.engine)

import session_store as st  # noqa: E402
from game import boosts  # noqa: E402

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok   ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


db = database.SessionLocal()
db.add(Course(id=1, slug="analisis", name="Análisis"))
db.commit()
db.add(User(id=1, clerk_user_id="c1", email="a@a.com", name="Ana", username="ana"))
db.commit()
db.add(Enrollment(user_id=1, course_id=1, university="UBA", enrolled_at=datetime.utcnow()))
db.commit()

for i in range(8):
    db.add(Exercise(
        course_id=1, external_id=f"res_{i}", belt="white", topic="t",
        exercise_type="FORM", question=f"pregunta {i}",
        option_a="a", option_b="b", option_c="c", option_d="d",
        correct_index=0, has_math=False, feedback_correct="ok",
        feedback_incorrect='"no importa"',
    ))
db.commit()


def sesion_respondida(external_ids: list[str]) -> int:
    """Arma una sesión, la contesta entera bien, y devuelve su id."""
    sess = SessionModel(
        user_id=1, course_id=1, mode="main", started_at=datetime.utcnow(),
        exercises_total=len(external_ids),
        served_external_ids=json.dumps(external_ids),
    )
    db.add(sess)
    db.commit()
    estado = st._reconstruct_session_state(sess.id, 1, 1, db)
    st._sessions[str(sess.id)] = estado
    for ex in estado.exercises:
        st.record_answer_db(
            session_id_db=sess.id, user_id=1, exercise_id=ex.exercise_id,
            answer_index=ex.correct_index, attempts=1, response_time_s=5.0, db=db,
        )
    return sess.id


print("1. sin empuje, todo el extra es de la racha")
# La racha arranca en 0 y el primer resumen la pone en 1, que todavía no da
# multiplicador: sin empuje ni racha, no hay extra que repartir.
s1 = sesion_respondida(["res_0", "res_1"])
r1 = st.get_summary_db(s1, 1, db)
check("el resumen trae el campo del empuje", "xp_from_boost" in r1)
check("y viene en cero", r1["xp_from_boost"] == 0, f"(dio {r1['xp_from_boost']})")

# El número del subtítulo ("completaste tu sesión número n") cuenta las sesiones
# terminadas incluyéndose a sí misma. Se afirma acá porque también es la cuenta
# con la que se mide la cadencia de los pedidos: uno abajo, y el café y el
# WhatsApp salen una sesión corridos para siempre.
check("la primera sesión terminada es la número 1", r1["session_number"] == 1,
      f"(dio {r1['session_number']})")

print("2. con empuje, el extra se reparte y NO se le carga todo a la racha")
# Racha alta para que los dos multiplicadores estén en juego a la vez: es el
# único caso donde el número mezclado se puede confundir con el de la racha.
u = db.get(User, 1)
u.streak_days = 20  # ×1,6
u.streak_last_date = None
db.commit()
boosts.grant(db, university="UBA", cafecitos=10)  # ×2,0
db.commit()
boosts.olvidar_cache_de_empujes()

s2 = sesion_respondida(["res_2", "res_3"])
r2 = st.get_summary_db(s2, 1, db)
del_empuje = r2["xp_from_boost"]
de_la_racha = r2["streak"]["xp_bonus"]
base = r2["xp_earned"] - del_empuje - de_la_racha
check("el empuje aportó algo", del_empuje > 0, f"(dio {del_empuje})")
check("la racha también", de_la_racha > 0, f"(dio {de_la_racha})")
check(
    "y los tres pedazos suman el total",
    base + de_la_racha + del_empuje == r2["xp_earned"],
    f"(base {base} + racha {de_la_racha} + empuje {del_empuje} = {r2['xp_earned']})",
)
# La aserción que importa: el bonus que se dibuja al lado de "×1,6" no puede
# incluir lo que puso un multiplicador distinto.
check(
    "el bonus de la racha NO se lleva lo del cafecito",
    de_la_racha < r2["xp_earned"] - base,
    f"(racha {de_la_racha}, extra total {r2['xp_earned'] - base})",
)

db.query(GameBoost).delete()
db.commit()
boosts.olvidar_cache_de_empujes()

print("3. la racha cuenta UN día por día, por más resúmenes que se pidan")
antes = db.get(User, 1).streak_days
r_a = st.get_summary_db(s2, 1, db)
r_b = st.get_summary_db(s2, 1, db)
check("un refetch no vuelve a contar el día",
      db.get(User, 1).streak_days == antes,
      f"(antes {antes}, ahora {db.get(User, 1).streak_days})")
check("y el payload lo dice: ya no se contó hoy",
      r_a["streak"]["counted_today"] is False and r_b["streak"]["counted_today"] is False)

# Una sesión NUEVA el mismo día tampoco suma otro día.
s3 = sesion_respondida(["res_4", "res_5"])
st.get_summary_db(s3, 1, db)
check("otra sesión el mismo día tampoco",
      db.get(User, 1).streak_days == antes,
      f"(dio {db.get(User, 1).streak_days})")

print("4. finished_at es el cierre real, no la hora de la última visita")
sess3 = db.get(SessionModel, s3)
primero = sess3.finished_at
check("quedó marcado", primero is not None)
sess3.finished_at = primero - timedelta(hours=3)
db.commit()
viejo = db.get(SessionModel, s3).finished_at
st.get_summary_db(s3, 1, db)
check("revisitar el resumen no lo pisa",
      db.get(SessionModel, s3).finished_at == viejo,
      f"(era {viejo}, quedó {db.get(SessionModel, s3).finished_at})")

print("5. el pedido se anota una vez y sobrevive al refetch")
import summary_asks  # noqa: E402

u = db.get(User, 1)
u.pwa_first_seen_at = datetime.utcnow()
u.streak_days = 5
u.summary_ask_last_session = None
db.commit()

# La sesión nº6 es múltiplo de PEDIDO_CADA: le toca el café.
while True:
    n = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == 1, SessionModel.finished_at.isnot(None))
        .count()
    )
    if n >= summary_asks.PEDIDO_CADA - 1:
        break
    sid = sesion_respondida(["res_6"])
    st.get_summary_db(sid, 1, db)

sid = sesion_respondida(["res_7"])
rp = st.get_summary_db(sid, 1, db)
check("en la sesión que toca, sale el pedido", rp["pedido"] is not None,
      f"(sesión {rp['session_number']}, pedido {rp['pedido']!r})")
check("y quedó anotado en qué sesión salió",
      db.get(User, 1).summary_ask_last_session == rp["session_number"],
      f"(dio {db.get(User, 1).summary_ask_last_session})")

# El refetch: el pedido NO se puede apagar con la persona mirándolo, y tampoco
# puede contar como uno nuevo.
rp2 = st.get_summary_db(sid, 1, db)
check("el refetch devuelve el MISMO pedido", rp2["pedido"] == rp["pedido"],
      f"(dio {rp2['pedido']!r})")
check("y no movió la marca",
      db.get(User, 1).summary_ask_last_session == rp["session_number"])

check("el resumen lleva el @ para armar el link", rp["handle"] == "ana")
check("y el porcentaje vigente", rp["share_percent"] > 0)

db.close()

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
