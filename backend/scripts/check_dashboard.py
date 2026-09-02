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
    Answer, Base, Course, Enrollment, ExerciseFeedback,
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
# u1 instala la PWA el mismo día que estudia (18); u2 instala un día después
# de su única sesión (19) — a propósito, para probar que instalar y estudiar
# son eventos distintos y D+0 de la retención no está forzado a 100%.
PWA_AT = {1: utc(18, 13), 2: utc(19, 9)}
for i in range(1, 6):
    db.add(User(id=i, clerk_user_id=f"c{i}", email=f"u{i}@x.com", name=f"U{i}",
                created_at=utc(18), reached_home=i <= 3,
                pwa_first_seen_at=PWA_AT.get(i),
                first_group_id="uba201" if i <= 3 else None))
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
check("embudo: la cohorte son las 5 altas de la semana", paso["Altas"] == 5)
check("embudo: onboarding completado = 4", paso["Terminó el onboarding"] == 4)
check("embudo: «llegó al home» sale de users.reached_home",
      paso["Llegó al home"] == 3, f'(dio {paso["Llegó al home"]})')
check("embudo: modo onboarding/test NO cuentan como sesión arrancada",
      paso["Arrancó una sesión"] == 3, f'(dio {paso["Arrancó una sesión"]})')
check("embudo: terminó una = 2", paso["Terminó una sesión"] == 2)
check("embudo: «instaló y abrió la PWA» sale de users.pwa_first_seen_at",
      paso["Instaló y abrió la PWA"] == 2, f'(dio {paso["Instaló y abrió la PWA"]})')
check("embudo: «volvió otro día» = 2+ días distintos con sesión",
      paso["Volvió otro día"] == 1, f'(dio {paso["Volvió otro día"]})')
# El embudo cierra en "volvió otro día". Pedir el día siguiente exacto es más
# estricto que lo que el producto promete (repetición espaciada, no racha).
check("embudo: «volvió otro día» es el último paso",
      f["steps"][-1]["label"] == "Volvió otro día",
      f'(último: {f["steps"][-1]["label"]})')
check("embudo: ya no se pide volver justo al día siguiente",
      "Volvió al día siguiente" not in paso)

# Que "otro día" NO signifique "el día siguiente" se prueba con días salteados,
# y el fixture no tiene ninguno: sus dos días son consecutivos y el caso pasaría
# igual con la regla vieja. Se arma a mano una cohorte mínima con un usuario que
# estudia martes y viernes.
def _mini(dias_offset):
    """Una cohorte de 1 persona que estudia en los días indicados de WEEK."""
    alta = q.datetime(WEEK.year, WEEK.month, WEEK.day, 12) + q.timedelta(days=1)
    return {
        "users": [{"id": 1, "created_at": alta, "reached_home": True,
                   "pwa_first_seen_at": None}],
        "enrollments": [{"user_id": 1}],
        "sessions": [
            {"user_id": 1, "mode": "main",
             "finished_at": alta + q.timedelta(days=d)} for d in dias_offset],
    }


check("embudo: volver el viernes después de estudiar el martes cuenta como «otro día»",
      q.funnel(_mini([0, 3]), WEEK)["steps"][-1]["n"] == 1)
check("embudo: un solo día, aunque tenga varias sesiones, no es volver",
      q.funnel(_mini([0, 0]), WEEK)["steps"][-1]["n"] == 0)
check("embudo: los pasos nunca crecen",
      all(a["n"] >= b["n"] for a, b in zip(f["steps"], f["steps"][1:])),
      f'({[(s["label"], s["n"]) for s in f["steps"]]})')
check("embudo: % del paso anterior",
      f["steps"][1]["pct_prev"] == 80.0, f'(dio {f["steps"][1]["pct_prev"]})')

# ── 2. Titulares ─────────────────────────────────────────────────────────────
cards = {c["key"]: c for c in q.headline(data, q._weeks_back(WEEK, 3))}
check("titulares: altas de la semana = 5", cards["altas"]["value"] == 5)
check("titulares: la semana anterior tiene 1 alta",
      cards["altas"]["series"][-2] == 1, f'(serie {cards["altas"]["series"]})')
