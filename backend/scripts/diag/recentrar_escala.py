"""Corre la escala de dificultad entera, una vez, para re-anclarla a las semillas.

ESCRIBE EN LA BASE REAL. No corre en CI. Pide confirmación salvo `--si`.

## Qué arregla

`p̂ = σ((θ − β)·SCALE)` depende de la RESTA, así que sumarle la misma constante a
todos los θ y todas las β no cambia ninguna predicción: la escala tiene un grado
de libertad suelto. Suelto no se queda quieto — con las tasas viejas
(`a/b` = 24 para la plantilla contra 5,3 para la persona) se fue siempre para el
mismo lado, y medido el 2026-09-11 las 29 β habían quedado 2,4 unidades por
debajo de sus semillas en promedio.

El código nuevo ancla la escala de acá en adelante (`_recentrar_escala` en
`game/router.py`). Este script arregla lo que ya pasó.

## Por qué corre θ TAMBIÉN, y no solo β

Porque θ solo significa algo relativo a β. Si se corren las β sin tocar los θ, el
motor pasa a creer que toda la gente es 2,4 unidades más débil de lo que es, y
les sirve ejercicios más fáciles hasta que θ se recupere. Está medido contra la
historia real: **el 56% de los jugadores caería a T0-T1**, y tardarían alrededor
de un mes de tráfico en volver a donde estaban.

Correr las dos cosas juntas es un CAMBIO DE COORDENADAS, no de creencias: ni una
predicción cambia, nadie recibe un ejercicio distinto al que hubiera recibido, y
ningún rating se mueve. Lo único que cambia es que a partir de ahí las β están
donde su semilla dice, así que el ancla nueva tiene contra qué anclar y la
sorpresa de cada respuesta empieza a irse a θ en vez de a la plantilla.

## La corrección no es exacta, y está bien

`effective_beta` mezcla la β cruda con la semilla, y la semilla NO se corre. Así
que la β creída se mueve un poco menos que la cruda: `δ · n/(n+prior)`. El script
calcula el δ de θ con esa ponderación —el promedio real sobre las plantillas
servidas— en vez de usar el δ crudo, que sobrecorregiría.

## Uso

    python backend/scripts/diag/recentrar_escala.py            # simula, no escribe
    python backend/scripts/diag/recentrar_escala.py --aplicar  # pide confirmación
    python backend/scripts/diag/recentrar_escala.py --aplicar --si
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


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true", help="escribe (si no, solo simula)")
    ap.add_argument("--si", action="store_true", help="no preguntar")
    args = ap.parse_args()

    url = os.environ.get("DATABASE_URL", "")
    if not url:
        print("falta DATABASE_URL")
        return 1
    engine = create_engine(url.replace("postgres://", "postgresql://", 1))

    with Session(engine) as db:
        filas = db.execute(
            text("select template_key, tier, beta, n_players from game_template_stats")
        ).all()
        if not filas:
            print("no hay plantillas: nada que hacer")
            return 0

        betas = {f[0]: float(f[2]) for f in filas}
        tiers = {f[0]: int(f[1]) for f in filas}
        jugadores = {f[0]: int(f[3]) for f in filas}

        delta = elo.desvio_de_escala(betas, tiers)
        print("plantillas: %d" % len(betas))
        print("media de beta: %+.3f   media de semillas: %+.3f" % (
            sum(betas.values()) / len(betas),
            sum(elo.BETA_SEED.get(t, 0.0) for t in tiers.values()) / len(tiers),
        ))
        print("delta de beta: %+.4f" % delta)

        if abs(delta) <= elo.RECENTRADO_UMBRAL:
            print("la escala ya esta centrada; no hay nada que correr")
            return 0

        # El delta de theta es el de beta ponderado por cuanto de la beta cruda
        # llega a la beta CREIDA, que es lo que el motor usa para predecir. Se
        # pesa por ejercicios servidos: lo que importa es el efecto promedio
        # sobre lo que la gente realmente recibe, no sobre el catalogo.
        servidos = dict(
            db.execute(
                text("select template_key, count(*) from game_exercises group by 1")
            ).all()
        )
        num = den = 0.0
        for key in betas:
            n = jugadores[key]
            if elo.BETA_PRIOR_CAP:
                n = min(n, elo.BETA_PRIOR_CAP)
            frac = n / (n + elo.BETA_PRIOR_PLAYERS) if n > 0 else 0.0
            peso = float(servidos.get(key, 0)) or 1.0
            num += frac * peso
            den += peso
        delta_theta = delta * (num / den)
        print("delta de theta: %+.4f (el de beta ponderado por cuanto llega a la beta creida)" % delta_theta)

        jug = db.execute(
            text("select count(*), avg(theta) from game_players where n_updates >= :r"),
            {"r": elo.RAMP_UPDATES},
        ).one()
        print("\njugadores calificados: %d, theta promedio %+.3f -> %+.3f" % (
            jug[0], float(jug[1] or 0.0), float(jug[1] or 0.0) + delta_theta))
        print("rating promedio: %d -> %d  (con RATING_BASE=%d)" % (
            elo.rating_of(float(jug[1] or 0.0)),
            elo.rating_of(float(jug[1] or 0.0) + delta_theta),
            elo.RATING_BASE,
        ))
        print("\nOJO: para que los ratings y los cinturones NO se muevan hay que")
        print("bajar RATING_BASE en %d y subir _LEVEL_CUTS en %.3f, en el mismo" % (
            round(elo.RATING_PER_THETA * delta_theta), delta_theta))
        print("deploy. Si no se hace, todos ganan %d puntos de rating de golpe." % (
            round(elo.RATING_PER_THETA * delta_theta)))

        if not args.aplicar:
            print("\n(simulacion: no se escribio nada. Correr con --aplicar)")
            return 0

        if not args.si:
            print("\nEsto escribe en la base REAL: %d plantillas y TODOS los jugadores." % len(betas))
            if input("Escribir 'si' para confirmar: ").strip().lower() != "si":
                print("cancelado")
                return 1

        db.execute(text("update game_template_stats set beta = beta + :d"), {"d": delta})
        db.execute(text("update game_players set theta = theta + :d"), {"d": delta_theta})
        db.commit()
        print("\nlisto: %d plantillas corridas %+.4f, jugadores corridos %+.4f" % (
            len(betas), delta, delta_theta))
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
