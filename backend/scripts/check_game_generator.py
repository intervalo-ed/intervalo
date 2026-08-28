"""Verifica el generador, el Elo y el validador del minijuego de derivadas.

Cubre la Fase 1 del plan:
  1. Cada plantilla genera 20 ejercicios y sympy.diff coincide con la derivada
     esperada re-parseada del string persistido (round-trip str->sympify).
  2. El validador acepta la derivada correcta y formas algebraicamente
     equivalentes; rechaza incorrectas; los errores predecibles devuelven su
     feedback específico; expresiones patológicas se rechazan sin decidir.
  3. La rampa inicial sirve tiers crecientes y la banda objetivo selecciona
     plantillas razonables; el update de Elo mueve θ/β en la dirección correcta.

Uso:
    python backend/scripts/check_game_generator.py

Determinístico (seeds fijas). Sale con código 1 si algo falla.
"""

import os
import random
import sys
import tempfile
from pathlib import Path

# La consola de Windows viene en cp1252; los labels usan ≡/·/→.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import sympy  # noqa: E402
from sympy import Symbol, cos, exp, log, sin  # noqa: E402

import database  # noqa: E402
from models import Base, GamePlayer  # noqa: E402
from game import elo  # noqa: E402
from game import keyboard as game_keyboard  # noqa: E402
from game.generator import pick_template, serve_exercise  # noqa: E402
from game.mathjson import MathJsonError, to_sympy  # noqa: E402
from game.templates import TEMPLATES, latex_es  # noqa: E402
from game.validator import (  # noqa: E402
    AnswerRejected,
    expr_from_stored,
    guard_candidate,
    match_common_error,
    numerically_equivalent,
)

x = Symbol("x")
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    status = "ok" if condition else "FAIL"
    print(f"  [{status}] {label}")
    if not condition:
        FAILURES.append(label)


def check_raises(fn, exc_type, label: str) -> None:
    try:
        fn()
    except exc_type:
        check(True, label)
    except Exception as exc:  # noqa: BLE001
        print(f"  [FAIL] {label} (levantó {type(exc).__name__}: {exc})")
        FAILURES.append(label)
    else:
        check(False, label)


# ── 1. Generación: 20 por plantilla, derivada correcta y round-trip ──────────
print("1. plantillas (20 ejercicios c/u)")
rng = random.Random(20260827)
for template in TEMPLATES:
    ok_diff = ok_roundtrip = ok_latex = ok_errors = True
    for _ in range(20):
        generated = template.build(rng)
        derivative = sympy.diff(generated.f, x)
        reparsed = expr_from_stored(str(derivative))
        if sympy.simplify(reparsed - derivative) != 0:
            ok_roundtrip = False
        # La derivada esperada nunca puede ser idéntica a un error predecible
        # (si no, el "error" sería correcto).
        for wrong, _fb in generated.common_errors:
            if sympy.simplify(wrong - derivative) == 0:
                ok_errors = False
        prompt = generated.prompt_latex or latex_es(generated.f)
        # `\tan` ya no se traduce: es la notación que muestra el teclado y la
        # tabla. El que sigue prohibido es `\sin`, que en el juego es `sen`.
        if not prompt or "\\sin" in prompt:
            ok_latex = False
        if derivative.has(sympy.Derivative):
            ok_diff = False
    check(ok_diff, f"{template.key}: deriva sin residuos")
    check(ok_roundtrip, f"{template.key}: round-trip str->sympify")
    check(ok_latex, f"{template.key}: latex en notación es (sen)")
    check(ok_errors, f"{template.key}: ningún error predecible == derivada")

# ── 2. Validador ─────────────────────────────────────────────────────────────
print("2. validador")
# f = x²·sen x → f' = 2x·sen x + x²·cos x
expected = sympy.diff(x**2 * sin(x), x)
check(numerically_equivalent(expected, 2 * x * sin(x) + x**2 * cos(x)), "acepta la forma directa")
check(numerically_equivalent(expected, x * (2 * sin(x) + x * cos(x))), "acepta forma factorizada")
check(not numerically_equivalent(expected, 2 * x * cos(x)), "rechaza u'·v'")

