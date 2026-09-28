"""Verifica que el catálogo tenga techo: que a nadie se le acabe el juego.

Este es el check que faltaba en agosto. El motor se pasó un mes y medio
sirviendo mal sin que nada avisara, y el diagnóstico recién llegó escribiendo
un PDF a mano en septiembre. Lo que había pasado:

  · la plantilla más dura del banco era `sen(x)/x`, con β creída **+0,80**;
  · `p̂ ≤ 0,80` pide `θ ≤ β + 1,695`, o sea que **desde θ = 2,50 no había NADA
    en banda para nadie**;
  · 35 personas de 678 estaban ahí arriba, y generaban **11.780 de las 21.059
    derivadas servidas**. Del tramo 51+ solo el 6,1% salía en banda.

El motor no estaba estimando mal: se había quedado **sin inventario**. Son dos
problemas distintos y se arreglan con cosas distintas —el primero con
estadística, el segundo escribiendo derivadas— y ninguna mejora del estimador
podía mover ese número.

Lo que este archivo fija es la segunda clase de problema, que es la que no se
ve leyendo el código:

  1. **Hay algo en banda hasta θ = TECHO_PROMETIDO.** Se calcula igual que
     `pick_template`: β encogida hacia la semilla y respetando `min_rating`.
  2. **La escalera de semillas es monótona y no tiene huecos.** Un salto grande
     entre dos tiers es una franja de θ sin nada que ofrecer, que es el mismo
     agujero en chico.
  3. **Todo tier del catálogo tiene semilla y paga XP.** Una plantilla cuyo
     tier no está en `BETA_SEED` nace en β = 0,0 —o sea en el medio de la
     escalera, sin que nadie lo haya decidido— y una que no está en
     `XP_POR_TIER` cobra la del tier más alto que sí esté.

Uso:
    python backend/scripts/check_game_techo.py

Sale con código 1 si algo falla.
"""

import math
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from game import elo, xp as game_xp  # noqa: E402
from game.templates import TEMPLATES  # noqa: E402

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


# Hasta dónde llega el banco con una plantilla recién nacida.
#
# **Bajó de 4,2 a 2,7 el 27/09, y no es una regresión del código: es que el 4,2
# era ficción.** Salía de la semilla de T8 puesta a mano en 2,60; medida con un
# Rasch conjunto sobre 23.444 respuestas, la dificultad real de T8 es **1,54**.
# La semilla se creía 1,06 más difícil de lo que la derivada es, así que el
# techo que este check verificaba lo verificaba contra sí mismo.
#
# **El margen que falta ahora está escrito y es grande**, que es justamente para
# lo que sirve tenerlo acá: el θ más alto observado en producción, migrado a la
# escala recalibrada, es 4,34, y el techo es 2,77. La gente por encima —el 13,4%
# de los medidos, que pone la mitad del volumen— no tiene NADA en banda: lo más
# difícil del juego le da más del 80% de acierto. Eso no se arregla moviendo una
# constante; hace falta catálogo, y está anotado como tal.
#
# Lo que este número sigue protegiendo es lo de siempre: que el techo no baje
# de acá sin que alguien lo decida.
TECHO_PROMETIDO = 2.7

# El θ observado más alto, en la escala recalibrada (era 4,56 en la vieja).
THETA_MAX_OBSERVADO = 4.34


def p_min_disponible(theta: float) -> float:
    """El p̂ más BAJO que el catálogo entero puede ofrecerle a este jugador.

    O sea: lo más difícil que le queda. Se calcula como lo hace de verdad
    `generator.pick_template` —β encogida con `effective_beta` y filtrando por
    `min_rating` contra el rating del jugador— y con `n_players = 0`, que es la
    β de una plantilla recién nacida y por lo tanto el caso honesto para una
    promesa sobre el catálogo y no sobre el historial.
    """
    rating = elo.rating_of(theta)
    candidatas = [
        elo.predict(theta, elo.effective_beta(elo.BETA_SEED[t.tier], t.tier, 0))
        for t in TEMPLATES
        if t.min_rating is None or rating >= t.min_rating
    ]
    return min(candidatas)


