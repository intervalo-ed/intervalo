"""Verifica las métricas del panel del minijuego contra un escenario a mano.

Cada bloque de `metrics/game_queries.py` tiene una respuesta conocida sobre datos
sembrados acá, así que el resultado es determinístico. Nada de comparar contra
producción, que cambia sola.

Lo que más importa que quede clavado son las definiciones, porque son las que se
pueden aflojar sin que nadie se entere y convierten el panel en un generador de
números lindos:

  - los estudiantes sembrados (`is_bot`) NO cuentan en ninguna métrica;
  - una respuesta que no parsea no es una respuesta: no cuenta como intento ni
    baja el acierto;
  - la curva de profundidad mide la PRIMERA SESIÓN y solo las CERRADAS;
  - el desglose reparte a la misma gente en montones: no cambia la base ni el
    largo de ninguna partida.

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
    GameNotificationSend, GamePlayer, GamePushSubscription, User,
)

Base.metadata.create_all(database.engine)
S = database.SessionLocal

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok  ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


import re as _re  # noqa: E402
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
# p3  invitado, UTN, 1 respuesta, partida ABIERTA (respondió hace 10 min)
# p4  registrado con cuenta vieja, UTN, 5 respuestas, cerrada
# p5  de CUATRO semanas antes y vuelve a jugar en esta: el único retenido, y el
#     único que ya existía cuando la semana empezó —o sea, el denominador de la
#     viralidad—. Cuatro semanas y no una para que quede afuera de la ventana
#     visible: acá se lo quiere solo como "el de antes", no como parte de las
#     cohortes que miden profundidad, difusión y aparato.
# p6  entra y se va sin responder nada: el rebote, que es más de la mitad del
#     tráfico real. Existe para que `activados` y `nuevos` NO sean el mismo
#     número: con los cuatro de arriba activando al 100%, un porcentaje medido
#     sobre altas y uno medido sobre activados daban idéntico, y ningún check
#     podía distinguirlos. Los tres de retención se miden sobre activados.
# p9  BOT: no tiene que aparecer en ninguna métrica
PLAYERS = [
    dict(id=1, user_id=1, alias="uno", university="UBA", career="E", is_bot=False,
         platform="desktop", pwa_first_seen_at=T(0, 15),
         created_at=T(0, 14), last_seen_at=T(0, 16)),
    dict(id=2, user_id=None, alias="dos", university="UBA", career="E", is_bot=False,
         platform="android", referred_by=5,
         created_at=T(1, 14), last_seen_at=T(1, 15)),
    dict(id=3, user_id=None, alias="tres", university="UTN", career="S", is_bot=False,
         platform="ios",
         created_at=T(6, 14), last_seen_at=NOW - timedelta(minutes=10)),
    dict(id=4, user_id=2, alias="cuatro", university="UTN", career="E", is_bot=False,
         platform="android",
         created_at=T(2, 14), last_seen_at=T(2, 15)),
    dict(id=5, user_id=None, alias="cero", university=None, career=None,
         is_bot=False, platform=None,
         created_at=T(-28, 14), last_seen_at=T(0, 15)),
    dict(id=6, user_id=None, alias="seis", university="UBA", career="E",
         is_bot=False, platform="android",
         created_at=T(3, 14), last_seen_at=T(3, 14, 2)),
    dict(id=9, user_id=None, alias="bot", university="UBA", career="E", is_bot=True,
         platform="desktop",
         created_at=T(0, 10), last_seen_at=T(0, 11)),
]
for p in PLAYERS:
    s.add(GamePlayer(theta=0.5, n_updates=5, xp=100, unlocked_keys="pow,sq", **p))

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

# p3: una sola respuesta hace diez minutos. Su tanda todavía puede crecer, así
# que la partida está ABIERTA y no entra en la curva.
ex = servir(3, NOW - timedelta(minutes=10), 0.85)
responder(ex, 3, NOW - timedelta(minutes=10), correcto=True)

# p4: 5 respuestas, todas correctas, y un salteo de una difícil.
for i in range(5):
    ex = servir(4, T(2, 14, i), 0.72)
    responder(ex, 4, T(2, 14, i), correcto=True)
servir(4, T(2, 14, 30), 0.35, template="t5_ln_over_x", status="skipped")

# p5 vuelve: una respuesta en la semana de referencia, cuatro semanas después
# de su alta. Es lo único que lo hace contar como retenido.
ex = servir(5, T(0, 15), 0.70)
responder(ex, 5, T(0, 15), correcto=True)

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
# El click sin impresión, que es un bug real de `settings-panel.tsx`: ahí el
# botón dispara el click sin montar nunca el contador de impresiones. Se siembra
# para probar que el panel lo trata como lo que es —un numerador sin
# denominador— y no lo suma a un CTR que quedaría inflado.
s.add(GameCtaEvent(player_id=2, cta="cafecito", action="click", placement="settings",
                   created_at=T(1, 16)))
s.add(GameCtaEvent(player_id=1, cta="share", action="impression", created_at=T(0, 15)))
s.add(GameCtaEvent(player_id=1, cta="share", action="click", created_at=T(0, 15, 2)))
# Un CTA del bot, que tampoco puede contar.
s.add(GameCtaEvent(player_id=9, cta="cafecito", action="click", created_at=T(0, 15)))

# ── Re-enganche ──────────────────────────────────────────────────────────────
# p1 registrado: su preferencia vive en `users` (es el titular del cupo).
# p2 invitado: la suya vive en su propia fila.
# p3 sin suscribir: no puede recibir aunque tenga la preferencia prendida.
s.query(User).filter(User.id == 1).update({"notify_enabled": True})
s.query(GamePlayer).filter(GamePlayer.id == 2).update({"notify_enabled": True})
s.query(GamePlayer).filter(GamePlayer.id == 3).update({"notify_enabled": True})
for pid in (1, 2):
    s.add(GamePushSubscription(player_id=pid, endpoint=f"https://push.test/{pid}",
                               p256dh="k", auth="a"))

# Cuatro avisos: tres programados y uno de evento, con un solo click. El de
# evento es el que NO tiene peso nominal.
AVISOS = [
    (1, "social", "social_hoy", T(0, 15), True),
    (1, "reactivacion", "reactivacion_ayer", T(1, 15), False),
    (2, "social", "social_semana", T(2, 15), False),
    (2, "empuje", "empuje_anon", T(3, 15), False),
]
for pid, cat, var, cuando, abierto in AVISOS:
    s.add(GameNotificationSend(
        player_id=pid, category=cat, variant_key=var, title="dx", body="cuerpo",
        sent_at=cuando, delivery_status="ok",
        opened_at=cuando + timedelta(minutes=5) if abierto else None))

# Un aviso del BOT, que no puede contar en ningún número.
s.add(GameNotificationSend(player_id=9, category="social", variant_key="social_hoy",
                           title="dx", body="cuerpo", sent_at=T(0, 15)))
s.add(GamePushSubscription(player_id=9, endpoint="https://push.test/bot",
                           p256dh="k", auth="a"))

# Mails: a p4 le salió el "volvé" y volvió a jugar al día siguiente; a p1 le
# salió el resumen de reclutas y no volvió.
s.query(GamePlayer).filter(GamePlayer.id == 4).update(
    {"winback_email_sent_at": T(2, 13)})
s.query(User).filter(User.id == 2).update({"reclutas_email_sent_on": T(0, 15).date()})

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

s.commit()

data = q.load(s)
weeks = q._weeks_back(WEEK, 4)

# ── 1 · Los bots no existen ──────────────────────────────────────────────────
print("\n— bots —")
check("los estudiantes sembrados se excluyen", len(data["players"]) == 6,
      f'({len(data["players"])} estudiantes)')
check("sus ejercicios también", all(e["player_id"] != 9 for e in data["exercises"]))
check("sus respuestas también", all(a["player_id"] != 9 for a in data["attempts"]))
check("sus CTA también", all(c["player_id"] != 9 for c in data["cta"]))
check("se informa cuántos se sacaron", data["_bots"] == 1)

# ── 2 · Qué es una respuesta ─────────────────────────────────────────────────
print("\n— respuestas —")
# p1: 12 + 1 mirada + 1 buena tras el fallo de parseo = 14 primeros intentos.
# p2: 4. p3: 1. p4: 5. p5: 1. Total 25 respuestas parseadas.
check("lo que no parsea no es respuesta", len(data["_answers"]) == 25,
      f'({len(data["_answers"])})')
check("el fallo de parseo sí queda registrado",
      sum(1 for a in data["attempts"] if not a["parse_ok"]) == 1)
# Los primeros intentos son la unidad de la curva de profundidad: el largo de
# una partida es cuántas derivadas DISTINTAS enfrentó, no cuántas veces tipeó.
# En este escenario nadie usó el segundo intento, así que coinciden — lo que se
# clava acá es que el fallo de parseo, que sí ocurrió, no cuenta como ninguno.
check("el largo de la partida se mide en primeros intentos",
      len(data["_firsts"]) == 25 and len(data["_firsts"]) == len(data["_answers"]),
      f'({len(data["_firsts"])} primeros intentos sobre {len(data["_answers"])} respuestas)')

# ── 3 · Los números de la semana ───────────────────────────────────────────
print()
print("— numeros de la semana —")
# `headline` devuelve un dict por sección, no una lista: los doce números viven
# arriba del gráfico que los explica. Acá se aplanan porque lo que se fija en
# este bloque son las DEFINICIONES, que no dependen de dónde se dibuje cada una.
REPARTO = q.headline(data, weeks)
h = {c["label"]: c for cards in REPARTO.values() for c in cards}
# Los cuatro estudiantes de la semana, más nadie: el bot no cuenta y p3 respondió
# recién el lunes siguiente, así que su respuesta cae en la semana de al lado.
check("usuarios nuevos de la semana", h["Usuarios nuevos"]["value"] == 5,
      f'({h["Usuarios nuevos"]["value"]}, los cuatro que jugaron + el que rebotó)')
# Los ÚNICOS son personas, no tandas: p1 entra el día 0 y vuelve dos horas
# después, y sigue siendo UNO. Es la diferencia con la métrica que estaba antes
# —visitas, que contaba tandas— y el motivo del cambio: «cuántas personas
# distintas abrieron el juego» es la pregunta de volumen que se quería contestar.
check("los únicos cuentan personas y no tandas",
      h["Usuarios únicos"]["value"] == 6,
      f'({h["Usuarios únicos"]["value"]}, esperaba los 5 nuevos + p0)')
# Y nunca puede haber menos únicos que nuevos: todo nuevo es, por definición,
# alguien que se asomó esa semana.
check("y nunca son menos que los nuevos",
      h["Usuarios únicos"]["value"] >= h["Usuarios nuevos"]["value"])

# La activación es el OMTM: de los nuevos, cuántos llegaron a responder. p1, p2 y
# p4 respondieron en la semana; p3 recién el lunes siguiente, pero su alta es de
# esta, así que la cohorte lo cuenta igual.
check("la activación se mide sobre los nuevos de la semana",
      h["Usuarios activados"]["value"] == 4,
      f'({h["Usuarios activados"]["value"]} de {h["Usuarios nuevos"]["value"]})')
check("y el porcentaje sale de esos dos",
      h["Activación"]["value"] == 80.0,
      f'({h["Activación"]["value"]}%, 4 de 5)')
# ── Retención, toda sobre los ACTIVADOS de la camada ──────────────────────
# La camada de la semana son cinco altas y cuatro activados. Los tres
# porcentajes de abajo se dividen por CUATRO: quien nunca respondió no puede
# volver, ni registrarse, ni instalar nada, y meterlo en el denominador mide
# activación disfrazada de retención.
check("el denominador de retención son los activados, no las altas",
      h["Activados de la camada"]["value"] == 4
      and h["Usuarios nuevos"]["value"] == 5,
      f'({h["Activados de la camada"]["value"]} de {h["Usuarios nuevos"]["value"]})')
# p1 y p4 tienen cuenta; p2 y p3 siguen de invitados. Sobre los cuatro
# activados da 50%; sobre las cinco altas daría 40%, que es el número que este
# check existe para NO dejar pasar.
check("se registran", h["Se registran"]["value"] == 50.0,
      f'({h["Se registran"]["value"]}%, sobre altas daría 40,0%)')
# La instalación es la otra mitad de «a quién podemos alcanzar después». p1 abrió
# la app instalada; los otros tres no.
# Solo p1 abrió la app instalada: 1 de los 4 activados.
check("las instalaciones salen de quien abrió la app instalada",
      h["Instalan la app"]["value"] == 25.0,
      f'({h["Instalan la app"]["value"]}%, esperaba 1 de 4 activados)')
# La vuelta se mide en DÍAS distintos con respuesta, no en sentadas: p1
# responde el día 0 y otra vez el día 4, así que vuelve; p2 y p4 juegan un solo
# día; p3 tiene una sola respuesta. Uno de cuatro.
check("vuelve quien respondió en un segundo día distinto",
      h["Vuelven otro día"]["value"] == 25.0,
      f'({h["Vuelven otro día"]["value"]}%, esperaba p1 de cuatro)')
# Y no es la misma cuenta que la de Jugabilidad, que mira SENTADAS: ahí p1 y p2
# vuelven —p2 tiene dos tandas el mismo día— y acá p2 no.
check("y no es la vuelta por sentadas de Jugabilidad",
      h["Vuelven otro día"]["value"] != h["Vuelven a jugar"]["value"],
      f'(días {h["Vuelven otro día"]["value"]}% contra '
      f'sentadas {h["Vuelven a jugar"]["value"]}%)')
check("el titular de cafecitos no cuenta los grants a mano",
      h["Cafecitos"]["value"] == 3, f'({h["Cafecitos"]["value"]}, no 6)')
# ── El K de camada ────────────────────────────────────────────────────────
# `cero` (p5) entró cuatro semanas antes y trajo a `dos` (p2), que respondió.
# O sea: una camada de una persona que trajo una persona, y las dos jugaron.
# Es el caso mínimo donde K vale exactamente 1 por los dos caminos, y sirve
# justamente porque los dos numeradores y los dos denominadores son el mismo
# número: si alguna de las cuatro cuentas se cruzara, daría distinto de 1.
CAM = {c["week"]: c for c in q.camadas(data, WEEK)["filas"]}
c_cero = CAM[(WEEK - timedelta(weeks=4)).isoformat()]
check("el recluta se le cuenta a la camada de SU RECLUTADOR",
      c_cero["reclutas"] == 1 and c_cero["n"] == 1,
      f'({c_cero["reclutas"]} reclutas sobre una camada de {c_cero["n"]})')
check("y el K de la camada es esa división",
      c_cero["k"] == 1.0, f'({c_cero["k"]})')
check("el de activados exige que las dos puntas hayan jugado",
      c_cero["reclutas_act"] == 1 and c_cero["n_act"] == 1,
      f'({c_cero["reclutas_act"]} de {c_cero["n_act"]})')
check("y da su propia división", c_cero["k_act"] == 1.0, f'({c_cero["k_act"]})')

# La camada de la semana de referencia no reclutó a nadie: sus cuatro miembros
# entraron por difusión. Cero y no None — la división existe y vale cero, que
# es una afirmación distinta de «no se puede calcular».
c_hoy = CAM[WEEK.isoformat()]
check("una camada que no reclutó a nadie da cero, no vacío",
      c_hoy["k"] == 0.0 and c_hoy["n"] == 5,
      f'(k={c_hoy["k"]} sobre {c_hoy["n"]})')
# Y una semana sin nadie no puede dar cero: dividir por cero no es cero.
vacias = [c for c in q.camadas(data, WEEK)["filas"] if c["n"] == 0]
check("y una camada vacía da vacío, no cero",
      bool(vacias) and all(c["k"] is None and c["k_act"] is None for c in vacias),
      f"({len(vacias)} camadas sin nadie)")

# ── La maduración, que es lo que evita leer una camada a medio terminar ────
# Medido en producción: el último de los 144 reclutas llegó 3,6 días después
# del alta de quien lo trajo. Una camada cierra el domingo y a los cuatro días
# ya no le entra nada. La regla se prueba contra HOY y no contra la semana del
# panel, porque lo que limita a una camada es el tiempo real que pasó.
_hoy = q.week_start(q.local_date(datetime.utcnow()))
check("la camada en curso nunca está madura",
      q._camadas(data, [_hoy])[_hoy]["madura"] is False)
_vieja = _hoy - timedelta(weeks=2)
check("y una de hace dos semanas siempre lo está",
      q._camadas(data, [_vieja])[_vieja]["madura"] is True)

# ── Los cuatro números de la fila salen de esa misma función ──────────────
# No de cuatro cuentas escritas aparte: dos definiciones de K dan dos números
# distintos para la misma pregunta, que es exactamente lo que pasó con el K
# semanal que esto reemplaza.
check("la fila de reclutas lee la camada de la semana",
      h["Reclutas traídos"]["value"] == c_hoy["reclutas"]
      and h["De esos, arrancaron"]["value"] == c_hoy["reclutas_act"]
      and h["K de la camada"]["value"] == c_hoy["k"]
      and h["K de activados"]["value"] == c_hoy["k_act"])
check("y los dos K se muestran con dos decimales",
      h["K de la camada"]["dec"] == 2 and h["K de activados"]["dec"] == 2)
# El K viejo dividía por la base previa, así que la difusión le movía el
# denominador. Que no quede ninguno de los dos suelto alimentando un número.
check("el K semanal no quedó colgado en ningún lado",
      not hasattr(q, "viralidad_activados")
      and "Viralidad general" not in h and "Viralidad de activados" not in h)
# La primera tanda de p1 son las 9 correctas del bloque del día 0 (la décima cae
# más de media hora después); p2 3, p4 5. p3 no respondió en esta semana.
# p1 respondió 12 veces el día 0, pero las últimas dos son dos horas después:
# su primera tanda son las diez seguidas, con nueve aciertos. Si el corte no
# existiera daría 12 y este número mediría "cuánto jugó en total el día que
# entró", que es otra cosa.
check("la primera sesión corta en el primer hueco de media hora",
      q._correctas_de_la_primera_sesion(
          [a for a in data["_answers"] if a["player_id"] == 1]) == 9)
# Primeras tandas: p1 9, p2 2, p4 5, p3 1 (su tanda cae recién el lunes
# siguiente, pero el alta es de esta semana y la cohorte es por alta).
check("y la mediana es sobre los nuevos que llegaron a responder",
      h["1ª sesión"]["value"] == 3.5, f'({h["1ª sesión"]["value"]})')

# ── La fila de sesiones ─────────────────────────────────────────────────────
# p1 tiene una segunda tanda (las de las 16, dos horas después) y p2 tiene la
# suya del día 3. Los dos de cuatro que respondieron: 50%.
check("«vuelven a jugar» mira sentadas, no semanas",
      h["Vuelven a jugar"]["value"] == 50.0,
      f'({h["Vuelven a jugar"]["value"]}%, esperaba p1 y p2 de cuatro)')
# La segunda tanda se mide POR TANDA: p1 aporta la suya y p2 la suya, así que
# son dos números y no dos personas promediadas.
check("la 2ª y siguientes se miden por tanda",
      h["2ª y siguientes"]["value"] is not None,
      f'({h["2ª y siguientes"]["value"]})')
# Y la duración: la primera tanda de p1 son diez respuestas de 14:00 a 14:09.
check("la duración de la 1ª sesión sale en minutos",
      h["Duración 1ª sesión"]["value"] is not None
      and h["Duración 1ª sesión"]["value"] > 0,
      f'({h["Duración 1ª sesión"]["value"]} min)')

# El reparto es la parte que se puede romper sin que nadie lo note: una tarjeta
# que se cae del dict desaparece de la página y ninguna consulta falla por eso.
check("son veinte números", len(h) == 20, f"({len(h)})")
check("repartidos de a cuatro en cinco grupos",
      {k: len(v) for k, v in REPARTO.items()}
      == {"activacion": 4, "retencion": 4, "monetizacion": 4, "reclutas": 4,
          "jugabilidad": 4},
      f"({ {k: len(v) for k, v in REPARTO.items()} })")
# El cafecito se mudó a Monetización y no quedó en los dos lados. Y el primero
# de la fila es el denominador de los otros tres, que es lo que hace que la
# fila se lea como una sola cuenta.
check("retención arranca por su denominador y no tiene el cafecito",
      [c["label"] for c in REPARTO["retencion"]]
      == ["Activados de la camada", "Vuelven otro día", "Se registran",
          "Instalan la app"],
      f'({[c["label"] for c in REPARTO["retencion"]]})')
# Cada uno va donde está el gráfico que lo explica, y la sección a la que apunta
# tiene que existir como pestaña: una clave mal escrita acá es una fila de
# números que no se dibuja en ningún lado.
# `reclutas` es la excepción: no es una pestaña sino una sección adentro de
# Activación, porque sus cuatro números hablan del mismo canal que la curva que
# tienen justo abajo y leerlos en la cabecera obligaba a subir y bajar.
check("y cada grupo apunta a una pestaña que existe, salvo reclutas",
      set(REPARTO) - {"reclutas"} <= {c for c, _ in game_render.SECCIONES},
      f"({sorted(REPARTO)})")
# Las derivadas de la primera tanda y sus minutos tienen que quedar PEGADAS:
# cinco derivadas en dos minutos y cinco en veinte son dos productos distintos,
# y con dos tarjetas en el medio esa lectura no ocurre.
etiquetas_prof = [c["label"] for c in REPARTO["jugabilidad"]]
check("la duración va al lado de las derivadas de esa misma tanda",
      abs(etiquetas_prof.index("1ª sesión")
          - etiquetas_prof.index("Duración 1ª sesión")) == 1,
      f"({etiquetas_prof})")

# ── 4 · Evolución semanal ────────────────────────────────────────────────────
# El embudo de la partida se fue del panel: sus primeros pasos son los números
# de la fila de activación (nuevos → activados), «llegó a k» es la curva de
# profundidad y «se registró» y «volvió otro día» son Retención. Quedaba
# diciendo tres veces lo mismo, así que se borró con su consulta.
print()
print("— evolución —")
ev = q.evolucion(data, WEEK)
check("arranca en la tasa de activación", ev["metrica"] == "activacion",
      f'({ev["metrica"]})')
check("una métrica que no existe cae en esa misma",
      q.evolucion(data, WEEK, "inventada")["metrica"] == "activacion")
# La serie va desde la primera semana del panel hasta la elegida, no las últimas
# cuatro: con cuatro puntos una tendencia no se distingue de un rebote.
semanas_esperadas = (WEEK - q.FIRST_WEEK).days // 7 + 1
check("la serie cubre toda la historia hasta la semana elegida",
      len(ev["filas"]) == semanas_esperadas,
      f'({len(ev["filas"])} semanas, esperaba {semanas_esperadas})')
check("y termina en la semana elegida",
      ev["filas"][-1]["week"] == WEEK.isoformat())
# Las cuatro curvas existen sobre las mismas filas: se elige cuál se dibuja, no
# se recalcula nada.
ultima = ev["filas"][-1]
check("cada fila trae los cuatro números",
      all(k in ultima for k in ("unicos", "nuevos", "activados", "activacion")))
check("los activados nunca superan a los nuevos",
      all(f["activados"] <= f["nuevos"] for f in ev["filas"]))
check("y los únicos nunca son menos que los nuevos",
      all(f["unicos"] >= f["nuevos"] for f in ev["filas"]))
# El sufijo va con la métrica: sin esto el porcentaje se dibujaría sin el % y
# los conteos con él.
check("el porcentaje lleva su unidad y los conteos no",
      ev["suffix"] == "%" and q.evolucion(data, WEEK, "nuevos")["suffix"] == "")

# ── 5 · Profundidad ──────────────────────────────────────────────────────────
print("\n— profundidad —")
pr = q.profundidad(data, weeks, now=NOW)
# p3 respondió hace diez minutos: su tanda todavía puede crecer y NO entra.
check("las partidas abiertas no entran en la curva", pr["base"] == 3, f'(base {pr["base"]})')
check("y se informa cuántas quedaron afuera", pr["abiertos"] == 1)
curva = {c["k"]: c for c in pr["curva"]}
check("S(1) = 100%", curva[1]["pct"] == 100.0)

# La partida es la PRIMERA TANDA, no la vida entera. p1 respondió 14 veces, pero
# 10 seguidas a las 14:00 y las otras 4 recién a partir de las 16:00 — dos horas
# después, o sea otra sentada. Su partida mide 10. p2 respondió 3 el día 1 y una
# el día 3: mide 3. p4 hizo sus 5 de una. Largos: [10, 3, 5].
check("la vuelta de otro día no alarga la partida",
      curva[4]["vivos"] == 2, f'(S(4) = {curva[4]["vivos"]}, y con la vida entera serían 3)')
check("S(5) los tiene a p1 y p4", curva[5]["vivos"] == 2, f'({curva[5]["vivos"]})')
check("S(6) deja solo a p1", curva[6]["vivos"] == 1)
check("y la segunda sentada de p1 tampoco cuenta",
      curva[10]["vivos"] == 1 and curva[11]["vivos"] == 0,
      f'(S(10) = {curva[10]["vivos"]}, S(11) = {curva[11]["vivos"]})')
check("mediana de derivadas", pr["mediana"] == 5.0, f'({pr["mediana"]})')

# La otra mitad de la regla: una partida abierta se cierra sola media hora
# después, sin que nadie haga nada. Es lo que hace legible la cohorte del día.
tarde = q.profundidad(data, weeks, now=NOW + timedelta(hours=1))
check("media hora después la partida de p3 ya está cerrada",
      tarde["base"] == 4 and tarde["abiertos"] == 0,
      f'(base {tarde["base"]}, abiertas {tarde["abiertos"]})')
check("y entra con el largo de su tanda, que es uno",
      {c["k"]: c["vivos"] for c in tarde["curva"]}[2] == 3)

# ── 6 · El desglose de la profundidad ──────────────────────────────────────
print()
print("— desglose —")
# El corte reparte a la MISMA gente en montones: no cambia quién entra ni cuánto
# aguantó cada uno. Si eso se rompiera, dos cortes contarían poblaciones
# distintas y compararlos no querría decir nada.
for c in q.CORTES:
    d = q.profundidad(data, weeks, now=NOW, corte=c)
    check(f"el corte «{c}» no cambia la base", d["base"] == pr["base"],
          f'({d["base"]} vs {pr["base"]})')
    check(f"ni el escalón del titular en «{c}»", d["peor_escalon"] == pr["peor_escalon"])

# Cinco partidas cerradas es el piso para tener línea propia. En el escenario
# solo p1, p2 y p4 están cerrados —tres— así que ninguna universidad ni ningún
# aparato llega, y el desglose queda deliberadamente vacío en vez de dibujar
# tres curvas de una persona.
uni = q.profundidad(data, weeks, now=NOW, corte="universidad")
check("un grupo con menos de cinco partidas no dibuja línea",
      uni["series"] == [], f'({[x["label"] for x in uni["series"]]})')
check("y se informa que el desglose no cubre nada", uni["cubiertos"] == 0)

# Con el piso bajado a uno aparecen, y las líneas suman exactamente el total:
# es la propiedad que hace que el desglose sea un reparto y no otro recorte.
q.MIN_BASE_SERIE = 1
try:
    uni = q.profundidad(data, weeks, now=NOW, corte="universidad")
    apa = q.profundidad(data, weeks, now=NOW, corte="aparato")
    coh = q.profundidad(data, weeks, now=NOW, corte="cohorte")
    check("por universidad salen UBA y UTN",
          {x["label"] for x in uni["series"]} == {"UBA", "UTN"},
          f'({[x["label"] for x in uni["series"]]})')
    check("cada línea lleva su sigla para poder pintarla con su color",
          all(x["clave"] for x in uni["series"]))
    check("las líneas del aparato suman el total",
          sum(x["base"] for x in apa["series"]) == apa["base"],
          f'({sum(x["base"] for x in apa["series"])} de {apa["base"]})')
    check("y van en el orden de la plataforma, no por tamaño",
          [x["label"] for x in apa["series"]] == ["Android", "Escritorio"],
          f'({[x["label"] for x in apa["series"]]})')
    check("las cohortes van de la más vieja a la más nueva",
          [x["label"] for x in coh["series"]]
          == sorted(x["label"] for x in coh["series"]))
    check("y no son más de tres", len(coh["series"]) <= q.MAX_COHORTES)
finally:
    q.MIN_BASE_SERIE = 5

# ── El corte por sesión ────────────────────────────────────────────────────
# Es el único que cambia de UNIDAD entre sus dos líneas: la primera cuenta
# personas y la segunda cuenta tandas. Si alguna vez se "arreglara" para que
# sumen, el número dejaría de contestar la pregunta que motivó el corte.
ses = q.profundidad(data, weeks, now=NOW, corte="sesion")
check("la primera línea del corte por sesión ES la curva de «Todos»",
      ses["series"][0]["curva"] == pr["curva"]
      and ses["series"][0]["base"] == pr["base"],
      f'({ses["series"][0]["base"]} vs {pr["base"]})')
# Con el piso en cinco no hay segunda línea en este escenario: las tandas de la
# segunda vuelta son dos. Que falte la segunda no puede llevarse puesta la
# primera, que es la referencia contra la que se lee todo el gráfico.
check("y sin base para la segunda, la primera sigue dibujándose",
      len(ses["series"]) == 1, f'({[x["label"] for x in ses["series"]]})')

q.MIN_BASE_SERIE = 1
try:
    ses = q.profundidad(data, weeks, now=NOW, corte="sesion")
    check("con base, salen las dos líneas",
          [x["label"] for x in ses["series"]] == ["1ª sesión", "2ª y siguientes"],
          f'({[x["label"] for x in ses["series"]]})')
    # p1 y p2 tienen una segunda tanda cada uno; p4 no. Son DOS tandas sobre
    # tres personas cerradas, así que la segunda línea no puede valer tres: si
    # valiera, estaría contando gente en vez de vueltas.
    check("la segunda línea cuenta tandas y no personas",
          ses["series"][1]["base"] == 2, f'({ses["series"][1]["base"]})')
    check("y las dos líneas NO suman el total, porque no reparten nada",
          sum(x["base"] for x in ses["series"]) != ses["base"],
          f'({sum(x["base"] for x in ses["series"])} vs {ses["base"]})')
finally:
    q.MIN_BASE_SERIE = 5

check("un corte que no existe cae en el total",
      q.profundidad(data, weeks, now=NOW, corte="inventado")["corte"] == "total")

# ── 6b · Las franjas horarias ──────────────────────────────────────────────
print()
print("— horarios —")


def AR(hora: int, minuto: int = 0) -> datetime:
    """El instante UTC que en Argentina se lee a esa hora."""
    return datetime(2026, 8, 17, hora, minuto) - q.AR_OFFSET


# Los bordes, uno por uno. Son la definición del corte: si alguno se corriera sin
# querer, las tres líneas del panel cambiarían de significado en silencio.
for hora, minuto, esperada in [
    (5, 59, "noche"), (6, 0, "manana"), (12, 59, "manana"),
    (13, 0, "tarde"), (19, 59, "tarde"), (20, 0, "noche"),
    (1, 0, "noche"), (23, 30, "noche"),
]:
    check(f"{hora:02d}:{minuto:02d} de Argentina cae en «{esperada}»",
          q._franja(AR(hora, minuto)) == esperada,
          f"(dio {q._franja(AR(hora, minuto))})")

# Y el cableado: la franja sale de la hora ARGENTINA de arranque de la tanda, no
# de la UTC de la columna. Las tres partidas cerradas del escenario arrancan
# 14:00 UTC, que son las 11 de la mañana acá — sin el huso serían «tarde», que es
# justo el error que no se vería en el gráfico.
q.MIN_BASE_SERIE = 1
try:
    hor = q.profundidad(data, weeks, now=NOW, corte="horario")
    check("las partidas de las 14 UTC son de la mañana argentina",
          [x["label"] for x in hor["series"]] == ["Mañana"],
          f'({[x["label"] for x in hor["series"]]})')
    check("y el desglose por horario reparte, no recorta",
          sum(x["base"] for x in hor["series"]) == hor["base"],
          f'({sum(x["base"] for x in hor["series"])} de {hor["base"]})')
    check("cada franja lleva su clave para poder pintarla",
          all(x["clave"] in q.FRANJA_ORDER for x in hor["series"]),
          f'({[x["clave"] for x in hor["series"]]})')
finally:
    q.MIN_BASE_SERIE = 5

# El orden es el del día y no el del tamaño: si se ordenaran por cuántos hay, las
# tres líneas cambiarían de lugar de una semana a la otra.
check("las franjas están declaradas en el orden del día",
      q.FRANJA_ORDER == ("manana", "tarde", "noche"), f"({q.FRANJA_ORDER})")
check("y las tres tienen etiqueta",
      all(k in q.FRANJA_LABEL for k in q.FRANJA_ORDER))

# La cohorte es la de la SEMANA ELEGIDA y no la ventana visible entera. Sin el
# corte por arriba, pedir una semana vieja devolvía una curva con gente que esa
# semana todavía no existía: p5 es de cuatro semanas antes y su cohorte es él
# solo, aunque después hayan entrado cuatro más.
vieja = q._weeks_back(WEEK - timedelta(weeks=4), 4)
pv = q.profundidad(data, vieja, now=NOW)
check("la cohorte es la de la semana elegida, no la ventana",
      pv["base"] == 1, f'({pv["base"]}, y la de {WEEK} tiene {pr["base"]})')
check("y no arrastra las altas posteriores",
      pv["base"] + pr["base"] == 4, f'({pv["base"]} + {pr["base"]})')

# «Por cohorte» sí trae otras camadas: la elegida y las dos anteriores. Es el
# único corte que NO parte la cohorte, y por eso sus líneas no suman el total.
q.MIN_BASE_SERIE = 1
try:
    tres = q.profundidad(data, q._weeks_back(WEEK - timedelta(weeks=2), 4),
                         now=NOW, corte="cohorte")
    check("por cohorte alcanza dos semanas para atrás",
          {x["clave"] for x in tres["series"]}
          == {(WEEK - timedelta(weeks=4)).isoformat()},
          f'({[x["clave"] for x in tres["series"]]})')
    lejos = q.profundidad(data, q._weeks_back(WEEK - timedelta(weeks=1), 4),
                          now=NOW, corte="cohorte")
    check("y una camada de tres semanas atrás ya no entra",
          all(x["clave"] != (WEEK - timedelta(weeks=4)).isoformat()
              for x in lejos["series"]),
          f'({[x["clave"] for x in lejos["series"]]})')
finally:
    q.MIN_BASE_SERIE = 5

# ── Re-enganche: push ───────────────────────────────────────────────────────
print()
print("— push —")
pu = q.push(data, weeks)
check("las suscripciones del bot no cuentan", pu["subs"] == 2, f'({pu["subs"]})')
# La preferencia vive en `users` para el registrado y en `game_players` para el
# invitado. Contar una sola de las dos tablas da la mitad de la respuesta, y es
# el error que este titular existe para detectar.
check("y «con notificación activa» mira las dos tablas",
      pu["activos"] == 3, f'({pu["activos"]}, esperaba p1 por users y p2/p3 por game_players)')
# Pero prender la preferencia no alcanza: hace falta un navegador suscripto. Los
# dos números se separan sin que haya ningún bug —p3 la tiene prendida y no se
# suscribió— y en producción se separan MÁS, porque un jugador registrado hereda
# la preferencia de Intervalo, donde la prendió para otro producto.
check("y «alcanzables» son los que además se suscribieron",
      pu["alcanzables"] == 2, f'({pu["alcanzables"]}, p3 tiene la preferencia y ningún navegador)')
check("los avisos del bot tampoco", pu["enviadas"] == 4, f'({pu["enviadas"]})')
check("un solo click", pu["abiertas"] == 1 and pu["ctr"] == 25.0,
      f'({pu["abiertas"]}, ctr {pu["ctr"]})')
cats = {c["categoria"]: c for c in pu["por_categoria"]}
check("la categoría más mandada va primero",
      pu["por_categoria"][0]["categoria"] == "social")
check("y cada una lleva su CTR", cats["social"]["enviadas"] == 2
      and cats["social"]["abiertas"] == 1 and cats["social"]["ctr"] == 50.0,
      f'({cats["social"]})')

# ── Re-enganche: mails ──────────────────────────────────────────────────────
print()
print("— mails —")
ma = q.mails(data, weeks)
tipos = {t["tipo"]: t for t in ma["tipos"]}
# A p4 le salió el "volvé" el día 2 a las 13 y respondió a las 14 del mismo día:
# volvió dentro de la ventana.
check("el volvé cuenta a quien vuelve a derivar",
      tipos["winback_dx"]["enviados"] == 1 and tipos["winback_dx"]["activados"] == 1,
      f'({tipos["winback_dx"]})')
# Al usuario 2 (jugador p4) le salió el resumen de reclutas el día 0; p4 recién
# respondió el día 2, o sea DENTRO de los tres días.
check("y el resumen de reclutas también tiene su fila",
      tipos["reclutas_semanal"]["enviados"] == 1, f'({tipos["reclutas_semanal"]})')
check("la tasa global sale de los dos", ma["enviados"] == 2, f'({ma["enviados"]})')
check("y se informa a cuántos se les puede escribir",
      ma["alcanzables"] == 2, f'({ma["alcanzables"]}, los jugadores con cuenta)')

# ── Reclutas ────────────────────────────────────────────────────────────────
print()
print("— reclutas —")
rc = q.reclutas(data, weeks)
# p2 entró por el link de p5: es el único reclutado del escenario.
check("cuenta a quien entró por un link", rc["total_reclutados"] == 1,
      f'({rc["total_reclutados"]})')
check("y el bot no está en el denominador", rc["total_jugadores"] == 6,
      f'({rc["total_jugadores"]})')
top = {t["alias"]: t for t in rc["top"]}
check("el reclutador aparece en el top", "cero" in top, f'({list(top)})')
# «Arrancaron» es lo que separa reclutar de repartir un link. En el escenario
# el recluta de `cero` respondió, así que su columna vale 1: si valiera 0 con
# un recluta que jugó, la tabla estaría contando otra cosa.
check("y la tabla dice cuántos de sus reclutas arrancaron",
      top["cero"]["activados"] == 1 if top else False,
      f'({top["cero"]["activados"] if top else "?"})')
# El eje de K no lleva %: es una razón —cuánta gente trae cada uno— y
# `ch.lines` rotula en porcentaje por defecto. Con el sufijo puesto mal, un
# K de 0,68 se dibujaba como «0,68%», cien veces menos.
h_via = game_render.page(q.build(s, WEEK), token="tok", seccion="activacion")
eje = h_via.split("Cuánta gente trae cada camada")[1][:3000]
check("el eje del coeficiente no se rotula en porcentaje",
      "%<" not in eje and "%'" not in eje)

# El gráfico de viralidad dibuja UNA serie y ya no ofrece desglose. La vista de
# volumen existía para poder auditar la división —un K que salta puede ser más
# reclutas o menos base— y ese trabajo lo hacen ahora los cuatro números de
# arriba de la sección, que traen los dos términos escritos.
h_k = game_render.page(q.build(s, WEEK), token="tok", seccion="activacion")
check("el gráfico de viralidad ya no tiene selector de vista",
      '<span class="cur">Coeficiente</span>' not in h_k
      and "Nuevos y reclutados" not in h_k)
check("y ningún link arrastra la vista vieja", "&v=" not in h_k)
check("la tabla de viralidad ya no está", "Base previa" not in h_k)
check("y los dos titulares que repetían tampoco",
      '<div class="label">K de la última semana</div>' not in h_k
      and '<div class="label">Top reclutador</div>' not in h_k)
# Los cuatro números de reclutas viven DENTRO de su sección y no en la cabecera
# de la pestaña: hablan del mismo canal que la curva que tienen abajo.
for etiqueta in ("Reclutas traídos", "De esos, arrancaron", "K de la camada",
                 "K de activados"):
    check(f"«{etiqueta}» está en la sección de reclutas",
          f'<div class="label">{etiqueta}</div>' in h_k)
# El top de reclutadores se fue del panel junto con las dos tarjetas
# acumuladas: es de SIEMPRE, así que no hay semana en que diga algo que no
# dijera la anterior, y no hay decisión que dependa de quién encabeza.
check("y el top de reclutadores tampoco está",
      "<h3>Top reclutadores</h3>" not in h_k)
check("con su cuenta de reclutas", top["cero"]["reclutas"] == 1 if top else False)
# La tabla de camadas es la auditoría de los dos K: sin los cuatro términos
# escritos, el número de arriba hay que creerlo.
check("la tabla de camadas trae los dos numeradores y los dos denominadores",
      all(f"<th>{c}</th>" in h_k for c in
          ("Camada", "Entraron", "Activados", "Reclutas", "Reclutas activados",
           "K", "K de activados")))
# Una camada a medio terminar tiene que decirlo EN la tabla y EN la curva: su
# K está incompleto y leerlo como caída es el error fácil. Las camadas del
# escenario son todas de agosto, o sea que están cerradas hace rato, así que
# comparar «¿aparece la marca?» contra «¿hay alguna sin cerrar?» daría falso
# contra falso y pasaría con el marcado roto. Se fuerza el otro lado moviendo
# la ventana de maduración, que es el único parámetro de la regla.
_cm = q.build(s, WEEK)["camadas"]["filas"]
check("con el escenario de agosto están todas cerradas",
      all(c["madura"] for c in _cm), f"({len(_cm)} camadas)")
def _huecos(pagina: str) -> int:
    """Cuántos puntos de la curva de camadas salen huecos.

    Se cuenta sobre el circulo y no sobre la linea punteada: con pocas camadas
    la curva son puntos sueltos —entre dos con dato hay semanas sin nadie, y un
    hueco corta la linea— asi que no hay tramo que puntear. El circulo hueco es
    el marcado que `weak` garantiza siempre.
    """
    trozo = pagina.split("Cuánta gente trae cada camada")[1].split("</div>")[0]
    return trozo.count('fill="var(--surface)" stroke=')


check("y entonces ni la tabla ni la curva marcan nada",
      '<span class="sub2">sumando</span>' not in h_k and _huecos(h_k) == 0,
      f"({_huecos(h_k)} puntos huecos)")

_md = q.MADURACION_DIAS
try:
    # Una ventana de maduración absurda deja a TODAS sin cerrar, sin tocar
    # ningún dato: es exactamente el estado que se quiere ver dibujado.
    q.MADURACION_DIAS = 10_000
    _h_verde = game_render.page(q.build(s, WEEK), token="tok", seccion="activacion")
    _cm2 = q.build(s, WEEK)["camadas"]["filas"]
finally:
    q.MADURACION_DIAS = _md
check("moviendo la ventana, ninguna queda cerrada",
      not any(c["madura"] for c in _cm2), f"({len(_cm2)} camadas)")
check("y la tabla las marca como sumando",
      '<span class="sub2">sumando</span>' in _h_verde)
# El marcado del gráfico es el mismo hecho por otro camino: `weak` dibuja el
# punto hueco y el tramo punteado. Si la tabla dice «sumando» y la curva lo
# dibuja firme, una de las dos miente.
check("y la curva las dibuja con el punto hueco",
      _huecos(_h_verde) > 0, f"({_huecos(_h_verde)} puntos huecos)")
# El eje tiene que poder distinguir las cinco marcas. K vive en centesimas, y
# con un decimal fijo la escala rotulaba «0,1 · 0,1 · 0,1 · 0 · 0»: tres
# etiquetas repetidas y ninguna informacion. Es el mismo error que el sufijo de
# porcentaje, por el otro lado del mismo rotulo.
_ejes = [t for t in _re.findall(r">([0-9][0-9.,]*)<",
                                h_k.split("Cuánta gente trae cada camada")[1]
                                   .split("</svg>")[0])]
check("las marcas del eje de K no se repiten",
      len(set(_ejes)) >= 4, f"({_ejes})")

# ── 6a-bis · La curva de retención ─────────────────────────────────────────
print()
print("— curva de retención —")

rt = q.retencion(data, WEEK)
check("arranca en la vuelta y no en el volumen", rt["metrica"] == "vuelven",
      f'({rt["metrica"]})')
check("una métrica que no existe cae en esa misma",
      q.retencion(data, WEEK, "inventada")["metrica"] == "vuelven")
check("la serie cubre toda la historia hasta la camada elegida",
      len(rt["filas"]) == 9, f'({len(rt["filas"])} semanas)')
check("y termina en la camada elegida", rt["filas"][-1]["week"] == WEEK.isoformat())
# Los dos términos de cada tasa viajan en la fila: una tasa sin su numerador y
# su denominador no se puede auditar, y estas viven abajo del 15%.
f_hoy = rt["filas"][-1]
check("cada fila trae los numeradores además de las tasas",
      f_hoy["n_vuelven"] == 1 and f_hoy["n_registran"] == 2
      and f_hoy["n_instalan"] == 1 and f_hoy["activados"] == 4,
      f"({f_hoy})")
check("y ningún numerador puede superar al denominador",
      all(f["n_vuelven"] <= f["activados"] and f["n_registran"] <= f["activados"]
          and f["n_instalan"] <= f["activados"] for f in rt["filas"]))
# Una camada sin activados da vacío y no cero: dividir por cero no es cero.
vacias_r = [f for f in rt["filas"] if f["activados"] == 0]
check("una camada sin activados da vacío, no cero",
      bool(vacias_r) and all(f["vuelven"] is None and f["registran"] is None
                             and f["instalan"] is None for f in vacias_r),
      f"({len(vacias_r)} camadas sin nadie que jugara)")
# La ventana de maduración es propia de cada métrica: instalar tiene una cola
# mucho más larga que registrarse, así que una camada puede estar cerrada para
# una y todavía abierta para la otra. Se prueba contra HOY, que es lo que la
# limita.
_hoy_r = q.week_start(q.local_date(datetime.utcnow()))
_madura_hoy = q._camadas_retencion(data, [_hoy_r])[_hoy_r]["madura"]
check("la camada en curso no está madura para ninguna métrica",
      not any(_madura_hoy.values()), f"({_madura_hoy})")
# Una de hace dos semanas ya cerró para volver (ventana 8 días) pero todavía no
# para instalar (14). Si las dos ventanas fueran una sola, esto daría igual.
_dos = _hoy_r - timedelta(weeks=2)
_madura_dos = q._camadas_retencion(data, [_dos])[_dos]["madura"]
check("y a las dos semanas cerró la vuelta pero no la instalación",
      _madura_dos["vuelven"] and not _madura_dos["instalan"],
      f"({_madura_dos})")

h_ret = game_render.page(q.build(s, WEEK), token="tok", seccion="retencion")
check("la curva arranca marcada en la vuelta",
      '<span class="cur">Vuelven otro día</span>' in h_ret)
check("y las otras tres se ofrecen como link",
      all(f"&mr={k}" in h_ret for k in ("activados", "registran", "instalan")))
# El parámetro es propio y no el de la curva de activación: con uno compartido,
# pasar por la otra pestaña pisaba la elección de esta.
check("la curva de activación no comparte parámetro con esta",
      "&m=" not in h_ret.replace("&mr=", ""))
h_ret2 = game_render.page(q.build(s, WEEK, metrica_ret="instalan"),
                          token="tok", seccion="retencion")
check("elegir otra curva la marca a ella",
      '<span class="cur">Instalan la app</span>' in h_ret2)
check("y esa elección viaja en los demás links",
      h_ret2.count("&mr=instalan") >= 3, f'({h_ret2.count("&mr=instalan")} links)')


# ── 6b-bis · Monetización ──────────────────────────────────────────────────
print()
print("— monetización —")

# La plata y las dos tasas que la explican. El escenario: 4 impresiones del
# cartel (milestone x2, record x2), 1 click desde milestone, 1 click desde
# ajustes SIN impresión, y una donación de 3 cafecitos.
check("los cafecitos son solo los donados de verdad",
      h["Cafecitos"]["value"] == 3, f'({h["Cafecitos"]["value"]}, el manual no cuenta)')
check("y las donaciones cuentan veces, no cafecitos",
      h["Donaciones"]["value"] == 1, f'({h["Donaciones"]["value"]})')
# 1 click sobre 4 impresiones. El click de ajustes NO entra: su lugar nunca
# anota impresiones, así que sumarlo daría 50% con el mismo denominador de 4.
# Es el bug que la tabla de abajo tiene que dejar a la vista.
check("el CTR deja afuera los clicks sin denominador",
      h["Tocan el cartel"]["value"] == 25.0,
      f'({h["Tocan el cartel"]["value"]}%, con los dos clicks daría 50,0%)')
check("y la última tasa cierra el embudo con la plata",
      h["Del click a la plata"]["value"] == 100.0,
      f'({h["Del click a la plata"]["value"]}%, 1 donación sobre 1 click medible)')

mo = q.monetizacion(data)
lug = {l["lugar"]: l for l in mo["lugares"]}
check("la tabla abre el cartel por dónde sale",
      set(lug) == {"milestone", "record", "settings"}, f"({sorted(lug)})")
check("y cada lugar trae su propio CTR",
      lug["milestone"]["ctr"] == 50.0 and lug["record"]["ctr"] == 0.0,
      f'(milestone {lug["milestone"]["ctr"]}, record {lug["record"]["ctr"]})')
# El lugar sin impresiones se lista igual y con el CTR VACÍO, no con un cero:
# un 0% es «nadie lo tocó» y acá lo que pasa es que no se puede calcular.
check("el lugar sin impresiones se lista con el CTR vacío",
      lug["settings"]["clicks"] == 1 and lug["settings"]["impresiones"] == 0
      and lug["settings"]["ctr"] is None,
      f'({lug["settings"]})')
check("y va al final, donde no ordena por un número que no tiene",
      mo["lugares"][-1]["lugar"] == "settings")
check("el panel dice cuántos clicks quedaron sin denominador",
      mo["sin_denominador"] == 1, f'({mo["sin_denominador"]})')

h_mon = game_render.page(q.build(s, WEEK), token="tok", seccion="monetizacion")
check("y lo avisa en la página", "clicks sin denominador" in h_mon)
check("la tabla marca el lugar que no anota impresiones",
      "no las anota" in h_mon)
# Los tres carteles que se fueron de acá, cada uno por su motivo. `share` pide
# una persona y no plata; `boost_offer` dividía una acción de nicho por un
# denominador global y daba 1,2% sin significar nada; `register` nunca existió.
check("compartir no está en monetización",
      "Reclutar: compartir el link" not in h_mon)
check("y la oferta de multiplicador tampoco",
      "Oferta de multiplicador" not in h_mon and "boost_offer" not in h_mon)
check("el cartel que nunca existió salió del mapa",
      "register" not in q.CARTELES, f"({sorted(q.CARTELES)})")
# `share` aterrizó en Reclutas, que es donde está la curva que explica.
h_act = game_render.page(q.build(s, WEEK), token="tok", seccion="activacion")
check("compartir vive ahora al lado del K que gobierna",
      "<h3>El cartel de compartir</h3>" in h_act)
check("con sus tres números", all(
    f'<div class="label">{e}</div>' in h_act for e in ("Lo vieron", "Lo tocaron", "CTR")))


# ── 6c · La pestaña de experimentos ────────────────────────────────────────
print()
print("— experimentos —")

EXP = q.EXPERIMENTOS[0]
MARCA = {c: f'{EXP["clave"]}:{c}' for c, _ in EXP["brazos"]}
CONTROL, TEST = [c for c, _ in EXP["brazos"]]

# El n comprometido se clava con su valor. No es un número decorativo: es lo que
# decide cuándo el panel deja de negarse a contestar, y si alguien tocara `base`
# o `mde` sin querer, el experimento pasaría a leerse antes o después sin que
# nadie lo note.
check("el n comprometido sale de los parámetros declarados",
      q.n_comprometido(EXP) == 373, f"({q.n_comprometido(EXP)} por brazo)")
# Y la propiedad que gobierna todo el programa de experimentos: el n va con el
# inverso del CUADRADO del efecto, así que pedir la mitad cuesta cuatro veces.
mitad = dict(EXP, mde=EXP["mde"] / 2)
check("y pedir la mitad de efecto cuesta ~4 veces la muestra",
      3.6 < q.n_comprometido(mitad) / q.n_comprometido(EXP) < 4.4,
      f'({q.n_comprometido(mitad)} contra {q.n_comprometido(EXP)})')


def escenario(n_por_brazo, servidas_control, servidas_test):
    """Un `data` mínimo con dos brazos poblados a mano."""
    players, exercises, firsts = [], [], []
    pid = 0
    for clave, servidas in ((CONTROL, servidas_control), (TEST, servidas_test)):
        for i in range(n_por_brazo):
            pid += 1
            players.append({
                "id": pid, "is_bot": False, "variant": MARCA[clave],
                "platform": "android" if i % 2 else "ios",
                "created_at": NOW, "user_id": None, "university": None,
                "referred_by": None, "pwa_first_seen_at": None,
            })
            if i < servidas:
                exercises.append({"player_id": pid, "created_at": NOW})
                firsts.append({"player_id": pid, "created_at": NOW,
                               "attempt_number": 1, "is_correct": True})
    return {"players": players, "exercises": exercises, "_firsts": firsts}


# ── La invariante central ──────────────────────────────────────────────────
# Con la muestra a medio juntar NO se calcula el p-valor. Es lo único que esta
# sección hace y ninguna otra del panel hace. Sin esto, alguien mira el panel
# todos los días y para en cuanto cruza 0,05 — que no es leer el experimento
# sino repetir el sorteo hasta que salga, y sube el error de tipo I muy por
# encima del alfa declarado.
flaco = q.experimentos(escenario(50, 25, 40))[0]
check("con la muestra a medio juntar, no está listo", not flaco["listo"])
check("y NO se calcula el p-valor todavía", flaco["lectura"] is None,
      f'({flaco["lectura"]})')
check("pero sí dice cuánto falta por brazo",
      all(b["falta"] == 323 for b in flaco["brazos"]),
      f'({[b["falta"] for b in flaco["brazos"]]})')
# Los guardarraíles se calculan igual, y eso no es contradicción: sirven para
# frenar un brazo que hace daño, no para declararlo ganado.
check("y los guardarraíles se miran igual, desde el primer día",
      all(b["pct_servida"] is not None for b in flaco["brazos"]))

# ── Con la muestra completa ────────────────────────────────────────────────
lleno = q.experimentos(escenario(400, 224, 264))[0]
check("con la muestra completa, está listo", lleno["listo"])
check("y ahí sí se calcula la lectura", lleno["lectura"] is not None)
L = lleno["lectura"]
check("el delta sale en puntos porcentuales", abs(L["delta_pp"] - 10.0) < 0.001,
      f'({L["delta_pp"]})')
check("un efecto de 10 puntos con el n comprometido se detecta",
      L["rechaza"] and L["p_valor"] < 0.05,
      f'(z={L["z"]}, p={L["p_valor"]:.4f})')
# El intervalo NO usa la proporción combinada —esa vale bajo H0— y tiene que
# contener al delta observado. Mezclar los dos errores estándar es el error
# clásico de este cálculo y no se vería en la pantalla.
check("y el intervalo contiene al delta observado",
      L["ic_pp"][0] < L["delta_pp"] < L["ic_pp"][1], f'({L["ic_pp"]})')

# Sin efecto, no rechaza. Es la otra mitad: un panel que siempre encuentra algo
# no sirve para decidir.
plano = q.experimentos(escenario(400, 224, 224))[0]
check("y sin diferencia real no rechaza",
      not plano["lectura"]["rechaza"] and plano["lectura"]["p_valor"] > 0.05,
      f'(p={plano["lectura"]["p_valor"]:.3f})')

# ── Quién entra al experimento ─────────────────────────────────────────────
# Los que no tienen variante quedan afuera solos. Son los 1.102 que ya existían
# cuando el experimento arrancó: contarlos sería meter en un brazo a gente que
# vio la otra pantalla.
con_viejos = escenario(50, 25, 40)
con_viejos["players"].append({
    "id": 9001, "is_bot": False, "variant": None, "platform": "android",
    "created_at": NOW, "user_id": None, "university": None,
    "referred_by": None, "pwa_first_seen_at": None,
})
check("quien no tiene variante no entra a ningún brazo",
      sum(b["n"] for b in q.experimentos(con_viejos)[0]["brazos"]) == 100)

# ── Y que la pantalla lo diga ──────────────────────────────────────────────
html_exp = game_render.page(q.build(s, WEEK), token="tok", seccion="experimentacion")
check("la pestaña avisa que todavía no se puede leer",
      "Todavía no se puede leer" in html_exp or "Sin datos todavía" in html_exp)
check("y no muestra un p-valor antes de tiempo",
      "p-valor" not in html_exp.split("Hipótesis")[0] or "faltan" in html_exp)
check("y escribe el n comprometido", str(q.n_comprometido(EXP)) in html_exp)
# `_table` escapa toda celda que no EMPIECE con "<", así que una celda que mezcla
# texto y marcado se dibuja con las etiquetas a la vista. Pasó con el desglose
# por plataforma y no lo atrapaba nada: la página se armaba igual.
check("y no se le escapa marcado a la vista",
      '&lt;span' not in html_exp, f'({html_exp.count(chr(38) + "lt;span")} sueltos)')

# El estado "ya se puede leer" tiene su propio render —el recuadro con el z, el
# p-valor y el intervalo— y ese camino no lo ejercita ningún escenario del panel,
# porque en el panel todavía no hay muestra. Se arma a mano: la primera vez que
# se dibujó de verdad tenía un `num()` sobre la tupla entera del intervalo en vez
# de sobre su primer elemento, y reventaba la página.
def _pintar(exp_listo):
    payload = dict(q.build(s, WEEK))
    payload["experimentos"] = [exp_listo]
    return game_render.page(payload, token="tok", seccion="experimentacion")


for etiqueta, datos in (("gana", escenario(400, 224, 264)),
                        ("plano", escenario(400, 224, 224)),
                        ("pierde", escenario(400, 264, 224))):
    e = q.experimentos(datos)[0]
    html_l = _pintar(e)
    check(f"el estado «{etiqueta}» se dibuja sin romperse", len(html_l) > 8000,
          f"({len(html_l)} bytes)")
    # Los dos extremos separados por " ; ", y sin rastro de una tupla de
    # Python impresa: `num()` sobre la tupla entera es justo el bug que
    # rompía esta pantalla, y su forma visible sería un "(3.3, 16.7)".
    check(f"y «{etiqueta}» muestra el intervalo con sus dos extremos",
          " ; " in html_l and ", " not in html_l.split(" ; ")[0][-14:])
check("y con la muestra completa aparece el p-valor",
      "p-valor" in _pintar(q.experimentos(escenario(400, 224, 264))[0]))

# ── 7 · La página se arma ───────────────────────────────────────────────────
print("\n— render —")
payload = q.build(s, WEEK)
html = game_render.page(payload, token="tok")
check("la página se arma entera", len(html) > 10000, f"({len(html)} bytes)")
check("no quedó ningún None crudo en el HTML", "None" not in html)
check("lleva el papel cuadriculado del juego", "background-size:40px 40px" in html)
# El canal de la barra de scroll se reserva siempre. Sin esto, la pestaña que
# entra en una pantalla alta —Experimentación— no dibuja barra, el viewport
# queda 15 px más ancho y el contenido centrado se corre 7 px respecto de las
# otras tres: al cambiar de pestaña se ve saltar TODO el panel de costado.
check("reserva el canal de la barra de scroll",
      "scrollbar-gutter:stable" in html)
check("y el borde de las cajas del juego", "#38385a" in html)
check("enlaza el panel de Intervalo", "/panel/tok</a>" in html or "/panel/tok'" in html)
check("el data.json queda linkeado", "/panel/tok/dx/data.json" in html)

# Una semana sin nada tiene que armarse igual y no romperse por dividir por cero.
vacio = q.build(s, WEEK + timedelta(weeks=8))
html2 = game_render.page(vacio, token="tok")
check("una semana vacía no rompe el panel", len(html2) > 5000)
# Y el corte por sesión es el que más superficie tiene para romperse ahí: dibuja
# la primera línea aunque no tenga base —es la referencia— así que pasa por
# `ch.lines` con una curva entera de None en vez de caer en el «no hay partidas».
vacio_ses = q.build(s, WEEK + timedelta(weeks=8), corte="sesion")
html3 = game_render.page(vacio_ses, token="tok", seccion="jugabilidad")
check("y tampoco rompe el corte por sesión", len(html3) > 5000, f"({len(html3)} bytes)")
check("que además avisa por qué le falta la segunda línea",
      "Todavía no hay segunda línea" in html3)

# Cada pestaña se arma sola y trae SU sección y ninguna otra: es lo que hace que
# el panel deje de ser un scroll.
# Una marca por pestaña: un título que solo aparece en ELLA. Con cuatro
# secciones por pestaña no alcanza con contar `<h2>`, hay que mirar cuál es.
titulos = {"activacion": "Difusión: a cuánta gente se llegó",
           "retencion": "Re-enganche · push",
           "jugabilidad": "Calibración del motor",
           "monetizacion": "Dónde se pide el cafecito",
           "experimentacion": "Experimentos"}
for clave, _ in game_render.SECCIONES:
    h = game_render.page(q.build(s, WEEK), token="tok", seccion=clave)
    otros = [t for k, t in titulos.items() if k != clave]
    check(f"la pestaña «{clave}» trae su sección",
          f'>{titulos[clave]}</h2>' in h or titulos[clave] in h)
    # Ya no se cuenta: una pestaña tiene varias secciones. Lo que se fija es
    # que no aparezca la marca de OTRA pestaña, que es lo que delataría que
    # una pieza quedó pegada en el lugar equivocado.
    check(f"y ninguna pieza ajena en «{clave}»",
          not any(t in h for t in otros),
          f'({h.count(chr(60) + "h2>")} secciones)')
    # La etiqueta de la barra es la de SECCIONES, que es más corta que el
    # título de la sección: la pestaña dice «Push» y el encabezado
    # «Re-enganche · push».
    etiqueta = dict(game_render.SECCIONES)[clave]
    check(f"la pestaña «{clave}» queda marcada en la barra",
          f'<span class="cur">{etiqueta}</span>' in h)
    # Y los números de la semana viajan con su sección. Es la forma callada de
    # que el reparto se rompa: una tarjeta con la clave mal escrita se dibuja
    # igual de linda, pero arriba del gráfico que no la explica — o no se dibuja
    # en ninguna parte y nadie se entera, porque ninguna consulta falla por eso.
    # `reclutas` se dibuja DENTRO de activación, así que para esa pestaña sus
    # números son propios y no ajenos. Es la única excepción y conviene que
    # esté escrita acá: si mañana se mueve a su propia pestaña, este check es
    # el que lo va a pedir.
    propios = {clave} | ({"reclutas"} if clave == "activacion" else set())
    mios = [c["label"] for k in propios for c in REPARTO.get(k, [])]
    ajenos = [c["label"] for k, cards in REPARTO.items() if k not in propios
              for c in cards]
    check(f"los numeros de «{clave}» estan en su pestaña",
          all(f'<div class="label">{lab}</div>' in h for lab in mios),
          f"({len(mios)} tarjetas)")
    check(f"y ninguno ajeno en «{clave}»",
          not any(f'<div class="label">{lab}</div>' in h for lab in ajenos))

# Una pestaña inventada cae en la primera en vez de dar una página vacía.
h = game_render.page(q.build(s, WEEK), token="tok", seccion="inventada")
check("una pestaña que no existe cae en la primera",
      "Difusión: a cuánta gente se llegó" in h)
# Y «titulares» es una pestaña inventada como cualquier otra: el panel la tuvo
# durante meses, así que hay links pegados por ahí que la siguen pidiendo y
# tienen que abrir el panel en vez de una página en blanco.
h = game_render.page(q.build(s, WEEK), token="tok", seccion="titulares")
check("un link viejo a «titulares» cae en la primera",
      "Difusión: a cuánta gente se llegó" in h)
check("y ya no queda ninguna seccion que se llame asi",
      "titulares" not in {c for c, _ in game_render.SECCIONES})

# Los cinco cortes tienen que armar la pestaña de profundidad, incluido el que
# se queda sin series: ahí el gráfico no se dibuja y la caja se cae si nadie lo
# previó.
for c in q.CORTES:
    h = game_render.page(q.build(s, WEEK, corte=c), token="tok", seccion="jugabilidad")
    check(f"la página se arma con el corte «{c}»", len(h) > 8000, f"({len(h)} bytes)")
    # El corte activo se dibuja como texto marcado y no como link: los otros
    # tres siguen siendo links, y el activo no puede llevar a sí mismo.
    activo = {"total": "Todos", "sesion": "Por sesión", "cohorte": "Por cohorte",
              "universidad": "Por universidad", "aparato": "Por aparato",
              "horario": "Por horario"}[c]
    check(f"y el corte «{c}» queda marcado en la barra",
          f'<span class="cur">{activo}</span>' in h)
    # El corte por horario es el único que además explica qué NO es: la hora de
    # arranque es en buena parte la hora en que salió el mensaje de difusión, y
    # sin decirlo el gráfico se lee como «a esta hora la gente rinde mejor».
    if c == "horario":
        check("y el corte por horario avisa que mide difusión tanto como hábito",
              "por qué difusión llegaste" in h)
        check("y deja escritos los bordes de las franjas",
              "mañana 06–13, tarde 13–20, noche 20–06" in h)
    # Las tres barras conviven: cambiar de semana o de pestaña no puede perder
    # el desglose elegido, y elegir desglose no puede devolver a la primera
    # pestaña. Se verifica sobre los links, que es donde viaja el estado.
    if c != "total":
        check(f"y el corte «{c}» viaja en los links de semana y pestaña",
              h.count(f"&corte={c}") >= 3, f'({h.count(f"&corte={c}")} links)')
    check(f"los links de la barra de cortes conservan la pestaña con «{c}»",
          h.count("s=jugabilidad") >= 3, f'({h.count("s=jugabilidad")} links)')

s.close()

print()
if fallos:
    print(f"FALLARON {len(fallos)}: " + ", ".join(fallos))
    sys.exit(1)
print("todo ok")
