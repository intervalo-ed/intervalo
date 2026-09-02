"""Verifica que el empuje de cafecito llegue a la XP de Intervalo clásico.

Un cafecito invitado en el minijuego multiplica el XP de toda una universidad
durante un día, y desde este cambio eso vale también acá. Lo que se prueba es lo
que NO se ve mirando la pantalla:

· Que el tope del producto sea 4,0 y no el ×3 del juego. Con tope 3,0 una sola
  persona con racha alta y su propia donación llega al techo, y game/boosts.py
  promete con todas las letras que al ×3 "hacen falta al menos dos personas".
· Que se redondee UNA sola vez, sobre el producto. Aplicar racha y empuje por
  separado da un número distinto del que muestra la tile, y el que pierde la
  confianza cuando no coinciden es el número.
· Que el candado antimudanza exista de este lado. En el juego está tapado por
  `game_players.university_set_at`; acá hace falta el gemelo en `enrollments` o
  cualquiera rehace el alta con la universidad impulsada y cobra.
· Que `answers.xp_from_boost` guarde el reparto entre racha y cafecito, que
  después no se puede reconstruir.
· Que quien cobra el empuje global y el de su universidad a la vez vea los DOS
  tramos, con sus dos donantes y sus dos vencimientos.

Uso:
    python backend/scripts/check_xp_boost.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "xp_boost.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from sqlalchemy import func  # noqa: E402
from models import (  # noqa: E402
    Answer,
    Base,
    Course,
    Enrollment,
    Exercise,
    GameBoost,
    User,
)

Base.metadata.create_all(database.engine)
S = database.SessionLocal

import xp_boost  # noqa: E402
from algorithm import (  # noqa: E402
    MAX_TOTAL_MULTIPLIER,
    effective_multiplier,
    review_xp_split,
    xp_from_boost,
)
from game import boosts  # noqa: E402

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok   ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


def limpiar_empujes(db) -> None:
    db.query(GameBoost).delete()
    db.commit()
    # El "no hay empujes" se memoriza unos segundos por proceso; sin esto, un
    # caso ve el estado del anterior.
    boosts.olvidar_cache_de_empujes()


db = S()
db.add(Course(id=1, slug="analisis", name="Análisis"))
db.add(User(id=1, clerk_user_id="c1", email="uba@a.com", name="Uba"))
db.add(User(id=2, clerk_user_id="c2", email="utn@a.com", name="Utn"))
db.add(User(id=3, clerk_user_id="c3", email="sin@a.com", name="Sin universidad"))
db.commit()
db.add(Enrollment(user_id=1, course_id=1, university="UBA"))
db.add(Enrollment(user_id=2, course_id=1, university="UTN"))
db.add(Enrollment(user_id=3, course_id=1, university=None))
db.commit()

print("1. sin empuje no cambia nada")
limpiar_empujes(db)
check("sin empujes el multiplicador es 1,0", xp_boost.multiplier_for_user(db, 1) == 1.0)
check("y no hay tramos que mostrar", xp_boost.tramos_de_usuario(db, 1) == [])

print("2. el empuje dirigido le toca a su universidad y solo a ella")
limpiar_empujes(db)
boosts.grant(db, university="UBA", cafecitos=4, donor_name="Nico")
db.commit()
boosts.olvidar_cache_de_empujes()
m_uba = xp_boost.multiplier_for_user(db, 1)
m_utn = xp_boost.multiplier_for_user(db, 2)
check("el de la UBA cobra ×1,4", abs(m_uba - 1.4) < 1e-9, f"(dio {m_uba})")
check("el de la UTN no cobra nada", m_utn == 1.0, f"(dio {m_utn})")
check("el que no cargó universidad tampoco", xp_boost.multiplier_for_user(db, 3) == 1.0)

print("3. el empuje global le toca a todo el mundo, universidad o no")
limpiar_empujes(db)
boosts.grant(db, university=None, cafecitos=3)
db.commit()
boosts.olvidar_cache_de_empujes()
check("el que no cargó universidad SÍ cobra el global",
      abs(xp_boost.multiplier_for_user(db, 3) - 1.3) < 1e-9)
check("y el que sí la cargó también", abs(xp_boost.multiplier_for_user(db, 1) - 1.3) < 1e-9)

print("4. global + dirigido se suman, y se ven los dos tramos")
limpiar_empujes(db)
boosts.grant(db, university=None, cafecitos=3, donor_name="Global")
boosts.grant(db, university="UBA", cafecitos=4, donor_name="Nico")
boosts.grant(db, university="UTN", cafecitos=9, donor_name="Ajeno")
db.commit()
boosts.olvidar_cache_de_empujes()
check("los cafecitos del global y los de su universidad se suman (3+4 → ×1,7)",
      abs(xp_boost.multiplier_for_user(db, 1) - 1.7) < 1e-9,
      f"(dio {xp_boost.multiplier_for_user(db, 1)})")
tramos = xp_boost.tramos_de_usuario(db, 1)
unis = sorted(t.university or "GLOBAL" for t in tramos)
check("ve DOS tramos: el global y el suyo", unis == ["GLOBAL", "UBA"], f"(dio {unis})")
check("y no el de la universidad ajena", "UTN" not in unis)

print("5. el candado antimudanza también existe en clásico")
limpiar_empujes(db)
boosts.grant(db, university="UBA", cafecitos=5)
db.commit()
boosts.olvidar_cache_de_empujes()
# El de la UTN se muda a la UBA DESPUÉS de que arrancó el empuje.
fila = db.query(Enrollment).filter(Enrollment.user_id == 2).first()
fila.university, fila.university_set_at = "UBA", datetime.utcnow() + timedelta(seconds=1)
db.commit()
check("mudarse a la universidad impulsada no cobra el empuje",
      xp_boost.multiplier_for_user(db, 2) == 1.0,
      f"(dio {xp_boost.multiplier_for_user(db, 2)})")
check("pero el que ya estaba lo sigue cobrando",
      abs(xp_boost.multiplier_for_user(db, 1) - 1.5) < 1e-9)
# Haberla cargado UNA vez y no haberla cambiado nunca (sello en NULL) sí cobra.
fila.university_set_at = None
db.commit()
check("y quien la cargó una sola vez y nunca la movió, cobra",
      abs(xp_boost.multiplier_for_user(db, 2) - 1.5) < 1e-9)

print("6. el tope del producto es 4,0, no el ×3 del juego")
check("racha máxima sola no llega al tope", effective_multiplier(2.0, 1.0) == 2.0)
check("una donación sola tampoco (×2 es lo que aporta una persona)",
      effective_multiplier(1.0, 2.0) == 2.0)
check("racha máxima + una donación sola dan exactamente el tope",
      effective_multiplier(2.0, 2.0) == MAX_TOTAL_MULTIPLIER,
      f"(dio {effective_multiplier(2.0, 2.0)})")
check("y nada lo pasa: ×2 de racha con el ×3 del juego sigue en 4,0",
      effective_multiplier(2.0, 3.0) == MAX_TOTAL_MULTIPLIER,
      f"(dio {effective_multiplier(2.0, 3.0)})")
check("con racha de 15 días (×1,5) una donación propia NO alcanza el tope",
      effective_multiplier(1.5, 2.0) < MAX_TOTAL_MULTIPLIER,
      f"(dio {effective_multiplier(1.5, 2.0)}) — con tope 3,0 llegaba sola")

print("7. se redondea una sola vez, sobre el producto")
# Con base 8, racha ×1,2 y empuje ×1,4: el producto es 1,68 → 13. Redondeando
# por separado darían round(8*1,2)=10 y después round(10*1,4)=14.
base, streak, boost = 8, 1.2, 1.4
_, una_vez = review_xp_split(1, 1.0, effective_multiplier(streak, boost))
dos_veces = round(round(base * streak) * boost)
check("un solo redondeo da 13 y dos dan 14", una_vez == 13 and dos_veces == 14,
      f"(una vez {una_vez}, dos veces {dos_veces})")

print("8. xp_from_boost reparte entre racha y cafecito")
check("sin empuje el reparto es cero", xp_from_boost(8, 1.2, effective_multiplier(1.2, 1.0)) == 0)
puesto = xp_from_boost(8, 1.2, effective_multiplier(1.2, 1.4))
check("con empuje es lo que se cobró de más sobre la racha sola",
      puesto == 13 - round(8 * 1.2), f"(dio {puesto})")
check("nunca es negativo con multiplicadores válidos",
      xp_from_boost(8, 2.0, effective_multiplier(2.0, 1.0)) == 0)

print("9. de punta a punta: la respuesta paga el empuje y lo deja anotado")
# Lo anterior prueba las piezas; esto prueba que estén enchufadas. Es el único
# caso que falla si `record_answer_db` calcula bien pero no llama al adaptador.
import json  # noqa: E402
import session_store as st  # noqa: E402
from models import Answer, Session as SessionModel  # noqa: E402

for i in range(2):
    db.add(Exercise(
        course_id=1, external_id=f"bst_{i}", belt="white", topic="t", exercise_type="FORM",
        question=f"pregunta {i}", option_a="a", option_b="b", option_c="c", option_d="d",
        correct_index=0, has_math=False, feedback_correct="ok",
        feedback_incorrect='"no importa"',
    ))
db.commit()


def responder(external_ids: list[str]) -> tuple[int, int]:
    """Arma una sesión, contesta bien el primer ejercicio, y devuelve
    (xp_earned, xp_from_boost) de esa respuesta."""
    sess = SessionModel(
        user_id=1, course_id=1, mode="main", started_at=datetime.utcnow(),
        exercises_total=len(external_ids),
        served_external_ids=json.dumps(external_ids),
    )
    db.add(sess)
    db.commit()
    estado = st._reconstruct_session_state(sess.id, 1, 1, db)
    st._sessions[str(sess.id)] = estado
    ex = estado.exercises[0]
    st.record_answer_db(
        session_id_db=sess.id, user_id=1, exercise_id=ex.exercise_id,
        answer_index=ex.correct_index, attempts=1, response_time_s=5.0, db=db,
    )
    fila = db.query(Answer).filter(Answer.session_id == sess.id).first()
    return fila.xp_earned, fila.xp_from_boost


limpiar_empujes(db)
xp_sin, boost_sin = responder(["bst_0"])
check("sin empuje, xp_from_boost queda en cero", boost_sin == 0, f"(dio {boost_sin})")

limpiar_empujes(db)
boosts.grant(db, university="UBA", cafecitos=10)  # ×2,0 para la UBA
db.commit()
boosts.olvidar_cache_de_empujes()
xp_con, boost_con = responder(["bst_1"])
check("con empuje la respuesta paga MÁS que sin él",
      xp_con > xp_sin, f"(sin {xp_sin}, con {xp_con})")
check("y lo que pagó de más quedó anotado en xp_from_boost",
      boost_con == xp_con - xp_sin, f"(dio {boost_con}, esperado {xp_con - xp_sin})")
check("con ×2,0 y sin racha, la XP se duplica",
      xp_con == xp_sin * 2, f"(sin {xp_sin}, con {xp_con})")

print("10. el payload de progreso lleva el empuje, y calla cuando no hay")
limpiar_empujes(db)
prog = st.get_user_progress_db(1, 1, db)
check("sin empuje, `boost` viene en None", prog["boost"] is None)

boosts.grant(db, university=None, cafecitos=2, donor_name="Global")
boosts.grant(db, university="UBA", cafecitos=4, donor_name="Nico")
db.commit()
boosts.olvidar_cache_de_empujes()
prog = st.get_user_progress_db(1, 1, db)
b = prog["boost"]
check("con empuje viene el bloque", b is not None)
check("con los DOS tramos, no uno", b and len(b["tramos"]) == 2,
      f"(dio {len(b['tramos']) if b else 0})")
check("el multiplicador es la suma de los dos (2+4 → ×1,6)",
      b and abs(b["multiplier"] - 1.6) < 1e-9, f"(dio {b['multiplier'] if b else None})")
check("y el efectivo lo calcula la MISMA función que paga",
      b and b["effective_multiplier"] == effective_multiplier(
          prog["streak"]["multiplier"], b["multiplier"]),
      f"(dio {b['effective_multiplier'] if b else None})")
# El vencimiento que se muestra es el del tramo que se apaga PRIMERO: es el
# instante en que el número deja de ser cierto, aunque el otro siga corriendo.
check("el vencimiento es el mínimo de los tramos, no el máximo",
      b and b["expires_in_seconds"] == min(t["expires_in_seconds"] for t in b["tramos"]))

print("11. las push de universidad miden XP SIN el empuje")
# El ranking acumulado sí lo incluye, y está bien. Lo que no se sostiene es
# meterlo en una VENTANA temporal, donde compite contra semanas que no lo
# tuvieron: dos compañeros que resuelven lo mismo, uno con el cafecito puesto y
# otro sin él, aportarían distinto, y la push anunciaría un salto que nadie
# resolvió.
import push_store  # noqa: E402

desde = datetime.utcnow() - timedelta(days=7)
con_empuje = push_store.university_weekly_xp(db, "UBA", desde)
crudo = (
    db.query(func.sum(Answer.xp_earned))
    .filter(Answer.user_id == 1, Answer.answered_at >= desde)
    .scalar()
    or 0
)
puesto_por_el_cafe = (
    db.query(func.sum(Answer.xp_from_boost))
    .filter(Answer.user_id == 1, Answer.answered_at >= desde)
    .scalar()
    or 0
)
check("hay una respuesta con empuje para medir", puesto_por_el_cafe > 0,
      f"(el cafecito puso {puesto_por_el_cafe})")
check("la ventana semanal descuenta lo que puso el cafecito",
      con_empuje == crudo - puesto_por_el_cafe,
      f"(dio {con_empuje}, crudo {crudo}, empuje {puesto_por_el_cafe})")

db.close()

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
