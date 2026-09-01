# -*- coding: utf-8 -*-
"""Estadísticas por EJERCICIO individual, para decidir descartes del banco.

Hermano de `report_difficulty.py`, que agrega por ítem (topic × skill). Este
agrega por `answers.exercise_external_id`, que es la identidad real del
ejercicio, y le cruza los cuatro canales de `exercise_feedback`.

P1 = % de respuestas con `quality_score = 5` (acierto al primer intento). NUNCA
`is_correct`: es `attempts <= 3` y da 90-100 % en cualquier ítem de 4 opciones.

Tres cosas que este script hace y que una consulta ingenua no haría:

1. **Corta la serie en --desde (default 2026-08-10).** Hasta el commit 3a98bf03
   (23/08/2026) el external_id salía de la POSICIÓN en el array, y el deep-clean
   del 10/08 llevó los 23 archivos de white/functions de 50 a 30 ejercicios. Toda
   respuesta anterior al 10/08 nombra un ejercicio distinto del que ese id nombra
   hoy. Verificado comparando 13206094 contra 3a98bf03: `tags` y `correct_index`
   calzan 30/30 en los 23 archivos, o sea que del 10/08 en adelante las
   posiciones son estables y los cambios fueron reescrituras en el lugar.

2. **Encoge el P1 hacia la media del ítem.** Con n = 5 el desvío del estimador
   de una proporción ronda 0,22: un 0,60 medido puede ser un 0,40 real. El P1
   crudo por ejercicio es casi todo ruido de muestreo. Se reporta `p1` (crudo) y
   `p1_shrunk` = (n·p1 + k·p1_ítem) / (n + k), con k = 4, que es el mismo
   pseudo-conteo que usa el Elo jerárquico en algorithm/elo.py para mezclar la
   dificultad del ejercicio con la de su ítem. Para ordenar, usar el shrunk.

3. **Cuenta los huérfanos.** Hay ids servidos que ya no existen en el catálogo
   (123 al 26/08, ver content/stamp_ids.py). El join va LEFT y los huérfanos se
   reportan aparte en vez de desaparecer en silencio.

Uso (sólo lectura, contra producción):
  DB_URL=postgresql://... python content/report_exercise_stats.py --course analisis
  DB_URL=... python content/report_exercise_stats.py --course analisis --json > out.json
  DB_URL=... python content/report_exercise_stats.py --course analisis --prefix white_

La credencial va SIEMPRE por variable de entorno, nunca en la línea de comando.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections import defaultdict

import psycopg2
import psycopg2.extras

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure") and (_stream.encoding or "").lower() != "utf-8":
        _stream.reconfigure(encoding="utf-8", errors="replace")

# Ventana en la que un external_id significa siempre el mismo contenido.
DESDE_DEFAULT = "2026-08-10"
# Pseudo-conteo del encogido hacia la media del ítem. Mismo valor que el
# w = n/(n+4) de algorithm/elo.py.
K_SHRINK = 4
BANDA_BAJA, BANDA_ALTA = 55, 77

# --- Exclusiones de la sección 1 del informe del 26/08 -----------------------
# La cuenta del fundador (1.880 respuestas) queda fuera de toda norma de
# comportamiento: por sí sola movería cualquier media. El segundo usuario, con
# 864 respuestas, parece una persona real muy intensa y no una cuenta de prueba;
# se lo excluye igual porque domina el n de los ejercicios que tocó.
VOL_MAX_DEFAULT = 800

Q_EXCLUIDOS = """
select u.id, count(a.id) as n
from users u join answers a on a.user_id = u.id
group by u.id
having count(a.id) >= %(vol_max)s
order by n desc
"""

Q_RESPUESTAS = """
select a.exercise_external_id                                  as ext,
       count(*)                                                as n,
       count(*) filter (where s.mode = 'main')                  as n_main,
       count(distinct a.user_id)                                as usuarios,
       count(*) filter (where a.quality_score = 5)              as p1_n,
       count(*) filter (where a.quality_score = 1)              as agoto_n,
       percentile_cont(0.5) within group (order by a.response_time_ms)
                                                                as t_mediana_ms
from answers a
join sessions s on s.id = a.session_id
join courses  c on c.id = a.course_id
where c.slug = %(course)s
  and a.quality_score is not null
  and a.exercise_external_id is not null
  and a.answered_at >= %(desde)s
  and s.mode in ('main', 'practice')
  and not (a.user_id = any(%(excluidos)s))
