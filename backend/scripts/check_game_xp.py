"""Verifica que la XP del minijuego diga qué tan difícil era la derivada.

Existe por un reporte concreto de un jugador: «los puntajes que se asignan por
una derivada determinada me aparecieron aleatorios, no dependientes de la
dificultad. Una derivada Sen(x)/x podía tener menos puntaje que 3^x». Medido
contra producción tenía razón —correlación dificultad/XP de 0,24, y `sen(x)/x`
pagando entre 5 y 114— porque la dificultad entraba solo por p̂, que el selector
mantiene en una banda angosta, mientras el combo sumaba planos y el cafecito
multiplicaba por tres.

Lo que se fija acá es la propiedad que hace que eso no pueda volver:

  1. Una derivada dada paga SIEMPRE lo mismo. La XP depende del tier y del
     número de intento, y de nada más — ni del jugador, ni del p̂, ni de cuándo.
  2. El orden entre tiers no se puede invertir sin combo, y el bonus de combo
     tampoco puede hacer que un tier pague menos que uno más fácil con el mismo
     combo.
  3. La tabla cubre el catálogo entero: ninguna plantilla necesita el clamp de
     `xp_base_de`.
  4. El espejo del front (web/src/app/derivadas/xp-estimate.ts) da lo mismo que
     el backend. Se compara la TABLA leyéndola del archivo, no reimplementándola
     acá: dos copias de un número solo sirven si algo las mira juntas.

Uso:
    python backend/scripts/check_game_xp.py

Sale con código 1 si algo falla.
"""

import os
import re
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_xp.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from game import xp as game_xp  # noqa: E402
from game.templates import TEMPLATES  # noqa: E402

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


TIERS = sorted(game_xp.XP_POR_TIER)

print("La XP depende del ítem y de nada más")

# La prueba de «no es aleatorio»: la misma derivada, en cualquier circunstancia
# que antes movía el número, paga igual. p_hat ya ni siquiera es un parámetro,
# así que lo que se comprueba es que no haya entrado otro por la ventana.
for tier in TIERS:
    valores = {
        game_xp.xp_for_answer(1, True, tier, combo)[0]
        for combo in (1, 2, 3, 4, 6, 7, 8, 9, 11)  # ninguno múltiplo de 5
    }
    check(len(valores) == 1, f"T{tier} al primer intento paga siempre lo mismo ({valores})")

check(
    game_xp.xp_for_answer(1, True, 5, 1)[0] > game_xp.xp_for_answer(1, True, 3, 1)[0],
    "sen(x)/x (T5) paga más que 3^x (T3) — el caso exacto del reporte",
)

print("El orden entre tiers no se puede invertir")

bases = [game_xp.xp_base_de(t) for t in TIERS]
check(bases == sorted(bases) and len(set(bases)) == len(bases),
      f"la base crece estrictamente con el tier: {dict(zip(TIERS, bases))}")

# Con combo, todos los tiers suben a la vez, así que el orden se conserva. Es lo
# que compra que el bonus sea una FRACCIÓN y no un número plano: con +15 planos
# un T0 con combo (23) le pasaba a un T5 sin él (34 hoy, 25 antes).
con_combo = [game_xp.xp_for_answer(1, True, t, 5)[0] for t in TIERS]
check(con_combo == sorted(con_combo) and len(set(con_combo)) == len(con_combo),
      f"con el combo puesto el orden también se conserva: {dict(zip(TIERS, con_combo))}")

# El rango tiene que ganarle al cafecito, que es lo que lo ahogaba: si la
# dificultad abarca menos que el multiplicador, el número vuelve a leerse como
# ruido. MAX_MULTIPLIER vive en game/boosts.py.
from game.boosts import MAX_MULTIPLIER  # noqa: E402

rango = bases[-1] / bases[0]
check(rango > MAX_MULTIPLIER,
      f"el rango por dificultad ({rango:.2f}×) le gana al del cafecito (×{MAX_MULTIPLIER})")

# Ningún tier puede pagar tan poco que el festejo reparta pasos de cero: el front
# cuenta en PASOS_MIN=4 pasos como mínimo (xp-pasos.ts), así que la base más
# chica tiene que dar para cuatro.
check(min(bases) >= 4, f"hasta el tier más fácil da para el festejo mínimo ({min(bases)} XP)")

print("Los intentos y las ayudas")

for tier in TIERS:
    base = game_xp.xp_base_de(tier)
    segundo = game_xp.xp_for_answer(2, True, tier, 0)[0]
    tercero = game_xp.xp_for_answer(3, True, tier, 0)[0]
    check(
        base > segundo > tercero >= 1,
        f"T{tier}: {base} al primero, {segundo} al segundo, {tercero} insistiendo",
    )

check(
    all(game_xp.xp_for_answer(1, True, t, 5, peeked=True) == (game_xp.XP_PEEKED, 0) for t in TIERS)
    and all(
        game_xp.xp_for_answer(1, True, t, 5, explained=True) == (game_xp.XP_EXPLICADO, 0)
        for t in TIERS
    ),
    "copiar de la tabla o leer el ¿Por qué? paga plano: la dificultad la resolvió la ayuda",
)

check(all(game_xp.xp_for_answer(1, False, t, 5) == (0, 0) for t in TIERS), "errar no paga nada")

print("La tabla cubre el catálogo")

tiers_del_catalogo = sorted({t.tier for t in TEMPLATES})
faltan = [t for t in tiers_del_catalogo if t not in game_xp.XP_POR_TIER]
check(not faltan, f"ninguna plantilla necesita el clamp de xp_base_de (faltarían: {faltan})")

print("El espejo del front")

ts = (BACKEND.parent / "web/src/app/derivadas/xp-estimate.ts").read_text(encoding="utf-8")
m = re.search(r"XP_POR_TIER:\s*Record<number, number>\s*=\s*\{([^}]*)\}", ts)
check(m is not None, "xp-estimate.ts tiene su tabla XP_POR_TIER")
if m:
    del_front = {int(k): int(v) for k, v in re.findall(r"(\d+)\s*:\s*(\d+)", m.group(1))}
    check(del_front == game_xp.XP_POR_TIER,
          f"la tabla del front es la misma que la del backend (front: {del_front})")

for nombre, valor in (
    ("XP_PEEKED", game_xp.XP_PEEKED),
    ("COMBO_INTERVAL", game_xp.COMBO_INTERVAL),
):
    m2 = re.search(rf"const {nombre} = (\d+)", ts)
    check(m2 is not None and int(m2.group(1)) == valor, f"{nombre} coincide con el backend ({valor})")

for nombre, valor in (
    ("FRACCION_SEGUNDO", game_xp._FRACCION_SEGUNDO),
    ("FRACCION_INSISTIENDO", game_xp._FRACCION_INSISTIENDO),
    ("FRACCION_COMBO", game_xp._FRACCION_COMBO),
):
    m2 = re.search(rf"const {nombre} = (\d+) / (\d+)", ts)
    check(m2 is not None and int(m2.group(1)) / int(m2.group(2)) == valor,
          f"{nombre} coincide con el backend ({valor:.2f})")

print(f"\n{len(FAILURES)} fallos" if FAILURES else "\ntodo ok")
sys.exit(1 if FAILURES else 0)
