"""Verifica el piso del paso de aprendizaje y el sorteo de `dx-elo-1`.

**Lo que este archivo existe para impedir.** Un experimento puede fallar de dos
formas y solo una se ve: que el resultado dé mal, o que los dos brazos hayan
estado haciendo lo mismo todo el tiempo. La segunda no avisa —el panel muestra
dos columnas, calcula su p-valor y contesta «no hay diferencia»— y es
exactamente lo que pasó con `check_game_variante.py` cuando copiaba el nombre
del experimento en vez de leerlo del front.

Los cuatro invariantes:

  1. **Abajo del umbral los dos brazos son BIT A BIT el mismo motor.** Es lo que
     permite que esto corra al mismo tiempo que `dx-puerta-2`, que mide las tres
     primeras correctas. Si se rompiera, los dos experimentos estarían midiendo
     el mismo cambio sin saberlo.
  2. **Arriba del umbral son distintos, y cada vez más.** Lo contrario del
     anterior y el mismo peligro: un piso que no muerde es un experimento que
     compara el control contra sí mismo.
  3. **El piso NO toca la β.** `game_template_stats` es una sola tabla para los
     dos brazos, así que si el piso moviera la plantilla, el brazo test le
     estaría cambiando la dificultad al control — que es contaminación cruzada y
     no se ve en ninguna columna del panel.
  4. **El umbral se calcula, no se escribe.** `sorteo.UMBRAL_N` y el 43 del panel
     salen de `_A_USER`/`_B_USER`. Si alguien mueve un hiperparámetro y el umbral
     se queda quieto, el panel inscribe gente a la que no le pasó nada.

Uso:
    python backend/scripts/check_game_elo_piso.py

Sale con código 1 si algo falla.
"""

import sys
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from game import elo, sorteo  # noqa: E402
from metrics import game_queries as q  # noqa: E402

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


# El n comprometido, clavado acá igual que en check_game_dashboard: que cambie
# es una decisión, y una decisión tiene que romper un check y no pasar
# desapercibida en un diff de un dígito.
N_COMPROMETIDO_MOTOR = 65


# ── 1 · El piso, como función ───────────────────────────────────────────────
print("\nEl piso del paso de aprendizaje")

UMBRAL = sorteo.UMBRAL_N
check(UMBRAL == 43, f"muerde en la respuesta 43 (dio {UMBRAL})")
check(elo.n_donde_muerde(elo.LR_MIN_CONTROL) is None,
      "el control no tiene piso: n_donde_muerde devuelve None")

# El umbral es EL borde, no un número cerca del borde.
check(elo.lr_de_usuario(UMBRAL) <= elo.LR_MIN_RAPIDO,
      f"en n={UMBRAL} el lr sin piso ya cayó hasta el piso")
check(elo.lr_de_usuario(UMBRAL - 1) > elo.LR_MIN_RAPIDO,
      f"y en n={UMBRAL - 1} todavía no: el umbral es el borde exacto")

# Que esté DERIVADO y no escrito: si se mueve un hiperparámetro, se mueve.
_a_original = elo._A_USER
try:
    elo._A_USER = 1.6  # el doble de paso inicial
    check(elo.n_donde_muerde(elo.LR_MIN_RAPIDO) > UMBRAL,
          "con otro _A_USER el umbral se mueve solo (está calculado, no escrito)")
finally:
    elo._A_USER = _a_original
check(elo.n_donde_muerde(elo.LR_MIN_RAPIDO) == UMBRAL,
      "y vuelve a su valor cuando el hiperparámetro vuelve")

check(elo.lr_de_usuario(10_000, elo.LR_MIN_RAPIDO) == elo.LR_MIN_RAPIDO,
      "el piso aguanta hasta el infinito: con 10.000 respuestas sigue en 0,20")


# ── 2 · Los dos brazos, contra el motor de verdad ───────────────────────────
print("\nLos dos brazos")

BETA, TIER, N_TEMPLATE, N_PLAYERS = 0.9, 5, 300, 25


def mueve(theta: float, n_user: int, lr_min: float, correct: bool) -> tuple[float, float]:
    """Una respuesta, por el mismo `update` que corre en producción."""
    return elo.update(theta, n_user, BETA, N_TEMPLATE, correct,
                      tier=TIER, n_players=N_PLAYERS, lr_min=lr_min)


