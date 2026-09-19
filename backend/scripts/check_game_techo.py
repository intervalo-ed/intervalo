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


# Hasta dónde tiene que llegar el banco. El θ más alto observado en producción
# (reporte del motor, 15/09) es 4,56, y con la semilla de T8 en 2,6 el techo
# real queda en 2,6 + 1,695 = 4,295: dos o tres personas siguen afuera y eso
# está aceptado. Lo que NO puede pasar es que el techo baje de acá sin que
# alguien lo decida.
TECHO_PROMETIDO = 4.2

# El θ observado más alto, para que el margen que falta esté escrito y no haya
# que ir a buscarlo a un PDF.
THETA_MAX_OBSERVADO = 4.56


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
print("2. la escalera de semillas sube y no se saltea escalones")

tiers = sorted({t.tier for t in TEMPLATES})
semillas = [elo.BETA_SEED[t] for t in tiers]
check(semillas == sorted(semillas), f"las semillas suben con el tier: {semillas}")

# Que haya algo en banda es más fuerte que que haya algo difícil: un θ puede
# tener el catálogo entero o demasiado fácil o demasiado difícil, y las dos
# cosas son el motor sin nada que elegir.
#
# La banda objetivo mide logit(0.80)/SCALE − logit(0.70)/SCALE ≈ 0,66 de ancho
# en θ, y las semillas se separan ~0,6, así que la escalera cierra... salvo en
# un punto.
ANCHO_DE_BANDA = (
    math.log(elo.TARGET_HIGH / (1 - elo.TARGET_HIGH))
    - math.log(elo.TARGET_LOW / (1 - elo.TARGET_LOW))
) / elo.SCALE

# **θ = 1,3 es un hueco conocido y viejo**, anterior a la regla de la cadena:
# entre T3 (−0,4) y T4 (+0,3) hay 0,70 de distancia contra 0,66 de banda, así
# que queda una franja de 0,04 donde ninguna SEMILLA cae adentro. No se
# arregla acá y a propósito: mover una semilla corre la escala entera y con
# ella los cortes de cinturón, que es un precio enorme por 0,04 de θ. En
# producción tampoco se nota, porque las β aprendidas se despliegan adentro de
# cada tier y tapan la franja — esta cuenta mira las semillas, que es el caso
# de una plantilla recién nacida.
#
# Está anotado y no ignorado: si alguien ensancha el hueco o abre uno nuevo,
# esta lista deja de coincidir y el check lo nombra.
HUECOS_CONOCIDOS = [1.3]

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
