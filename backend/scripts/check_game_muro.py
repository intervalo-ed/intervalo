"""Verifica el tope diario de derivadas y el pase que lo levanta (game/muro.py).

Es el primer experimento que le COBRA a alguien por algo personal, así que lo
que hay que cuidar acá no es que la cuenta cierre sino que **no se le niegue una
derivada a quien no corresponde** y que **no se la regale a quien sí**. Cada
sección existe por un agujero concreto:

  - **el brazo de control no ve muro nunca**, ni con doscientas resueltas. Si
    esto se rompe, el experimento deja de tener grupo de comparación y no se nota
    hasta leer el panel;
  - **los jugadores VIEJOS tampoco**, en ningún brazo. Solo participa quien se
    creó a partir de `muro.ARRANQUE`, y el panel filtra con la misma fecha. Si
    esto se rompe, el tope aparece de golpe en la mitad de la gente que ya venía
    jugando sin él — que es exactamente el daño que la excepción existe para no
    hacer;
  - **`/skip` también corta.** Es la puerta que es fácil olvidarse: saltear
    CIERRA el ejercicio y sirve otro, así que sin esto el cupo se esquiva
    salteando y el experimento mide cero;
  - **el ejercicio ya abierto se puede responder.** `/answer` no frena nunca.
    Quitarle a alguien una derivada que ya tenía en pantalla es la única forma
    de que el tope se sienta como un robo en vez de como un límite;
  - **las incorrectas no consumen cupo.** El contador es `is_correct`, así que
    trabarse no cuesta. Si algún día se contara el intento, el tope castigaría
    justo a quien peor la está pasando;
  - **el contador es de HOY.** Cincuenta respuestas de ayer no frenan nada;
  - **el pase sale de `game_boosts` y NO vence.** Y el empuje de AFORO no lo da:
    ese no lo pagó nadie, y si lo diera el reclutamiento sería la forma gratis
    de saltear el tope;
  - **el interruptor apaga todo.** Un tope tiene que poder apagarse sin deploy;
  - **los minutos son de juego efectivo y no de reloj de pared.** Medido, el
    reloj de pared tiene p90 de 353 minutos: una de cada diez felicitaciones
    diría «resolviste 30 en 6 horas», que es una burla.

Uso:
    python backend/scripts/check_game_muro.py

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
    Path(tempfile.mkdtemp()) / "game_muro.db"
).replace("\\", "/")
# Encendido para todo el archivo salvo la sección que lo apaga a propósito.
os.environ["MURO_ENABLED"] = "1"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base, GameAttempt, GameBoost, GameCtaEvent, GameExercise, GamePlayer,
)

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import aforo, muro  # noqa: E402
from game.router import _inicio_del_dia, _proxima_medianoche  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


API = "/game/derivemos"
client = TestClient(main.app, raise_server_exceptions=True)

# Dos jugadores, uno de cada brazo. Los ids se buscan en vez de fijarse: el
# hash lleva el nombre del experimento adentro, así que renombrarlo re-sortea a
# todo el mundo y un id escrito a mano dejaría este archivo verde midiendo el
# brazo equivocado.
# `created_at` se escribe a mano y no se deja en el default. Solo participa
# quien nació a partir de `muro.ARRANQUE` (ver sección 11), y esa fecha puede
# estar en el FUTURO el día que esta suite corra: con el default («ahora») todo
# este archivo mediría a dos jugadores exentos y pasaría en verde sin haber
# probado el tope una sola vez. Nacen en el instante exacto del corte, que es el
# borde que sí participa.
_creados: dict[str, GamePlayer] = {}
for i in range(1, 60):
    j = GamePlayer(alias=f"tope{i}", theta=0.0, n_updates=0, exercises_correct=0,
                   exercises_attempted=0, is_bot=False, guest_token=f"tok-tope{i}")
    j.created_at = muro.NACIDO_DESPUES_DE
    db.add(j)
    db.commit()
    _creados.setdefault(muro.brazo_de(j.id), j)
    if len(_creados) == len(muro.BRAZOS):
        break

CONTROL, CON_MURO = _creados["control"], _creados["muro"]
TOK_CONTROL = f"tok-tope{CONTROL.alias[4:]}"
TOK_MURO = f"tok-tope{CON_MURO.alias[4:]}"


def acertar(jugador: GamePlayer, cuantas: int, *, cuando: datetime | None = None,
            correcta: bool = True) -> None:
    """Respuestas ya resueltas, escritas directo en la base.

    No se pasa por `/answer` a propósito: lo que este archivo prueba es el
    TOPE, y treinta llamadas al motor de sympy por sección lo volverían el check
    más lento de la suite para verificar algo que no depende de sympy.
    """
    base = cuando or (_inicio_del_dia() + timedelta(hours=10))
    for k in range(cuantas):
        ex = GameExercise(
            player_id=jugador.id, template_key="t1_pow", prompt_latex="x^2",
            expected_derivative="2*x", theta_at_serve=0.0, beta_at_serve=-1.0,
            p_hat=0.8, status="answered",
        )
        db.add(ex)
        db.commit()
        db.add(GameAttempt(
            exercise_id=ex.id, player_id=jugador.id, attempt_number=1,
            is_correct=correcta, parse_ok=True,
            created_at=base + timedelta(minutes=k),
        ))
    db.commit()


# ── 1 · El sorteo ────────────────────────────────────────────────────────────
print("1. el sorteo del brazo")

reparto = [muro.brazo_de(i) for i in range(1, 4001)]
cuantos = reparto.count("muro")
check(1800 <= cuantos <= 2200,
      f"reparte parejo sobre 4.000 ids ({cuantos} en el brazo muro)")
check(all(muro.brazo_de(i) == muro.brazo_de(i) for i in range(1, 200)),
      "y es estable: el mismo id da siempre el mismo brazo")
check(set(reparto) == set(muro.BRAZOS),
      f"y usa los dos brazos declarados ({muro.BRAZOS})")
# El brazo NO puede coincidir con el del otro experimento del servidor: los dos
# hashes llevan su propio nombre adentro justamente para que un jugador del
# brazo rápido de `dx-elo-1` no caiga sistemáticamente en el mismo de acá.
from game import sorteo  # noqa: E402
iguales = sum(1 for i in range(1, 2001)
              if (muro.brazo_de(i) == "muro") == (sorteo.brazo_de(i) == "rapido"))
check(850 <= iguales <= 1150,
      f"y no está correlacionado con el brazo de dx-elo-1 ({iguales} de 2.000 coinciden)")


# ── 2 · El control no ve muro nunca ──────────────────────────────────────────
print("2. el brazo de control juega como siempre")

check(muro.tope_de(CONTROL) is None, "el control no tiene tope")
acertar(CONTROL, 200)
r = client.post(f"{API}/next", headers={"X-Game-Token": TOK_CONTROL})
check(r.status_code == 200,
      f"con 200 resueltas hoy sigue recibiendo derivadas (dio {r.status_code})")


# ── 3 · El tope corta, y corta en el número declarado ────────────────────────
print("3. el tope del brazo test")

check(muro.tope_de(CON_MURO) == muro.TOPE_DIARIO,
      f"el brazo test tiene tope {muro.TOPE_DIARIO}")

acertar(CON_MURO, muro.TOPE_DIARIO - 1)
r = client.post(f"{API}/next", headers={"X-Game-Token": TOK_MURO})
check(r.status_code == 200,
      f"con {muro.TOPE_DIARIO - 1} resueltas todavía pasa (dio {r.status_code})")

acertar(CON_MURO, 1)
r = client.post(f"{API}/next", headers={"X-Game-Token": TOK_MURO})
check(r.status_code == 402,
      f"con {muro.TOPE_DIARIO} exactas devuelve 402 (dio {r.status_code})")

# 402 y no 403/429: el cliente decide qué dibujar mirando el status, y
# `ApiError.retriable` deja al 402 afuera de los reintentos.
r_skip = client.post(f"{API}/skip", json={"exercise_id": 1},
                     headers={"X-Game-Token": TOK_MURO})
check(r_skip.status_code == 402,
      f"y /skip corta igual, que es la puerta que se olvida (dio {r_skip.status_code})")


# ── 4 · Lo que el tope NO puede hacer ────────────────────────────────────────
print("4. lo que sigue permitido con el cupo agotado")

# El ejercicio que ya estaba en pantalla se responde. Se sirve uno a mano —el
# endpoint está cerrado— y se contesta.
abierto = GameExercise(
    player_id=CON_MURO.id, template_key="t1_pow", prompt_latex="x^{2}",
    expected_derivative="2*x", theta_at_serve=0.0, beta_at_serve=-1.0,
    p_hat=0.8, status="served",
)
db.add(abierto)
db.commit()
r = client.post(f"{API}/answer",
                json={"exercise_id": abierto.id, "answer_latex": "2x"},
                headers={"X-Game-Token": TOK_MURO})
check(r.status_code == 200,
      f"el ejercicio ya abierto se puede responder (dio {r.status_code})")
cuerpo = r.json() if r.status_code == 200 else {}
check(bool(cuerpo.get("muro", {}).get("bloqueado")),
      "y la respuesta avisa que el cupo está agotado, sin un /next fallido de por medio")

# Las incorrectas no consumen cupo: se cuenta `is_correct`.
antes = muro.estado(db, CONTROL, 0, _inicio_del_dia(), _proxima_medianoche())
otro = GamePlayer(alias="errante", theta=0.0, n_updates=0, exercises_correct=0,
                  exercises_attempted=0, is_bot=False, guest_token="tok-errante")
db.add(otro)
db.commit()
acertar(otro, 50, correcta=False)
hechas = db.query(GameAttempt).filter(
    GameAttempt.player_id == otro.id, GameAttempt.is_correct.is_(True)).count()
check(hechas == 0, "cincuenta respuestas erradas no suman una sola al contador")
check(antes.bloqueado is False, "y un jugador sin resueltas no está bloqueado")


# ── 5 · El contador es de HOY ────────────────────────────────────────────────
print("5. el cupo se renueva")

ayer = GamePlayer(alias="ayerjugo", theta=0.0, n_updates=0, exercises_correct=0,
                  exercises_attempted=0, is_bot=False, guest_token="tok-ayer")
db.add(ayer)
db.commit()
acertar(ayer, 80, cuando=_inicio_del_dia() - timedelta(hours=6))
e = muro.estado(db, ayer, 0, _inicio_del_dia(), _proxima_medianoche())
check(not e.bloqueado, "ochenta resueltas AYER no frenan nada hoy")
check(e.libre_en_segundos is None, "y sin bloqueo no hay cuenta regresiva")

bloqueado = muro.estado(db, CON_MURO, muro.TOPE_DIARIO, _inicio_del_dia(),
                        _proxima_medianoche())
check(bloqueado.libre_en_segundos is not None
      and 0 < bloqueado.libre_en_segundos <= 24 * 3600,
      f"con bloqueo la cuenta regresiva cae dentro del día "
      f"(dio {bloqueado.libre_en_segundos})")
check(_proxima_medianoche() - _inicio_del_dia() == timedelta(days=1),
      "y la medianoche siguiente está exactamente a un día de la de hoy")


# ── 6 · El pase ──────────────────────────────────────────────────────────────
print("6. el pase que compra un cafecito")

check(not muro.tiene_pase(db, CON_MURO), "sin donaciones no hay pase")

pago = GameBoost(university="UTN", cafecitos=1, source="cafecito",
                 player_id=CON_MURO.id, external_ref="mp:test-1",
                 expires_at=datetime.utcnow() + timedelta(hours=2))
db.add(pago)
db.commit()
check(muro.tiene_pase(db, CON_MURO), "una donación lo enciende")
e = muro.estado(db, CON_MURO, muro.TOPE_DIARIO * 3, _inicio_del_dia(),
                _proxima_medianoche())
check(not e.bloqueado,
      "y con el pase puesto ni noventa resueltas bloquean")
r = client.post(f"{API}/next", headers={"X-Game-Token": TOK_MURO})
check(r.status_code == 200, f"el endpoint también lo deja pasar (dio {r.status_code})")

# NO vence. Duraba treinta días hasta el 03/10; ahora es para siempre. Se
# mueve la donación dos años atrás y el tope sigue levantado.
pago.created_at = datetime.utcnow() - timedelta(days=730)
db.commit()
check(muro.tiene_pase(db, CON_MURO), "una donación de hace dos años sigue dando pase")
e = muro.estado(db, CON_MURO, muro.TOPE_DIARIO * 3, _inicio_del_dia(),
                _proxima_medianoche())
check(e.con_pase and not e.bloqueado, "y el estado lo dice: con pase, sin bloqueo")
r = client.post(f"{API}/next", headers={"X-Game-Token": TOK_MURO})
check(r.status_code == 200, f"y el tope NO vuelve a cortar (dio {r.status_code})")
check(not hasattr(muro, "PASE_DIAS"), "no queda una duración que alguien pueda leer")

# El empuje de aforo NO da pase: ese no lo pagó nadie. Se saca la donación
# para que lo único que quede con su nombre sea el regalo.
db.delete(pago)
db.commit()
r = client.post(f"{API}/next", headers={"X-Game-Token": TOK_MURO})
check(r.status_code == 402, f"sin la donación el tope vuelve a cortar (dio {r.status_code})")
regalo = GameBoost(university="UTN", cafecitos=aforo.CAFECITOS_EQUIVALENTES,
                   source=aforo.SOURCE, player_id=CON_MURO.id,
                   external_ref="aforo:UTN:hoy",
                   expires_at=datetime.utcnow() + timedelta(hours=2))
db.add(regalo)
db.commit()
check(not muro.tiene_pase(db, CON_MURO),
      "el empuje de aforo no da pase: si lo diera, reclutar sería la forma "
      "gratis de saltear el tope")


# ── 7 · Los números del cartel ───────────────────────────────────────────────
print("7. los minutos y los percentiles")

t0 = datetime(2026, 9, 26, 14, 0)
seguidas = [t0 + timedelta(minutes=k) for k in range(31)]
check(muro.minutos_jugando(seguidas) == 30,
      f"treinta seguidas de a un minuto dan 30 (dio {muro.minutos_jugando(seguidas)})")

# El caso que el reloj de pared arruinaría: quince a la mañana y quince nueve
# horas después. El reloj diría «en 9 h 14 min»; el tiempo jugando dice 28.
partido = ([t0 + timedelta(minutes=k) for k in range(15)]
           + [t0 + timedelta(hours=9) + timedelta(minutes=k) for k in range(15)])
check(muro.minutos_jugando(partido) == 28,
      f"partido en dos sentadas da 28 y no 554 (dio {muro.minutos_jugando(partido)})")
check(muro.minutos_jugando([t0]) == 0, "una sola respuesta da cero y no explota")
check(muro.minutos_jugando([]) == 0, "y la lista vacía tampoco")
check(muro.minutos_jugando(list(reversed(seguidas))) == 30,
      "y no depende del orden en que lleguen")

check(muro.percentil_de_velocidad(10) == 90, "diez minutos es más rápido que el 90%")
check(muro.percentil_de_velocidad(25) == 51, "veinticinco, que es la mediana, da 51%")
check(muro.percentil_de_velocidad(10_000) == muro.VELOCIDAD[-1][1],
      "y un número enorme cae en el último escalón en vez de romperse")
check(all(a[1] >= b[1] for a, b in zip(muro.VELOCIDAD, muro.VELOCIDAD[1:])),
      "la tabla es monótona: tardar más nunca puede dar un percentil mejor")
check(all(a[0] < b[0] for a, b in zip(muro.VELOCIDAD, muro.VELOCIDAD[1:])),
      "y sus umbrales están ordenados, o el primer `<=` ganaría el equivocado")


# ── 8 · El interruptor ───────────────────────────────────────────────────────
print("8. se puede apagar sin deploy")

os.environ["MURO_ENABLED"] = "0"
check(muro.tope_de(CON_MURO) is None, "apagado, nadie tiene tope")
r = client.post(f"{API}/next", headers={"X-Game-Token": TOK_MURO})
check(r.status_code == 200,
      f"y el que estaba bloqueado vuelve a jugar (dio {r.status_code})")
check(muro.estado(db, CON_MURO, 999, _inicio_del_dia(),
                  _proxima_medianoche()).bloqueado is False,
      "ni con 999 resueltas")
os.environ["MURO_ENABLED"] = "1"
check(muro.tope_de(CON_MURO) == muro.TOPE_DIARIO,
      "y se vuelve a encender leyendo la variable, sin reiniciar el proceso")


# ── 9 · La telemetría del cartel ─────────────────────────────────────────────
print("9. el cartel entra al embudo del cafecito")

r = client.post(f"{API}/cta",
                json={"cta": "cafecito", "action": "impression",
                      "placement": "muro", "solved": muro.TOPE_DIARIO},
                headers={"X-Game-Token": TOK_MURO})
fila = (db.query(GameCtaEvent)
        .filter(GameCtaEvent.placement == "muro")
        .order_by(GameCtaEvent.id.desc()).first())
check(r.status_code in (200, 204) and fila is not None,
      f"la impresión del muro se anota (status {r.status_code})")
check(fila is not None and fila.cta == "cafecito",
      "y lo hace como cafecito, para caer en el mismo embudo que los otros carteles")
# El nombre del lugar tiene que entrar en la columna, que es String(20).
check(len("muro") <= 20, "el nombre del lugar entra en la columna sin migración")

from metrics.game_queries import LUGARES_CAFECITO  # noqa: E402
check("muro" in LUGARES_CAFECITO,
      "y el panel sabe cómo se llama, o la tabla mostraría la clave cruda")


# ── 10 · La regla de inscripción del panel ───────────────────────────────────
print("10. quién entra al experimento")

from datetime import date as _date  # noqa: E402
from metrics.game_queries import EXPERIMENTO_MURO, _alta_en_el_muro  # noqa: E402

# Se LEE de `muro.ARRANQUE` y no se escribe: esa fecha hace dos cosas a la vez
# —abre la inscripción y define quién es nuevo— y con la fecha copiada acá este
# archivo seguiría verde el día que una de las dos mitades se mueva.
DESDE = muro.ARRANQUE
T = muro.TOPE_DIARIO

# El panel puede abrir la inscripción DESPUÉS del arranque —lo hace desde el
# 02/10, ver `LECTURA_DESDE`— y nunca antes: antes inscribiría gente que el
# servidor no topea.
check(EXPERIMENTO_MURO["desde"] >= muro.ARRANQUE,
      "el panel nunca inscribe antes de la fecha que define quién participa")

# **`>=` y no `>`, y de esto depende que el experimento exista.** En el brazo
# tratado el contador no puede pasar del tope porque el servidor corta justo
# ahí, así que con `>` el brazo test tendría cero inscriptos para siempre y el
# panel diría «faltan 269» hasta el fin de los tiempos.
justo = {_date(2026, 9, 28): T}
check(_alta_en_el_muro(justo, DESDE, T) == _date(2026, 9, 28),
      f"llegar a {T} exactas inscribe (es el caso del brazo CON tope, que no "
      f"puede pasar de ahí)")
check(_alta_en_el_muro({_date(2026, 9, 28): T - 1}, DESDE, T) is None,
      f"con {T - 1} no")

# El control se inscribe por el mismo hecho, y ahí es el contrafáctico: el día
# en que habría chocado.
check(_alta_en_el_muro({_date(2026, 9, 28): T * 10}, DESDE, T) == _date(2026, 9, 28),
      "y pasarse largo también, que es como entra el control")

# El primero que cuenta es el PRIMERO, no el último ni el más grande.
varios = {_date(2026, 9, 30): T * 3, _date(2026, 9, 28): T, _date(2026, 10, 5): T}
check(_alta_en_el_muro(varios, DESDE, T) == _date(2026, 9, 28),
      "con varios días que llegan, entra por el primero")

# Nada de antes del arranque cuenta, y NO hay inscripción retroactiva: quien
# llegó a 30 en septiembre y no volvió no chocó ningún muro, y meterlo sumaría
# cientos de personas con cero días activos a los dos brazos.
antes = {_date(2026, 9, 10): T * 5, _date(2026, 9, 20): T * 2}
check(_alta_en_el_muro(antes, DESDE, T) is None,
      "lo anterior al arranque no inscribe a nadie: sin esto, el experimento se "
      "llenaría de gente que nunca vio un muro")
mixto = {_date(2026, 9, 20): T * 5, _date(2026, 10, 2): T}
check(_alta_en_el_muro(mixto, DESDE, T) == _date(2026, 10, 2),
      "y quien ya llegaba antes entra recién el día que vuelve a llegar, con el "
      "experimento corriendo")
check(_alta_en_el_muro({}, DESDE, T) is None, "sin días jugados no entra nadie")
check(_alta_en_el_muro({DESDE: T}, DESDE, T) == DESDE,
      "el día del arranque cuenta (el borde es cerrado)")


# ── 11 · La excepción de los veteranos ───────────────────────────────────────
print("11. los jugadores de antes no participan")

from datetime import timezone as _tz  # noqa: E402

# Un jugador con la misma suerte que `CON_MURO` —mismo brazo— pero creado antes
# del arranque. El id se busca, igual que arriba: el brazo sale de un hash.
VIEJO = None
for i in range(200, 400):
    j = GamePlayer(alias=f"tope{i}", theta=0.0, n_updates=0, exercises_correct=0,
                   exercises_attempted=0, is_bot=False, guest_token=f"tok-tope{i}")
    db.add(j)
    db.commit()
    if muro.brazo_de(j.id) == "muro":
        VIEJO = j
        break
assert VIEJO is not None
# Nacido un día antes del corte. Se escribe a mano porque el default de la
# columna es «ahora», y «ahora» siempre cae después del arranque.
VIEJO.created_at = muro.NACIDO_DESPUES_DE - timedelta(days=1)
db.commit()
TOK_VIEJO = f"tok-tope{VIEJO.alias[4:]}"

check(muro.brazo_de(VIEJO.id) == "muro",
      "el jugador de prueba cayó en el brazo CON tope, que es donde se nota")
check(muro.participa(VIEJO) is False, "y no participa, por ser de antes")
check(muro.tope_de(VIEJO) is None,
      "así que no tiene tope aunque le haya tocado el brazo tratado")

acertar(VIEJO, 200)
check(muro.estado(db, VIEJO, 200, _inicio_del_dia(),
                  _proxima_medianoche()).bloqueado is False,
      "con 200 resueltas hoy sigue sin muro")
r = client.post(f"{API}/next", headers={"X-Game-Token": TOK_VIEJO})
check(r.status_code == 200, f"y /next le sirve otra derivada (dio {r.status_code})")
_abierto = r.json().get("exercise_id") if r.status_code == 200 else None
r = client.post(f"{API}/skip", json={"exercise_id": _abierto},
                headers={"X-Game-Token": TOK_VIEJO})
check(r.status_code != 402,
      f"y /skip tampoco lo corta (dio {r.status_code})")

# El borde, que es lo único que una fecha puede tener mal.
class _Falso:
    def __init__(self, created_at):
        self.created_at = created_at
        self.id = 1

check(muro.participa(_Falso(muro.NACIDO_DESPUES_DE)) is True,
      "el instante del corte SÍ participa (el borde es cerrado)")
check(muro.participa(_Falso(muro.NACIDO_DESPUES_DE - timedelta(microseconds=1))) is False,
      "y un microsegundo antes no")
check(muro.participa(_Falso(None)) is False,
      "sin fecha de creación no participa: el caso imposible cae del lado seguro")
# El corte es medianoche de Buenos Aires y no de UTC, que son tres horas de
# jugadores. Con el corte en UTC, todo el que se creara entre las 21 y las 24 del
# día anterior entraría al experimento sin que fuera su día.
check(muro.NACIDO_DESPUES_DE.replace(tzinfo=_tz.utc).astimezone(
          muro._TZ_JUEGO).hour == 0,
      "el corte es la medianoche ARGENTINA, no la de UTC")


# ── 12 · El panel no cuenta a los veteranos ──────────────────────────────────
print("12. y el panel tampoco los cuenta")

from metrics.game_queries import experimento_muro  # noqa: E402

# El dato mínimo que el bloque necesita: dos personas del MISMO brazo, una nueva
# y una vieja, las dos con un día que llega al tope después del arranque.
# El día en que los dos llegan al tope es uno que el PANEL ya lee: desde el
# 02/10 su inscripción abre después del arranque (`LECTURA_DESDE`), así que un
# día entre las dos fechas no inscribiría a nadie y el chequeo mediría eso.
_ABRE = EXPERIMENTO_MURO["desde"]
_dia = datetime(_ABRE.year, _ABRE.month, _ABRE.day, 15, 0, 0)
_fake = {
    "players": [
        {"id": CON_MURO.id, "is_bot": False, "xp": 100,
         "created_at": muro.NACIDO_DESPUES_DE},
        {"id": VIEJO.id, "is_bot": False, "xp": 100,
         "created_at": muro.NACIDO_DESPUES_DE - timedelta(days=1)},
    ],
    "attempts": [
        {"player_id": pid, "is_correct": True, "created_at": _dia}
        for pid in (CON_MURO.id, VIEJO.id) for _ in range(T)
    ],
    "boosts": [],
    "cta": [],
}
_b = {x["clave"]: x for x in experimento_muro(_fake)["brazos"]}
check(_b["muro"]["n"] + _b["muro"]["en_curso"] == 1,
      "de los dos que llegaron al tope, el panel inscribe UNO: el nuevo")
check(experimento_muro(_fake)["exentos"] == 1,
      "y cuenta al otro como exento, que es el precio de la excepción")

# Y el control, que también se filtra: si la excepción valiera solo del lado del
# tope, el control tendría gente que el brazo tratado no puede tener y los dos
# montones dejarían de ser comparables.
_fake2 = {
    **_fake,
    "players": [{"id": CONTROL.id, "is_bot": False, "xp": 100,
                 "created_at": muro.NACIDO_DESPUES_DE - timedelta(days=1)}],
    "attempts": [{"player_id": CONTROL.id, "is_correct": True, "created_at": _dia}
                 for _ in range(T)],
}
_b2 = {x["clave"]: x for x in experimento_muro(_fake2)["brazos"]}
check(_b2["control"]["n"] + _b2["control"]["en_curso"] == 0,
      "un veterano del CONTROL tampoco entra, o los brazos medirían poblaciones "
      "distintas")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
