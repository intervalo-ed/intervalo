# -*- coding: utf-8 -*-
"""Estampa el campo `id` en cada ejercicio de los JSON de autoría.

Por qué existe
--------------
Hasta ago-2026 el `external_id` de un ejercicio se derivaba de su posición en el
array: `white_reglas_FORM_07` era "el séptimo del archivo". Borrar o insertar un
ejercicio en el medio renumeraba todos los que seguían, y las respuestas ya
guardadas en `answers.exercise_external_id` pasaban a describir otro contenido.
En producción quedaron 123 ids apuntando a ejercicios que no existen, y varias
unidades registran más ids servidos que ejercicios en el catálogo.

Este script estampa el id que cada ejercicio tiene HOY como campo explícito. Es
puramente aditivo: no renumera nada y no pierde una sola respuesta del
histórico. A partir de acá, `seed_content.py` usa `entry["id"]` cuando está, así
que mover, reordenar o borrar ejercicios deja de tener consecuencias.

Regla de asignación
-------------------
Un id nuevo es siempre `max(sufijos existentes) + 1`, nunca el primer hueco
libre: si el 05 se archivó, su id queda quemado para siempre. Reusarlo mezclaría
las respuestas del ejercicio viejo con las del nuevo, que es exactamente el
problema que este script viene a cerrar.

En la primera corrida ningún ejercicio tiene id, así que la regla le asigna a
cada uno su posición actual — que es justo lo que preserva el histórico.

El id es un identificador, no una ruta. Si un topic se renombra (pasó con
`factorizacion` → `factorization`), los ids conservan el nombre viejo a
propósito: cortar la serie histórica es peor que un id que no matchea la carpeta.

Uso
---
    python content/stamp_ids.py                  # todos los cursos
    python content/stamp_ids.py --course probabilidad
    python content/stamp_ids.py --dry-run        # muestra sin escribir

Es idempotente: correrlo dos veces no cambia nada. Correlo después de cada
ronda de generación, para que los ejercicios nuevos queden sellados.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

CONTENT_DIR = Path(__file__).resolve().parent
COURSES = ("probabilidad", "analisis", "algebra")
META_FILES = frozenset({"course.json", "catalog.json", "belt_info.json"})

# Sufijo numérico al final del id: `white_reglas_FORM_07` → 7.
SUFFIX_RE = re.compile(r"_(\d+)$")


def skill_files(course_dir: Path):
    """Los JSON de skill del curso: 3 o 4 partes desde la raíz del curso."""
    for path in sorted(course_dir.rglob("*.json")):
        if path.name in META_FILES:
            continue
        rel = path.relative_to(course_dir)
        if len(rel.parts) == 4:
            belt, _unit, topic, skill_name = rel.parts
        elif len(rel.parts) == 3:
            belt, topic, skill_name = rel.parts
        else:
            continue
        yield path, belt, topic, Path(skill_name).stem


def read_text(path: Path) -> str:
    """Sin traducción de finales de línea: los archivos son CRLF y así quedan."""
    with path.open(encoding="utf-8", newline="") as fh:
        return fh.read()


def element_offsets(text: str) -> list[int]:
    """Offset del `{` que abre cada elemento del array raíz.

    `json.loads` devuelve los datos pero pierde las posiciones, y reserializar
    con `json.dumps` reformatea los arrays que estaban escritos compactos a mano
    (`"tags": ["x"]` se abre en tres líneas). Como la única edición que hacemos
    es insertar una línea, conviene tocar el texto y no el árbol: así el diff es
    una línea por ejercicio y el resto del archivo queda byte a byte igual.
    """
    decoder = json.JSONDecoder()
    idx = text.index("[") + 1
    offsets: list[int] = []
    while True:
        while idx < len(text) and text[idx] in " \t\r\n,":
            idx += 1
        if idx >= len(text) or text[idx] == "]":
            return offsets
        offsets.append(idx)
        _value, idx = decoder.raw_decode(text, idx)


def indent_inside(text: str, brace: int) -> str:
    """Sangría de la primera clave del objeto, para alinear la línea nueva."""
    line_end = text.find("\n", brace)
    if line_end == -1:
        return "    "
    rest = text[line_end + 1:]
    return rest[:len(rest) - len(rest.lstrip(" "))] or "    "


def sufijo_maximo_archivado(path: Path) -> int:
    """Mayor sufijo usado por los ejercicios archivados de este mismo ítem.

    Un id nunca se reusa, ni siquiera cuando el ejercicio se archiva (regla 78):
    las respuestas viejas siguen apuntando a él y reasignarlo haría que
    describieran otro contenido. Como el archivo vive fuera del árbol del curso,
    hay que ir a buscarlo a mano.

    Sin esto, un ítem que archivó sus ejercicios más altos le da al siguiente
    ejercicio nuevo un id que ya está quemado. Pasó de verdad: tras bajar
    `analisis` a 15 ejercicios por ítem, dos de los tres ítems que recibieron
    contenido nuevo habrían reusado un id (`linear/FORM` el 30 y
    `quadratic/GRAF` el 29).
    """
    partes = path.parts
    if "content" not in partes:
        return 0
    i = len(partes) - 1 - partes[::-1].index("content")
    espejo = Path(*partes[:i + 1], "archive", *partes[i + 1:])
    if not espejo.exists():
        return 0
    try:
        archivados = json.loads(read_text(espejo))
    except (OSError, ValueError):
        return 0
    mayor = 0
    for entry in archivados if isinstance(archivados, list) else []:
        existing = entry.get("id") if isinstance(entry, dict) else None
        if isinstance(existing, str):
            match = SUFFIX_RE.search(existing)
            if match:
                mayor = max(mayor, int(match.group(1)))
    return mayor


def stamp_file(path: Path, belt: str, topic: str, skill: str) -> tuple[str, list, int]:
    """Devuelve (texto nuevo, ids finales en orden, cuántos se estamparon)."""
    text = read_text(path)
    entries = json.loads(text)
    if not isinstance(entries, list):
        raise ValueError(f"{path}: la raíz tiene que ser una lista")

    offsets = element_offsets(text)
    if len(offsets) != len(entries):
        raise ValueError(
            f"{path}: {len(offsets)} elementos localizados en el texto contra "
            f"{len(entries)} parseados — no se toca el archivo"
        )

    prefix = f"{belt}_{topic}_{skill}"
    highest = sufijo_maximo_archivado(path)
    for entry in entries:
        existing = entry.get("id")
        if isinstance(existing, str):
            match = SUFFIX_RE.search(existing)
            if match:
                highest = max(highest, int(match.group(1)))

    ids: list[str] = []
    inserts: list[tuple[int, str]] = []
    for entry, brace in zip(entries, offsets):
        existing = entry.get("id")
        if isinstance(existing, str) and existing.strip():
            ids.append(existing)
            continue
        highest += 1
        exercise_id = f"{prefix}_{highest:02d}"
        ids.append(exercise_id)
        sangria = indent_inside(text, brace)
        inserts.append((brace + 1, f"\r\n{sangria}\"id\": \"{exercise_id}\","))

    # De atrás para adelante, así los offsets ya calculados no se corren.
    out = text
    for pos, línea in reversed(inserts):
        out = out[:pos] + línea + out[pos:]

    return out, ids, len(inserts)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--course", choices=COURSES, help="un solo curso")
    parser.add_argument("--dry-run", action="store_true", help="no escribe nada")
    args = parser.parse_args()

    courses = [args.course] if args.course else list(COURSES)
    total_files = total_stamped = touched_files = 0
    all_ids: dict[str, dict[str, str]] = {}
    duplicates: list[str] = []

    for course in courses:
        course_dir = CONTENT_DIR / course
        if not course_dir.is_dir():
            print(f"! curso sin carpeta: {course}", file=sys.stderr)
            continue
        seen: dict[str, str] = {}
        all_ids[course] = seen

        for path, belt, topic, skill in skill_files(course_dir):
            total_files += 1
            nuevo_texto, ids, stamped = stamp_file(path, belt, topic, skill)
            rel = str(path.relative_to(CONTENT_DIR))

            for exercise_id in ids:
                if exercise_id in seen:
                    duplicates.append(
                        f"{course}: id duplicado {exercise_id!r} "
                        f"en {seen[exercise_id]} y {rel}"
                    )
                seen[exercise_id] = rel

            if stamped:
                touched_files += 1
                total_stamped += stamped
                print(f"  {rel}: +{stamped}")
                if not args.dry_run:
                    # Releer para confirmar que el texto nuevo sigue parseando
                    # a los mismos datos más el id: si la inserción se corrió de
                    # lugar, el archivo no se escribe.
                    if len(json.loads(nuevo_texto)) != len(ids):
                        raise ValueError(f"{rel}: la inserción rompió el JSON")
                    with path.open("w", encoding="utf-8", newline="") as fh:
                        fh.write(nuevo_texto)

    if duplicates:
        print("\nERROR: ids duplicados dentro de un mismo curso.", file=sys.stderr)
        for line in duplicates:
            print(f"  {line}", file=sys.stderr)
        return 1

    verbo = "estamparía" if args.dry_run else "estampó"
    print(
        f"\n{verbo} {total_stamped} ids en {touched_files} archivos "
        f"(de {total_files} revisados)."
    )
    for course, seen in all_ids.items():
        print(f"  {course}: {len(seen)} ejercicios con id único")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