check("titulares: instalaciones = altas que instalaron la PWA (u1, u2)",
      cards["instalados"]["value"] == 2, f'(dio {cards["instalados"]["value"]})')
# Se mide sobre los que ESTUDIARON (u1 y u2), no sobre las 5 altas.
check("titulares: «vuelven otro día» es sobre los activados, no sobre las altas",
      cards["otro_dia"]["value"] == 50.0, f'(dio {cards["otro_dia"]["value"]})')
# El titular y el último paso del embudo tienen que ser el mismo corte, para
# que los dos números se puedan leer juntos sin traducir.
check("titulares: el tercer titular usa el mismo corte que el embudo",
      cards["otro_dia"]["value"] == q._pct(paso["Volvió otro día"], 2),
      f'(titular {cards["otro_dia"]["value"]} vs embudo {paso["Volvió otro día"]}/2)')
check("titulares: reactivados son de cohortes ANTERIORES, no de esta",
      cards["reactivados"]["value"] == 0, f'(dio {cards["reactivados"]["value"]})')

# ── 3. Retención ─────────────────────────────────────────────────────────────
ret = q.retention(data, [WEEK])
coh = ret["cohortes"][0]
# La base son los que INSTALARON la PWA (u1 y u2), no las 5 altas: u3, u4 y u5
# nunca instalaron.
check("retención: la base son los que instalaron la PWA, no las altas",
      coh["n"] == 2 and coh["altas"] == 5, f'(n={coh["n"]} altas={coh["altas"]})')
pts = {p["k"]: p for p in coh["points"]}
# u1 instala el mismo día que estudia (18) → cuenta en D+0, y sigue contando
# en cada k siguiente (acumulado: una vez que volvió, cuenta para siempre).
# u2 instala un día DESPUÉS de su única sesión (19, sesión fue el 18) → esa
# sesión es ANTERIOR a instalar, no cuenta como "volver" — u2 no vuelve nunca
# y queda en 0 en todos los k. Es justo el caso que prueba que instalar y
# estudiar son eventos distintos, así que D+0 no está forzado a 100%.
check("retención: D+0 no está forzado a 100% (instalar y estudiar son eventos distintos)",
      pts[0]["n"] == 1 and pts[0]["obs"] == 2 and pts[0]["pct"] == 50.0,
      f'(dio {pts[0]})')
check("retención: D+1 es solo u1 (50% de la base)",
      pts[1]["n"] == 1 and pts[1]["pct"] == 50.0, f'(dio {pts[1]})')
# Acumulado y no día exacto: u1 volvió una sola vez (el día 1), pero cuenta
# como retenido en TODOS los k siguientes, no solo en el día puntual en que
# volvió. Con el diseño viejo (día exacto) esto habría caído a 0% en D+2.
check("retención: es acumulado — quien volvió una vez sigue contando en los k siguientes",
      pts[14]["n"] == 1 and pts[14]["pct"] == 50.0, f'(dio {pts[14]})')
check("retención: el porcentaje nunca decrece con k (acumulado, no día exacto)",
      all(a["pct"] is None or b["pct"] is None or b["pct"] >= a["pct"]
          for a, b in zip(coh["points"], coh["points"][1:])),
      f"({[p['pct'] for p in coh['points']]})")
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
# El payload emite la CLAVE cruda; la etiqueta y el emoji los pone render.py,
# así `data.json` queda estable para consumir desde afuera.
check("cohortes: agrupa por el código de carrera, no por su etiqueta",
      carrera.get("E") == 3 and carrera.get("S") == 1, f"(dio {carrera})")

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

# El abandono ahora se mide por curso, no como curva por ejercicio.
cur = {c["curso"]: c for c in pr["cursos"]}
check("producto: abandono por curso = iniciadas que no se terminaron",
      cur["analisis"]["main_abandono"] == 25.0,
      f'(dio {cur["analisis"]["main_abandono"]} sobre {cur["analisis"]["main_n"]} sesiones)')
check("producto: accuracy por curso",
      cur["analisis"]["p1"] == 100.0, f'(dio {cur["analisis"]["p1"]})')