group by 1
"""

# Votos de encuesta. answered_at IS NULL = impresión mostrada y salteada: no es
# un voto y contarla como tal inventa señal. OJO con `value`: "justo" existe en
# el canal A (la dificultad estuvo bien) y en el D (ni aburrido ni interesante),
# y significan cosas distintas. Por eso se agrupa por (question_type, value) y
# nunca por value solo.
Q_ENCUESTAS = """
select f.exercise_external_id as ext,
       f.question_type        as canal,
       f.value                as valor,
       f.reason               as razon,
       count(*)               as n
from exercise_feedback f
join courses c on c.id = f.course_id
where c.slug = %(course)s
  and f.answered_at is not null
  and f.question_type in ('A', 'B', 'D')
group by 1, 2, 3, 4
"""

# Canal C: reporte de contenido. Sin muestreo, sin tope, con texto libre. Es la
# señal por ejercicio más limpia que hay hoy. Se traen las filas enteras.
Q_REPORTES = """
select f.exercise_external_id as ext,
       f.value                as categoria,
       f.free_text            as texto,
       f.user_id              as usuario,
       f.shown_at             as fecha
from exercise_feedback f
join courses c on c.id = f.course_id
where c.slug = %(course)s
  and f.question_type = 'C'
order by f.shown_at
"""

# Catálogo vivo, para separar los huérfanos y traer el estado del Elo.
Q_CATALOGO = """
select e.external_id  as ext,
       e.belt, e.topic, e.exercise_type as skill,
       e.difficulty, e.difficulty_n, e.reviewed,
       (e.table_data is not null) as tiene_tabla
