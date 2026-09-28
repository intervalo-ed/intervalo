"""Reescribe θ y β a la escala recalibrada del 27/09/2026. Una sola vez.

ESCRIBE EN LA BASE REAL. No corre en CI. Pide confirmación salvo `--si`.

## Qué arregla

`elo.SCALE` valía 0,818, heredado de la calibración por temperatura de Intervalo
clásico. Medido contra 23.444 respuestas del propio juego, el valor real es
**1,1266**: la escala estaba estirada un 37%.

El costo no era cosmético. Con la escala corta el motor predice más cerca de 0,5
de lo que corresponde, y para el caso normal —alguien al que el ejercicio le
queda fácil— eso significa prometer menos acierto del que va a haber. Sobre
53.842 primeras respuestas sin tabla: **prometía 83,86% y la gente entregaba
91,48%**, un sesgo de +7,62 pp presente en todos los tramos de la curva de
calibración. Traducido: la banda objetivo [0,70 , 0,80] son (θ−β) ∈ [1,04 , 1,70]
en unidades del motor, y ese rango con la escala real da p̂ ∈ [0,76 , 0,87]. **El
motor apuntaba a 75% y servía 82%.**

Las semillas tenían el mismo problema y peor: puestas a mano separadas de a 0,6,
cuando los tiers se separan 0,31 medidos. `desvio_de_escala` no veía nada porque
solo corrige la MEDIA, y las derivas se cancelaban entre sí (T8 se creía 1,08 más
difícil de lo que es; T1, 0,90 más fácil).

## De dónde salen los números

De un **Rasch conjunto** —habilidad por persona y dificultad por plantilla
estimadas a la vez por máxima verosimilitud, de los datos crudos— y NO de las
creencias del motor, que es lo que lo haría circular. La selección adaptativa es
ignorable para el MLE conjunto: el motor eligió en función de creencias que son
función de las respuestas ya observadas.

Se ajusta sobre las **últimas 100 respuestas de cada jugador**. El Rasch da UNA
habilidad por persona, así que sobre la historia entera promedia a cada uno con
su propio pasado y subestima a quien mejoró. Verificado: con la historia completa
el motor parecía sobreestimar a los veteranos en 203 puntos de rating; con la
ventana reciente son 102, y la diferencia era el supuesto, no el motor.

También se verificó que excluir a quien acertó TODO (su MLE es infinito) no
inventa el resultado: son 24 jugadores, todos con 46 respuestas o menos, ninguno
por encima de 250.

## Por qué θ se mapea con una AFÍN y no persona por persona

El Rasch solo cubre a los 501 jugadores con 15 o más respuestas limpias. Un mapa
que trate distinto a esos 501 reordenaría el ranking: alguien pasaría a otro por
haber estado en la muestra. La afín preserva el orden exactamente, y el residuo
por persona lo corrige el propio motor online — más rápido que antes, porque con
las creencias arregladas lo que se sirve informa más.

    θ_nuevo = 0,798 · θ_viejo + 0,6974      (R² 0,755 sobre 501, residuo sd 0,572)

## Lo que la persona ve: nada

`RATING_BASE` y `RATING_PER_THETA` se movieron (821/200 → 646/251) justamente
para absorber esta afín. **El rating de cada jugador queda igual a menos de 2
puntos y 1.213 de 1.670 no se mueven ni uno.** De color, 815 suben y ninguno
baja.

## Lo que NO es exacto, y está bien

`effective_beta` mezcla la β cruda con la semilla del tier y la semilla NO se
toca acá (ya está en el código). Así que la β creída queda tirada hacia la media
de su tier: con el tope de `BETA_PRIOR_CAP` la semilla pesa como mínimo 29%. Para
`t8_quot_cadena` (β real 2,18, semilla de T8 1,54) eso significa servirla como si
fuera 1,99. Es el guardarraíl contra la selección adaptativa haciendo su trabajo,
es el mismo comportamiento que antes, y se deja así a propósito.

## Uso

    python backend/scripts/diag/recalibrar_motor.py            # simula, no escribe
    python backend/scripts/diag/recalibrar_motor.py --aplicar  # pide confirmación
    python backend/scripts/diag/recalibrar_motor.py --aplicar --si
"""

from __future__ import annotations

import argparse
import os
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy import create_engine, text  # noqa: E402

from game import elo  # noqa: E402

# El mapa de θ, congelado el 27/09/2026. Ver el encabezado.
AFIN_A = 0.798
AFIN_B = 0.6974