check("producto: las sesiones sin ninguna respuesta van aparte del abandono",
      pr["sin_respuesta"]["main"] == 0, f'(dio {pr["sin_respuesta"]})')

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
# Los external_id llevan el cinturón en el prefijo, que es de donde sale el
# desglose por unidad: "{cinturón}_{tema}_{SKILL}_{nn}" (ver seed_content.py).
db.add(ExerciseFeedback(user_id=1, session_id=101, course_id=1,
                        exercise_external_id="white_definition_LEXI_01",
                        question_type="A",
                        value="justo", shown_at=utc(18), answered_at=utc(18)))
db.add(ExerciseFeedback(user_id=2, session_id=103, course_id=1,
                        exercise_external_id="white_definition_CLSF_02",
                        question_type="D",
                        value="aburrido", reason="pura_cuenta",
                        shown_at=utc(18), answered_at=utc(18)))
# Este es de OTRO cinturón: si el desglose no leyera el prefijo, caerían juntos.
db.add(ExerciseFeedback(user_id=1, session_id=102, course_id=1,
                        exercise_external_id="blue_continuity_FORM_03",
                        question_type="D",
                        value="interesante", reason="me_hizo_pensar",
                        shown_at=utc(19), answered_at=utc(19)))
db.add(ExerciseFeedback(user_id=3, session_id=104, course_id=1,
                        exercise_external_id="white_definition_LEXI_01",
                        question_type="D",
                        value="justo", shown_at=utc(19)))  # sin responder = skip
db.commit()

en = q.encuestas(q.load(db), [WEEK])
mix = {r["canal"]: r for r in en["mix"]}
check("encuestas: el skip cuenta como mostrada pero no como respondida",
      mix["D"]["shown"] == 3 and mix["D"]["answered"] == 2)

d_curso = {r["curso"]: r for r in en["d_por_curso"]}
check("encuestas: 'justo' del canal A no se suma al canal D",
      d_curso["analisis"]["valores"]["justo"] == 0,
      f'(dio {d_curso["analisis"]["valores"]})')
check("encuestas: el canal D por curso separa aburrido de interesante",
      d_curso["analisis"]["valores"]["aburrido"] == 1
      and d_curso["analisis"]["valores"]["interesante"] == 1)
check("encuestas: el skip no entra en el desglose (no tiene respuesta)",
      d_curso["analisis"]["total"] == 2, f'(dio {d_curso["analisis"]["total"]})')
a_curso = {r["curso"]: r for r in en["a_por_curso"]}
check("encuestas: el canal A por curso cuenta su propio 'justo'",
      a_curso["analisis"]["valores"]["justo"] == 1,
      f'(dio {a_curso["analisis"]["valores"]})')

# El cinturón sale del prefijo del external_id ("white_...", "brown_...").
unidades = {u["belt"]: u for u in en["unidades"]}
check("encuestas: el desglose por unidad saca el cinturón del external_id",
      set(unidades) == {"white", "blue"}, f"(dio {set(unidades)})")
check("encuestas: no mezcla cinturones (el 'interesante' es del azul)",
      unidades["blue"]["D"]["valores"]["interesante"] == 1
      and unidades["white"]["D"]["valores"]["interesante"] == 0,
      f'(blanco={unidades["white"]["D"]["valores"]} azul={unidades["blue"]["D"]["valores"]})')
check("encuestas: por unidad separa los dos canales",
      unidades["white"]["D"]["total"] == 1 and unidades["white"]["A"]["total"] == 1,
      f'(D={unidades["white"]["D"]} A={unidades["white"]["A"]})')
check("encuestas: las unidades salen en el orden del curso, no alfabético",
      [u["belt"] for u in en["unidades"]] == ["white", "blue"],
      f'(dio {[u["belt"] for u in en["unidades"]]})')

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
                       "producto", "encuestas", "reenganche", "emails"})

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
# El etiquetado vive en render: chips de universidad con color de marca, y
# emoji + nombre para carreras y cursos, los mismos que ve el usuario.
check("render: la universidad usa el chip de marca del ranking",
      'class="tag" style="color:#4F76E0' in html)
check("render: la carrera se muestra con su emoji y su nombre",
      "⚙️" in html and "Ingeniería" in html)
check("render: el curso usa el emoji del onboarding",
      "📈" in html and "Análisis" in html)
