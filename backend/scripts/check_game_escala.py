"""Verifica que la escala de dificultad no se pueda volver a desfondar.

Existe por lo que se midió el 2026-09-11 sobre 11.414 primeras respuestas: las
29 plantillas habían terminado entre 1 y 3,5 unidades por debajo de su semilla,
`sen(x)/x` (T5) se creía más fácil que la semilla de `kx` (T1), y la mediana de
θ llevaba meses clavada en 0,07 con el 70% de la gente en cinturón blanco.

La causa no era un bug puntual sino el grado de libertad suelto del modelo:
`p̂ = σ((θ − β)·SCALE)` depende de la RESTA, así que sumarle la misma constante a
todos los θ y todas las β no cambia ninguna predicción. Ese grado de libertad no
se queda quieto: se va para donde lo empuje la asimetría de las tasas de
aprendizaje, y con `a/b` de 24 para la plantilla contra 5,3 para la persona, se
iba siempre para el mismo lado — la plantilla se comía la sorpresa que le tocaba
a la persona.

Lo que se fija acá son las tres piezas del arreglo:

  1. El re-centrado (`desvio_de_escala`) corrige el corrimiento GLOBAL sin tocar
     el orden entre plantillas ni las distancias, que es lo que el motor aprendió
     de verdad y que los datos respaldan.
  2. El tope del ancla (`BETA_PRIOR_CAP`) hace que la semilla no se diluya sola
     a medida que el juego crece.
  3. El reparto de la sorpresa favorece a la PERSONA sobre la plantilla.

Uso:
    python backend/scripts/check_game_escala.py

Determinístico. Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_escala.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from game import elo  # noqa: E402
from game.templates import TEMPLATES  # noqa: E402

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


TIERS = {t.key: t.tier for t in TEMPLATES}
SEMILLAS = {k: elo.BETA_SEED.get(t, 0.0) for k, t in TIERS.items()}


print("1. El re-centrado corrige el corrimiento y NADA mas")

# Una escala corrida entera: todas las plantillas 2,4 abajo de su semilla, que es
# exactamente lo que se midio en produccion.
corrida = {k: v - 2.4 for k, v in SEMILLAS.items()}
delta = elo.desvio_de_escala(corrida, TIERS)
check(abs(delta - 2.4) < 1e-9, "detecta un corrimiento de 2,4 (dio %.4f)" % delta)

centrada = {k: v + delta for k, v in corrida.items()}
check(
    all(abs(centrada[k] - SEMILLAS[k]) < 1e-9 for k in centrada),
    "y al aplicarlo la escala vuelve exactamente a las semillas",
)

# Lo importante: una escala con estructura APRENDIDA (tiers mas juntos que las
# semillas, que es lo que dicen los datos) conserva esa estructura intacta.
aprendida = {k: SEMILLAS[k] * 0.5 - 2.4 for k in SEMILLAS}  # mitad de amplitud, corrida
d2 = elo.desvio_de_escala(aprendida, TIERS)
recentrada = {k: v + d2 for k, v in aprendida.items()}
distancias_antes = [aprendida[a] - aprendida[b] for a in aprendida for b in aprendida]
distancias_despues = [recentrada[a] - recentrada[b] for a in recentrada for b in recentrada]
check(
    all(abs(x - y) < 1e-9 for x, y in zip(distancias_antes, distancias_despues)),
    "las distancias entre plantillas quedan intactas: corrige el nivel, no la forma",
)
check(
    abs(sum(recentrada.values()) / len(recentrada) - sum(SEMILLAS.values()) / len(SEMILLAS)) < 1e-9,
    "y la media queda en la de las semillas",
)

# Una escala ya centrada no se toca.
check(
    abs(elo.desvio_de_escala(SEMILLAS, TIERS)) < 1e-9,
    "una escala ya centrada da desvio cero",
)
check(elo.desvio_de_escala({}, {}) == 0.0, "sin plantillas no explota")


print("\n2. El re-centrado NO fuerza cada tier a su semilla")

# El motor tiene derecho a aprender que los tiers estan mas juntos de lo que
# supusimos —los datos lo dicen: dentro de una misma banda de theta, T5 y T1
# rinden casi igual—. El re-centrado no puede pisar eso.
amplitud_semillas = max(SEMILLAS.values()) - min(SEMILLAS.values())
amplitud_recentrada = max(recentrada.values()) - min(recentrada.values())
check(
    amplitud_recentrada < amplitud_semillas * 0.6,
    "una escala comprimida sigue comprimida despues de recentrar (%.2f vs %.2f)"
    % (amplitud_recentrada, amplitud_semillas),
)


print("\n3. El ancla no se diluye cuando el juego crece")

# El bug de fondo: el peso de la semilla era prior/(n+prior), asi que a mas
# gente, menos ancla. Justo al reves de lo que hace falta.
def peso_semilla(n_players: int) -> float:
    b = elo.effective_beta(0.0, 5, n_players)  # beta cruda 0, semilla T5 = +0.9
    return b / elo.BETA_SEED[5]


peso_pocos = peso_semilla(20)
peso_muchos = peso_semilla(400)
check(
    abs(peso_pocos - peso_muchos) < 1e-9,
    "con 20 y con 400 personas la semilla pesa lo mismo (%.3f vs %.3f)"
    % (peso_pocos, peso_muchos),
)
check(
    peso_muchos > 0.25,
    "y no baja del 25%% por mucha gente que pase (dio %.1f%%)" % (100 * peso_muchos),
)
check(
    elo.effective_beta(-3.0, 5, 0) == elo.BETA_SEED[5],
    "sin nadie que la haya visto, la plantilla ES su semilla",
)
# Con evidencia por debajo del tope el comportamiento no cambia.
check(
    abs(elo.effective_beta(-3.0, 5, 5) - (5 * -3.0 + 8 * 0.9) / 13) < 1e-9,
    "por debajo del tope se comporta igual que antes",
)


print("\n4. La sorpresa se la lleva la PERSONA, no la plantilla")

# `a/b` es cuanto puede moverse cada numero en total a lo largo de su vida.
cap_persona = elo._A_USER / elo._B_USER
cap_plantilla = elo._A_TEMPLATE / elo._B_TEMPLATE
check(
    cap_persona > cap_plantilla,
    "capacidad total: persona %.1f > plantilla %.1f" % (cap_persona, cap_plantilla),
)

# Y en concreto: ante la misma sorpresa, theta se mueve mas que beta.
th1, be1 = elo.update(0.0, 50, -1.0, 50, correct=True, tier=3, n_players=50)
check(
    abs(th1 - 0.0) > abs(be1 - (-1.0)),
    "ante la misma respuesta theta se mueve mas que beta (%.4f vs %.4f)"
    % (abs(th1), abs(be1 + 1.0)),
)

# El veterano no queda congelado: a 280 respuestas todavia se mueve.
paso_280 = elo._A_USER / (1 + elo._B_USER * 280)
check(
    paso_280 > 0.03,
    "un jugador con 280 respuestas todavia mueve theta (paso %.4f)" % paso_280,
)


print("\n5. Nada de esto cambia lo que el modelo predice")

# El re-centrado corre theta y beta juntos, asi que la prediccion es la misma:
# es un cambio de coordenadas, no de creencias.
for th, be in [(0.0, -1.0), (1.5, 0.3), (-0.8, -2.2)]:
    p_antes = elo.predict(th, be)
    p_despues = elo.predict(th + 2.4, be + 2.4)
    check(
        abs(p_antes - p_despues) < 1e-12,
        "p̂ no cambia al correr theta y beta juntos (theta=%s, beta=%s)" % (th, be),
    )

print("\n%d fallos" % len(FAILURES) if FAILURES else "\ntodo ok")
sys.exit(1 if FAILURES else 0)
