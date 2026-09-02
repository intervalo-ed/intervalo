"""Verifica el «¿Por qué?» del juego: game/explain.py y POST /explain.

Lo que más vale de este check es la primera parte, y es aburrida a propósito:
construir la explicación de las 29 plantillas con muchas semillas. Los
ejercicios del juego se generan al azar, así que la forma de romper esto no es
un caso de borde raro sino la combinación de parámetros que nadie miró — un
`KeyError` de una rama que el catálogo de reglas no conoce, o una plantilla
nueva sin forma asignada.

Lo segundo que vale: que la cuenta final de la explicación sea NUMÉRICAMENTE la
misma derivada que el validador toma por buena. Es una comparación fácil de
saltear y sin ella la explicación puede terminar en algo distinto de lo que el
juego corrige, o sea contándole a la persona una respuesta que le va a marcar
mal. Se compara evaluando y no por string a propósito: la regla del cociente
escribe $(u'v - uv')/v^2$ y sympy la reparte como suma; son la misma función y
tienen que poder escribirse distinto.

Y después el endpoint: el candado de los intentos, la marca que le baja la
recompensa, y que leerlo dos veces no cobre dos veces.

Uso:
    python backend/scripts/check_game_explain.py

Sale con código 1 si algo falla.
"""

import json
import math
import os
import random
import re
import sys
import tempfile
from datetime import datetime
from pathlib import Path

# La consola de Windows abre en cp1252 y este check imprime LaTeX con acentos.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_explain.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameAttempt, GameExercise, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import sympy  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
from game import explain as game_explain  # noqa: E402
from game import xp as game_xp  # noqa: E402
from game.cycler import CyclingRandom  # noqa: E402
from game.templates import TEMPLATES, latex_es, x  # noqa: E402
from game.validator import expr_from_stored, numerically_equivalent  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


class _Falso:
    """Un ejercicio sin base de datos: lo único que `build` mira son estos
    cuatro campos, y armarlos a mano deja recorrer las 29 plantillas por 20
    semillas sin escribir 520 filas."""

    def __init__(self, template, seed):
        g = template.build(CyclingRandom(random.Random(seed), {}))
        self.template_key = template.key
        self.params_json = json.dumps({"f": str(g.f)})
        self.prompt_latex = g.prompt_latex or latex_es(g.f)
        self.expected_derivative = str(sympy.diff(g.f, x))


SEMILLAS = range(20)
FORMULA_DISPLAY = re.compile(r"\$\$.*?\$\$", re.S)

print("\ncatálogo")
check(game_explain.plantillas_sin_forma() == [], "las 29 plantillas tienen forma asignada")
check(len(game_explain.REGLAS) == 14, f"hay 14 reglas ({len(game_explain.REGLAS)})")
check(
    all(r.imagen.strip() for r in game_explain.REGLAS.values()),
    "ninguna regla quedó sin imagen escrita",
)

print("\nconstrucción (29 plantillas × 20 semillas)")
explicaciones: dict[str, str] = {}
resultados: dict[str, game_explain.Explanation] = {}
rotas: list[str] = []
sin_imagen: list[str] = []
graficos_mal: list[str] = []
latex_mal: list[str] = []
for t in TEMPLATES:
    for s in SEMILLAS:
        falso = _Falso(t, s)
        try:
            resultado = game_explain.build(falso)
        except Exception as exc:  # noqa: BLE001 — el punto del check es cazarlas
            rotas.append(f"{t.key}/{s}: {type(exc).__name__} {exc}")
            continue
        txt = resultado.text
        explicaciones.setdefault(t.key, txt)
        resultados.setdefault(t.key, resultado)
        # Una explicación sin una sola imagen es la señal de que `_reglas_de`
        # no reconoció la forma: la cuenta sale igual y no se nota mirando.
        if not any(r.imagen in txt for r in game_explain.REGLAS.values()):
            sin_imagen.append(f"{t.key}/{s}")

        # El gráfico: graph_fn/graph_fn2 tienen que ser la MISMA f y la misma
        # derivada que el validador toma por buena — evaluadas y no comparadas
        # por string, mismo criterio que la sección "la cuenta cierra" de acá
        # abajo (el cociente imprime distinto de cómo lo guarda sympy.diff).
        try:
            f_esperada = expr_from_stored(json.loads(falso.params_json)["f"])
            fp_esperada = expr_from_stored(falso.expected_derivative)
            coincide_f = numerically_equivalent(f_esperada, expr_from_stored(resultado.graph_fn))
            coincide_fp = numerically_equivalent(
                fp_esperada, expr_from_stored(resultado.graph_fn2)
            )
        except Exception as exc:  # noqa: BLE001
            graficos_mal.append(f"{t.key}/{s}: {type(exc).__name__} {exc}")
        else:
            if not (coincide_f and coincide_fp):
                graficos_mal.append(f"{t.key}/{s}: graph_fn/graph_fn2 no son f y f'")
        x_lo, x_hi, y_lo, y_hi = resultado.graph_view
        if not (
            all(math.isfinite(v) for v in resultado.graph_view) and x_lo < x_hi and y_lo < y_hi
        ):
            graficos_mal.append(f"{t.key}/{s}: graph_view inválida {resultado.graph_view}")

        # graph_fn_latex/graph_fn2_latex son la misma f y f' de arriba, solo
        # para la leyenda del gráfico: no hace falta reparsearlas (ya se
        # comprobó que graph_fn/graph_fn2 son correctas), alcanza con que
        # `latex_es` no haya devuelto algo roto o vacío.
        if not resultado.graph_fn_latex or "None" in resultado.graph_fn_latex:
            latex_mal.append(f"{t.key}/{s}: graph_fn_latex sospechosa ({resultado.graph_fn_latex!r})")
        if not resultado.graph_fn2_latex or "None" in resultado.graph_fn2_latex:
            latex_mal.append(f"{t.key}/{s}: graph_fn2_latex sospechosa ({resultado.graph_fn2_latex!r})")

