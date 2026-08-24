"""Verifica las métricas del panel contra un escenario armado a mano.

Cada consulta de `metrics/queries.py` tiene una respuesta conocida sobre datos
sembrados acá, así que el resultado es determinístico: nada de comparar contra
producción, que cambia sola.

Lo que más importa que quede clavado son las definiciones, porque son las que
ya se equivocaron una vez y volvieron falso un reporte entero:
  - las sesiones de `onboarding` y `test` NO cuentan como sesión;
  - P1 es `quality_score = 5`, no `is_correct`;
  - el denominador de la retención D+k son los observables, no la cohorte;
  - "justo" del canal A no se mezcla con "justo" del canal D.

Uso:
    python backend/scripts/check_dashboard.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

# La consola de Windows abre en cp1252 y este script imprime acentos y comillas
# tipográficas; sin esto un check que falla muere con UnicodeEncodeError y
# tapa el error real.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
# Mismo motivo que en check_table_boost: NullPool abre una conexión por
# statement y ":memory:" perdería el esquema entre inserts.
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "panel.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Answer, Base, Course, Enrollment, ExerciseFeedback, Exercise,
    Session as SessionModel, User,
)

Base.metadata.create_all(database.engine)
S = database.SessionLocal

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


from metrics import queries as q  # noqa: E402

# ── Escenario ────────────────────────────────────────────────────────────────
# La semana de referencia arranca el lunes 2026-08-17 (hora Argentina). Todo se
# escribe en UTC naive, como hace la app, así que las 12:00 UTC caen a las 09:00
# locales del mismo día y no hay ambigüedad de borde.
WEEK = q.date(2026, 8, 17)


def utc(d: int, h: int = 12) -> datetime:
    return datetime(2026, 8, d, h, 0)


db = S()
db.add(Course(id=1, slug="analisis", name="Análisis"))

# 5 usuarios de alta el martes 18/08 (cohorte de WEEK) y 1 la semana anterior.
for i in range(1, 6):
    db.add(User(id=i, clerk_user_id=f"c{i}", email=f"u{i}@x.com", name=f"U{i}",
                created_at=utc(18), first_group_id="uba201" if i <= 3 else None))
db.add(User(id=9, clerk_user_id="c9", email="u9@x.com", name="U9", created_at=utc(11)))

# u1..u4 completan el onboarding; u5 no.
for i in range(1, 5):
    db.add(Enrollment(user_id=i, course_id=1, university="UBA",
                      career="E" if i < 4 else "S", enrolled_at=utc(18)))
db.commit()

sid = 100


def sesion(user: int, dia: int, mode: str = "main", terminada: bool = True,
           respuestas: int = 0, quality: int = 5, ext: str | None = None,
           dur_min: int = 4, total: int = 8) -> int:
    """Crea una sesión y sus respuestas. `total` es el largo ASIGNADO
    (`exercises_total`), que no tiene por qué coincidir con `respuestas`: esa
    diferencia es justo lo que mide la curva de abandono."""
    global sid
    sid += 1
    ini = utc(dia, 12)
    db.add(SessionModel(
        id=sid, user_id=user, course_id=1, mode=mode, started_at=ini,
        finished_at=ini + timedelta(minutes=dur_min) if terminada else None,
        exercises_total=total))
    for k in range(respuestas):
        db.add(Answer(
            session_id=sid, user_id=user, course_id=1,
            exercise_id=f"ex_{k:03d}", exercise_external_id=ext or f"item_{k}",
            belt="white", topic="definition", exercise_type="LEXI",
            is_correct=True, quality_score=quality, answered_at=ini))
    return sid


# u1: 2 sesiones terminadas (18 y 19) → vuelve, y está activo en D+1.
sesion(1, 18, respuestas=8)
sesion(1, 19, respuestas=8)
# u2: 1 sesión terminada.
sesion(2, 18, respuestas=8)
# u3: abre una sesión y la abandona en el ejercicio 3.
sesion(3, 18, terminada=False, respuestas=3)
# u4: solo la sesión sintética del onboarding — NO cuenta como sesión.
sesion(4, 18, mode="onboarding", respuestas=1)
# u5: una sesión de QA — tampoco cuenta.
sesion(5, 18, mode="test", respuestas=5)
db.commit()

data = q.load(db)

# ── 1. Embudo ────────────────────────────────────────────────────────────────
f = q.funnel(data, WEEK)
paso = {s["label"]: s["n"] for s in f["steps"]}
check("embudo: la cohorte son los 5 de la semana", paso["Llegó a la app"] == 5)
check("embudo: onboarding completado = 4", paso["Completó el onboarding"] == 4)
check("embudo: modo onboarding/test NO cuentan como sesión abierta",
      paso["Abrió una sesión"] == 3, f'(dio {paso["Abrió una sesión"]})')
check("embudo: terminó una = 2", paso["Terminó una sesión"] == 2)
check("embudo: terminó más de una = 1", paso["Terminó más de una"] == 1)
check("embudo: % del paso anterior",
      f["steps"][1]["pct_prev"] == 80.0, f'(dio {f["steps"][1]["pct_prev"]})')

# ── 2. Titulares ─────────────────────────────────────────────────────────────
cards = {c["key"]: c for c in q.headline(data, q._weeks_back(WEEK, 3))}
check("titulares: altas de la semana = 5", cards["altas"]["value"] == 5)
check("titulares: la semana anterior tiene 1 alta",
      cards["altas"]["series"][-2] == 1, f'(serie {cards["altas"]["series"]})')
check("titulares: D+1 solo cuenta a u1 (1 de 5 = 20%)",
      cards["d1"]["value"] == 20.0, f'(dio {cards["d1"]["value"]})')

# ── 3. Retención ─────────────────────────────────────────────────────────────
ret = q.retention(data, [WEEK])
coh = ret["cohortes"][0]
# La base son los que ESTUDIARON (u1 y u2), no las 5 altas: u3 abandonó, u4 solo
# hizo el onboarding y u5 una sesión de QA.
check("retención: la base son los que terminaron alguna sesión, no las altas",
      coh["n"] == 2 and coh["altas"] == 5, f'(n={coh["n"]} altas={coh["altas"]})')
pts = {p["k"]: p for p in coh["points"]}
check("retención: D+0 son 2 de 2 (100%)",
      pts[0]["n"] == 2 and pts[0]["obs"] == 2 and pts[0]["pct"] == 100.0,
      f'(dio {pts[0]})')
check("retención: D+1 es solo u1 (50% de la base)",
      pts[1]["n"] == 1 and pts[1]["pct"] == 50.0, f'(dio {pts[1]})')
# El denominador de cada k son los observables. Se comprueba la propiedad y no
# un valor fijo porque "cuántos observables hay" depende de la fecha de hoy: un
# número clavado acá empezaría a fallar solo con el paso del tiempo.
obs = [pts[k]["obs"] for k in range(ret["horizon"] + 1)]
check("retención: los observables nunca crecen con k",
      all(a >= b for a, b in zip(obs, obs[1:])), f"(obs {obs})")
check("retención: sin observables el porcentaje es None y no 0",
      all(pts[k]["pct"] is None for k in range(ret["horizon"] + 1) if pts[k]["obs"] == 0))
check("retención: los activos nunca superan a los observables",
      all(pts[k]["n"] <= pts[k]["obs"] for k in range(ret["horizon"] + 1)))

# ── 4. Cohortes ──────────────────────────────────────────────────────────────
co = q.cohorts(data, [WEEK])
origen = {r["label"]: r for r in co["origen"]}
check("cohortes: 3 atribuidos a UBA, 2 sin atribución",
      origen["UBA"]["n"] == 3 and origen["Sin atribución"]["n"] == 2)
check("cohortes: atribución 60%", co["atribucion"]["pct"] == 60.0)
# De los 3 de UBA (u1,u2,u3) estudiaron 2 → base=2. De esos volvió 1 (u1).
check("cohortes: «estudió» se mide sobre el total del corte (2 de 3)",
      origen["UBA"]["base"] == 2 and origen["UBA"]["estudio"] == 66.7,
      f'(dio base={origen["UBA"]["base"]} estudio={origen["UBA"]["estudio"]})')
check("cohortes: «volvió» se mide sobre la base, no sobre el total (1 de 2 = 50%)",
      origen["UBA"]["volvio"] == 50.0, f'(dio {origen["UBA"]["volvio"]})')
carrera = {r["label"]: r["n"] for r in co["carrera"]}
check("cohortes: la carrera 'E' se muestra como Ingeniería",
      carrera.get("Ingeniería") == 3, f"(dio {carrera})")

# ── 5. Producto ──────────────────────────────────────────────────────────────
pr = q.producto(data, [WEEK])
ses = {(r["curso"], r["modo"]): r for r in pr["sesiones"]}
check("producto: 4 sesiones main iniciadas, 3 terminadas",
      ses[("analisis", "main")]["iniciadas"] == 4
      and ses[("analisis", "main")]["terminadas"] == 3)
check("producto: no aparecen los modos onboarding/test",
      all(k[1] in ("main", "practice") for k in ses))
check("producto: duración mediana 4 min", pr["duracion"]["main"] == 4.0)
check("producto: P1 global 100% (todas quality_score=5)", pr["p1_global"] == 100.0)

ab = pr["abandono"]["main"]
check("abandono: base excluye las sesiones sin ninguna respuesta",
      ab["base"] == 4 and ab["cero"] == 0)
check("abandono: con menos de 10 sesiones la curva no se dibuja (sería ruido)",
      ab["curva"] == [], f'(dio {ab["curva"]})')

# P1 tiene que ignorar is_correct: una respuesta correcta al tercer intento
# (quality_score bajo) no es P1.
sesion(2, 20, respuestas=4, quality=2)
db.commit()
pr2 = q.producto(q.load(db), [WEEK])
check("P1 usa quality_score=5 y no is_correct (todas is_correct=True)",
      pr2["p1_global"] and pr2["p1_global"] < 100.0,
      f'(dio {pr2["p1_global"]})')

# ── 6. Encuestas ─────────────────────────────────────────────────────────────
# "justo" en los dos canales: es la colisión que hace falsos los cortes por
# valor sin filtrar el canal.
db.add(ExerciseFeedback(user_id=1, session_id=101, course_id=1,
                        exercise_external_id="item_0", question_type="A",
                        value="justo", shown_at=utc(18), answered_at=utc(18)))
db.add(ExerciseFeedback(user_id=2, session_id=103, course_id=1,
                        exercise_external_id="item_1", question_type="D",
                        value="aburrido", reason="pura_cuenta",
                        shown_at=utc(18), answered_at=utc(18)))
db.add(ExerciseFeedback(user_id=1, session_id=102, course_id=1,
                        exercise_external_id="item_2", question_type="D",
                        value="interesante", reason="me_hizo_pensar",
                        shown_at=utc(19), answered_at=utc(19)))
db.add(ExerciseFeedback(user_id=3, session_id=104, course_id=1,
                        exercise_external_id="item_0", question_type="D",
                        value="justo", shown_at=utc(19)))  # sin responder = skip
db.commit()

en = q.encuestas(q.load(db), [WEEK])
d = {r["label"]: r["n"] for r in en["d"]}
check("encuestas: 'justo' del canal A no se suma al canal D",
      d["justo"] == 0, f"(dio {d})")
check("encuestas: canal D tiene 1 aburrido y 1 interesante",
      d["aburrido"] == 1 and d["interesante"] == 1)
mix = {r["canal"]: r for r in en["mix"]}
check("encuestas: el skip cuenta como mostrada pero no como respondida",
      mix["D"]["shown"] == 3 and mix["D"]["answered"] == 2)
ejes = {r["eje"]: r for r in en["ejes"]}
check("encuestas: las razones se agrupan por eje con su signo",
      ejes["Ingenio"]["pos"] == 1 and ejes["Ingenio"]["neg"] == 1, f"(dio {ejes})")
items = {r["item"]: r for r in en["items"]}
check("encuestas: el ranking ordena de peor a mejor score",
      en["items"][0]["item"] == "item_1" and items["item_1"]["score"] == -1.0)
check("encuestas: cada ítem trae su P1 para poder estratificar",
      items["item_1"]["p1"] is not None)

# ── 7. Tablas ────────────────────────────────────────────────────────────────
db.add(Exercise(course_id=1, external_id="item_1", belt="white", topic="definition",
                exercise_type="LEXI", question="q", option_a="a", option_b="b",
                option_c="c", option_d="d", correct_index=0,
                feedback_correct="ok", feedback_incorrect="[]",
                table_data='{"rows":[]}'))
db.commit()
t = q.tablas(q.load(db), [WEEK])
check("tablas: reconoce el único ítem con table_data", t["items"] == 1)
check("tablas: separa interés con tabla vs. sin tabla",
      t["interes"]["con_tabla"]["n"] == 1 and t["interes"]["sin_tabla"]["n"] == 1,
      f'(dio {t["interes"]})')
check("tablas: el alcance mide las primeras sesiones de repaso",
      t["alcance"]["primeras"] == 3, f'(dio {t["alcance"]})')

# ── 8. Mails de ciclo de vida ────────────────────────────────────────────────
# u1 recibe el winback el 18 y termina una sesión ese mismo día → activó.
# u2 recibe el bounce el 21, después de su última sesión (el 20) → NO activó:
# la ventana mira hacia adelante, no hacia atrás.
# u3 recibe el bounce el 18 y nunca termina nada → no activó.
db.query(User).filter(User.id == 1).update({"winback_email_sent_at": utc(18, 9)})
db.query(User).filter(User.id == 2).update({"bounce_email_sent_at": utc(21, 9)})
db.query(User).filter(User.id == 3).update({"bounce_email_sent_at": utc(18, 9)})
db.commit()

em = q.emails(q.load(db), [WEEK])
tipos = {t["tipo"]: t for t in em["tipos"]}
check("mails: cuenta los envíos por copy",
      tipos["bounce"]["enviados"] == 2 and tipos["winback"]["enviados"] == 1,
      f"(dio {[(t['tipo'], t['enviados']) for t in em['tipos']]})")
check("mails: activó quien estudió DESPUÉS del envío",
      tipos["winback"]["activados"] == 1 and tipos["winback"]["pct"] == 100.0)
check("mails: una sesión ANTERIOR al envío no cuenta como activación",
      tipos["bounce"]["activados"] == 0, f'(dio {tipos["bounce"]["activados"]})')
check("mails: el agradecimiento por reporte se cuenta por usuario-día",
      tipos["report_thanks"]["enviados"] == 0)
check("mails: la tasa global sale sobre el total de envíos",
      em["enviados"] == 3 and em["pct"] == 33.3, f'(dio {em["enviados"]} {em["pct"]})')

# Fuera de la ventana no se cuenta.
db.query(User).filter(User.id == 9).update({"bounce_email_sent_at": datetime(2026, 3, 1)})
db.commit()
check("mails: solo cuenta los envíos de la ventana visible",
      q.emails(q.load(db), [WEEK])["enviados"] == 3)

# ── 9. Payload completo ──────────────────────────────────────────────────────
payload = q.build(db, WEEK)
check("build: devuelve todos los bloques",
      set(payload) == {"meta", "headline", "funnel", "retencion", "cohortes",
                       "producto", "encuestas", "tablas", "reenganche", "emails"})

import json  # noqa: E402
try:
    json.dumps(payload)
    serializable = True
except TypeError as exc:
    serializable = False
    print("   ", exc)
check("build: el payload es serializable a JSON (lo sirve /data.json)", serializable)

# ── 9. Render ────────────────────────────────────────────────────────────────
from metrics.render import page  # noqa: E402

html = page(payload, token="tok")
check("render: produce una página completa",
      html.startswith("<!doctype html>") and html.rstrip().endswith("</html>"))
check("render: no filtra el token en un link indexable", "noindex" in html)
check("render: los links de semana llevan el token", "/panel/tok?w=" in html)
check("render: no hay llaves de formato sin resolver", "{" not in html.split("<style>")[0])

# ── 10. Semana vacía ─────────────────────────────────────────────────────────
# Una semana sin datos tiene que renderizar, no explotar: es el caso de la
# semana en curso todos los lunes a la mañana.
vacio = q.build(db, q.date(2026, 1, 5))
check("semana sin datos: el embudo queda en cero sin romper",
      vacio["funnel"]["steps"][0]["n"] == 0)
check("semana sin datos: renderiza igual", page(vacio, token="tok").endswith("</html>"))


# ── 11. Curva de abandono con volumen ────────────────────────────────────────
# Va al final para no correr los denominadores de los checks de arriba. Los
# usuarios se crean fuera de las tres semanas visibles: así aportan sesiones a
# `producto` (que filtra por fecha de sesión) sin entrar en las cohortes.
#
# El escenario separa el largo real de la sesión del largo asignado:
#   10 sesiones de 5 ejercicios, TERMINADAS con sus 5;
#   12 sesiones de 8 ejercicios, abandonadas en el 7.
# En k=6 las de 5 no tienen por qué aparecer: no fueron abandonadas, eran más
# cortas. Ese es exactamente el error que la curva vieja cometía.
for i in range(20, 42):
    db.add(User(id=i, clerk_user_id=f"c{i}", email=f"u{i}@x.com", name=f"U{i}",
                created_at=utc(1)))
db.commit()
for i in range(20, 30):
    sesion(i, 19, terminada=True, respuestas=5, total=5)
for i in range(30, 42):
    sesion(i, 19, terminada=False, respuestas=7, total=8)
db.commit()

ab2 = q.producto(q.load(db), [WEEK])["abandono"]["main"]
curva = {c["k"]: c for c in ab2["curva"]}
# De las 27 sesiones que arrancaron, en k=6 solo 17 tenían 6 ejercicios o más
# (las 12 de 8 más las 5 del bloque de arriba, que también son de 8).
check("abandono: en k=6 el denominador excluye a las sesiones de 5 ejercicios",
      curva[6]["de"] == 17, f'(dio {curva[6]["de"]} de {ab2["base"]} sesiones)')
check("abandono: en k=6 llegan 15 de esas 17 (88,2%, no 55,6% sobre el total)",
      curva[6]["pct"] == 88.2, f'(dio {curva[6]["pct"]})')
check("abandono: una sesión corta TERMINADA no hunde la curva en k=6",
      curva[6]["pct"] > 80, f'(k4={curva[4]["pct"]}% k6={curva[6]["pct"]}%)')
check("abandono: los cortes se registran en el ejercicio donde se cortó",
      curva[7]["cortes"] == 12, f'(dio {curva[7]["cortes"]})')
check("abandono: la curva se corta cuando el denominador se vuelve chico",
      max(curva) <= 8, f"(llegó a k={max(curva)})")

print()
print("todo ok" if not fallos else f"FALLARON: {fallos}")
sys.exit(1 if fallos else 0)
