"""Los cinco estados del bloque de experimentos POR GRUPO, ejecutados de verdad.

**Por qué existe este check.** El estado que importa —«hay muestra suficiente,
acá está el p-valor»— solo corre cuando los dos brazos llegan al n comprometido,
o sea semanas después de desplegarlo. El 13/09 la pestaña de experimentos por
jugador tenía en esa misma rama un `num()` sobre la tupla del intervalo en vez
de sobre sus elementos: se rompía justo el día que hubiera datos, y hasta
entonces nadie lo veía. Este check ejecuta las cinco ramas hoy.

El escenario sale de la asignación real del A/B de la imagen
(`docs/experimentos/2026-09-14-ab-imagen-asignacion.csv`): los grupos con su
universidad y sus miembros de verdad, y un clickrate por grupo sacado de la
distribución medida en la camada del 07/09 —media por universidad más ruido con
σ_w = 5,66 pp—. Así el check no prueba una maqueta sino la forma que los datos
van a tener.

Sale con código 1 si algo falla.
"""
import csv
import io
import os
import random
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
RAIZ = BACKEND.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "experimento.db").replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(RAIZ))

import database  # noqa: E402
from models import (  # noqa: E402
    Base, GameAttempt, GameExercise, GameGroup, GamePlayer,
)
from metrics import game_queries as q  # noqa: E402
from metrics import game_render  # noqa: E402

CSV = RAIZ / "docs" / "experimentos" / "2026-09-14-ab-imagen-asignacion.csv"

# Las bases por universidad de la camada del 07/09 y el desvío dentro de casa.
# No son decoración: con bases muy distintas entre universidades, un estimador
# que NO estratifique se nota — y es justo lo que este bloque tiene que hacer.
BASE_UNI = {"UBA": 10.9, "UNC": 8.1, "UNLP": 8.0, "UNSAM": 17.4, "UTN": 4.9}
SIGMA_W = 5.66
LUNES = datetime(2026, 9, 15, 15, 0)

fallos: list[str] = []


def check(nombre: str, ok: bool, detalle: str = "") -> None:
    print(("ok    " if ok else "FALLA ") + nombre + (f" {detalle}" if detalle else ""))
    if not ok:
        fallos.append(nombre)


def escenario(por_brazo: int, efecto_pp: float, semilla: int = 5):
    """Siembra `por_brazo` grupos de cada brazo, con `efecto_pp` extra en el test."""
    Base.metadata.drop_all(bind=database.engine)
    Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    rng = random.Random(semilla)

    porb: dict[str, list[dict]] = {}
    for f in csv.DictReader(io.open(CSV, encoding="utf-8")):
        porb.setdefault(f["brazo"], []).append(f)
    elegidos = [f for brazo in porb for f in porb[brazo][:por_brazo]]

    pid = 0
    for f in elegidos:
        db.add(GameGroup(id=f["id"], universidad=f["universidad"],
                         miembros=int(f["miembros"]), producto="dx",
                         ultimo_envio=LUNES.date(), ultima_campana=f["brazo"],
                         fuente=f["fuente"], synced_at=LUNES))
        tasa = rng.gauss(BASE_UNI.get(f["universidad"], 8.0), SIGMA_W)
        if f["brazo"].endswith("tratamiento"):
            tasa += efecto_pp
        for k in range(max(0, round(int(f["miembros"]) * tasa / 100))):
            pid += 1
            cuando = LUNES + timedelta(hours=k % 40)
            db.add(GamePlayer(
                id=pid, alias=f"j{pid}", university=f["universidad"], theta=0.5,
                n_updates=5, xp=10, unlocked_keys="pow", first_group_id=f["id"],
                is_bot=False, created_at=cuando, last_seen_at=cuando))
            # Dos de cada tres llegan a que se les sirva una derivada, y uno de
            # cada seis vuelve otro día: son los guardarraíles, que se calculan
            # siempre y no esperan al n.
            if k % 3 != 2:
                db.add(GameExercise(
                    id=pid, player_id=pid, template_key="t", prompt_latex="x",
                    expected_derivative="1", status="open", theta_at_serve=0.5,
                    beta_at_serve=-1.0, p_hat=0.8, created_at=cuando))
                db.add(GameAttempt(
                    player_id=pid, exercise_id=pid, attempt_number=1,
                    is_correct=True, parse_ok=True, xp_awarded=25,
                    created_at=cuando))
                if k % 6 == 0:
                    db.add(GameExercise(
                        id=100000 + pid, player_id=pid, template_key="t",
                        prompt_latex="x", expected_derivative="1", status="open",
                        theta_at_serve=0.5, beta_at_serve=-1.0, p_hat=0.8,
                        created_at=LUNES + timedelta(days=2)))
    db.commit()
    return db