# 1 · Abajo del umbral: idénticos, y no «parecidos».
iguales = all(
    mueve(1.0, n, elo.LR_MIN_CONTROL, ok) == mueve(1.0, n, elo.LR_MIN_RAPIDO, ok)
    for n in range(0, UMBRAL)
    for ok in (True, False)
)
check(iguales,
      f"abajo de {UMBRAL} los dos brazos dan el MISMO θ, bit a bit "
      "(es lo que deja correr dx-puerta-2 al mismo tiempo)")

# 2 · Arriba del umbral: distintos, y la brecha crece con la experiencia.
brechas = []
for n in (71, 130, 279, 1006):
    tc, _ = mueve(1.0, n, elo.LR_MIN_CONTROL, True)
    tt, _ = mueve(1.0, n, elo.LR_MIN_RAPIDO, True)
    brechas.append((tt - 1.0) / (tc - 1.0))
check(all(b > 1.0 for b in brechas),
      "arriba del umbral el brazo con piso mueve más θ por respuesta")
check(brechas == sorted(brechas),
      f"y la ventaja CRECE con la experiencia "
      f"(×{brechas[0]:.1f} a las 71 respuestas, ×{brechas[-1]:.1f} a las 1006)")

# 3 · La β no se entera. Este es el que protege al control.
misma_beta = all(
    mueve(t, n, elo.LR_MIN_CONTROL, ok)[1] == mueve(t, n, elo.LR_MIN_RAPIDO, ok)[1]
    for t in (0.0, 1.5, 3.0)
    for n in (0, 50, 500)
    for ok in (True, False)
)
check(misma_beta,
      "el piso NO mueve la β: la tabla de plantillas es compartida entre brazos")

# 4 · Bajar sigue siendo más caro que subir, que es lo que hace que la escala
#     no se infle sola. El piso multiplica los dos lados por igual.
sube, _ = mueve(1.0, 500, elo.LR_MIN_RAPIDO, True)
baja, _ = mueve(1.0, 500, elo.LR_MIN_RAPIDO, False)
check((1.0 - baja) > (sube - 1.0),
      "con piso, errar sigue costando más de lo que un acierto da (la escala no se infla)")

# 5 · El botón de saltear vuelve a ser barato para el veterano, que es la mitad
#     del argumento del experimento. Se mide EN BANDA —θ tal que p̂ = 0,75— y no
#     en cualquier punto: el precio del botón depende de cuánto da un acierto, y
#     cuánto da un acierto depende de qué tan difícil era. Fuera de la banda el
#     número sale más chico y estaría midiendo otra cosa.
EN_BANDA = BETA + elo._OFFSET_DE_BANDA
precio_con = elo.SKIP_THETA_PENALTY / (
    mueve(EN_BANDA, 1006, elo.LR_MIN_RAPIDO, True)[0] - EN_BANDA)
precio_sin = elo.SKIP_THETA_PENALTY / (
    mueve(EN_BANDA, 1006, elo.LR_MIN_CONTROL, True)[0] - EN_BANDA)
check(precio_con < 10 < precio_sin,
      f"en banda, saltear le cuesta a un veterano {precio_sin:.0f} aciertos sin "
      f"piso y {precio_con:.1f} con piso")


# ── 3 · El sorteo ───────────────────────────────────────────────────────────
print("\nEl sorteo")

check(sorteo.brazo_de(7) == sorteo.brazo_de(7) == sorteo.brazo_de(7),
      "el brazo es determinístico: el mismo id da siempre el mismo brazo")
check(set(sorteo.PISOS) == set(sorteo.BRAZOS),
      "todo brazo declarado tiene su piso")
check(sorteo.PISOS["control"] == elo.LR_MIN_CONTROL,
      "el control es el motor de hoy, sin piso")

reparto = Counter(sorteo.brazo_de(i) for i in range(1, 3001))
menor = min(reparto.values())
check(abs(reparto["control"] - reparto["rapido"]) < 120,
      f"reparte parejo sobre 3.000 ids secuenciales ({dict(reparto)})")
check(menor > 0 and len(reparto) == len(sorteo.BRAZOS),
      "los dos brazos reciben gente")

# El id es SECUENCIAL: si el hash tuviera estructura en los bits bajos, ids
# consecutivos caerían alternados o en bloques. Es el mismo defecto que el
# FNV-1a del front tuvo hasta que se le puso la avalancha.
alternados = sum(1 for i in range(1, 2000)
                 if sorteo.brazo_de(i) != sorteo.brazo_de(i + 1))
check(700 < alternados < 1300,
      f"y no alterna ni agrupa por id consecutivo ({alternados} cambios en 2.000)")