# La β de cada plantilla, del mismo ajuste. Las que no estén acá no se tocan:
# una plantilla con menos de 30 respuestas no tiene estimación propia y se queda
# con lo que tenga, que el encogimiento ya tira hacia la semilla nueva.
BETAS: dict[str, float] = {
    "t0_const": -2.429, "t0_x": -1.339,
    "t1_kpow": -1.543, "t1_kx": -1.914, "t1_pow": -1.080, "t1_recip": 0.578,
    "t1_sqrt": 0.443,
    "t2_pow_plus_const": -1.057, "t2_sum2": -0.392, "t2_sum3": -0.187,
    "t3_ax": 0.981, "t3_cos": 0.819, "t3_exp": -1.089, "t3_ln": -1.066,
    "t3_loga": 0.365, "t3_mix_sum": -0.708, "t3_sin": -0.290, "t3_tan": 0.640,
    "t3_trig_sum": 0.660,
    "t4_exp_cos": 0.497, "t4_exp_sin": -0.198, "t4_pow_exp": 0.424,
    "t4_pow_ln": 0.385, "t4_pow_sin": 0.790,
    "t5_exp_over_pow": 0.909, "t5_linear_over_linear": 1.154,
    "t5_ln_over_x": 0.854, "t5_pow_over_linear": 1.062, "t5_sin_over_x": 1.274,
    "t6_cos_lineal": 0.899, "t6_exp_lineal": 0.085, "t6_ln_lineal": 0.058,
    "t6_pow_lineal": 1.144, "t6_sin_lineal": 0.986,
    "t7_exp_poly": 2.011, "t7_ln_poly": 1.091, "t7_pow_poly": 1.197,
    "t7_pow_trig": 1.960, "t7_sqrt_poly": 1.305,
    "t8_cos_ln": 1.363, "t8_exp_sin": 0.431, "t8_pow_ln": 1.832,
    "t8_prod_cadena": 1.914, "t8_quot_cadena": 2.178,
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true",
                    help="escribe en la base (si no, solo simula)")
    ap.add_argument("--si", action="store_true", help="no pedir confirmación")
    args = ap.parse_args()

    url = os.environ.get("DATABASE_PUBLIC_URL") or os.environ.get("DATABASE_URL")
    if not url:
        print("Falta DATABASE_URL (o DATABASE_PUBLIC_URL).", file=sys.stderr)
        return 2
    eng = create_engine(url, pool_pre_ping=True)

    with eng.connect() as c:
        jug = [dict(r._mapping) for r in c.execute(text(
            "SELECT id, theta, n_updates, is_bot FROM game_players"))]
        st = [dict(r._mapping) for r in c.execute(text(
            "SELECT template_key, tier, beta, n_players FROM game_template_stats"))]

    # ── Lo que va a pasar ────────────────────────────────────────────────────
    activos = [p for p in jug if (p["n_updates"] or 0) >= 1 and not p["is_bot"]]
    print(f"jugadores: {len(jug)} ({len(activos)} no-bot con al menos una respuesta)")
    print(f"plantillas con fila: {len(st)}   con β nueva: "
          f"{sum(1 for s in st if s['template_key'] in BETAS)}")

    def nivel(t: float) -> int:
        return elo.level_of(t)

    d_rating, sube, baja, quieto = [], 0, 0, 0
    for p in activos:
        vieja = float(p["theta"] or 0.0)
        nueva = AFIN_A * vieja + AFIN_B
        # El rating viejo se recalcula con las constantes viejas a mano: el
        # módulo ya tiene las nuevas cargadas.
        r_viejo = max(400, round(821 + 200 * vieja))
        r_nuevo = elo.rating_of(nueva)
        d_rating.append(r_nuevo - r_viejo)
        n_viejo = sum(1 for cut in (0.3, 1.6, 3.7) if vieja >= cut)
        n_nuevo = nivel(nueva)
        if n_nuevo > n_viejo:
            sube += 1
        elif n_nuevo < n_viejo:
            baja += 1
        else:
            quieto += 1

    print(f"\nθ: ×{AFIN_A} + {AFIN_B}")
    print(f"  mediana {statistics.median([float(p['theta'] or 0) for p in activos]):.3f}"
          f" → {statistics.median([AFIN_A*float(p['theta'] or 0)+AFIN_B for p in activos]):.3f}")
    print(f"rating: cambio medio {statistics.fmean(d_rating):+.2f} puntos, "
          f"máximo |{max(abs(x) for x in d_rating)}|, "
          f"sin moverse {sum(1 for x in d_rating if x == 0)}/{len(d_rating)}")
    print(f"nivel: suben {sube}, BAJAN {baja}, quedan {quieto}")
    if baja:
        print("  ¡OJO! con los números del 27/09 no bajaba nadie. Mirar antes de aplicar.")

    print(f"\nβ por tier (cruda → nueva):")
    for t in sorted({s["tier"] for s in st}):
        g = [s for s in st if s["tier"] == t]
        con = [s for s in g if s["template_key"] in BETAS]
        if not con:
            continue
        print(f"  T{t}: {statistics.fmean([s['beta'] for s in con]):>6.2f} → "
              f"{statistics.fmean([BETAS[s['template_key']] for s in con]):>6.2f}"
              f"   (semilla nueva {elo.BETA_SEED.get(t, 0):>6.2f}, {len(con)} plantillas)")

    if not args.aplicar:
        print("\n(simulación: no se escribió nada. Correr con --aplicar)")
        return 0

    print("\nESTO ESCRIBE EN LA BASE REAL y reescribe el θ de todos.")
    if not args.si:
        if input("Escribir 'si' para confirmar: ").strip().lower() != "si":
            print("cancelado")
            return 1

    with eng.begin() as c:
        c.execute(text("UPDATE game_players SET theta = :a * theta + :b"),
                  {"a": AFIN_A, "b": AFIN_B})
        for clave, beta in BETAS.items():
            c.execute(text("UPDATE game_template_stats SET beta = :b "
                           "WHERE template_key = :k"), {"b": beta, "k": clave})
    print(f"listo: {len(jug)} jugadores y {len(BETAS)} plantillas reescritos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