# Equivalencia trigonométrica no trivial: 2·sen x·cos x ≡ sen(2x)
check(numerically_equivalent(2 * sin(x) * cos(x), sin(2 * x)), "2·sen·cos ≡ sen(2x)")

# ln: grilla positiva
expected_ln = sympy.diff(log(x), x)
check(numerically_equivalent(expected_ln, 1 / x), "ln x: acepta 1/x")
check(not numerically_equivalent(expected_ln, 1 / x**2), "ln x: rechaza 1/x²")

# a^x con ln a en forma numérica equivalente
expected_ax = sympy.diff(sympy.Integer(3) ** x, x)
check(
    numerically_equivalent(expected_ax, sympy.Integer(3) ** x * log(3)),
    "3^x: acepta 3^x·ln 3",
)
check(not numerically_equivalent(expected_ax, sympy.Integer(3) ** x), "3^x: rechaza sin ln 3")

# Guardas
check_raises(lambda: guard_candidate(Symbol("y") + x), AnswerRejected, "rechaza símbolo extra")
check_raises(lambda: guard_candidate(x ** sympy.Integer(99)), AnswerRejected, "rechaza exponente enorme")
check_raises(
    lambda: guard_candidate(sympy.Integer(10) ** 20 * x), AnswerRejected, "rechaza enteros gigantes"
)
check_raises(
    lambda: numerically_equivalent(expected_ln, sympy.sqrt(-1 - x**2)),
    AnswerRejected,
    "sin puntos co-válidos no decide",
)

# Feedback específico por error predecible
tpl = next(t for t in TEMPLATES if t.key == "t4_pow_sin")
gen = tpl.build(random.Random(7))
import json  # noqa: E402

errors_json = json.dumps(
    [{"expr": str(e), "feedback": fb} for e, fb in gen.common_errors]
)
wrong_expr, wrong_fb = gen.common_errors[0]
check(match_common_error(errors_json, wrong_expr) == wrong_fb, "matchea error predecible (producto)")
check(match_common_error(errors_json, sympy.diff(gen.f, x)) is None, "la correcta no matchea errores")

# ── 3. MathJSON ──────────────────────────────────────────────────────────────
print("3. mathjson")
mj = ["Add", ["Multiply", 2, "x", ["Sin", "x"]], ["Multiply", ["Power", "x", 2], ["Cos", "x"]]]
check(sympy.simplify(to_sympy(mj) - expected) == 0, "árbol de producto completo")
check(to_sympy(["Divide", 1, "x"]) == 1 / x, "División")
check(to_sympy(["Multiply", ["Power", "ExponentialE", "x"], ["Ln", "x"]]) == exp(x) * log(x), "e^x·ln x")
check(to_sympy(["Log", "x", 3]) == log(x, 3), "log base 3")
check_raises(lambda: to_sympy(["Integrate", "x"]), MathJsonError, "head desconocido")
check_raises(lambda: to_sympy("z"), MathJsonError, "símbolo desconocido")

# ── 4. Rampa + banda + Elo con BD ────────────────────────────────────────────
print("4. selección y Elo")
Base.metadata.create_all(bind=database.engine)
db = database.SessionLocal()
player = GamePlayer(guest_token="check-token", alias="checker1")
db.add(player)
db.commit()
db.refresh(player)

rng = random.Random(1)
tiers_seen = []
for n in range(5):
    player.n_updates = n
    template, stat, p_hat = pick_template(db, player, rng)
    tiers_seen.append(template.tier)
check(tiers_seen == sorted(tiers_seen) and tiers_seen[0] == 0, f"rampa por tier creciente {tiers_seen}")

player.n_updates = 50
player.theta = 0.0
picks = {pick_template(db, player, random.Random(i))[0].tier for i in range(30)}
check(all(t <= 4 for t in picks), f"con θ=0 la banda elige tiers bajos/medios {sorted(picks)}")