check(not rotas, f"ninguna explota ({'; '.join(rotas[:3])})")
check(not sin_imagen, f"todas explican al menos una regla ({sin_imagen[:3]})")
check(
    len(explicaciones) == len(TEMPLATES),
    f"salió una explicación por plantilla ({len(explicaciones)}/{len(TEMPLATES)})",
)

print("\ngráfico (graph_fn/graph_fn2/graph_view)")
check(not graficos_mal, f"graph_fn es f y graph_fn2 es f', y graph_view es válida ({graficos_mal[:3]})")
check(not latex_mal, f"graph_fn_latex/graph_fn2_latex de la leyenda son texto válido ({latex_mal[:3]})")

print("\nla cuenta cierra")
desviadas: list[str] = []
for t in TEMPLATES:
    for s in SEMILLAS:
        falso = _Falso(t, s)
        # No se re-parsea el LaTeX de la explicación: eso probaría el parser de
        # LaTeX y no esto. Se rearma la expresión por el MISMO camino que
        # `build` —la regla, no `sympy.diff` sobre f— y se compara contra
        # `expected_derivative`, que es la que corrige de verdad.
        f = expr_from_stored(json.loads(falso.params_json)["f"])
        forma = game_explain.FORMA_POR_PLANTILLA[t.key]
        if forma == "producto":
            factores = f.as_ordered_factors()
            u, v = factores[0], sympy.Mul(*factores[1:])
            resultado = sympy.diff(u, x) * v + u * sympy.diff(v, x)
        elif forma == "cociente":
            u, v = f.as_numer_denom()
            resultado = (sympy.diff(u, x) * v - u * sympy.diff(v, x)) / v**2
        else:
            resultado = sympy.diff(f, x)
        if not numerically_equivalent(expr_from_stored(falso.expected_derivative), resultado):
            desviadas.append(f"{t.key}/{s}")
check(not desviadas, f"la cuenta es la derivada que el juego corrige ({desviadas[:3]})")

print("\nlos casos donde sympy miente")
loga = explicaciones["t3_loga"]
check(
    game_explain.REGLAS["loga"].imagen in loga,
    "t3_loga se explica como logaritmo",
)
check(
    game_explain.REGLAS["cociente"].imagen not in loga,
    "t3_loga NO se explica como cociente (sympy lo guarda como log(x)/log(a))",
)
check(r"\log_" in loga, "el enunciado de t3_loga conserva la notación log_a")

print("\nformato del banco")
uno = explicaciones["t4_pow_sin"]
check(uno.count("$$") % 2 == 0, "los bloques $$ cierran de a pares")
check("\n\n\n" not in uno, "no quedan renglones en blanco de más")
check(not uno.endswith("\n") and not uno.startswith("\n"), "sin saltos sueltos en las puntas")
check(
    all("\n\n$$" not in t and "$$\n\n" not in t for t in explicaciones.values()),
    "los $$ van pegados con un solo salto, como en el banco",
)
check(
    all("\\sin" not in t for t in explicaciones.values()),
    "el seno se escribe `sen` en todas (latex_es)",
)
check(
    all(t.startswith("$$") for t in explicaciones.values()),
    "arrancan directo en la fórmula, sin '\"Lo que hay que derivar\"'",
)
check(
    all("Por lo tanto:" in t and "Juntando todo" not in t for t in explicaciones.values()),
    "cierran con 'Por lo tanto:' y no con la fórmula vieja",
)

