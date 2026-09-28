"""Verifica la banda objetivo por jugador (game/banda.py) — `dx-banda-1`.

La banda decide **qué dificultad se le sirve a cada uno en cada ejercicio**, así
que se puede romper de formas que no dan error y que solo se ven semanas después
en el panel. Cada sección de acá tapa un agujero concreto:

  - **el sorteo reparte parejo, es estable y no está pegado a los otros.** Tres
    experimentos del motor comparten la misma técnica de hash; si dos brazos
    quedaran correlacionados, cada uno mediría al otro sin que nada avise;

  - **el brazo exigente recibe de verdad ejercicios más difíciles.** Es el único
    check que prueba que el experimento EXISTE. Sin esto, toda la maquinaria del
    panel podría estar midiendo dos brazos idénticos y el resultado saldría
    «sin diferencia» con toda propiedad;

  - **el centro cae adentro de su banda.** `pick_template` acerca al centro
    cuando la banda queda vacía, y un centro afuera haría que el rescate sirva
    sistemáticamente lo que la banda rechaza;

  - **la banda de exploración CONTIENE a la objetivo.** La ε-exploración elige
    dentro de la ampliada; si fuera más angosta en algún borde, el 15% de los
    ejercicios contradiría al otro 85%;

  - **el interruptor apaga todo y deja a los dos brazos en la banda de siempre.**

Uso:
    python backend/scripts/check_game_banda.py

Sale con código 1 si algo falla.
"""

import os
import random
import statistics
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_banda.db"
).replace("\\", "/")
os.environ["BANDA_ENABLED"] = "1"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

from game import banda, elo, generator, rampa, sorteo  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str, extra: str = "") -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}{(' ' + extra) if extra else ''}")
    if not condition:
        FAILURES.append(label)


# ── 1 · El sorteo ───────────────────────────────────────────────────────────
print("1. el sorteo")
reparto = {b: 0 for b in banda.BRAZOS}
for i in range(1, 4001):
    reparto[banda.brazo_de(i)] += 1
check(all(abs(v - 2000) < 100 for v in reparto.values()),
      "reparte parejo sobre 4.000 ids", f"({reparto})")
check(all(banda.brazo_de(7) == banda.brazo_de(7) for _ in range(5)),
      "el mismo id da siempre el mismo brazo")

# Los tres experimentos del motor usan el mismo hash con distinto nombre
# adentro. Si dos quedaran correlacionados, cada uno estaría midiendo al otro.
for otro, nombre in ((lambda i: sorteo.brazo_de(i) == "rapido", "dx-elo-1"),
                     (lambda i: rampa.brazo_de(i) == "ayudas", "dx-rampa-1")):
    iguales = sum(1 for i in range(1, 3001)
                  if (banda.brazo_de(i) == "exigente") == otro(i))
    # 1.500 en los dos casos, y para la rampa NO es obvio: tiene tres brazos, así
    # que «es ayudas» pasa 1/3 de las veces. Coincidir es (los dos sí) o (los dos
    # no) = 1/2·1/3 + 1/2·2/3 = 1/2 igual. Lo que se mide es independencia entre
    # dos indicadores binarios, no que los brazos tengan el mismo tamaño.
    esperado = 1500
    check(abs(iguales - esperado) < 120,
          f"y no está correlacionado con el brazo de {nombre}",
          f"({iguales} de 3.000 coinciden, se esperan ~{esperado})")

# ── 2 · Las bandas ──────────────────────────────────────────────────────────
print("\n2. las bandas")
for clave, (lo, hi) in banda.BANDAS.items():
    check(0.0 < lo < hi < 1.0, f"«{clave}» es un intervalo válido", f"({lo}, {hi})")
    mid = banda.centro_de(lo, hi)
    # `pick_template` acerca al CENTRO cuando la banda queda vacía. Un centro
    # afuera de su propia banda haría que el rescate sirva lo que la banda
    # rechaza, y eso no da error: da un experimento que mide otra cosa.
    check(lo <= mid <= hi, f"y su centro cae adentro", f"(centro {mid:.3f})")
    ex_lo, ex_hi = banda.exploracion_de(lo, hi)
    check(ex_lo <= lo and ex_hi >= hi,
          f"y la banda de exploración la contiene", f"({ex_lo:.2f}–{ex_hi:.2f})")

