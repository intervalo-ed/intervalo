"""Verifica la rampa del teclado, que es de todos desde que `dx-rampa-1` se
cerró (30/10/2026, ver game/rampa.py).

El experimento se cerró por decisión de producto con el brazo de arriba de la
escalera —rampa + ayudas + arranque— como juego para todo el mundo. Lo que este
chequeo cuida ahora son las invariantes de ESE juego, y cada sección existe por
un agujero concreto:

  - **la tecla que la respuesta necesita SIEMPRE está.** Es el único invariante
    que hace que una rampa sea una rampa y no una jaula: si alguna derivada
    pidiera un dígito que el teclado no tiene, esa persona queda trabada sin
    salida. Se prueba contra el recorrido real Y contra un barrido de
    plantillas;

  - **el inventario nunca encoge, y a los ocho ejercicios está COMPLETO**,
    pase lo que pase. Es el techo que convierte la rampa en algo con fin;

  - **todos tienen rampa, sea cual sea su hash**, y `fijas` viaja SIEMPRE como
    lista: el cliente ya no tiene un caso «teclado completo» que adivinar;

  - **el veterano que nunca tuvo rampa no pierde teclas.** Quien jugó en el
    brazo control tiene la columna sin fijas; achicarle el teclado al cerrar el
    experimento sería quitarle lo que usaba ayer. Recibe el bloque entero en su
    próximo ejercicio, y sin festejarlo como nuevo;

  - **los tres primeros ejercicios no mueven θ**, para todos (elo.py ::
    SIN_ELO_HASTA): son ítems de calibración que la rampa vuelve casi seguros;

  - **registrarse no pierde el teclado.** La fusión invitado→usuario une las dos
    familias de teclas;

  - **no queda interruptor ni brazo a la vista.** `RAMPA_ENABLED` ya no apaga
    nada y el jugador no anuncia brazo.

Uso:
    python backend/scripts/check_game_rampa.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_rampa.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import sympy  # noqa: E402

import database  # noqa: E402
from models import Base, GameExercise, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import elo  # noqa: E402
from game import keyboard as kb  # noqa: E402
from game import rampa  # noqa: E402
from game.cycler import CyclingRandom  # noqa: E402
from game.templates import TEMPLATES  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str, extra: str = "") -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}{(' ' + extra) if extra else ''}")
    if not condition:
        FAILURES.append(label)


API = "/game/derivemos"
client = TestClient(main.app, raise_server_exceptions=True)
X = sympy.Symbol("x")


# ── 1 · El sorteo, que solo lo lee el panel ─────────────────────────────────
print("1. el sorteo sigue siendo determinista (el panel lo reconstruye)")
check(all(rampa.brazo_de(7) == rampa.brazo_de(7) for _ in range(5)),
      "el mismo id da siempre el mismo brazo")
check(set(rampa.brazo_de(i) for i in range(1, 400)) == set(rampa.BRAZOS),
      "y usa los cuatro brazos declarados", f"({rampa.BRAZOS})")
for viejo in ("habilitado", "con_rampa", "con_ayudas", "muestra_digest", "sin_elo",
              "SIN_ELO_HASTA"):
    check(not hasattr(rampa, viejo), f"`rampa.{viejo}` ya no existe")


# ── 2 · Un jugador de cada brazo VIEJO ──────────────────────────────────────
def nuevo(prefijo: str, brazo_buscado: str) -> GamePlayer:
    """Un jugador al que el hash habría puesto en `brazo_buscado`. Se busca uno
    por brazo viejo justamente para probar que el brazo ya no decide nada."""
    for i in range(1, 400):
        tok = f"tok-{prefijo}{i}"
        if db.query(GamePlayer).filter(GamePlayer.guest_token == tok).first():
            continue
        j = GamePlayer(alias=f"{prefijo}{i}", theta=0.0, n_updates=0,
                       exercises_correct=0, exercises_attempted=0, is_bot=False,
                       guest_token=tok, platform="android")
        db.add(j)
        db.commit()
        if rampa.brazo_de(j.id) == brazo_buscado:
            return j
    raise SystemExit(f"no se encontró un jugador del brazo {brazo_buscado}")


JUGADORES = {b: nuevo(b[:4], b) for b in rampa.BRAZOS}
H = {b: {"X-Game-Token": j.guest_token} for b, j in JUGADORES.items()}


print("\n2. el jugador ya no anuncia brazo")
for brazo in rampa.BRAZOS:
    me = client.get(f"{API}/me", headers=H[brazo]).json()
    check("rampa" not in me, f"`{brazo}`: `/me` no trae `rampa`",
          f'(trae {me.get("rampa")!r})')


# ── 3 · La rampa, ejercicio por ejercicio ───────────────────────────────────
print("\n3. la rampa crece y nunca encoge")


def recorrer(brazo: str, pasos: int) -> list[dict]:
    """`pasos` ejercicios servidos y cerrados, devolviendo cada payload.

    El ejercicio se cierra A MANO en vez de responderlo por la API. Lo que la
    rampa mira es `exercises_attempted` —el k-ésimo ejercicio de esta persona—
    y no si acertó, así que mandar una respuesta de verdad obligaría a construir
    el MathJSON de cada derivada generada para probar algo que no depende de
    eso. El Elo, que sí depende de la respuesta, se prueba aparte (sección 6)
    con un ejercicio forzado de derivada conocida.
    """
    salida = []
    for _ in range(pasos):
        ex = client.post(f"{API}/next", headers=H[brazo]).json()
        salida.append(ex)
        db.query(GameExercise).filter(
            GameExercise.id == ex["exercise_id"]).update({"status": "answered"})
        db.query(GamePlayer).filter(
            GamePlayer.guest_token == H[brazo]["X-Game-Token"]).update(
                {"exercises_attempted": GamePlayer.exercises_attempted + 1})
        db.commit()
    return salida


pasos = recorrer("teclado", elo.SIN_ELO_HASTA + 6)
tam = [len(e["fijas"]) for e in pasos]
print(f"     fijas por ejercicio: {tam}")
check(all(isinstance(e["fijas"], list) for e in pasos),
      "`fijas` viaja siempre como lista")
check(len(pasos[0]["fijas"]) <= 3,
      "el primer ejercicio arranca con muy pocas teclas",
      f'({pasos[0]["fijas"]})')
check(all(b >= a for a, b in zip(tam, tam[1:])), "el inventario nunca encoge",
      f"({tam})")
check(tam[-1] == len(kb.FIJAS_ORDER),
      f"a los {kb.RAMPA_COMPLETA_EN} ejercicios está completo", f"({tam[-1]} de {len(kb.FIJAS_ORDER)})")
check(all(set(e["fijas_nuevas"]).issubset(e["fijas"]) for e in pasos),
      "`fijas_nuevas` siempre es subconjunto de `fijas`")


# ── 4 · El invariante que hace que sea una rampa y no una jaula ─────────────
print("\n4. nunca falta la tecla que la respuesta necesita")
faltantes = []
for e in pasos:
    fila = db.query(GameExercise).filter(
        GameExercise.id == e["exercise_id"]).first()
    pide = kb.fijas_requeridas(sympy.sympify(fila.expected_derivative))
    falta = pide - set(e["fijas"])
    if falta:
        faltantes.append((fila.expected_derivative, sorted(falta)))
check(not faltantes, "en el recorrido real", f"({faltantes[:3]})")

# Y contra un barrido de TODAS las plantillas, que es lo que cubre las que el
# recorrido de arriba no llegó a servir.
import random  # noqa: E402

rng = random.Random(7)
sin_cubrir = []
for template in TEMPLATES:
    col = ""
    for n in range(1, 9):
        der = sympy.diff(template.build(CyclingRandom(rng, {})).f, X)
        col, _din, _fij = kb.unlock(col, der, n_servidos=n)
        falta = kb.fijas_requeridas(der) - kb.parse_fijas(col)
        if falta:
            sin_cubrir.append((template.key, str(der), sorted(falta)))
check(not sin_cubrir, f"y en un barrido de las {len(TEMPLATES)} plantillas",
      f"({sin_cubrir[:3]})")


# ── 5 · Todos tienen rampa, y el veterano no pierde teclas ──────────────────
print("\n5. todos tienen rampa, sea cual sea su hash")
for brazo in ("control", "ayudas", "bienvenida"):
    primeros = recorrer(brazo, 1)
    check(isinstance(primeros[0]["fijas"], list) and len(primeros[0]["fijas"]) <= 3,
          f"`{brazo}`: el primer ejercicio sale con el teclado en rampa",
          f'({primeros[0]["fijas"]})')


def veterano(alias: str, respondidas: int, columna: str) -> dict:
    """Un jugador de los que jugaron SIN rampa, y lo primero que le sirve /next."""
    j = GamePlayer(alias=alias, theta=0.0, n_updates=0, exercises_correct=0,
                   exercises_attempted=respondidas, is_bot=False,
                   guest_token=f"tok-{alias}", platform="android",
                   unlocked_keys=columna)
    db.add(j)
    db.commit()
    return client.post(f"{API}/next", headers={"X-Game-Token": j.guest_token}).json()


print("\n5b. el que jugó sin rampa recibe el bloque entero, sin festejo")
for alias, respondidas in (("vetlargo", 40), ("vetcorto", 2)):
    ex = veterano(alias, respondidas, "pow,sq")
    check(ex["fijas"] == list(kb.FIJAS_ORDER),
          f"con {respondidas} respondidas: el bloque fijo completo de una",
          f'({len(ex["fijas"])} de {len(kb.FIJAS_ORDER)})')
    check(ex["fijas_nuevas"] == [],
          f"con {respondidas} respondidas: y no se anuncia como nuevo",
          f'({ex["fijas_nuevas"]})')
    fila_v = db.query(GamePlayer).filter(GamePlayer.alias == alias).first()
    db.refresh(fila_v)
    check(kb.parse_fijas(fila_v.unlocked_keys) == set(kb.FIJAS_ORDER),
          f"con {respondidas} respondidas: y queda escrito en la columna")
    check({"pow", "sq"} <= kb.parse_unlocked(fila_v.unlocked_keys),
          f"con {respondidas} respondidas: sin perder las dinámicas que tenía")

# El que todavía no respondió nada no es veterano de nada: arranca la rampa.
recien = veterano("vetcero", 0, "")
check(len(recien["fijas"]) <= 3,
      "quien no respondió nada todavía arranca la rampa desde abajo",
      f'({recien["fijas"]})')
# Y la otra cara: la regla del veterano no le roba la rampa a nadie, porque
# desde el primer ejercicio la columna ya tiene alguna fija.
col1, _d, _f = kb.unlock("", X, n_servidos=1)
check(kb.parse_fijas(col1), "con rampa, la columna tiene fijas desde el primero",
      f"({col1})")
col2, _d, _f = kb.unlock(col1, 2 * X, n_servidos=2)
check(len(kb.parse_fijas(col2)) < len(kb.FIJAS_ORDER),
      "así que el segundo sigue en rampa y no salta al bloque entero",
      f"({col2})")


# ── 6 · El Elo de la rampa, en LOS TRES brazos ─────────────────────────────
print(f"\n6. los {elo.SIN_ELO_HASTA} primeros no mueven θ, para todos")
def responder_forzado(pid: int, headers: dict) -> None:
    """Sirve un ejercicio de derivada CONOCIDA y lo responde bien de verdad.

    Forzado y no generado porque acá sí hace falta que `/answer` acepte: lo que
    se prueba es el Elo, y el Elo solo se mueve con una respuesta real.
    """
    db.query(GameExercise).filter(GameExercise.player_id == pid).update(
        {"status": "expired"}, synchronize_session=False)
    ej = GameExercise(
        player_id=pid, template_key="t2_sum2", prompt_latex="x^{2}+x",
        expected_derivative="2*x + 1", common_errors_json="[]",
        theta_at_serve=0.0, beta_at_serve=-1.0, p_hat=0.75, status="served")
    db.add(ej)
    db.commit()
    client.post(f"{API}/answer", headers=headers, json={
        "exercise_id": ej.id, "answer_latex": "2x+1",
        "answer_mathjson": ["Add", ["Multiply", 2, "x"], 1]})


for brazo in rampa.BRAZOS:
    j = nuevo(f"elo{brazo[:3]}", brazo)
    h = {"X-Game-Token": j.guest_token}
    for _ in range(elo.SIN_ELO_HASTA):
        responder_forzado(j.id, h)
    db.expire_all()
    fila_j = db.query(GamePlayer).filter(GamePlayer.id == j.id).first()
    check(fila_j.theta == 0.0 and fila_j.n_updates == 0,
          f"`{brazo}`: theta sigue en cero tras la rampa",
          f"(theta={fila_j.theta}, n={fila_j.n_updates})")
    check(fila_j.exercises_attempted == elo.SIN_ELO_HASTA,
          f"`{brazo}`: pero el contador de ejercicios SI avanzo",
          f"({fila_j.exercises_attempted})")
    # Y la consecuencia, que es la que faltaba y por eso el bug entro sin que
    # nada se pusiera en rojo: el tope de tier tiene que haber avanzado con las
    # respuestas y no con theta. Leyendo `n_updates` —que es lo que hacia el
    # generador— el tope queda en 0 con tres derivadas contestadas, y la rampa
    # pasa de cinco ejercicios a ocho sin que nadie lo decida.
    check(elo.max_tier_de(fila_j.exercises_attempted) == elo.SIN_ELO_HASTA
          and elo.max_tier_de(fila_j.n_updates) == 0,
          f"`{brazo}`: y el tope de tier avanzo con el, no con theta",
          f"(tope={elo.max_tier_de(fila_j.exercises_attempted)}, "
          f"si mirara theta seria {elo.max_tier_de(fila_j.n_updates)})")
    # Y el siguiente sí lo mueve: si no, la rampa nunca terminaría.
    responder_forzado(j.id, h)
    db.expire_all()
    fila_j = db.query(GamePlayer).filter(GamePlayer.id == j.id).first()
    check(fila_j.n_updates == 1,
          f"`{brazo}`: y el siguiente SI entra al Elo", f"(n={fila_j.n_updates})")


# ── 7 · Registrarse no pierde el teclado ───────────────────────────────────
print("\n7. la fusión invitado→usuario")
mezcla = kb.serialize(
    kb.parse_unlocked("pow,sq") | kb.parse_fijas("f:1,f:2,f:x")
    | kb.parse_unlocked("ln") | kb.parse_fijas("f:3"))
check(kb.parse_unlocked(mezcla) == {"pow", "sq", "ln"},
      "une las dinámicas de los dos", f"({sorted(kb.parse_unlocked(mezcla))})")
check(kb.parse_fijas(mezcla) == {"f:1", "f:2", "f:3", "f:x"},
      "y las fijas de los dos", f"({sorted(kb.parse_fijas(mezcla))})")


# ── 8 · Ya no hay interruptor ──────────────────────────────────────────────
print("\n8. `RAMPA_ENABLED` ya no apaga nada")
os.environ["RAMPA_ENABLED"] = "0"
try:
    check(elo.sin_elo(1), "los tres primeros siguen fuera del Elo")
    otro = recorrer("ayudas", 1)
    check(isinstance(otro[0]["fijas"], list), "y el ejercicio sigue trayendo sus fijas")
finally:
    os.environ.pop("RAMPA_ENABLED", None)

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