print("\nlargo de párrafo (authoring-context.md: ≤200 por tramo de prosa entre $$)")
# authoring-context.md, sección "Cómo se miden los límites de párrafo cuando
# hay una fórmula centrada en el medio": el límite es por CADA TRAMO DE PROSA
# ENTRE BLOQUES $$...$$, no por el párrafo completo. Partir directo por "\n\n"
# no alcanza: acá un solo `\n` separa un párrafo de prosa de la fórmula que le
# sigue, así que dos párrafos reales pueden quedar unidos en el mismo split de
# "\n\n" si entre medio no hay otro doble salto (ver "potencia"/"producto",
# partidas en dos con un `\n\n` interno pero cada mitad pegada a un bloque
# `$$...$$` con `\n` simple).
largos: list[str] = []
for key, t in explicaciones.items():
    marcado = FORMULA_DISPLAY.sub("\x00", t)
    for tramo in marcado.split("\x00"):
        for parrafo in tramo.split("\n\n"):
            parrafo = parrafo.strip()
            if len(parrafo) > 200:
                largos.append(f"{key} ({len(parrafo)} car.): {parrafo[:60]}…")
check(not largos, f"ningún párrafo de prosa pasa los 200 caracteres ({largos[:3]})")

print("\nrepetición")
check(
    uno.count(game_explain.REGLAS["potencia"].imagen) == 1,
    "una regla que aparece dos veces se explica una sola",
)

print("\nXP")
check(game_xp.xp_for_answer(1, True, 0.5, 1)[0] > 0, "el primer intento paga")
check(game_xp.xp_for_answer(2, True, 0.5, 0) == (8, 0), "el segundo intento paga 8")
check(
    game_xp.xp_for_answer(3, True, 0.5, 0) == (game_xp.XP_INSISTIENDO, 0),
    f"del tercero en adelante paga {game_xp.XP_INSISTIENDO}",
)
check(
    game_xp.xp_for_answer(9, True, 0.5, 0) == (game_xp.XP_INSISTIENDO, 0),
    "y sigue pagando lo mismo por más que insista",
)
check(
    all(
        game_xp.xp_for_answer(n, True, 0.5, 5, explained=True) == (game_xp.XP_EXPLICADO, 0)
        for n in (1, 2, 3, 40)
    ),
    f"haber leído el ¿Por qué? deja el acierto en {game_xp.XP_EXPLICADO}, sea cual sea el intento",
)
check(
    game_xp.xp_for_answer(2, True, 0.5, 0, peeked=True, explained=True)[0]
    == game_xp.XP_EXPLICADO,
    "con tabla Y explicación gana la más barata de las dos",
)
check(game_xp.xp_for_answer(1, False, 0.5, 0) == (0, 0), "errar no paga nada")
check(
    game_xp.xp_for_answer(1, True, 0.5, 5, explained=True)[1] == 0,
    "el bonus de combo no se cobra habiendo leído",
)

# ── El endpoint ─────────────────────────────────────────────────────────────
print("\nPOST /explain")
client = TestClient(main.app, raise_server_exceptions=True)
r = client.post("/game/derivemos/player", json={})
TOKEN = r.json()["guest_token"]
H = {"X-Game-Token": TOKEN}
jugador = db.query(GamePlayer).filter(GamePlayer.guest_token == TOKEN).first()


def sembrar(intentos: int, status: str = "served") -> GameExercise:
    """Un ejercicio de la plantilla del producto con `intentos` respuestas ya
    parseadas y erradas."""
    g = TEMPLATES[16].build(CyclingRandom(random.Random(3), {}))  # t4_pow_sin
    e = GameExercise(
        player_id=jugador.id,
        template_key="t4_pow_sin",
        params_json=json.dumps({"f": str(g.f)}),
        prompt_latex=latex_es(g.f),
        expected_derivative=str(sympy.diff(g.f, x)),
        common_errors_json="[]",
        theta_at_serve=0.0,
        beta_at_serve=0.0,
        p_hat=0.5,
        status=status,
        created_at=datetime.utcnow(),
    )
    db.add(e)
    db.flush()
    for n in range(1, intentos + 1):
        db.add(GameAttempt(
            exercise_id=e.id, player_id=jugador.id, attempt_number=n,
            answer_latex="x", answer_parsed="x", parse_ok=True, is_correct=False,
            xp_awarded=0, created_at=datetime.utcnow(),
        ))
    db.commit()
    return e