ctrl = banda.BANDAS["control"]
exig = banda.BANDAS["exigente"]
check(exig[1] < ctrl[1] and exig[0] < ctrl[0],
      "la exigente está corrida hacia abajo en los dos bordes",
      f"({exig} contra {ctrl})")
# El salto tiene que ser de al menos una banda entera o los dos brazos sirven
# casi lo mismo y el experimento no puede ganar por diseño.
salto = banda.centro_de(*ctrl) - banda.centro_de(*exig)
ancho = (ctrl[1] - ctrl[0])
check(salto >= ancho,
      "y el salto entre centros es de al menos un ancho de banda",
      f"({salto:.3f} contra un ancho de {ancho:.3f})")

# ── 3 · El brazo exigente recibe de verdad más difícil ──────────────────────
print("\n3. lo que cada brazo recibe (el check que prueba que el experimento existe)")
rng = random.Random(20260927)
por_brazo: dict[str, list[float]] = {b: [] for b in banda.BRAZOS}
# θ = 1,2 es donde hay catálogo de sobra a los dos lados, así que la banda puede
# elegir y la diferencia mide la banda y no el techo.
for pid in range(1, 61):
    # `exercises_attempted` va al lado de `n_updates` porque el tope de tier
    # de la rampa mira ese contador (elo.max_tier_de): sin el, estos sesenta
    # jugadores quedarian en la rampa y el motor no podria elegir nada.
    p = GamePlayer(id=pid, alias=f"p{pid}", guest_token=f"t{pid}",
                   theta=1.2, n_updates=60, exercises_attempted=60)
    db.add(p)
db.commit()
for pid in range(1, 61):
    p = db.get(GamePlayer, pid)
    for _ in range(12):
        _, _, p_hat = generator.pick_template(db, p, rng)
        por_brazo[banda.brazo_de(pid)].append(p_hat)
db.rollback()

medias = {b: statistics.fmean(v) for b, v in por_brazo.items() if v}
check(len(medias) == 2, "los dos brazos recibieron ejercicios", f"({medias})")
check(medias["exigente"] < medias["control"],
      "el brazo exigente recibe ejercicios MÁS DIFÍCILES",
      f"(p̂ medio {medias['exigente']:.3f} contra {medias['control']:.3f})")
# No alcanza con que sea menor: tiene que ser una diferencia que se pueda medir
# con el n comprometido, o el experimento está declarado para no encontrar nada.
check(medias["control"] - medias["exigente"] > 0.03,
      "y la diferencia es de más de 3 puntos de p̂",
      f"({100 * (medias['control'] - medias['exigente']):.1f} pp)")
en_banda = {
    b: sum(1 for v in por_brazo[b] if banda.BANDAS[b][0] <= v <= banda.BANDAS[b][1])
       / len(por_brazo[b])
    for b in banda.BRAZOS if por_brazo[b]}
check(all(v > 0.5 for v in en_banda.values()),
      "y cada brazo cae mayormente DENTRO de su propia banda",
      f"({ {k: round(100 * v) for k, v in en_banda.items()} })")

# ── 4 · El interruptor ──────────────────────────────────────────────────────
print("\n4. el interruptor")
os.environ["BANDA_ENABLED"] = "0"
check(not banda.habilitado(), "BANDA_ENABLED=0 apaga el experimento")
check(all(banda.banda_de(i) == banda.BANDAS["control"] for i in range(1, 200)),
      "y los dos brazos quedan en la banda de siempre")
os.environ["BANDA_ENABLED"] = "1"
check(banda.habilitado(), "y se vuelve a prender")
del os.environ["BANDA_ENABLED"]
check(banda.habilitado(), "sin la variable puesta, arranca ENCENDIDO")

# La banda del código tiene que seguir siendo la que `elo` declara como objetivo:
# si alguien mueve TARGET_LOW/HIGH y no toca esto, el control deja de ser el
# motor de siempre y el experimento compara contra un tercer mundo.
check(banda.BANDAS["control"] == (elo.TARGET_LOW, elo.TARGET_HIGH),
      "el brazo control es exactamente la banda de elo.py",
      f"({banda.BANDAS['control']} contra ({elo.TARGET_LOW}, {elo.TARGET_HIGH}))")

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    raise SystemExit(1)
print("todos los chequeos pasaron")
