"""Vuelve a puntuar TODO el historial del juego con las reglas vigentes.

ESCRIBE EN LA BASE REAL: el θ de cada jugador y la β de cada plantilla. No corre
en CI. Pide confirmación salvo `--si`.

## Por qué

El re-anclaje de escala (`recentrar_escala.py`) arregló la regla hacia adelante,
pero dejó el pasado puntuado con las reglas viejas — las que le daban a la
plantilla 4,5 veces más capacidad de moverse que a la persona, y por lo tanto le
acreditaban a la derivada el mérito de quien la resolvía. Un jugador con 421
respuestas correctas seguía en el puesto 16.

Esto recalcula θ y β desde cero, respuesta por respuesta, con las reglas de hoy:
tasas rebalanceadas, tope del ancla y re-centrado continuo.

## Qué se replica, y en qué orden

La línea de tiempo se arma por `game_exercises.id`, que es el orden real en que
la persona los vio:

  - **respuestas de primer intento** que parsearon y NO se miraron con la tabla
    abierta. Son las únicas que mueven el Elo, igual que en `_aplicar_elo`.
  - **salteos** (`status='skipped'`), que restan `SKIP_THETA_PENALTY` de θ y no
    tocan ni β ni `n_updates`, igual que en el endpoint de salteo.

`n_updates` NO se toca: es un contador histórico con su propio significado —
decide quién entra al ranking— y su valor guardado no siempre coincide con el
recalculado por razones anteriores a esto.

Los jugadores sin una sola respuesta quedan en θ=0, que es donde arranca
cualquiera. Hace falta decirlo porque `recentrar_escala.py` los corrió +1,7379
junto con todos los demás, y a alguien que nunca jugó eso lo dejaba pareciendo
un veterano.

## Uso

    python backend/scripts/diag/backfill_elo.py             # simula
    python backend/scripts/diag/backfill_elo.py --aplicar
    python backend/scripts/diag/backfill_elo.py --aplicar --si
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

from game import elo  # noqa: E402


def recalcular(db: Session) -> tuple[dict[int, float], dict[str, float], dict[int, int]]:
    """Devuelve (θ por jugador, β por plantilla, respuestas por jugador)."""
    respuestas = db.execute(
        text(
            """
            select e.id, a.player_id, e.template_key, s.tier,
                   case when a.is_correct then 1 else 0 end
              from game_attempts a
              join game_exercises e on e.id = a.exercise_id
              join game_template_stats s on s.template_key = e.template_key
             where a.attempt_number = 1 and a.parse_ok
               and not coalesce(e.peeked, false)
            """
        )
    ).all()
    salteos = db.execute(
        text("select id, player_id from game_exercises where status = 'skipped'")
    ).all()

    # Una sola línea de tiempo, ordenada como la vivió la persona.
    linea: list[tuple[int, str, tuple]] = []
    for eid, pid, key, tier, hit in respuestas:
        linea.append((eid, "resp", (pid, key, tier, hit)))
    for eid, pid in salteos:
        linea.append((eid, "salteo", (pid,)))
    linea.sort(key=lambda x: x[0])

    tiers = {r[2]: r[3] for r in respuestas}
    beta = {k: elo.BETA_SEED.get(t, 0.0) for k, t in tiers.items()}
    n_obs = {k: 0 for k in beta}
    personas: dict[str, set[int]] = {k: set() for k in beta}
    theta: dict[int, float] = {}
    n_up: dict[int, int] = {}
    media_semilla = sum(elo.BETA_SEED.get(t, 0.0) for t in tiers.values()) / len(tiers)

    for _, clase, datos in linea:
        if clase == "salteo":
            (pid,) = datos
            theta[pid] = theta.get(pid, 0.0) - elo.SKIP_THETA_PENALTY
            continue

        pid, key, tier, hit = datos
        t = theta.get(pid, 0.0)
        n = n_up.get(pid, 0)
        b = beta[key]
        creida = elo.effective_beta(b, tier, len(personas[key]))
        # El mismo reparto que `elo.update`: θ contra la β encogida, β contra la
        # cruda. Se escribe acá en vez de llamar a `update` porque hace falta el
        # estado intermedio para el re-centrado.
        theta[pid] = t + elo._A_USER / (1 + elo._B_USER * n) * (hit - elo.predict(t, creida))
        n_up[pid] = n + 1
        beta[key] = b - elo._A_TEMPLATE / (1 + elo._B_TEMPLATE * n_obs[key]) * (
            hit - elo.predict(t, b)
        )
        n_obs[key] += 1
        personas[key].add(pid)

        delta = media_semilla - sum(beta.values()) / len(beta)
        if abs(delta) > elo.RECENTRADO_UMBRAL:
            for k in beta:
                beta[k] += delta

    return theta, beta, n_up


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true")
    ap.add_argument("--si", action="store_true")
    args = ap.parse_args()

    url = os.environ.get("DATABASE_URL", "")
    if not url:
        print("falta DATABASE_URL")
        return 1
    engine = create_engine(url.replace("postgres://", "postgresql://", 1))

    with Session(engine) as db:
        theta, beta, n_up = recalcular(db)
        jugadores = db.execute(text("select id, theta, n_updates from game_players")).all()

        hoy = {p: float(t) for p, t, n in jugadores if n >= elo.RAMP_UPDATES}
        nuevo = {p: theta[p] for p in theta if n_up.get(p, 0) >= elo.RAMP_UPDATES}
        sin_historia = [p for p, _, _ in jugadores if p not in theta]

        print("respuestas replicadas: %d | salteos: %d" % (
            sum(n_up.values()),
            db.execute(text("select count(*) from game_exercises where status='skipped'")).scalar(),
        ))
        print("jugadores con historia: %d | sin una sola respuesta: %d" % (
            len(theta), len(sin_historia)))

        orden_hoy = sorted(hoy, key=lambda p: -hoy[p])
        orden_nuevo = sorted(nuevo, key=lambda p: -nuevo[p])
        pos_hoy = {p: i + 1 for i, p in enumerate(orden_hoy)}
        pos_nuevo = {p: i + 1 for i, p in enumerate(orden_nuevo)}
        subieron = sum(1 for p in nuevo if p in pos_hoy and pos_nuevo[p] < pos_hoy[p])
        bajaron = sum(1 for p in nuevo if p in pos_hoy and pos_nuevo[p] > pos_hoy[p])
        print("\npuestos: %d suben, %d bajan, %d quedan" % (
            subieron, bajaron, len(nuevo) - subieron - bajaron))

        vals = sorted(nuevo.values())
        pct = lambda L, f: L[int(f * (len(L) - 1))]  # noqa: E731
        mediana_hoy = elo.rating_of(pct(sorted(hoy.values()), 0.5))
        base = round(mediana_hoy - elo.RATING_PER_THETA * pct(vals, 0.5))
        print("\nmediana de rating hoy: %d" % mediana_hoy)
        print("RATING_BASE que la deja quieta: %d  (hoy %d)" % (base, elo.RATING_BASE))
        if base != elo.RATING_BASE:
            print("  -> hay que ponerlo en elo.py EN EL MISMO DEPLOY que esta corrida")

        if not args.aplicar:
            print("\n(simulacion: no se escribio nada. Correr con --aplicar)")
            return 0

        if not args.si:
            print("\nEsto reescribe el theta de %d jugadores y la beta de %d plantillas." % (
                len(jugadores), len(beta)))
            if input("Escribir 'si' para confirmar: ").strip().lower() != "si":
                print("cancelado")
                return 1

        for pid, th in theta.items():
            db.execute(
                text("update game_players set theta = :t where id = :i"), {"t": th, "i": pid}
            )
        for pid in sin_historia:
            db.execute(text("update game_players set theta = 0 where id = :i"), {"i": pid})
        for key, b in beta.items():
            db.execute(
                text("update game_template_stats set beta = :b where template_key = :k"),
                {"b": b, "k": key},
            )
        db.commit()
        print("\nlisto: %d jugadores recalculados, %d puestos en 0 por no tener historia, "
              "%d plantillas" % (len(theta), len(sin_historia), len(beta)))
        print("RECORDAR: RATING_BASE tiene que quedar en %d" % base)
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
