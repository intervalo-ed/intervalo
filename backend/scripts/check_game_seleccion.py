"""Verifica que el juego no repita la misma derivada una y otra vez.

Existe por un reporte de un jugador: «se repiten muchas veces las mismas
derivadas. Conté 4 veces la misma en 10 oportunidades consecutivas. Eso juega a
favor si uno quiere solo sumar puntos porque uno ya la escribe sin pensarlo pero
puede resultar demasiado mecánico y podría liquidar el entusiasmo».

Medido contra producción sobre 7.838 ejercicios, no era mala suerte: la ventana
de exclusión era de 3 plantillas y la banda objetivo tiene entre 3 y 8, así que a
menudo quedaba UNA sola candidata legal, y `rng.choice` sobre una lista de uno no
es azar. Repetición de enunciado por tramo del recorrido: 2,4% en los primeros
diez, 50,1% entre el 26 y el 50, y 77,5% del 51 en adelante.

Lo que se fija acá corre la simulación entera —doscientos ejercicios servidos de
verdad, por el mismo camino que usa el endpoint— y mide sobre eso:

  1. Ninguna plantilla vuelve dentro de la ventana de exclusión.
  2. Antes de repetir se ensancha la BANDA, no se acorta la ventana. El orden de
     la escalera es lo que hace que (1) no se pague sirviendo cualquier cosa.
  3. El enunciado exacto no vuelve pronto, que es lo que la persona nota. La
     ventana sola no alcanzaba: una plantilla con una sola variante es una
     derivada que vuelve textual por más que se excluya su plantilla.
  4. Ninguna plantilla del catálogo es una sola expresión.

Uso:
    python backend/scripts/check_game_seleccion.py

Determinístico (seeds fijas). Sale con código 1 si algo falla.
"""

import os
import random
import sys
import tempfile
from collections import Counter
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_seleccion.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameExercise, GamePlayer  # noqa: E402
from game import elo, generator  # noqa: E402
from game.cycler import CyclingRandom  # noqa: E402
from game.templates import TEMPLATES  # noqa: E402

Base.metadata.create_all(bind=database.engine)

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def peor_vuelta(secuencia: list[str], ventana: int) -> int:
    """A qué distancia volvió lo más pronto que volvió, mirando `ventana` atrás.

    0 si nada volvió dentro de la ventana. Es la medida directa de lo que se
    quiere prohibir, y se calcula sobre la tira ya servida en vez de espiar el
    estado del selector: lo que importa es lo que la persona recibió.
    """
    peor = 0
    for i, item in enumerate(secuencia):
        atras = secuencia[max(0, i - ventana):i]
        if item in atras:
            peor = max(peor, len(atras) - atras[::-1].index(item))
    return peor


def corrida(theta: float, n: int, semilla: int) -> list[tuple[str, str]]:
    """Sirve `n` ejercicios a un jugador parado en `theta`. Devuelve (plantilla, enunciado).

    El θ se deja QUIETO a propósito: lo que se mide es qué le ofrece el motor a
    alguien que ya se estabilizó, que es el caso del reporte —quien contó las
    repeticiones llevaba decenas de derivadas, no tres—. Con el θ moviéndose la
    variedad sale gratis por el paseo, y eso taparía justo lo que hay que ver.
    """
    db = database.SessionLocal()
    player = GamePlayer(
        guest_token="tok%d" % semilla,
        alias="j%d" % semilla,
        theta=theta,
        n_updates=elo.RAMP_UPDATES + 50,
    )
    db.add(player)
    db.commit()
    rng = random.Random(semilla)
    salida = []
    for _ in range(n):
        ex = generator.serve_exercise(db, player, rng=rng)
        # Que el siguiente pedido no devuelva el mismo ejercicio todavía abierto.
        ex.status = "expired"
        db.commit()
        salida.append((ex.template_key, ex.prompt_latex))
    db.close()
    return salida


# θ elegidos para pisar los tres regímenes: la banda baja (T0-T1), la del medio
# —donde vive casi todo el mundo— y la alta, donde el catálogo se acaba y la
# escalera de rescate tiene que trabajar.
CORRIDAS = {t: corrida(t, 200, 1000 + int(t * 10)) for t in (-1.5, 0.0, 1.5, 3.0)}
SALTEO = len(generator.ONBOARDING)  # el arranque fijo no pasa por pick_template

print("1. Ninguna plantilla vuelve dentro de la ventana")

