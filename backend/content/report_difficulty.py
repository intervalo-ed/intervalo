# -*- coding: utf-8 -*-
"""Reporte de calibración: qué unidades están fuera de la banda 55-77 % de P1.

La banda sale de cruzar la micro-encuesta de dificultad (`exercise_feedback`,
pregunta A) con el P1 medido de los ítems votados: "muy fácil" promedia 77 %,
"justo" 61 %, "muy difícil" 55 %. Ver regla 78 de `authoring-context.md`.

P1 = % de respuestas con `quality_score = 5` (acierto al primer intento). NO
usar `Answer.is_correct`: es `attempts <= 3` y por eso da 90-100 % en cualquier
ítem de 3 o 4 opciones sin decir nada sobre dificultad real.

Uso (solo lectura, contra producción):
  DB_URL=postgresql://... python content/report_difficulty.py
  DB_URL=... python content/report_difficulty.py --course probabilidad
  DB_URL=... python content/report_difficulty.py --min-n 10
  DB_URL=... python content/report_difficulty.py --json

Sin argumentos reporta las tres bandas (dura/en banda/fácil) de todos los
cursos, con n≥20. `--min-n` baja el umbral para topics chicos, a costa de
confianza estadística: avisar esa pérdida es responsabilidad de quien lo corre,
no del script.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

import psycopg2
import psycopg2.extras

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure") and (_stream.encoding or "").lower() != "utf-8":
        _stream.reconfigure(encoding="utf-8", errors="replace")

BANDA_BAJA = 55
BANDA_ALTA = 77

QUERY = """
select c.slug as curso, a.belt, a.topic, a.exercise_type as skill,
       count(*) as n,
       count(distinct a.user_id) as usuarios,
       round(100.0 * avg(case when a.quality_score = 5 then 1.0 else 0 end)) as p1,
       round(100.0 * avg(case when a.quality_score = 1 then 1.0 else 0 end)) as agotado
from answers a
join courses c on c.id = a.course_id
where a.quality_score is not null
  and (%(course)s is null or c.slug = %(course)s)
group by 1, 2, 3, 4
having count(*) >= %(min_n)s
order by curso, p1
"""


def veredicto(p1: float) -> str:
    if p1 < BANDA_BAJA:
        return "DURA"
    if p1 > BANDA_ALTA:
        return "FACIL"
    return "en banda"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                      formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--course", help="filtrar a un solo curso (slug)")
    parser.add_argument("--min-n", type=int, default=20,
                         help="exposición mínima por unidad (default 20)")
    parser.add_argument("--json", action="store_true", help="salida JSON, sin resumen")
    args = parser.parse_args()

    url = os.environ.get("DB_URL")
    if not url:
        print("Falta DB_URL. Ver Railway → servicio BBDD → Variables → "
              "DATABASE_PUBLIC_URL.", file=sys.stderr)
        return 1

    conn = psycopg2.connect(url, connect_timeout=15)
    conn.set_session(readonly=True, autocommit=True)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(QUERY, {"course": args.course, "min_n": args.min_n})
            filas = cur.fetchall()
    finally:
        conn.close()

    for f in filas:
        f["veredicto"] = veredicto(f["p1"])

    if args.json:
        print(json.dumps(filas, indent=2, default=str))
        return 0

    duras = [f for f in filas if f["veredicto"] == "DURA"]
    faciles = [f for f in filas if f["veredicto"] == "FACIL"]
    en_banda = [f for f in filas if f["veredicto"] == "en banda"]

    def tabla(titulo: str, rows: list) -> None:
        print(f"\n{titulo} ({len(rows)})")
        print("-" * len(titulo))
        if not rows:
            print("  (ninguna)")
            return
        for r in rows:
            unidad = f"{r['curso']}/{r['belt']}/{r['topic']}/{r['skill']}"
            print(f"  {unidad:<48} n={r['n']:<5} usuarios={r['usuarios']:<4} "
                  f"P1={r['p1']:>3.0f}%  agotó={r['agotado']:>3.0f}%")

    tabla(f"MUY DIFÍCILES (P1 < {BANDA_BAJA}%)", duras)
    tabla(f"MUY FÁCILES (P1 > {BANDA_ALTA}%)", faciles)
    print(f"\nen banda ({BANDA_BAJA}-{BANDA_ALTA}%): {len(en_banda)}")
    print(f"\nTotal de unidades con n≥{args.min_n}: {len(filas)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
