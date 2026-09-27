"""Verifica la rampa del teclado y la fila de ayudas (game/rampa.py).

`dx-rampa-1` toca dos cosas delicadas a la vez: **qué teclas tiene alguien para
contestar** y **qué respuestas entran al Elo**. Las dos pueden romperse en
silencio y las dos arruinan el experimento de formas distintas, así que cada
sección de acá existe por un agujero concreto:

  - **la tecla que la respuesta necesita SIEMPRE está.** Es el único invariante
    que hace que una rampa sea una rampa y no una jaula: si alguna derivada
    pidiera un dígito que el teclado no tiene, esa persona queda trabada sin
    salida y el tratamiento pasa de ayudar a expulsar. Se prueba contra las tres
    derivadas fijas del arranque Y contra un barrido de plantillas;

  - **el inventario nunca encoge.** Es acumulativo por definición; si una
    derivada "devolviera" teclas, el teclado parpadearía y el desbloqueo dejaría
    de significar nada;

  - **a los ocho ejercicios está COMPLETO**, pase lo que pase. Es el techo que
    convierte la rampa en algo con fin. Sin esto, una racha de derivadas simples
    dejaría a alguien con cuatro teclas para siempre;

  - **el brazo control no tiene rampa nunca.** Si esto se rompe el experimento
    se queda sin grupo de comparación y no se nota hasta leer el panel;

  - **los tres primeros ejercicios no mueven θ, EN LOS TRES BRAZOS.** Es el
    guardarraíl del confound: la rampa vuelve casi seguras las tres fijas, y si
    movieran θ el brazo tratado entraría al motor con ejercicios más difíciles y
    perdería profundidad por algo que no es el tratamiento. Apagarlo en un solo
    brazo sería *crear* la diferencia, así que se verifica en los tres;

  - **registrarse no pierde el teclado.** La fusión invitado→usuario une las dos
    familias de teclas; uniendo solo las dinámicas, registrarse a mitad de la
    rampa devolvía el teclado a su estado inicial;

  - **el interruptor apaga todo.** Una palanca de activación tiene que poder
    apagarse desde Railway sin deploy.

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
os.environ["RAMPA_ENABLED"] = "1"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import sympy  # noqa: E402

import database  # noqa: E402
from models import Base, GameExercise, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
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


# ── 1 · El sorteo ───────────────────────────────────────────────────────────
print("1. el sorteo")
reparto = {b: 0 for b in rampa.BRAZOS}
for i in range(1, 3001):
    reparto[rampa.brazo_de(i)] += 1
check(all(b in reparto for b in rampa.BRAZOS), "hay cuatro brazos",
      f"({rampa.BRAZOS})")
# El esperado sale de `len(BRAZOS)` y no de una constante: estaba en 1.000 —tres
# brazos— y al sumar el cuarto este chequeo falló por aritmética propia y no por
# un sorteo roto, que es la peor forma de fallar que tiene un chequeo.
#
# La tolerancia sí es fija y holgada a propósito: con 3.000 sorteos el desvío de
# un multinomial uniforme está entre 24 y 26 según cuántos brazos haya, así que
# 50 son casi dos desvíos. Lo que esto atrapa es un hash que agrupe, no el azar.
ESPERADO = 3000 // len(rampa.BRAZOS)
check(all(abs(v - ESPERADO) < 50 for v in reparto.values()),
      f"y reparte parejo (~{ESPERADO} por brazo)", f"({reparto})")
check(all(rampa.brazo_de(7) == rampa.brazo_de(7) for _ in range(5)),
      "el mismo id da siempre el mismo brazo")
check(rampa.con_rampa is not None
      and all(rampa.con_rampa(i) == (rampa.brazo_de(i) in ("teclado", "ayudas", "bienvenida"))
              for i in range(1, 200)),
      "los TRES brazos tratados tienen rampa: cada escalón es el anterior más algo")
check(all(rampa.con_ayudas(i) == (rampa.brazo_de(i) in ("ayudas", "bienvenida"))
          for i in range(1, 200)),
      "y la fila de botones la tienen `ayudas` y el escalón de arriba")


# ── 2 · Un jugador de cada brazo ────────────────────────────────────────────
def nuevo(prefijo: str, brazo_buscado: str) -> GamePlayer:
    """Un jugador del brazo pedido. El id se busca en vez de fijarse: el hash
    lleva el nombre del experimento adentro, así que renombrarlo re-sortea a
    todo el mundo y un id escrito a mano dejaría este archivo verde midiendo el
    brazo equivocado."""
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


print("\n2. el brazo viaja al cliente")
for brazo in rampa.BRAZOS:
    me = client.get(f"{API}/me", headers=H[brazo]).json()
    check(me.get("rampa") == brazo, f"`{brazo}` se anuncia en el jugador",
          f'(dio {me.get("rampa")!r})')


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


pasos = recorrer("teclado", rampa.SIN_ELO_HASTA + 6)
tam = [len(e["fijas"] or []) for e in pasos]
print(f"     fijas por ejercicio: {tam}")
check(pasos[0]["fijas"] is not None, "el brazo tratado recibe la lista de fijas")
check(len(pasos[0]["fijas"]) <= 3,
      "el primer ejercicio arranca con muy pocas teclas",
      f'({pasos[0]["fijas"]})')
check(all(b >= a for a, b in zip(tam, tam[1:])), "el inventario nunca encoge",
      f"({tam})")
check(tam[-1] == len(kb.FIJAS_ORDER),
      f"a los {kb.RAMPA_COMPLETA_EN} ejercicios está completo", f"({tam[-1]} de {len(kb.FIJAS_ORDER)})")
check(all(set(e["fijas_nuevas"]).issubset(e["fijas"] or []) for e in pasos),
      "`fijas_nuevas` siempre es subconjunto de `fijas`")


# ── 4 · El invariante que hace que sea una rampa y no una jaula ─────────────
print("\n4. nunca falta la tecla que la respuesta necesita")
faltantes = []
for e in pasos:
    fila = db.query(GameExercise).filter(
        GameExercise.id == e["exercise_id"]).first()
    pide = kb.fijas_requeridas(sympy.sympify(fila.expected_derivative))
    falta = pide - set(e["fijas"] or [])
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
        col, _din, _fij = kb.unlock(col, der, rampa=True, n_servidos=n)
        falta = kb.fijas_requeridas(der) - kb.parse_fijas(col)
        if falta:
            sin_cubrir.append((template.key, str(der), sorted(falta)))
check(not sin_cubrir, f"y en un barrido de las {len(TEMPLATES)} plantillas",
      f"({sin_cubrir[:3]})")


# ── 5 · El control no tiene rampa ───────────────────────────────────────────
print("\n5. el brazo control")
ctrl = recorrer("control", 3)
check(all(e["fijas"] is None for e in ctrl),
      "no recibe lista de fijas: el teclado le sale completo")
check(all(not e["fijas_nuevas"] for e in ctrl),
      "y nunca se le anuncia una fija nueva")
fila_ctrl = db.query(GamePlayer).filter(
    GamePlayer.id == JUGADORES["control"].id).first()
db.expire(fila_ctrl)
check(not kb.parse_fijas(fila_ctrl.unlocked_keys),
      "ni se le escriben fijas en la columna", f"({fila_ctrl.unlocked_keys})")


# ── 6 · El Elo de la rampa, en LOS TRES brazos ─────────────────────────────
print(f"\n6. los {rampa.SIN_ELO_HASTA} primeros no mueven θ, en los tres brazos")
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
    for _ in range(rampa.SIN_ELO_HASTA):
        responder_forzado(j.id, h)
    db.expire_all()
    fila_j = db.query(GamePlayer).filter(GamePlayer.id == j.id).first()
    check(fila_j.theta == 0.0 and fila_j.n_updates == 0,
          f"`{brazo}`: theta sigue en cero tras la rampa",
          f"(theta={fila_j.theta}, n={fila_j.n_updates})")
    check(fila_j.exercises_attempted == rampa.SIN_ELO_HASTA,
          f"`{brazo}`: pero el contador de ejercicios SI avanzo",
          f"({fila_j.exercises_attempted})")
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


# ── 8 · El interruptor ─────────────────────────────────────────────────────
print("\n8. el interruptor")
os.environ["RAMPA_ENABLED"] = "0"
try:
    check(not rampa.habilitado(), "`RAMPA_ENABLED=0` apaga el experimento")
    check(not any(rampa.con_rampa(i) for i in range(1, 200)),
          "y con eso NADIE tiene rampa, en ningún brazo")
    check(not rampa.sin_elo(1),
          "y los tres primeros vuelven a entrar al Elo")
    apagado = recorrer("ayudas", 1)
    check(apagado[0]["fijas"] is None,
          "el ejercicio sale con el teclado completo")
    me = client.get(f"{API}/me", headers=H["ayudas"]).json()
    check(me.get("rampa") is None, "y el jugador no anuncia brazo")
finally:
    os.environ["RAMPA_ENABLED"] = "1"
check(rampa.habilitado(), "y volver a prenderlo lo revive, sin reiniciar nada")
# Lo que YA se había ganado no se pierde cuando el experimento se apaga: la
# columna conserva las fijas aunque deje de crecer.
col, _d, _f = kb.unlock("f:1,f:2", 2 * X, rampa=False)
check(kb.parse_fijas(col) == {"f:1", "f:2"},
      "y apagado, lo ya desbloqueado se conserva", f"({kb.parse_fijas(col)})")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