for theta, tira in CORRIDAS.items():
    keys = [k for k, _ in tira][SALTEO:]
    peor = peor_vuelta(keys, generator._RECENT_EXCLUDE)
    check(
        peor == 0,
        "theta=%s: ninguna plantilla vuelve antes de %d (peor: %d)"
        % (theta, generator._RECENT_EXCLUDE, peor),
    )


print("2. Antes de repetir se ensancha la banda")

# La prueba directa: un jugador cuya banda objetivo tiene menos plantillas que la
# ventana. Si la escalera estuviera al revés —acortar la ventana antes que
# ensanchar la banda— el resultado sería una repetición temprana en lugar de una
# derivada un poco fuera de banda.
db = database.SessionLocal()
apretado = GamePlayer(
    guest_token="apretado", alias="apretado", theta=3.0, n_updates=elo.RAMP_UPDATES + 50
)
db.add(apretado)
db.commit()
rng = random.Random(7)
elegidas: list[str] = []
fuera_de_banda = 0
for _ in range(30):
    plantilla, stat, p_hat = generator.pick_template(db, apretado, rng=rng)
    elegidas.append(plantilla.key)
    if not (elo.TARGET_LOW <= p_hat <= elo.TARGET_HIGH):
        fuera_de_banda += 1
    db.add(
        GameExercise(
            player_id=apretado.id,
            template_key=plantilla.key,
            prompt_latex="x",
            expected_derivative="1",
            theta_at_serve=apretado.theta,
            beta_at_serve=stat.beta,
            p_hat=p_hat,
            status="expired",
        )
    )
    db.commit()
db.close()

check(
    peor_vuelta(elegidas, generator._RECENT_EXCLUDE) == 0,
    "con la banda apretada tampoco repite dentro de la ventana",
)
check(
    fuera_de_banda > 0,
    "y lo paga saliendose de la banda, que es justo lo que se prefiere (%d/30)"
    % fuera_de_banda,
)
check(
    len(set(elegidas)) > generator._RECENT_EXCLUDE,
    "toco mas de %d plantillas distintas (dio %d)"
    % (generator._RECENT_EXCLUDE, len(set(elegidas))),
)


print("3. El enunciado exacto no vuelve pronto")

for theta, tira in CORRIDAS.items():
    prompts = [p for _, p in tira][SALTEO:]
    ultimo: dict[str, int] = {}
    gap_min = len(prompts)
    for i, pr in enumerate(prompts):
        if pr in ultimo:
            gap_min = min(gap_min, i - ultimo[pr])
        ultimo[pr] = i
    peor_ventana = max(
        Counter(prompts[i : i + 10]).most_common(1)[0][1]
        for i in range(len(prompts) - 9)
    )
    repetidos = sum(1 for i, pr in enumerate(prompts) if pr in prompts[:i])
    print(
        "     theta=%s: gap minimo %d, peor ventana de 10 %d/10, %d%% repetidos en %d"
        % (theta, gap_min, peor_ventana, 100 * repetidos // len(prompts), len(prompts))
    )
    # El reporte contó 4 en 10. Tres es el techo que se acepta: por debajo de eso
    # ya no se lee como «me está dando siempre la misma».
    check(peor_ventana <= 3, "theta=%s: nunca mas de 3 iguales en 10 seguidas" % theta)
    check(
        gap_min >= generator._RECENT_EXCLUDE,
        "theta=%s: el mismo enunciado no vuelve antes de %d (dio %d)"
        % (theta, generator._RECENT_EXCLUDE, gap_min),
    )


print("4. Ninguna plantilla es una sola expresion")


def variantes(template) -> int:
    estado: dict = {}
    r = random.Random(99)
    return len({str(template.build(CyclingRandom(r, estado)).f) for _ in range(200)})


flacas = [t.key for t in TEMPLATES if variantes(t) < 2]
check(
    flacas == ["t0_x"],
    "solo la derivada de x es una sola expresion, y no tiene otra forma posible (dio %s)"
    % flacas,
)

# La banda alta es la que el motor pisa cuando alguien se queda a jugar, y es
# donde estaban TODAS las degeneradas: sen(x)/x se sirvió 626 veces siendo
# siempre la misma. Ahí el piso tiene que ser cómodo, no apenas mayor que uno.
menor = min(variantes(t) for t in TEMPLATES if t.tier >= 4)
check(menor >= 9, "la plantilla mas flaca de T4-T5 tiene %d variantes" % menor)

print("\n%d fallos" % len(FAILURES) if FAILURES else "\ntodo ok")
sys.exit(1 if FAILURES else 0)