# Con la base chica del fixture todas las filas caen en el camino atenuado,
# que es lo correcto: un porcentaje sobre 2 personas no es señal. La escala se
# comprueba directo.
from metrics.render import HEAT_MIN_BASE, _heat_cell  # noqa: E402
check("render: una base chica se muestra sin color",
      'class="dim"' in _heat_cell(50.0, 0, 100, dim=True))
check("render: el calor es relativo a la columna, no absoluto",
      "background:rgba(126,128,247,0.1" in _heat_cell(20.0, 20, 60, dim=False)
      and "background:rgba(126,128,247,0.52" in _heat_cell(60.0, 20, 60, dim=False),
      f"(min={_heat_cell(20.0, 20, 60, dim=False)} max={_heat_cell(60.0, 20, 60, dim=False)})")
# El techo del eje: con la iteración al revés, 252 escalaba contra 1000 y la
# barra ocupaba un cuarto del ancho. Se comprueba la propiedad —ninguna barra
# puede quedar por debajo de ~70% del ancho— y no valores sueltos.
from metrics.charts import _nice_max  # noqa: E402
ocupacion = [(v, 100 * v / _nice_max(v))
             for v in (1, 3, 7, 16, 23, 37, 69, 75, 95, 151, 242, 252, 1000, 4321)]
check("gráficos: el techo del eje no desperdicia el ancho de la barra",
      all(pct >= 70 for _v, pct in ocupacion),
      f"(peor: {min(ocupacion, key=lambda t: t[1])})")
check("gráficos: el techo siempre deja aire arriba del valor",
      all(_nice_max(v) > v for v in (1, 7, 100, 252, 1000)))
check("gráficos: la grilla en cuartos da números legibles",
      all(round(_nice_max(v) / 4, 2) == _nice_max(v) / 4 for v in (3, 7, 75, 252, 951)))

check("render: sin dato no se pinta nada",
      _heat_cell(None, 0, 100, dim=False) == '<td class="dim">—</td>')
check("render: las filas con base chica quedan atenuadas en la tabla real",
      html.count('class="dim"') > 0 and str(HEAT_MIN_BASE) in html)
check("render: ya no existe la sección de formato tabla",
      "Formato tabla" not in html)
# A diferencia de la curva vieja (anclada en la primera sesión, donde D+0
# daba 100% por construcción), acá el ancla es instalar la PWA y "volver" es
# haber estudiado ESE día — dos eventos distintos, así que D+0 no está
# forzado a 100%. En este fixture da 50% (ver bloque 3, arriba).
r0 = payload["retencion"]["cohortes"][0]["points"][0]
check("retención: D+0 no está forzado a 100% (instalar y estudiar son eventos distintos)",
      r0["pct"] == 50.0, f"(dio {r0})")
check("render: los puntos de la curva llevan tooltip nativo",
      "<title>Cohorte" in html and 'cursor:help' in html)

# El denominador de cada k son los OBSERVABLES, no la cohorte entera: es la
# confusión que motivó todo esto. Cada tooltip tiene que explicar cuál de los
# dos casos es, sin que haya que deducirlo del gráfico.
_tips = [t.split("</title>")[0] for t in html.split("<title>")[1:]
         if t.startswith("Cohorte")]
_explica = ("todavía no cumplieron", "el denominador es la cohorte entera",
            "no hay a quién medir")
check("render: todos los tooltips explican de dónde sale el denominador",
      _tips and all(any(e in t for e in _explica) for t in _tips),
      f"({len(_tips)} tooltips)")

# Marca de cola. `_flojo` es la regla; se prueba directo porque depende de la
# fecha de corrida y en el fixture no siempre hay una cohorte con cola.
from metrics.render import _flojo  # noqa: E402
check("render: un punto con menos de la mitad de la base va marcado como flojo",
      _flojo({"pct": 0.0, "obs": 4}, 23) and not _flojo({"pct": 0.0, "obs": 12}, 23))
check("render: el mismo obs es flojo o no según el tamaño de la cohorte",
      _flojo({"pct": 5.0, "obs": 12}, 95) and not _flojo({"pct": 5.0, "obs": 12}, 23))
check("render: un punto sin dato no se marca como flojo (ya es un hueco)",
      not _flojo({"pct": None, "obs": 0}, 23))