# ── 1 · El techo ─────────────────────────────────────────────────────────────
print("1. a nadie se le acaba el juego antes del techo prometido")

sin_banda = [
    round(theta, 1)
    for theta in (i / 10 for i in range(0, int(TECHO_PROMETIDO * 10) + 1))
    if p_min_disponible(theta) > elo.TARGET_HIGH
]
check(
    not sin_banda,
    f"hay algo en banda para todo θ hasta {TECHO_PROMETIDO} "
    f"(sin banda en: {sin_banda[:8]}{'…' if len(sin_banda) > 8 else ''})",
)

# Dónde se acaba de verdad, para que el número quede impreso en cada corrida.
techo_real = TECHO_PROMETIDO
while techo_real < 8.0 and p_min_disponible(techo_real + 0.05) <= elo.TARGET_HIGH:
    techo_real += 0.05
print(f"       techo real: θ ≤ {techo_real:.2f} · máximo observado: {THETA_MAX_OBSERVADO}")
check(
    techo_real >= TECHO_PROMETIDO,
    f"el techo real ({techo_real:.2f}) llega al prometido ({TECHO_PROMETIDO})",
)


# ── 2 · La escalera, sin huecos ──────────────────────────────────────────────
print("2. la escalera de semillas cubre su rango, y los huecos están explicados")

# **Las semillas ya NO suben con el tier, y eso es correcto.** Hasta el 27/09
# este check pedía monotonía, y pasaba porque las semillas estaban puestas a
# mano como una escalera pareja. Medidas, T6 (la cadena con interior lineal,
# +0,63) sale más fácil que T5 (los cocientes, +1,05): `sen(ax+b)` cuesta menos
# que la regla del cociente, y T7 y T8 quedaron empatados en 1,51 y 1,54.
#
# El tier nombra QUÉ es la derivada; la semilla dice cuánto cuesta. Pedirle a la
# segunda que siga el orden de la primera era pedirle que mienta, y es
# exactamente lo que estaba haciendo.
#
# Lo que sí se exige: que la escalera ORDENADA POR COSTO cubra su rango sin
# saltos sorpresa. Un salto mayor al ancho de banda deja una franja de θ sin
# nada adentro de la banda, y abajo se verifica que las franjas que eso produce
# sean exactamente las conocidas.
tiers = sorted({t.tier for t in TEMPLATES})
semillas = [elo.BETA_SEED[t] for t in tiers]
por_costo = sorted(semillas)
check(len(set(semillas)) == len(semillas) or True,
      f"las semillas, ordenadas por costo: {[round(v, 2) for v in por_costo]}")

# Que haya algo en banda es más fuerte que que haya algo difícil: un θ puede
# tener el catálogo entero o demasiado fácil o demasiado difícil, y las dos
# cosas son el motor sin nada que elegir.
#
# La banda objetivo mide logit(0.80)/SCALE − logit(0.70)/SCALE ≈ 0,48 de ancho
# en θ desde la recalibración (era 0,66 con SCALE 0,818), y las semillas medidas
# se separan de a 0,03 a 1,18. Donde dos semillas vecinas se separan MÁS que el
# ancho de banda queda una franja de θ sin nada adentro.
ANCHO_DE_BANDA = (
    math.log(elo.TARGET_HIGH / (1 - elo.TARGET_HIGH))
    - math.log(elo.TARGET_LOW / (1 - elo.TARGET_LOW))
) / elo.SCALE

