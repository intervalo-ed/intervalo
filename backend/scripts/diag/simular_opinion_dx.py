"""Qué habría hecho la encuesta de dificultad sobre el historial real del juego.

SOLO LEE. No corre en CI (nada de `scripts/diag/` corre en CI). Pide
`DATABASE_URL` y está pensado para correrse por `railway ssh --service backend`.

## Para qué

Las constantes de `game/opinion.py` —la ventana, el encogimiento y el tope— no se
eligen de un razonamiento: se eligen mirando qué habrían hecho sobre la historia
que ya pasó. Es el mismo procedimiento con el que se eligieron `_A_USER` y
`_B_USER` («simulado contra la historia real», `game/elo.py`).

## Qué simula

Recorre la línea de tiempo de cada jugador por `game_exercises.id`, que es el
orden en que los vio, y dispara la encuesta en los mismos hitos que el front
(`HITO_OPINION`, después cada `OPINION_CADA`, tope `OPINION_MAX`). En cada
disparo calcula el Δθ que habría salido **para cada uno de los tres votos**,
porque cómo habría votado la gente no se puede saber: lo que sí se puede saber es
de qué tamaño es la palanca que se le estaría dando.

## Lo que hay que mirar en la salida

  - **Cuántos disparos mueven algo.** Si casi ninguno, la encuesta es decorativa;
    si casi todos topean, el tope está mandando sobre la evidencia y el número
    que se aplica ya no sale del registro de nadie.
  - **Cuántos cruzan de nivel**, para arriba y para abajo. Es el color del nombre
    en el ranking, y es lo que la gente ve.
  - **Cuántos están arriba del techo del catálogo.** A esos el ajuste les mueve
    la creencia y no el ejercicio (ver el docstring de `game/opinion.py`).

## Uso

    python backend/scripts/diag/simular_opinion_dx.py
    python backend/scripts/diag/simular_opinion_dx.py --i0 1,2,3 --ventana 10,20,40
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from game import elo, opinion  # noqa: E402

# Los mismos hitos que el front. Se repiten acá en vez de importarse porque el
# front es TypeScript; si allá cambian, este número queda mintiendo y por eso
# está a la vista y no escondido en una función.
HITO = 10
CADA = 30
MAX_VECES = 3

# A partir de acá el catálogo no tiene con qué: es la β creída más alta que
# existe más el ancho de la banda. Se calcula y no se tabula para que el día que
# entren los tiers 6-8 este número se corra solo.
def techo_del_catalogo(db: Session) -> float:
    filas = db.execute(
        text("select template_key, tier, beta, n_players from game_template_stats")
    ).all()
    if not filas:
        return float("inf")
    creidas = [elo.effective_beta(b, t, n or 0) for _, t, b, n in filas]
    return max(creidas) + elo._OFFSET_DE_BANDA - 1.0


def historial(db: Session) -> dict[int, list[tuple[float, bool, float]]]:
    """Por jugador, sus primeros intentos sin tabla: (p̂, acertó, θ al servir)."""
    filas = db.execute(
        text(
            """
            select e.player_id, e.id, e.p_hat, a.is_correct, e.theta_at_serve
              from game_attempts a
              join game_exercises e on e.id = a.exercise_id
              join game_players p on p.id = e.player_id
             where a.attempt_number = 1 and a.parse_ok
               and not coalesce(e.peeked, false)
               and not coalesce(p.is_bot, false)
               and e.p_hat is not null
             order by e.id
            """
        )
    ).all()
    por_jugador: dict[int, list[tuple[float, bool, float]]] = {}
    for pid, _eid, phat, ok, theta in filas:
        por_jugador.setdefault(pid, []).append((float(phat), bool(ok), float(theta or 0.0)))
    return por_jugador


def disparos(respuestas: list[tuple[float, bool, float]]) -> list[int]:
    """En qué índices de la lista habría aparecido la pregunta.

    El hito del front cuenta RESUELTAS, así que se cuentan aciertos. Es una
    aproximación: allá cuenta `exercises_correct`, que incluye las que salieron
    al segundo intento y las copiadas de la tabla, y acá esas no están. O sea que
    la simulación dispara un poco más tarde que el juego real, nunca antes.
    """
    puntos, correctas, vistas = [], 0, 0
    for i, (_p, ok, _t) in enumerate(respuestas):
        if ok:
            correctas += 1
        if vistas >= MAX_VECES:
            break
        toca = correctas >= HITO + CADA * vistas
        if toca:
            puntos.append(i)
            vistas += 1
    return puntos


def percentil(valores: list[float], q: float) -> float:
    if not valores:
        return 0.0
    orden = sorted(valores)
    return orden[min(len(orden) - 1, int(q * len(orden)))]


def simular(datos: dict, *, ventana: int, i0: float, tope: float, techo: float) -> dict:
    opinion.VENTANA, opinion.I0_PRIOR, opinion.TOPE = ventana, i0, tope
    out = {v: {"mueve": 0, "deltas": [], "topean": 0, "sube_nivel": 0, "baja_nivel": 0}
           for v in opinion.VOTOS}
    total, arriba_del_techo, jugadores = 0, 0, set()
    for pid, resp in datos.items():
        for i in disparos(resp):
            total += 1
            jugadores.add(pid)
            theta = resp[i][2]
            if theta >= techo:
                arriba_del_techo += 1
            # De la más nueva a la más vieja, que es como la espera la fórmula.
            tanda = [(p, ok) for p, ok, _t in reversed(resp[max(0, i - ventana + 1):i + 1])]
            for voto in opinion.VOTOS:
                a = opinion.ajuste_de_theta(voto, tanda)
                if a.delta == 0.0:
                    continue
                d = out[voto]
                d["mueve"] += 1
                d["deltas"].append(abs(a.delta))
                if abs(abs(a.delta) - tope) < 1e-9:
                    d["topean"] += 1
                antes, despues = elo.level_of(theta), elo.level_of(theta + a.delta)
                if despues > antes:
                    d["sube_nivel"] += 1
                elif despues < antes:
                    d["baja_nivel"] += 1
    return {"total": total, "jugadores": len(jugadores),
            "arriba_del_techo": arriba_del_techo, "votos": out}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ventana", default=str(opinion.VENTANA))
    ap.add_argument("--i0", default=str(opinion.I0_PRIOR))
    ap.add_argument("--tope", default=str(opinion.TOPE))
    args = ap.parse_args()

    url = os.environ.get("DATABASE_URL")
    if not url:
        print("falta DATABASE_URL")
        return 1
    engine = create_engine(url)
    with Session(engine) as db:
        techo = techo_del_catalogo(db)
        datos = historial(db)

    respuestas = sum(len(v) for v in datos.values())
    print(f"jugadores con historial: {len(datos)}   respuestas de primer intento: {respuestas}")
    print(f"techo del catálogo: θ ≥ {techo:.2f}")
    print(f"hitos: a las {HITO}, después cada {CADA}, tope {MAX_VECES}\n")

    for ventana in [int(x) for x in args.ventana.split(",")]:
        for i0 in [float(x) for x in args.i0.split(",")]:
            for tope in [float(x) for x in args.tope.split(",")]:
                r = simular(datos, ventana=ventana, i0=i0, tope=tope, techo=techo)
                print(f"── ventana {ventana} · I₀ {i0} · tope {tope} " + "─" * 28)
                print(f"   {r['total']} disparos sobre {r['jugadores']} jugadores; "
                      f"{r['arriba_del_techo']} arriba del techo "
                      f"({100 * r['arriba_del_techo'] / max(1, r['total']):.0f}%)")
                for voto in opinion.VOTOS:
                    d = r["votos"][voto]
                    if not d["deltas"]:
                        print(f"   {voto:<12} no mueve nunca")
                        continue
                    pct = 100 * d["mueve"] / max(1, r["total"])
                    print(f"   {voto:<12} mueve {d['mueve']:>4} ({pct:>4.0f}%)  "
                          f"|Δθ| mediana {percentil(d['deltas'], 0.5):.2f} "
                          f"p90 {percentil(d['deltas'], 0.9):.2f}  "
                          f"topean {100 * d['topean'] / max(1, d['mueve']):>3.0f}%  "
                          f"nivel +{d['sube_nivel']} −{d['baja_nivel']}")
                print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