def leer(db):
    """El payload y el HTML de la pestaña, como los ve el panel."""
    q.FIRST_WEEK = LUNES.date() - timedelta(days=LUNES.weekday())
    p = q.build(db, q.FIRST_WEEK)
    html = game_render.page(p, token="tok", seccion="experimentacion")
    db.close()
    return p["experimentos_grupos"][0], html


N_PEDIDO = q.n_comprometido_medias(q.EXPERIMENTOS_GRUPOS[0])
print(f"— el n comprometido sale de los parámetros declarados ({N_PEDIDO} por brazo) —")
check("el n comprometido es el del documento", N_PEDIDO == 88, f"({N_PEDIDO})")

print()
print("— los cinco estados —")

exp, html = leer(escenario(0, 0.0))
check("sin un solo grupo, el bloque dice que no hay datos",
      exp["sin_arrancar"] and "Sin datos todavía" in html)

exp, html = leer(escenario(30, 0.0))
check("a mitad de camino se niega a contestar",
      "Todavía no se puede leer" in html and exp["lectura"] is None,
      f'(n={[b["n"] for b in exp["brazos"]]})')
check("y dice cuántos grupos faltan por brazo",
      f'faltan {N_PEDIDO - 30}' in html)

# Las tres ramas de `lectura`, que son las que solo corren con muestra completa.
exp, html = leer(escenario(N_PEDIDO, 0.0))
L = exp["lectura"]
check("con la muestra completa y sin efecto, no rechaza",
      "Sin diferencia detectable" in html and not L["rechaza"],
      f'(delta {L["delta_pp"]} pp, p {L["p_valor"]:.3f})')
check("y el intervalo contiene al cero, como corresponde",
      L["ic_pp"][0] <= 0 <= L["ic_pp"][1], f'({L["ic_pp"]})')

exp, html = leer(escenario(N_PEDIDO, 4.0))
L = exp["lectura"]
check("con un efecto grande a favor, rechaza",
      "Diferencia significativa" in html and L["rechaza"] and L["delta_pp"] > 0,
      f'(delta {L["delta_pp"]} pp, p {L["p_valor"]:.4f})')
check("y el intervalo se corre entero arriba del cero",
      L["ic_pp"][0] > 0, f'({L["ic_pp"]})')
# El signo importa: un efecto a favor que se dibujara como «pierde» sería peor
# que no dibujarlo, porque se leería como que la variante hace daño.
check("y el tono dice que gana, no que pierde",
      'a favor' in html and 'EN CONTRA' not in html)

exp, html = leer(escenario(N_PEDIDO, -4.0))
L = exp["lectura"]
check("con un efecto en contra, también rechaza",
      L["rechaza"] and L["delta_pp"] < 0,
      f'(delta {L["delta_pp"]} pp)')
check("y lo dice EN CONTRA, que es la mitad del valor de un test a dos colas",
      'EN CONTRA' in html)
check("con el intervalo entero abajo del cero", L["ic_pp"][1] < 0, f'({L["ic_pp"]})')

print()
print("— que el estimador mida lo que se le inyecta —")
# Con 88 por brazo el error estándar de la diferencia es ~0,86 pp, así que un
# efecto de 6 pp tiene que recuperarse dentro de ~3 pp. La tolerancia es ancha
# a propósito: lo que se quiere atrapar es un error de escala o de signo, no
# ruido de muestreo.
exp, _ = leer(escenario(N_PEDIDO, 6.0, semilla=17))
check("un efecto inyectado de 6 pp se recupera",
      abs(exp["lectura"]["delta_pp"] - 6.0) < 3.0,
      f'(midió {exp["lectura"]["delta_pp"]} pp)')

# Y la invariante que ata las dos salidas: rechazar y que el intervalo excluya
# al cero son la MISMA afirmación (dualidad test/IC). Si alguna vez se separan,
# una de las dos está mal calculada.
print()
print("— la dualidad entre el test y el intervalo —")
for efecto in (0.0, 3.0, -3.0, 6.0):
    exp, _ = leer(escenario(N_PEDIDO, efecto, semilla=23))
    L = exp["lectura"]
    excluye = L["ic_pp"][0] > 0 or L["ic_pp"][1] < 0
    check(f"con efecto {efecto:+.0f} pp, rechazar e IC sin el cero dicen lo mismo",
          L["rechaza"] == excluye,
          f'(rechaza={L["rechaza"]}, IC={L["ic_pp"]})')

print()
if fallos:
    print(f"FALLARON {len(fallos)}: " + ", ".join(fallos))
    raise SystemExit(1)
print("todo ok")