theta1, beta1 = elo.update(0.0, 0, 0.0, 0, correct=True)
theta2, beta2 = elo.update(0.0, 0, 0.0, 0, correct=False)
check(theta1 > 0 and beta1 < 0, "acierto: sube θ, baja β")
check(theta2 < 0 and beta2 > 0, "fallo: baja θ, sube β")
check(abs(elo.update(0.0, 100, 0.0, 0, True)[0]) < abs(theta1), "learning rate decrece con n")

served = serve_exercise(db, player)
db.commit()
check(served.status == "served" and served.expected_derivative, "serve_exercise persiste")
served2 = serve_exercise(db, player)
db.commit()
db.refresh(served)
check(served.status == "expired", "servir de nuevo expira el anterior")
check(served2.template_key != served.template_key, "anti-repetición inmediata")
db.close()

# ── 5. Teclado acumulativo ───────────────────────────────────────────────────
# El riesgo real es dejar a alguien sin poder escribir la respuesta: se verifica
# que TODA tecla que la derivada exige esté desbloqueada después de servirla.
print("5. teclado acumulativo")
rng = random.Random(20260827)
samples: dict[str, list[str]] = {}
for template in TEMPLATES:
    ok_covers = ok_vocab = True
    for i in range(20):
        generated = template.build(rng)
        derivative = sympy.diff(generated.f, x)
        required = game_keyboard.required_keys(derivative)
        col, fresh = game_keyboard.unlock("", derivative)
        keys = game_keyboard.parse_unlocked_ordered(col)
        if not required.issubset(keys):
            ok_covers = False
        if not set(keys).issubset(game_keyboard.CANONICAL_ORDER):
            ok_vocab = False
        # Desde cero, todo lo exigido es nuevo: no hay teclas de relleno.
        if set(fresh) != required:
            ok_covers = False
        samples.setdefault(template.key, keys)
    check(ok_covers, f"{template.key}: desbloquea exactamente lo necesario")
    check(ok_vocab, f"{template.key}: vocabulario conocido")

# Lo que define al inventario: nunca encoge, y recorrer todas las plantillas
# termina desbloqueando el vocabulario entero.
col = ""
sizes: list[int] = []
for template in TEMPLATES:
    for _ in range(5):
        derivative = sympy.diff(template.build(rng).f, x)
        col, _fresh = game_keyboard.unlock(col, derivative)
        sizes.append(len(game_keyboard.parse_unlocked(col)))
check(all(b >= a for a, b in zip(sizes, sizes[1:])), "el inventario nunca encoge")

# Alcanzable = lo que alguna plantilla llega a exigir. Se calcula de las
# plantillas y no se hardcodea: si mañana entra una con raíces o tangente, este
# chequeo se entera solo.
alcanzable: set[str] = set()
rng_cov = random.Random(20260828)
for template in TEMPLATES:
    for _ in range(60):
        alcanzable |= game_keyboard.required_keys(sympy.diff(template.build(rng_cov).f, x))
final = game_keyboard.parse_unlocked(col)
check(final == alcanzable, f"se desbloquea todo lo alcanzable ({len(final)}/{len(alcanzable)})")

# Las que ningún ejercicio puede pedir. NO es un fallo: es el dato de que esas
# teclas del vocabulario están muertas mientras no exista una plantilla que las
# necesite — antes se veían igual porque entraban como distractores, y con el
# teclado acumulativo ya no aparecen nunca.
inalcanzables = [k for k in game_keyboard.CANONICAL_ORDER if k not in alcanzable]
print(f"   alcanzables: {' '.join(game_keyboard.in_order(alcanzable))}")
print(f"   sin plantilla que las pida: {' '.join(inalcanzables) or '(ninguna)'}")
# Volver a servir algo ya visto no vuelve a anunciarlo como nuevo.
repetida = sympy.diff(TEMPLATES[0].build(rng).f, x)
_col, fresh_otra_vez = game_keyboard.unlock(col, repetida)
check(fresh_otra_vez == [], "una tecla ya desbloqueada no se reanuncia")

print("   muestras (desde cero, una plantilla sola):")
for key, keys in samples.items():
    print(f"     {key:22s} {' '.join(keys) if keys else '(sin teclas nuevas)'}")

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