from exercises e
join courses c on c.id = e.course_id
where c.slug = %(course)s
"""


def item_de(ext, catalogo):
    row = catalogo.get(ext)
    if row:
        return f"{row['belt']}/{row['topic']}/{row['skill']}"
    return "(huerfano)"


def main() -> int:
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--course", default="analisis", help="slug del curso")
    p.add_argument("--desde", default=DESDE_DEFAULT,
                   help=f"corte de la serie (default {DESDE_DEFAULT}, ver docstring)")
    p.add_argument("--prefix", help="filtrar ejercicios cuyo external_id arranque así")
    p.add_argument("--vol-max", type=int, default=VOL_MAX_DEFAULT,
                   help="excluir usuarios con al menos estas respuestas totales")
    p.add_argument("--json", action="store_true", help="salida JSON completa")
    args = p.parse_args()

    url = os.environ.get("DB_URL")
    if not url:
        print("Falta DB_URL (variable de entorno). Ver Railway -> servicio BBDD -> "
              "Variables -> DATABASE_PUBLIC_URL.", file=sys.stderr)
        return 1

    conn = psycopg2.connect(url, connect_timeout=20)
    conn.set_session(readonly=True, autocommit=True)
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(Q_EXCLUIDOS, {"vol_max": args.vol_max})
            excluidos = [dict(r) for r in cur.fetchall()]
            ids_excluidos = [int(r["id"]) for r in excluidos]

            params = {"course": args.course, "desde": args.desde,
                      "excluidos": ids_excluidos}
            cur.execute(Q_CATALOGO, {"course": args.course})
            catalogo = {r["ext"]: dict(r) for r in cur.fetchall()}
            cur.execute(Q_RESPUESTAS, params)
            respuestas = [dict(r) for r in cur.fetchall()]
            cur.execute(Q_ENCUESTAS, {"course": args.course})
            encuestas = [dict(r) for r in cur.fetchall()]
            cur.execute(Q_REPORTES, {"course": args.course})
            reportes = [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()

    # --- Media por ítem, para el encogido ------------------------------------
    por_item_n = defaultdict(int)
    por_item_p1 = defaultdict(int)
    for r in respuestas:
        it = item_de(r["ext"], catalogo)
        por_item_n[it] += r["n"]
        por_item_p1[it] += r["p1_n"]
    media_item = {it: 100.0 * por_item_p1[it] / por_item_n[it]
                  for it in por_item_n if por_item_n[it]}

    # --- Cruce ---------------------------------------------------------------
    votos = defaultdict(list)
    for e in encuestas:
        votos[e["ext"]].append(e)
    reps = defaultdict(list)
    for r in reportes:
        reps[r["ext"]].append(r)

    salida = []
    huerfanos = []
    for r in respuestas:
        ext = r["ext"]
        it = item_de(ext, catalogo)
        n, p1_n = r["n"], r["p1_n"]
        p1 = 100.0 * p1_n / n if n else None
        base = media_item.get(it, 61.0)
        p1_shrunk = (n * p1 + K_SHRINK * base) / (n + K_SHRINK) if n else base
        cat = catalogo.get(ext) or {}
        fila = {
            "ext": ext, "item": it, "n": n, "n_main": r["n_main"],
            "usuarios": r["usuarios"],
            "p1": round(p1, 1) if p1 is not None else None,
            "p1_shrunk": round(p1_shrunk, 1),
            "agoto": round(100.0 * r["agoto_n"] / n, 1) if n else None,
            "t_mediana_s": round(r["t_mediana_ms"] / 1000.0, 1) if r["t_mediana_ms"] else None,
            "votos": votos.get(ext, []),
            "reportes": reps.get(ext, []),
            "difficulty_n": cat.get("difficulty_n"),
            "reviewed": cat.get("reviewed"),
            "tiene_tabla": cat.get("tiene_tabla"),
        }
        (huerfanos if it == "(huerfano)" else salida).append(fila)

    # Ejercicios del catálogo que nunca se sirvieron: no son malos, son no
    # medidos. La exploración e = 0,15 del motor existe justamente para eso.
    vistos = {r["ext"] for r in respuestas}
    nunca = [{"ext": k, "item": f"{v['belt']}/{v['topic']}/{v['skill']}",
              "n": 0, "p1": None, "p1_shrunk": None,
              "votos": votos.get(k, []), "reportes": reps.get(k, []),
              "tiene_tabla": v["tiene_tabla"], "reviewed": v["reviewed"]}
             for k, v in catalogo.items() if k not in vistos]

    if args.prefix:
        pref = args.prefix
        salida = [r for r in salida if r["ext"].startswith(pref)]
        nunca = [r for r in nunca if r["ext"].startswith(pref)]

    if args.json:
        print(json.dumps({
            "curso": args.course, "desde": args.desde, "k_shrink": K_SHRINK,
            "usuarios_excluidos": excluidos,
            "media_por_item": {k: round(v, 1) for k, v in media_item.items()},
            "n_por_item": dict(por_item_n),
            "ejercicios": sorted(salida, key=lambda r: (r["item"], r["ext"])),
            "nunca_servidos": sorted(nunca, key=lambda r: (r["item"], r["ext"])),
            "huerfanos": sorted(huerfanos, key=lambda r: -r["n"]),
            "reportes_todos": reportes,
        }, indent=2, default=str, ensure_ascii=False))
        return 0

    print(f"curso={args.course}  serie desde {args.desde}  k_shrink={K_SHRINK}")
    print(f"usuarios excluidos por volumen (>= {args.vol_max} respuestas): "
          f"{[(r['id'], r['n']) for r in excluidos]}")
    print(f"catalogo={len(catalogo)}  con datos={len(salida)}  "
          f"nunca servidos={len(nunca)}  ids huerfanos={len(huerfanos)}")

    print(f"\nReportes de contenido (canal C): {len(reportes)}")
    for r in reportes:
        txt = (r["texto"] or "").replace("\n", " ")[:100]
        print(f"  {r['ext']:<38} {str(r['categoria']):<20} {txt}")

    print("\nPor ejercicio (ordenado por ítem y luego por P1 encogido):")
    ultimo = None
    for r in sorted(salida, key=lambda x: (x["item"], x["p1_shrunk"])):
        if r["item"] != ultimo:
            n_item = por_item_n.get(r["item"], 0)
            print(f"\n== {r['item']}  (n={n_item}, P1 ítem="
                  f"{media_item.get(r['item'], 0):.0f}%) ==")
            print(f"  {'external_id':<38} {'n':>4} {'usr':>4} {'P1':>6} "
                  f"{'shrunk':>7} {'agoto':>6} {'seg':>6}  votos")
            ultimo = r["item"]
        v = " ".join(f"{x['canal']}:{x['valor']}x{x['n']}" for x in r["votos"])
        marca = " <-- REPORTE" if r["reportes"] else ""
        print(f"  {r['ext']:<38} {r['n']:>4} {r['usuarios']:>4} "
              f"{r['p1']:>5.0f}% {r['p1_shrunk']:>6.0f}% {r['agoto']:>5.0f}% "
              f"{str(r['t_mediana_s']):>6}  {v}{marca}")

    if nunca:
        print(f"\nNunca servidos ({len(nunca)}) -- no medidos, no malos:")
        for r in sorted(nunca, key=lambda x: x["ext"]):
            print(f"  {r['ext']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
