# -*- coding: utf-8 -*-
"""Fecha de estabilidad de contenido por ejercicio, sacada del historial de git.

Un ejercicio cuyo enunciado, opciones o respuesta correcta cambiaron el 15/08
tiene su P1 anterior a esa fecha contaminado por la version vieja. Si el cambio
fue un arreglo (el commit 3714f06e se llama "seis ejercicios rotos de raiz"),
contar esas respuestas lo condena por un defecto que ya no existe.

Este script recorre los commits que tocaron cada archivo y devuelve, por
ejercicio, la ultima fecha en que cambio alguno de esos tres campos. Cruzado con
report_exercise_stats.py, permite recalcular el P1 sobre la ventana en la que el
ejercicio fue el que es hoy.

Identidad: se usa el campo `id` si esta (commit 3a98bf03 en adelante) y la
posicion en el array si no. Antes del 10/08/2026 la posicion no es identidad
confiable (el deep-clean llevo white/functions de 50 a 30 ejercicios), asi que
por defecto no se mira mas atras de esa fecha.

Uso (no toca la base, solo git):
  python content/exercise_stability.py --course analisis
  python content/exercise_stability.py --course analisis --json
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure") and (_stream.encoding or "").lower() != "utf-8":
        _stream.reconfigure(encoding="utf-8", errors="replace")

DESDE_DEFAULT = "2026-08-10"
CAMPOS = ("question", "options", "correct_index")
REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def git(*args) -> str:
    r = subprocess.run(["git", "-C", REPO, *args], capture_output=True)
    if r.returncode:
        return ""
    return r.stdout.decode("utf-8", errors="replace")


def leer(rev: str, path: str):
    r = subprocess.run(["git", "-C", REPO, "show", f"{rev}:{path}"], capture_output=True)
    if r.returncode:
        return None
    try:
        return json.loads(r.stdout.decode("utf-8"))
    except Exception:
        return None


def firma(ej: dict) -> tuple:
    return tuple(json.dumps(ej.get(c), ensure_ascii=False, sort_keys=True) for c in CAMPOS)


def snapshot(arr):
    """Lista de (id_o_None, posicion, firma) en el orden del array."""
    return [(e.get("id"), i, firma(e)) for i, e in enumerate(arr)]


def comparar(previo, actual):
    """Ejercicios de `actual` cuyo contenido cambio respecto de `previo`.

    Empareja por `id` cuando ambos lados lo tienen, y por posicion cuando no.
    Sin esto, el commit que estampo los ids (3a98bf03) aparece cambiando los
    1.331 ejercicios del curso: lo unico que cambio fue la clave, no el
    contenido. Devuelve las claves de `actual` (id si tiene, si no posicion).
    """
    if previo is None:
        return []
    ids_prev = {i for i, _, _ in previo if i}
    ids_act = {i for i, _, _ in actual if i}
    if ids_prev and ids_act:
        antes = {i: f for i, _, f in previo if i}
    else:
        antes = {pos: f for _, pos, f in previo}
    cambiados = []
    for id_, pos, f in actual:
        k = id_ if (ids_prev and ids_act and id_) else pos
        if k not in antes:
            continue  # ejercicio nuevo: no es un cambio de contenido
        if antes[k] != f:
            cambiados.append(id_ or f"#{pos:02d}")
    return cambiados


def main() -> int:
    p = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--course", default="analisis")
    p.add_argument("--desde", default=DESDE_DEFAULT)
    p.add_argument("--json", action="store_true")
    args = p.parse_args()

    raiz = f"backend/content/{args.course}"
    archivos = [f for f in git("ls-files", raiz).split()
                if f.endswith(".json") and os.path.basename(f)[0].isupper()]

    resultado = {}
    for path in sorted(archivos):
        # Commits que tocaron el archivo desde el corte, del mas viejo al mas nuevo.
        log = git("log", "--reverse", f"--since={args.desde}", "--format=%H %cI", "--", path)
        commits = [l.split(" ", 1) for l in log.strip().split("\n") if l.strip()]
        if not commits:
            continue
        # Estado base: el commit inmediatamente anterior a la ventana.
        previo = git("log", "-1", f"--until={args.desde}", "--format=%H", "--", path).strip()
        base = leer(previo, path) if previo else None
        anterior = snapshot(base) if base else None
        estable = {}
        for sha, fecha in commits:
            actual = leer(sha, path)
            if actual is None:
                continue
            snap = snapshot(actual)
            for k in comparar(anterior, snap):
                estable[k] = {"desde": fecha[:10], "commit": sha[:8]}
            anterior = snap
        rel = path.replace(f"backend/content/{args.course}/", "")
        # Traducir claves posicionales al id vigente en HEAD, si existe.
        head = leer("HEAD", path) or []
        pos_a_id = {f"#{i:02d}": e.get("id") for i, e in enumerate(head)}
        for k, v in estable.items():
            ext = pos_a_id.get(k, k) if k.startswith("#") else k
            if ext:
                resultado[ext] = {**v, "archivo": rel}

    if args.json:
        print(json.dumps(resultado, indent=2, ensure_ascii=False, sort_keys=True))
        return 0

    print(f"Ejercicios de {args.course} cuyo contenido cambio despues de {args.desde}: "
          f"{len(resultado)}")
    por_fecha = {}
    for ext, v in resultado.items():
        por_fecha.setdefault((v["desde"], v["commit"]), []).append(ext)
    for (fecha, sha), exts in sorted(por_fecha.items()):
        asunto = git("log", "-1", "--format=%s", sha).strip()
        print(f"\n{fecha}  {sha}  {asunto[:70]}  ({len(exts)} ejercicios)")
        for e in sorted(exts)[:8]:
            print(f"    {e}")
        if len(exts) > 8:
            print(f"    ... y {len(exts) - 8} mas")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