# El punteado tiene que salir de `weak` y no de otra cosa: se dibuja a mano una
# serie con la cola floja y se mira el SVG.
from metrics import charts as ch  # noqa: E402

_svg_cola = ch.lines(
    [{"label": "x", "values": [100.0, 20.0, 10.0], "weak": [False, False, True]}],
    ["D+0", "D+1", "D+2"], legend=False)
_svg_llena = ch.lines(
    [{"label": "x", "values": [100.0, 20.0, 10.0], "weak": [False, False, False]}],
    ["D+0", "D+1", "D+2"], legend=False)
check("gráficos: el tramo flojo va punteado y el resto lleno",
      "stroke-dasharray" in _svg_cola and _svg_cola.count("<path") > _svg_llena.count("<path"))
check("gráficos: sin puntos flojos no hay ningún punteado",
      "stroke-dasharray" not in _svg_llena)
check("gráficos: el punto flojo va hueco y el firme relleno",
      'fill="var(--surface)"' in _svg_cola and 'fill="var(--surface)"' not in _svg_llena)
# Sin `weak` el gráfico tiene que dibujarse igual que antes: lo usan las otras
# curvas del panel, que no marcan cola.
check("gráficos: `weak` es opcional y no cambia las curvas que no lo usan",
      "stroke-dasharray" not in ch.lines(
          [{"label": "x", "values": [1.0, 2.0]}], ["a", "b"], legend=False))

# Piso de semanas. Antes del 10/08 las cohortes son de 1 y 2 personas y sus
# porcentajes son ruido con formato de dato.
check("semanas: _weeks_back no baja de FIRST_WEEK",
      q._weeks_back(q.FIRST_WEEK, 3) == [q.FIRST_WEEK])
check("semanas: por encima del piso sigue trayendo las 3",
      len(q._weeks_back(q.FIRST_WEEK + q.timedelta(weeks=2), 3)) == 3)
check("semanas: nunca devuelve una lista vacía",
      q._weeks_back(q.FIRST_WEEK - q.timedelta(weeks=5), 3) != [])
check("semanas: clamp_week sube una fecha vieja al piso",
      q.clamp_week(q.date(2026, 7, 27)) == q.FIRST_WEEK)
check("semanas: clamp_week no deja pasar una semana futura",
      q.clamp_week(q.date(2030, 1, 7)) <= q.week_start(q.local_date(q.datetime.utcnow())))
check("semanas: el selector no ofrece semanas anteriores al piso",
      ">27/07<" not in html and ">03/08<" not in html)
check("render: los emojis de la encuesta acompañan los rótulos",
      all(e in html for e in ("🥱", "🙂", "💡", "😴", "👌", "🤯")))
# El fixture solo tiene blanco y azul, así que se verifica que salgan esos dos
# con su color y que el mapa cubra los cuatro cinturones del curso.
from metrics.render import PUSH_COPY  # noqa: E402
# Sin envíos en el fixture la tabla de push sale vacía, así que el mapa de
# descripciones se verifica directo contra las categorías reales del backend.
import notification_copy  # noqa: E402
check("render: hay descripción y ejemplo para cada categoría de push",
      set(PUSH_COPY) == set(notification_copy.CATEGORY_WEIGHTS),
      f"(faltan: {set(notification_copy.CATEGORY_WEIGHTS) - set(PUSH_COPY)})")
check("render: los pesos nominales de push coinciden con notification_copy",
      all(PUSH_COPY[k][2] == round(v * 100)
          for k, v in notification_copy.CATEGORY_WEIGHTS.items()),
      f"(panel: {[(k, v[2]) for k, v in PUSH_COPY.items()]})")

# ── 10. Semana vacía ─────────────────────────────────────────────────────────
# Una semana sin datos tiene que renderizar, no explotar: es el caso de la
# semana en curso todos los lunes a la mañana.
vacio = q.build(db, q.date(2026, 1, 5))
check("semana sin datos: el embudo queda en cero sin romper",
      vacio["funnel"]["steps"][0]["n"] == 0)
check("semana sin datos: renderiza igual", page(vacio, token="tok").endswith("</html>"))


print()
print("todo ok" if not fallos else f"FALLARON: {fallos}")
sys.exit(1 if fallos else 0)
