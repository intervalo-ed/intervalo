"""Verifica las métricas del panel del minijuego contra un escenario a mano.

Cada bloque de `metrics/game_queries.py` tiene una respuesta conocida sobre datos
sembrados acá, así que el resultado es determinístico. Nada de comparar contra
producción, que cambia sola.

Lo que más importa que quede clavado son las definiciones, porque son las que se
pueden aflojar sin que nadie se entere y convierten el panel en un generador de
números lindos:

  - los estudiantes sembrados (`is_bot`) NO cuentan en ninguna métrica;
  - un ejercicio respondido con la TABLA ABIERTA no entra en el acierto al
    primer intento ni en la calibración;
  - una respuesta que no parsea no es una respuesta: no cuenta como intento, no
    baja el acierto, y vive en su propia sección;
  - la curva de profundidad se calcula solo sobre partidas CERRADAS;
  - el CTR del cafecito se cuenta sobre PERSONAS y no sobre impresiones.

Uso:
    python backend/scripts/check_game_dashboard.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

# La consola de Windows abre en cp1252 y este script imprime acentos; sin esto un
# check que falla muere con UnicodeEncodeError y tapa el error real.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
# NullPool abre una conexión por statement y ":memory:" perdería el esquema
# entre inserts (mismo motivo que en check_dashboard.py).
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "gamepanel.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base, Course, GameAttempt, GameBoost, GameCtaEvent, GameEvent, GameExercise,
    GamePlayer, GameTemplateStat, Session as SessionModel, User,
)

Base.metadata.create_all(database.engine)
S = database.SessionLocal

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


from metrics import game_queries as q  # noqa: E402
from metrics import game_render  # noqa: E402

# ── Escenario ────────────────────────────────────────────────────────────────
# La semana de referencia arranca el lunes 2026-08-17 (hora Argentina). Todo se
# escribe en UTC (las columnas son naive UTC) así que las horas van +3 respecto
# de la hora local que se quiere representar: 15:00 UTC = 12:00 en Argentina.
WEEK = datetime(2026, 8, 17).date()

# El escenario vive en una semana anterior al piso real del panel
# (game_queries.FIRST_WEEK = la semana de la difusión). Se baja el piso para
# este check: lo que se prueba acá son las definiciones de las métricas, no
# desde cuándo el panel decide mostrar semanas.
q.FIRST_WEEK = WEEK - timedelta(weeks=8)


def T(dia: int, hora: int = 15, minuto: int = 0) -> datetime:
    """Lunes de la semana + `dia`, a las `hora`:`minuto` UTC."""
    return datetime(2026, 8, 17, hora, minuto) + timedelta(days=dia)


# `now` fijo: la profundidad depende de qué partidas están cerradas, y con
# `utcnow()` el resultado cambiaría según cuándo se corra el check.
NOW = datetime(2026, 8, 24, 12, 0)

s = S()

s.add(Course(id=1, slug="analisis-1", name="Análisis 1"))

# Un usuario de Intervalo que se creó DESPUÉS de su estudiante (o sea: lo trajo el
# juego) y otro que ya existía antes.
s.add(User(id=1, clerk_user_id="u1", email="uno@x.com", name="Uno", created_at=T(0, 16)))
s.add(User(id=2, clerk_user_id="u2", email="dos@x.com", name="Dos",
           created_at=datetime(2026, 7, 1)))
s.flush()

# ── Estudiantes ──────────────────────────────────────────────────────────────
# p1  registrado, UBA, estudiante profundo (12 respuestas), partida CERRADA
# p2  invitado, UBA, 3 respuestas, partida CERRADA
# p3  invitado, UTN, 1 respuesta, partida ABIERTA (respondió hace 1 h)
# p4  registrado con cuenta vieja, UTN, 5 respuestas, cerrada
# p9  BOT: no tiene que aparecer en ninguna métrica
PLAYERS = [
    dict(id=1, user_id=1, alias="uno", university="UBA", career="E", is_bot=False,
         platform="desktop",
         created_at=T(0, 14), last_seen_at=T(0, 16)),
    dict(id=2, user_id=None, alias="dos", university="UBA", career="E", is_bot=False,
         platform="android",
         created_at=T(1, 14), last_seen_at=T(1, 15)),
    dict(id=3, user_id=None, alias="tres", university="UTN", career="S", is_bot=False,
         platform="ios",
         created_at=T(6, 14), last_seen_at=NOW - timedelta(hours=1)),
    dict(id=4, user_id=2, alias="cuatro", university="UTN", career="E", is_bot=False,
         platform="android",
         created_at=T(2, 14), last_seen_at=T(2, 15)),
    dict(id=9, user_id=None, alias="bot", university="UBA", career="E", is_bot=True,
         platform="desktop",
         created_at=T(0, 10), last_seen_at=T(0, 11)),
]
for p in PLAYERS:
    s.add(GamePlayer(theta=0.5, n_updates=5, xp=100, unlocked_keys="pow,sq", **p))

s.add(GameTemplateStat(template_key="t1_pow", tier=1, beta=-1.6, n_observations=30, n_correct=24))
s.add(GameTemplateStat(template_key="t5_ln_over_x", tier=5, beta=0.9,
                       n_observations=5, n_correct=1))
s.flush()

# ── Ejercicios y respuestas ──────────────────────────────────────────────────
# Un helper que sirve un ejercicio y lo responde, para no repetir veinte líneas.
_ex_id = [0]


# Por defecto el ejercicio se sirve en el aparato de primer contacto del
# estudiante; se pasa explícito solo para el caso que importa, que es el de alguien
# que cambia de dispositivo a mitad de partida.
_PLAT = {p["id"]: p["platform"] for p in PLAYERS}


def servir(player_id: int, cuando: datetime, p_hat: float, template="t1_pow",
           status="answered", peeked=False, platform=None) -> int:
    _ex_id[0] += 1
    s.add(GameExercise(
        id=_ex_id[0], player_id=player_id, template_key=template,
        prompt_latex="x", expected_derivative="1",
        theta_at_serve=0.5, beta_at_serve=-1.0, p_hat=p_hat,
        status=status, peeked=peeked, platform=platform or _PLAT[player_id],
        created_at=cuando, answered_at=cuando if status != "served" else None))
    return _ex_id[0]


_at_id = [0]


def responder(ex: int, player_id: int, cuando: datetime, correcto: bool,
              intento=1, parse_ok=True, ms=8000) -> None:
    _at_id[0] += 1
    s.add(GameAttempt(
        id=_at_id[0], exercise_id=ex, player_id=player_id,
        attempt_number=intento if parse_ok else intento - 1,
        parse_ok=parse_ok, is_correct=correcto, response_ms=ms, xp_awarded=25 if correcto else 0,
        theta_before=0.4 if (parse_ok and intento == 1) else None,
        theta_after=0.5 if (parse_ok and intento == 1) else None,
        created_at=cuando))


# p1: 12 respuestas el día 0, todas correctas menos una. Dos sesiones: las
# primeras 10 seguidas, y las últimas 2 más de 30 minutos después.
for i in range(10):
    ex = servir(1, T(0, 14, i), 0.75)
    responder(ex, 1, T(0, 14, i), correcto=(i != 3))
for i in range(2):
    ex = servir(1, T(0, 16, i), 0.75)
    responder(ex, 1, T(0, 16, i), correcto=True)

# p1 además miró la tabla en un ejercicio y acertó: NO tiene que contar en P1.
ex_peek = servir(1, T(0, 16, 30), 0.30, peeked=True)
responder(ex_peek, 1, T(0, 16, 30), correcto=True)

# p1 también escribió algo que el parser no entendió, y después acertó bien.
ex_parse = servir(1, T(0, 16, 40), 0.75)
responder(ex_parse, 1, T(0, 16, 40), correcto=False, parse_ok=False)
responder(ex_parse, 1, T(0, 16, 41), correcto=True)

# p2: 3 respuestas el día 1, dos correctas. Vuelve el día 3 con una más.
for i in range(3):
    ex = servir(2, T(1, 14, i), 0.60)
    responder(ex, 2, T(1, 14, i), correcto=(i != 2))
# La vuelta de p2 es desde la compu: el mismo estudiante en dos aparatos.
ex = servir(2, T(3, 14), 0.60, platform="desktop")
responder(ex, 2, T(3, 14), correcto=True)

# p3: una sola respuesta, y sigue jugando (partida abierta).
ex = servir(3, NOW - timedelta(hours=1), 0.85)
responder(ex, 3, NOW - timedelta(hours=1), correcto=True)

# p4: 5 respuestas, todas correctas, y un salteo de una difícil.
for i in range(5):
    ex = servir(4, T(2, 14, i), 0.72)
    responder(ex, 4, T(2, 14, i), correcto=True)
servir(4, T(2, 14, 30), 0.35, template="t5_ln_over_x", status="skipped")

# Bot: 50 respuestas que NO tienen que aparecer en ningún lado.
for i in range(50):
    ex = servir(9, T(0, 12, i % 60), 0.90)
    responder(ex, 9, T(0, 12, i % 60), correcto=True)

# ── Cafecito ─────────────────────────────────────────────────────────────────
# 4 impresiones sobre 2 personas, 1 click de 1 persona → CTR por persona = 50%.
for pid, cuando, trig in [(1, T(0, 15), "milestone"), (1, T(0, 15, 30), "milestone"),
                          (2, T(1, 15), "record"), (2, T(1, 15, 5), "record")]:
    s.add(GameCtaEvent(player_id=pid, cta="cafecito", action="impression",
                       placement=trig, solved=10, university="UBA", created_at=cuando))
s.add(GameCtaEvent(player_id=1, cta="cafecito", action="click", placement="milestone",
                   solved=10, university="UBA", created_at=T(0, 15, 1)))
s.add(GameCtaEvent(player_id=1, cta="share", action="impression", created_at=T(0, 15)))
s.add(GameCtaEvent(player_id=1, cta="share", action="click", created_at=T(0, 15, 2)))
# Un CTA del bot, que tampoco puede contar.
s.add(GameCtaEvent(player_id=9, cta="cafecito", action="click", created_at=T(0, 15)))

# Dos empujes con el MISMO tamaño y distinto origen: uno donado de verdad y uno
# que insertamos nosotros para probar. Es el par que fija la definición — el
# titular de ingresos tiene que contar el primero y no el segundo.
s.add(GameBoost(university="UBA", cafecitos=3, donor_name="Nico", source="cafecito",
                created_at=T(0, 14), expires_at=T(0, 14, 30)))
s.add(GameBoost(university="UTN", cafecitos=3, donor_name=None, source="manual",
                created_at=T(0, 18), expires_at=T(0, 18, 30)))
s.add(GameEvent(kind="boost", text="alguien invitó un cafecito", emoji="☕",
                university="UBA", created_at=T(0, 14)))
s.add(GameEvent(kind="climb", text="subió 4 puestos", emoji="🚀", created_at=T(0, 15)))

# Sesión de estudio real de p1 en Intervalo, y una de onboarding que NO cuenta.
s.add(SessionModel(user_id=1, course_id=1, mode="main", exercises_total=8,
                   started_at=T(1, 14), finished_at=T(1, 14, 20)))
s.add(SessionModel(user_id=2, course_id=1, mode="onboarding", exercises_total=1,
                   started_at=T(1, 14), finished_at=T(1, 14, 5)))
s.commit()

data = q.load(s)
weeks = q._weeks_back(WEEK, 4)

# ── 1 · Los bots no existen ──────────────────────────────────────────────────
print("\n— bots —")
check("los estudiantes sembrados se excluyen", len(data["players"]) == 4,
      f'({len(data["players"])} estudiantes)')
check("sus ejercicios también", all(e["player_id"] != 9 for e in data["exercises"]))
check("sus respuestas también", all(a["player_id"] != 9 for a in data["attempts"]))
check("sus CTA también", all(c["player_id"] != 9 for c in data["cta"]))
check("se informa cuántos se sacaron", data["_bots"] == 1)

# ── 2 · Qué es una respuesta ─────────────────────────────────────────────────
print("\n— respuestas —")
# p1: 12 + 1 mirada + 1 buena tras el fallo de parseo = 14 primeros intentos.
# p2: 4. p3: 1. p4: 5. Total 24 respuestas parseadas.
check("lo que no parsea no es respuesta", len(data["_answers"]) == 24,
      f'({len(data["_answers"])})')
check("el fallo de parseo sí queda registrado",
      sum(1 for a in data["attempts"] if not a["parse_ok"]) == 1)
clean = q._clean_firsts(data)
check("el ejercicio con la tabla abierta sale del P1", len(clean) == 23,
      f'({len(clean)} primeros intentos limpios)')

# ── 3 · Titulares ────────────────────────────────────────────────────────────
print("\n— titulares —")
h = {c["label"]: c for c in q.headline(data, weeks)}
check("estudiantes nuevos de la semana", h["Estudiantes nuevos"]["value"] == 4,
      f'({h["Estudiantes nuevos"]["value"]})')
# p3 respondió recién el lunes siguiente: cae en la semana de al lado.
check("estudiantes activos", h["Estudiantes activos"]["value"] == 3,
      f'({h["Estudiantes activos"]["value"]})')
# Correctas parseadas DE ESTA SEMANA: p1 9+2+1(peek)+1 = 13, p2 3, p4 5 → 21.
# La de p3 cae en la semana siguiente.
check("derivadas resueltas", h["Derivadas resueltas"]["value"] == 21,
      f'({h["Derivadas resueltas"]["value"]})')
# P1 limpio de la semana: 22 primeros intentos, 20 correctos (falla el i==3 de
# p1 y el i==2 de p2) → 90,9%. Sin la exclusión de la tabla serían 23 y 21.
check("el acierto al primer intento excluye la tabla",
      h["Acierto al primer intento"]["value"] == 90.9,
      f'({h["Acierto al primer intento"]["value"]}%)')
# Solo p1 pasa las 10 derivadas → 1 de 4.
check("llegan a 10", h["Llegan a 10"]["value"] == 25.0)
check("se registran", h["Se registran"]["value"] == 50.0)
check("el titular de cafecitos no cuenta los grants a mano",
      h["Cafecitos"]["value"] == 3, f'({h["Cafecitos"]["value"]}, no 6)')

# ── 4 · Embudo ───────────────────────────────────────────────────────────────
print("\n— embudo —")
f = q.funnel(data, WEEK)
pasos = {p["label"]: p["n"] for p in f["steps"]}
check("base = estudiantes de la cohorte", f["base"] == 4)
check("todos vieron una derivada", pasos["Vio una derivada"] == 4)
check("todos respondieron", pasos["Respondió"] == 4)
check("llegó a 5", pasos["Llegó a 5"] == 2, f'({pasos["Llegó a 5"]})')
check("llegó a 10", pasos["Llegó a 10"] == 1)
check("volvió otro día", pasos["Volvió otro día"] == 1, f'({pasos["Volvió otro día"]})')
# Los pasos que no están anidados no pueden mostrar «% del paso anterior»: era
# de donde salía el «600% del paso anterior» que no quiere decir nada.
por_label = {p["label"]: p for p in f["steps"]}
check("los pasos anidados se leen contra el anterior",
      por_label["Llegó a 5"]["pct_prev"] is not None)
check("los que no lo están, no", por_label["Cargó universidad"]["pct_prev"] is None
      and por_label["Se registró"]["pct_prev"] is None
      and por_label["Volvió otro día"]["pct_prev"] is None)
check("y la cadena no se corta por ellos: «llegó a 25» sigue midiendo contra «llegó a 10»",
      por_label["Llegó a 25"]["pct_prev"] == 0.0)

# ── 5 · Profundidad ──────────────────────────────────────────────────────────
print("\n— profundidad —")
pr = q.profundidad(data, weeks, now=NOW)
# p3 está jugando ahora mismo: su partida NO entra.
check("las partidas abiertas no entran en la curva", pr["base"] == 3, f'(base {pr["base"]})')
check("y se informa cuántas quedaron afuera", pr["abiertos"] == 1)
curva = {c["k"]: c for c in pr["curva"]}
check("S(1) = 100%", curva[1]["pct"] == 100.0)
# Largos de las partidas cerradas: p1 = 14 (12 + la mirada + la de después del
# fallo de parseo), p2 = 4, p4 = 5.
check("S(4) los tiene a los tres", curva[4]["vivos"] == 3, f'({curva[4]["vivos"]})')
check("S(5) deja afuera a p2", curva[5]["vivos"] == 2, f'({curva[5]["vivos"]})')
check("S(6) deja solo a p1", curva[6]["vivos"] == 1)
# p1 tiene 14 primeros intentos parseados.
check("S(15) es cero", curva[15]["vivos"] == 0)
check("mediana de derivadas", pr["mediana"] == 5.0, f'({pr["mediana"]})')

# ── 6 · Motor ────────────────────────────────────────────────────────────────
print("\n— motor —")
mo = q.motor(data, weeks)
cal = {c["label"]: c for c in mo["calibracion"]}
# El bin 70–80% se lleva los 12 de p1 (0,75) + los 5 de p4 (0,72) + el que
# siguió al fallo de parseo = 18; falla uno → 17/18 = 94,4%.
check("la calibración usa solo primeros intentos limpios", cal["70–80%"]["n"] == 18,
      f'({cal["70–80%"]["n"]})')
check("y su tasa observada", cal["70–80%"]["observado"] == 94.4,
      f'({cal["70–80%"]["observado"]}%)')
check("el bin <40% no tiene respuestas limpias (era la mirada)",
      cal["<40%"]["n"] == 0, f'({cal["<40%"]["n"]})')
check("hay error de calibración calculado", mo["ece"] is not None)
# Servidos: 12 + 1 peek + 1 parse + 4 (p2) + 1 (p3) + 6 (p4, uno salteado) = 25.
check("servidos", mo["servidos"] == 25, f'({mo["servidos"]})')
check("salteo sobre servidos", mo["salteo_pct"] == 4.0, f'({mo["salteo_pct"]}%)')
check("consultas a la tabla sobre servidos", mo["peek_pct"] == 4.0, f'({mo["peek_pct"]}%)')
cont = {c["label"]: c for c in mo["continuidad"]}
check("la continuidad mira si hubo otra derivada después",
      cont["70–80%"]["ok_n"] > 0 and cont["70–80%"]["ok"] is not None)
check("la escalera de θ tiene puntos", len(mo["escalera"]) >= 5)

# ── 7 · Plantillas ───────────────────────────────────────────────────────────
print("\n— plantillas —")
pl = q.plantillas(data, weeks)
por_key = {r["key"]: r for r in pl["filas"]}
check("t1_pow acumula lo servido", por_key["t1_pow"]["servidos"] == 24,
      f'({por_key["t1_pow"]["servidos"]})')
check("t5_ln_over_x se sirvió una vez y se salteó",
      por_key["t5_ln_over_x"]["servidos"] == 1 and por_key["t5_ln_over_x"]["salteo"] == 100.0)
check("las plantillas verdes se marcan", "t5_ln_over_x" in pl["verdes"])
check("t1_pow ya no es verde", "t1_pow" not in pl["verdes"])

# ── 8 · Cafecito ─────────────────────────────────────────────────────────────
print("\n— cafecito —")
ca = q.cafecito(data, weeks)
fila = ca["filas"][-1]
check("impresiones de la semana", fila["impresiones"] == 4, f'({fila["impresiones"]})')
check("el CTR se cuenta sobre personas", fila["ctr"] == 50.0, f'({fila["ctr"]}%)')
check("los cafecitos del titular son solo los donados", fila["cafecitos"] == 3,
      f'({fila["cafecitos"]}, y {fila["manuales"]} a mano aparte)')
check("los grants a mano se cuentan pero no se mezclan",
      fila["manuales"] == 3 and fila["empujes"] == 1 and fila["empujes_manuales"] == 1)
check("cafecitos por click ignora los grants a mano", fila["por_click"] == 3.0,
      "(con los 3 a mano adentro daría 6,0)")
check("el total tampoco los mezcla",
      ca["total_cafecitos"] == 3 and ca["total_manuales"] == 3)
trig = {t["trigger"]: t for t in ca["por_trigger"]}
check("el disparador milestone convierte", trig["milestone"]["ctr"] == 50.0)
check("el disparador record no", trig["record"]["ctr"] == 0.0)
check("compartir se mide aparte", ca["share"]["ctr"] == 100.0)
check("cada ventana dice de dónde salió",
      {(x["source"], x["university"]) for x in ca["ventanas"]}
      == {("cafecito", "UBA"), ("manual", "UTN")},
      f'({[(x["source"], x["university"]) for x in ca["ventanas"]]})')
check("y quién donó, que es lo único que delata la alerta de prueba",
      any(x["donante"] == "Nico" for x in ca["ventanas"]))
v = [x for x in ca["ventanas"] if x["university"] == "UBA"][0]
check("la ventana del empuje mide su propia universidad", v["university"] == "UBA")
check("y cuenta las respuestas de adentro", v["respuestas"] > 0, f'({v["respuestas"]})')
check("con un ritmo basal de la misma universidad", v["basal"] is not None)

# ── 9 · Rivalidad, difusión, entrada ─────────────────────────────────────────
print("\n— resto —")
ri = q.rivalidad(data, weeks)
unis = {u["university"]: u for u in ri["universidades"]}
check("dos universidades", set(unis) == {"UBA", "UTN"})
check("el XP por estudiante es el que ordena", unis["UBA"]["estudiantes"] == 2)
check("los eventos del feed se cuentan", sum(e["n"] for e in ri["eventos"]) == 2)

en = q.entrada(data, weeks)
check("un fallo de parseo sobre 25 envíos", en["fallos"] == 1 and en["intentos"] == 25,
      f'({en["fallos"]}/{en["intentos"]})')
check("tasa de fallo", en["pct_fallos"] == 4.0)
check("nadie fue a un segundo intento", en["segundo_intento"] == 0.0)

print("\n— dispositivo —")
de = q.dispositivo(data, weeks, now=NOW)
por_plat = {f["label"]: f for f in de["filas"]}
check("un aparato por estudiante, el de primer contacto",
      por_plat["Android"]["estudiantes"] == 2
      and por_plat["Escritorio"]["estudiantes"] == 1
      and por_plat["iOS"]["estudiantes"] == 1,
      f'({ {k: v["estudiantes"] for k, v in por_plat.items()} })')
# Los hechos del aparato se atribuyen por EJERCICIO: p2 volvió desde la compu,
# así que ese ejercicio suma a Escritorio aunque p2 sea un estudiante Android.
check("los ejercicios se atribuyen al aparato que los pidió",
      por_plat["Android"]["servidos"] == 9 and por_plat["Escritorio"]["servidos"] == 15,
      f'(android {por_plat["Android"]["servidos"]}, '
      f'escritorio {por_plat["Escritorio"]["servidos"]})')
check("y por eso alguien puede aparecer en dos aparatos", de["cambiaron"] == 1,
      f'({de["cambiaron"]} de {de["con_aparato"]})')
check("la mediana de derivadas es sobre los que jugaron, no sobre los que llegaron",
      por_plat["Escritorio"]["derivadas_mediana"] == 13.0,
      f'({por_plat["Escritorio"]["derivadas_mediana"]})')
check("el % de teléfono se calcula sobre los que tienen dato",
      de["por_semana"][-1]["pct_telefono"] == 75.0,
      f'({de["por_semana"][-1]["pct_telefono"]}%)')
check("la curva por aparato deja afuera las partidas abiertas",
      all(c["label"] != "iOS" for c in de["curvas"]),
      f'({[c["label"] for c in de["curvas"]]})')
check("el cafecito se corta por aparato",
      any(c["label"] == "Escritorio" and c["ctr"] == 100.0 for c in de["cta"]),
      f'({de["cta"]})')

di = q.difusion(data, weeks)
check("sin grupo de origen todos caen en el mismo bucket",
      di["origen"][0]["label"] == "sin grupo" and di["origen"][0]["n"] == 4)

# ── 10 · La página se arma ───────────────────────────────────────────────────
print("\n— render —")
payload = q.build(s, WEEK)
html = game_render.page(payload, token="tok")
check("la página se arma entera", len(html) > 10000, f"({len(html)} bytes)")
check("no quedó ningún None crudo en el HTML", "None" not in html)
check("lleva el papel cuadriculado del juego", "background-size:40px 40px" in html)
check("y el borde de las cajas del juego", "#38385a" in html)
check("enlaza el panel de Intervalo", "/panel/tok</a>" in html or "/panel/tok'" in html)
check("el data.json queda linkeado", "/panel/tok/derivemos/data.json" in html)

# Una semana sin nada tiene que armarse igual y no romperse por dividir por cero.
vacio = q.build(s, WEEK + timedelta(weeks=8))
html2 = game_render.page(vacio, token="tok")
check("una semana vacía no rompe el panel", len(html2) > 5000)

s.close()

print()
if fallos:
    print(f"FALLARON {len(fallos)}: " + ", ".join(fallos))
    sys.exit(1)
print("todo ok")