# Los dos experimentos tienen que ser independientes: saber el brazo de uno no
# puede decir nada del otro. Se mide contra el hash del OTRO nombre.
cruce = sum(1 for i in range(1, 3001)
            if sorteo.brazo_de(i) == sorteo.brazo_de(i, "dx-elo-0"))
check(1300 < cruce < 1700,
      f"el nombre del experimento re-sortea de verdad ({cruce} coincidencias de 3.000)")

check(sorteo.etiqueta_de(1).startswith(f"{sorteo.EXPERIMENTO}:"),
      "la etiqueta usa el mismo formato que game_players.variant")
check(sorteo.piso_de(1) in sorteo.PISOS.values(),
      "piso_de devuelve uno de los pisos declarados")


# ── 4 · El panel ────────────────────────────────────────────────────────────
print("\nEl panel")

EXP = q.EXPERIMENTO_MOTOR
n_pedido = q._n_medias(EXP["sd"], EXP["mde"], EXP["alpha"], EXP["potencia"])
check(n_pedido == N_COMPROMETIDO_MOTOR,
      f"el n comprometido es {N_COMPROMETIDO_MOTOR} por brazo (dio {n_pedido})")

# La restricción que gobierna todo el programa, acá también: el n va con el
# inverso del CUADRADO del efecto.
mitad = q._n_medias(EXP["sd"], EXP["mde"] / 2, EXP["alpha"], EXP["potencia"])
check(3.6 < mitad / n_pedido < 4.4,
      f"pedir la mitad de efecto cuadruplica la muestra ({mitad} contra {n_pedido})")

check(EXP["clave"] == sorteo.EXPERIMENTO,
      "el panel lee la clave del experimento de donde se decide, no la copia")
check(all(c in dict(sorteo.PISOS) for c, _ in EXP["brazos"]),
      "los brazos del panel son los brazos del sorteo")
check(all(k in EXP for k in ("base", "sd", "mde", "alpha", "potencia",
                             "prediccion", "hipotesis", "ventana_dias")),
      "está todo pre-registrado: base, sd, mde, alfa, potencia, predicción")

# No cambió el otro experimento de medias al refactorizar la fórmula.
check(q.n_comprometido_medias(q.EXPERIMENTOS_GRUPOS[0]) == 88,
      "el experimento por grupos sigue pidiendo 88 (la fórmula se compartió sin moverla)")


# ── 5 · A quién inscribe, con datos falsos ──────────────────────────────────
print("\nA quién inscribe")

DESDE = EXP["desde"]
DENTRO = datetime.combine(DESDE + timedelta(days=1), datetime.min.time())
ANTES = datetime.combine(DESDE - timedelta(days=3), datetime.min.time())


def jugador(pid, n_updates, is_bot=False):
    return {"id": pid, "n_updates": n_updates, "theta": 2.0, "is_bot": is_bot,
            "platform": "android", "variant": None}


# Tres jugadores que importan:
#   1 → veterano de verdad, entra.
#   2 → cruzó el umbral DESPUÉS de arrancar (43 hoy, pero 40 el día 0): no entra.
#   3 → nunca llegó: no entra.  4 → bot: no entra.
players = [jugador(1, 300), jugador(2, UMBRAL + 3), jugador(3, 10),
           jugador(4, 900, is_bot=True)]
firsts = ([{"player_id": 2, "exercise_id": None, "is_correct": True,
            "created_at": DENTRO}] * 5
          + [{"player_id": 1, "exercise_id": None, "is_correct": True,
              "created_at": ANTES}])
exercises = [
    {"id": 10, "player_id": 1, "created_at": DENTRO, "p_hat": 0.75,
     "status": "answered", "peeked": False},
    {"id": 11, "player_id": 4, "created_at": DENTRO, "p_hat": 0.75,
     "status": "answered", "peeked": False},
]
bloque = q.experimento_motor(
    {"players": players, "exercises": exercises, "_firsts": firsts})

inscriptos = sum(b["n"] for b in bloque["brazos"])
check(inscriptos == 1,
      f"solo entra el que ya estaba arriba del umbral el día 0 (entraron {inscriptos})")
check(bloque["umbral_n"] == UMBRAL,
      "el panel usa el umbral calculado y no uno propio")
check(bloque["listo"] is False,
      "no se puede leer mientras la ventana de 14 días siga abierta")
check(bloque["n_pedido"] == N_COMPROMETIDO_MOTOR,
      "y publica el n comprometido")

# El bot no cuenta ni siquiera para las derivadas servidas.
check(all(b["servidas"] <= 1 for b in bloque["brazos"]),
      "los bots quedan afuera, como en el resto del panel")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