virgen = sembrar(0)
r = client.post("/game/derivemos/explain", json={"exercise_id": virgen.id}, headers=H)
check(r.status_code == 409, f"sin ningún intento devuelve 409 (dio {r.status_code})")

# Un intento que el parser NO entendió tampoco habilita: escribir cualquier cosa
# no es haber intentado, y es la puerta de atrás obvia a un endpoint que regala
# la respuesta.
sucio = sembrar(0)
db.add(GameAttempt(
    exercise_id=sucio.id, player_id=jugador.id, attempt_number=0,
    answer_latex="((", answer_parsed=None, parse_ok=False, is_correct=False,
    xp_awarded=0, created_at=datetime.utcnow(),
))
db.commit()
r = client.post("/game/derivemos/explain", json={"exercise_id": sucio.id}, headers=H)
check(r.status_code == 409, "un intento que no parseó tampoco lo desbloquea")

abierto = sembrar(1)
r = client.post("/game/derivemos/explain", json={"exercise_id": abierto.id}, headers=H)
check(r.status_code == 200, f"con un intento errado devuelve la explicación ({r.status_code})")
cuerpo = r.json()
check(len(cuerpo["explanation"]) > 200, "la explicación tiene cuerpo")
check(cuerpo["costs_xp"] is True, "con el ejercicio abierto, avisa que cuesta")
check(bool(cuerpo["graph_fn"]) and bool(cuerpo["graph_fn2"]), "el endpoint también manda el gráfico")
check(
    len(cuerpo["graph_view"]) == 4 and all(math.isfinite(v) for v in cuerpo["graph_view"]),
    f"graph_view viaja como 4 números finitos ({cuerpo['graph_view']})",
)
db.refresh(abierto)
check(abierto.explained is True, "queda marcado en el ejercicio")

r2 = client.post("/game/derivemos/explain", json={"exercise_id": abierto.id}, headers=H)
check(r2.status_code == 200, "se puede volver a leer")
check(r2.json()["costs_xp"] is False, "pero la segunda lectura ya no cobra")

cerrado = sembrar(1, status="answered")
r = client.post("/game/derivemos/explain", json={"exercise_id": cerrado.id}, headers=H)
check(r.status_code == 200, "un ejercicio ya acertado también se puede explicar")
check(r.json()["costs_xp"] is False, "y ahí no cuesta nada: no queda XP que cobrar")
db.refresh(cerrado)
check(cerrado.explained is False, "y no se lo marca — ya no cambia ninguna recompensa")

otro = client.post("/game/derivemos/player", json={}).json()["guest_token"]
r = client.post(
    "/game/derivemos/explain",
    json={"exercise_id": abierto.id},
    headers={"X-Game-Token": otro},
)
check(r.status_code == 404, "el ejercicio de otro jugador no se explica")

# ── Intentos ilimitados ─────────────────────────────────────────────────────
# Jugador nuevo y no el de arriba: aquel tiene ejercicios sembrados a mano en
# estado "served", y /next devuelve el que ya estaba abierto en vez de servir
# uno nuevo. Se pisaba `abierto`, que además ya estaba marcado como explicado.
print("\nintentos ilimitados")
H = {"X-Game-Token": client.post("/game/derivemos/player", json={}).json()["guest_token"]}
r = client.post("/game/derivemos/next", json={}, headers=H)
ej_id = r.json()["exercise_id"]
codigos = []
for _ in range(4):
    rr = client.post(
        "/game/derivemos/answer",
        json={
            "exercise_id": ej_id,
            "answer_latex": "42",
            "answer_mathjson": 42,
            "peeked": False,
        },
        headers=H,
    )
    codigos.append(rr.status_code)
check(codigos == [200, 200, 200, 200], f"cuatro respuestas erradas y ninguna 409 ({codigos})")
ej = db.query(GameExercise).filter(GameExercise.id == ej_id).first()
db.refresh(ej)
check(ej.status == "served", "el ejercicio sigue abierto después del cuarto error")
check(rr.json()["attempts_left"] is None, "attempts_left viaja como None (sin límite)")
check(
    rr.json()["correct_answer_latex"] is None,
    "y no se filtra la respuesta al errar",
)
antes = db.query(GameAttempt).filter(GameAttempt.exercise_id == ej_id).count()
check(antes == 4, f"los cuatro intentos quedaron registrados ({antes})")

print("\n" + ("Todo ok\n" if not FAILURES else f"{len(FAILURES)} fallo(s)\n"))
sys.exit(1 if FAILURES else 0)