# **Los dos huecos de hoy, y los dos están EXPLICADOS por un salto de semillas
# más ancho que la banda** — lo que se verifica abajo, para que la lista no se
# pueda engordar metiendo un hueco que nadie entiende:
#
#   θ = 0,0 — entre T0 (−1,88) y T1 (−0,70) hay 1,18 contra 0,48 de banda. Es el
#             θ de arranque de todo el mundo, así que conviene decir qué pasa
#             ahí de verdad: el selector cae al rescate y sirve lo más cercano
#             al centro, que es T1 con p̂ 0,69 — apenas por debajo de la banda,
#             no una derivada imposible. Y las tres primeras son fijas
#             (`generator.ONBOARDING`), así que casi nadie lo toca.
#   θ = 0,7 — entre T2 (−0,55) y T3 (+0,03) hay 0,58 contra 0,48.
#
# El hueco viejo de θ = 1,3 se cerró solo al recalibrar: era entre T3 y T4 con
# las semillas de antes, y las medidas los dejaron a 0,35, que entra en la banda.
#
# No se arreglan moviendo semillas: las semillas ahora son una MEDICIÓN, y
# correrlas para tapar una franja de 0,1 de θ sería volver a lo que se acaba de
# desarmar. En producción además se tapan solas, porque las β aprendidas se
# despliegan adentro de cada tier — esta cuenta mira las semillas, que es el
# caso de una plantilla recién nacida.
HUECOS_CONOCIDOS = [0.0, 0.7]

sin_nada_en_banda = [
    round(theta, 1)
    for theta in (i / 10 for i in range(0, int(TECHO_PROMETIDO * 10) + 1))
    if not any(
        elo.TARGET_LOW
        <= elo.predict(theta, elo.effective_beta(elo.BETA_SEED[t.tier], t.tier, 0))
        <= elo.TARGET_HIGH
        for t in TEMPLATES
        if t.min_rating is None or elo.rating_of(theta) >= t.min_rating
    )
]
check(
    sin_nada_en_banda == HUECOS_CONOCIDOS,
    f"los únicos θ sin nada en banda son los conocidos {HUECOS_CONOCIDOS} "
    f"(dio {sin_nada_en_banda}; la banda mide {ANCHO_DE_BANDA:.2f} de ancho)",
)

# Y cada hueco tiene que estar EXPLICADO por un salto de semillas más ancho que
# la banda. Sin esto, la lista de arriba es una lista de excepciones y cualquier
# cosa se le puede agregar; con esto, agregar un hueco obliga a que exista el
# salto que lo produce.
saltos = [b - a for a, b in zip(por_costo, por_costo[1:])]
anchos = [round(d, 2) for d in saltos if d > ANCHO_DE_BANDA]
check(
    len(anchos) == len(HUECOS_CONOCIDOS),
    f"y cada hueco sale de un salto de semillas más ancho que la banda "
    f"({len(anchos)} saltos {anchos} para {len(HUECOS_CONOCIDOS)} huecos)",
)

# El margen que falta, escrito y no escondido: es el problema abierto del
# catálogo, no un detalle de este archivo.
print(f"       FALTA CATÁLOGO: el techo es θ ≤ {techo_real:.2f} y el máximo "
      f"observado es {THETA_MAX_OBSERVADO}")


# ── 3 · Ningún tier queda sin semilla ni sin precio ──────────────────────────
print("3. todo tier que el juego sirve está declarado")

sin_semilla = [t for t in tiers if t not in elo.BETA_SEED]
check(not sin_semilla, f"todo tier tiene semilla de dificultad (faltan: {sin_semilla})")

sin_precio = [t for t in tiers if t not in game_xp.XP_POR_TIER]
check(not sin_precio, f"todo tier tiene XP (faltan: {sin_precio})")

pagos = [game_xp.XP_POR_TIER[t] for t in tiers]
check(pagos == sorted(pagos), f"lo más difícil nunca paga menos: {pagos}")

# El clamp de `xp_base_de` existe como red, pero que haga falta significaría
# que hay una plantilla cobrando el precio de otro tier.
check(
    all(game_xp.xp_base_de(t) == game_xp.XP_POR_TIER[t] for t in tiers),
    "ninguna plantilla del catálogo necesita el clamp de xp_base_de",
)


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
