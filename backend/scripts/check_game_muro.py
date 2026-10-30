"""Verifica que el tope diario ya no existe (`dx-muro-1`, cerrado el 30/10/2026,
ver game/muro.py), y que el panel sigue leyendo bien lo que se juntó.

El experimento se cerró por decisión de producto con el CONTROL como juego para
todos: nadie tiene tope. Lo que hay que cuidar ahora es lo contrario de lo que
cuidaba este archivo antes —que **no se le niegue una derivada a nadie**— y que
el panel histórico no se mienta a sí mismo:

  - **nadie ve muro nunca**, ni en el brazo que lo tenía, ni nacido después
    del arranque, ni con doscientas resueltas hoy, ni con `MURO_ENABLED`
    prendido: `/next` y `/skip` no devuelven 402, y ninguna respuesta trae
    `muro`;
  - **el módulo no decide nada.** Quedan el sorteo y las fechas que lee el
    panel; si alguien vuelve a importar `tope_de` o `estado`, esto se pone rojo;
  - **la inscripción del panel** sigue con sus reglas —`>=` el tope, nada
    retroactivo, veteranos exentos— y además **se cierra el día del cierre**:
    quien llegó a 30 después no chocó ningún muro y no puede contar en un brazo.

Uso:
    python backend/scripts/check_game_muro.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from datetime import date as _date, datetime, timedelta, timezone as _tz
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_muro.db"
).replace("\\", "/")
# Prendido a propósito: la variable ya no tiene que hacer nada, y la forma de
# probarlo es dejarla en el valor que antes encendía el tope.
os.environ["MURO_ENABLED"] = "1"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameAttempt, GameExercise, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import muro, sorteo  # noqa: E402
from game.router import _inicio_del_dia  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


API = "/game/derivemos"
client = TestClient(main.app, raise_server_exceptions=True)

# Un jugador del brazo que TENÍA tope, nacido en el instante del corte: es
# exactamente quien antes chocaba el muro. El id se busca porque el brazo sale
# de un hash.
CON_MURO = None
for i in range(1, 60):
    j = GamePlayer(alias=f"tope{i}", theta=0.0, n_updates=0, exercises_correct=0,
                   exercises_attempted=0, is_bot=False, guest_token=f"tok-tope{i}")
    j.created_at = muro.NACIDO_DESPUES_DE
    db.add(j)
    db.commit()
    if muro.brazo_de(j.id) == "muro":
        CON_MURO = j
        break
assert CON_MURO is not None
TOK = {"X-Game-Token": CON_MURO.guest_token}


def acertar(jugador: GamePlayer, cuantas: int) -> None:
    """Resueltas de hoy, escritas directo en la base."""
    base = _inicio_del_dia() + timedelta(hours=10)
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
            is_correct=True, parse_ok=True,
            created_at=base + timedelta(minutes=k),
        ))
    db.commit()


# ── 1 · El sorteo, que solo lo lee el panel ──────────────────────────────────
print("1. el sorteo sigue siendo determinista (el panel lo reconstruye)")
reparto = [muro.brazo_de(i) for i in range(1, 4001)]
check(1800 <= reparto.count("muro") <= 2200, "reparte parejo sobre 4.000 ids")
check(all(muro.brazo_de(i) == muro.brazo_de(i) for i in range(1, 200)),
      "y es estable: el mismo id da siempre el mismo brazo")
iguales = sum(1 for i in range(1, 2001)
              if (muro.brazo_de(i) == "muro") == (sorteo.brazo_de(i) == "rapido"))
check(850 <= iguales <= 1150,
      f"y no está correlacionado con el brazo de dx-elo-1 ({iguales} de 2.000)")


# ── 2 · El módulo ya no decide nada ──────────────────────────────────────────
print("2. el módulo cerrado")
for viejo in ("habilitado", "tope_de", "participa", "estado", "tiene_pase",
              "ENV_ENCENDIDO", "Muro"):
    check(not hasattr(muro, viejo), f"`muro.{viejo}` ya no existe")


# ── 3 · Nadie tiene tope ─────────────────────────────────────────────────────
print("3. nadie tiene tope, ni en el brazo que lo tenía")

acertar(CON_MURO, muro.TOPE_DIARIO * 7)
r = client.post(f"{API}/next", headers=TOK)
check(r.status_code == 200,
      f"con {muro.TOPE_DIARIO * 7} resueltas hoy /next sirve (dio {r.status_code})")
check("muro" not in r.json(), "y el ejercicio no trae `muro`")
abierto = r.json()["exercise_id"]

r = client.post(f"{API}/skip", json={"exercise_id": abierto}, headers=TOK)
check(r.status_code == 200, f"/skip tampoco corta (dio {r.status_code})")
abierto = r.json()["exercise_id"]

# Una respuesta real, para mirar el cuerpo de /answer.
db.query(GameExercise).filter(GameExercise.player_id == CON_MURO.id).update(
    {"status": "expired"}, synchronize_session=False)
ej = GameExercise(
    player_id=CON_MURO.id, template_key="t1_pow", prompt_latex="x^{2}",
    expected_derivative="2*x", theta_at_serve=0.0, beta_at_serve=-1.0,
    p_hat=0.8, status="served",
)
db.add(ej)
db.commit()
r = client.post(f"{API}/answer", json={"exercise_id": ej.id, "answer_latex": "2x"},
                headers=TOK)
check(r.status_code == 200, f"/answer contesta (dio {r.status_code})")
check("muro" not in r.json(), "y la respuesta no trae `muro`")
check(r.json().get("correct_today", 0) > muro.TOPE_DIARIO,
      "y el contador del día sigue contando de más del viejo tope")

me = client.get(f"{API}/me", headers=TOK).json()
check("muro" not in me, "`/me` no trae `muro`")

r = client.post(f"{API}/next", headers=TOK)
check(r.status_code == 200, f"y sigue jugando después (dio {r.status_code})")


# ── 4 · El panel sabe nombrar el lugar del cartel ────────────────────────────
print("4. lo que el panel necesita del cartel")
from metrics.game_queries import LUGARES_CAFECITO  # noqa: E402
check("muro" in LUGARES_CAFECITO,
      "el panel sabe cómo se llamaba el cartel, para las impresiones viejas")


# ── 5 · La regla de inscripción del panel ────────────────────────────────────
print("5. quién entró al experimento")

from metrics.game_queries import EXPERIMENTO_MURO, _alta_en_el_muro  # noqa: E402

DESDE = muro.ARRANQUE
HASTA = EXPERIMENTO_MURO["hasta"]
T = muro.TOPE_DIARIO

check(EXPERIMENTO_MURO["desde"] >= muro.ARRANQUE,
      "el panel nunca inscribe antes de la fecha que define quién participaba")
cierre = EXPERIMENTO_MURO["cierre"]
check(cierre is not None and not cierre.get("cancelado")
      and cierre["fecha"] == _date(2026, 10, 30) and HASTA == cierre["fecha"],
      "está cerrado el 30/10, y la inscripción cierra ese mismo día")
check("decisión de producto" in cierre["motivo"] and "NO por lo que midió" in cierre["motivo"],
      "y el motivo dice que es una decisión y no una lectura")

justo = {_date(2026, 9, 28): T}
check(_alta_en_el_muro(justo, DESDE, T) == _date(2026, 9, 28),
      f"llegar a {T} exactas inscribe (el brazo con tope no podía pasar de ahí)")
check(_alta_en_el_muro({_date(2026, 9, 28): T - 1}, DESDE, T) is None, f"con {T - 1} no")
check(_alta_en_el_muro({_date(2026, 9, 28): T * 10}, DESDE, T) == _date(2026, 9, 28),
      "y pasarse largo también, que es como entraba el control")
varios = {_date(2026, 9, 30): T * 3, _date(2026, 9, 28): T, _date(2026, 10, 5): T}
check(_alta_en_el_muro(varios, DESDE, T) == _date(2026, 9, 28),
      "con varios días que llegan, entra por el primero")
antes = {_date(2026, 9, 10): T * 5, _date(2026, 9, 20): T * 2}
check(_alta_en_el_muro(antes, DESDE, T) is None,
      "lo anterior al arranque no inscribe a nadie")
check(_alta_en_el_muro({}, DESDE, T) is None, "sin días jugados no entra nadie")
check(_alta_en_el_muro({DESDE: T}, DESDE, T) == DESDE,
      "el día del arranque cuenta (el borde es cerrado)")
# El cierre: lo de después no es el experimento.
check(_alta_en_el_muro({HASTA: T * 3}, DESDE, T, HASTA) is None,
      "el día del cierre ya no inscribe: ese día nadie tenía tope")
check(_alta_en_el_muro({HASTA - timedelta(days=1): T}, DESDE, T, HASTA)
      == HASTA - timedelta(days=1),
      "y el día anterior todavía sí")
check(_alta_en_el_muro({HASTA + timedelta(days=3): T, _date(2026, 10, 10): T},
                       DESDE, T, HASTA) == _date(2026, 10, 10),
      "quien llegó antes y después entra por el de antes")


# ── 6 · El panel: veteranos exentos, y el reloj parado en el cierre ──────────
print("6. el bloque del panel")

from metrics.game_queries import experimento_muro  # noqa: E402

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

check(muro.NACIDO_DESPUES_DE.replace(tzinfo=_tz.utc).astimezone(
          muro._TZ_JUEGO).hour == 0,
      "el corte de quién es nuevo es la medianoche ARGENTINA, no la de UTC")

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
_pay = experimento_muro(_fake)
_b = {x["clave"]: x for x in _pay["brazos"]}
check(_b["muro"]["n"] == 1,
      "de los dos que llegaron al tope, el panel inscribe UNO: el nuevo")
check(_pay["exentos"] == 1, "y cuenta al otro como exento")
check("encendido" not in _pay, "el bloque ya no habla de un interruptor")
check(_pay["cierre"] is not None, "y lleva el cierre, que es lo que dibuja la caja")

# El reloj se para en el cierre: una ventana de 14 días abierta el 20/10 no
# llegó a cerrarse con el tope puesto, así que queda en curso para siempre.
_tarde = datetime(2026, 10, 20, 15, 0, 0)
_fake_tarde = {
    **_fake,
    "players": [{"id": CON_MURO.id, "is_bot": False, "xp": 100,
                 "created_at": muro.NACIDO_DESPUES_DE}],
    "attempts": [{"player_id": CON_MURO.id, "is_correct": True, "created_at": _tarde}
                 for _ in range(T)],
}
_bt = {x["clave"]: x for x in experimento_muro(_fake_tarde)["brazos"]}
check(_bt["muro"]["n"] == 0 and _bt["muro"]["en_curso"] == 1,
      "una ventana que el cierre cortó por la mitad queda en curso, no se lee")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
