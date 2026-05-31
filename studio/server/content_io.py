"""
content_io.py — Lectura/escritura de los JSON de contenido del curso.

Fuente de verdad: backend/content/<course-slug>/
  - catalog.json      (estructura belts/topics/skills + tooltips)
  - course.json       (metadatos)
  - belt_info.json    (headline/description por cinturón)
  - exercises/<belt>_<topic>.json  (array de ejercicios)

Escribe siempre con indent=2 y ensure_ascii=False para mantener los diffs de
git limpios y el LaTeX/acentos legibles (igual que los archivos existentes).

Reutiliza la validación de backend/seed_content.py para que el editor y el
seeder de producción compartan exactamente las mismas reglas.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

# Repo layout: <repo>/studio/server/content_io.py  → repo root = parents[2]
REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
CONTENT_ROOT = BACKEND_DIR / "content"
DEFAULT_COURSE = "analisis-1"

# Importar los validadores del seeder de producción.
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from seed_content import _validate_exercise  # noqa: E402


class ContentError(Exception):
    """Error de validación o de I/O, con mensaje apto para mostrar en la UI."""


def course_dir(course: str = DEFAULT_COURSE) -> Path:
    d = CONTENT_ROOT / course
    if not d.exists():
        raise ContentError(f"El curso '{course}' no existe en {CONTENT_ROOT}")
    return d


def _read_json(path: Path) -> Any:
    if not path.exists():
        raise ContentError(f"No existe el archivo {path.name}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_json(path: Path, data: Any) -> None:
    # Escritura atómica: tmp + replace para no dejar archivos corruptos.
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    tmp.replace(path)


# ── Catálogo ────────────────────────────────────────────────────────────────

def read_catalog(course: str = DEFAULT_COURSE) -> dict:
    return _read_json(course_dir(course) / "catalog.json")


def catalog_index(catalog: dict) -> dict[str, dict[str, list[str]]]:
    """{belt_key: {topic_key: [skills...]}} para validar pertenencia."""
    idx: dict[str, dict[str, list[str]]] = {}
    for belt in catalog.get("belts", []):
        idx[belt["key"]] = {t["key"]: list(t["skills"]) for t in belt.get("topics", [])}
    return idx


def update_tooltip(belt: str, topic: str, tooltip: str, course: str = DEFAULT_COURSE) -> dict:
    """Actualiza SOLO el campo tooltip de un (belt, topic), preservando el resto."""
    path = course_dir(course) / "catalog.json"
    catalog = _read_json(path)
    found = False
    for b in catalog.get("belts", []):
        if b["key"] != belt:
            continue
        for t in b.get("topics", []):
            if t["key"] == topic:
                t["tooltip"] = tooltip
                found = True
                break
    if not found:
        raise ContentError(f"No se encontró el tema {belt}/{topic} en el catálogo")
    _write_json(path, catalog)
    return catalog


# ── Course / belt_info ──────────────────────────────────────────────────────

def read_course(course: str = DEFAULT_COURSE) -> dict:
    d = course_dir(course)
    out: dict[str, Any] = {"course": _read_json(d / "course.json")}
    belt_info_path = d / "belt_info.json"
    out["belt_info"] = _read_json(belt_info_path) if belt_info_path.exists() else []
    return out


# ── Ejercicios ──────────────────────────────────────────────────────────────

def _exercises_path(belt: str, topic: str, course: str = DEFAULT_COURSE) -> Path:
    return course_dir(course) / "exercises" / f"{belt}_{topic}.json"


def read_exercises(belt: str, topic: str, course: str = DEFAULT_COURSE) -> list[dict]:
    path = _exercises_path(belt, topic, course)
    if not path.exists():
        return []
    data = _read_json(path)
    if not isinstance(data, list):
        raise ContentError(f"{path.name}: el contenido raíz debe ser una lista")
    return data


def write_exercises(
    belt: str,
    topic: str,
    entries: list[dict],
    course: str = DEFAULT_COURSE,
) -> list[dict]:
    """Valida cada entrada y escribe el archivo <belt>_<topic>.json.

    Validaciones:
      - belt/topic existen en el catálogo
      - cada entry pasa _validate_exercise (esquema del seeder de producción)
      - belt/topic de cada entry coinciden con el archivo
      - skill pertenece al topic en el catálogo
      - correct_index dentro de 0..3 y exactamente una opción correcta implícita
      - external_id únicos dentro del archivo
    """
    if not isinstance(entries, list):
        raise ContentError("El cuerpo debe ser una lista de ejercicios")

    idx = catalog_index(read_catalog(course))
    if belt not in idx:
        raise ContentError(f"El cinturón '{belt}' no existe en el catálogo")
    if topic not in idx[belt]:
        raise ContentError(f"El tema '{topic}' no existe en el cinturón '{belt}'")
    valid_skills = set(idx[belt][topic])

    path = _exercises_path(belt, topic, course)
    seen: set[str] = set()
    for i, entry in enumerate(entries):
        try:
            _validate_exercise(entry, path, i)
        except ValueError as e:
            raise ContentError(str(e))
        if entry["belt"] != belt or entry["topic"] != topic:
            raise ContentError(
                f"Ejercicio [{i}] ({entry.get('external_id')}): belt/topic "
                f"({entry['belt']}/{entry['topic']}) no coinciden con el archivo "
                f"({belt}/{topic})"
            )
        if entry["skill"] not in valid_skills:
            raise ContentError(
                f"Ejercicio [{i}] ({entry['external_id']}): la habilidad "
                f"'{entry['skill']}' no pertenece a {belt}/{topic}. "
                f"Válidas: {sorted(valid_skills)}"
            )
        ext_id = entry["external_id"]
        if ext_id in seen:
            raise ContentError(f"external_id duplicado en el archivo: {ext_id}")
        seen.add(ext_id)
        # Normalizar: toda entrada del archivo debe tener `reviewed` (default false).
        entry["reviewed"] = bool(entry.get("reviewed", False))

    path.parent.mkdir(parents=True, exist_ok=True)
    _write_json(path, entries)
    return entries


def _empty_cell() -> dict:
    return {"count": 0, "reviewed": 0, "graph": 0, "text": 0, "with_explanation": 0}


def _acc(cell: dict, e: dict) -> None:
    cell["count"] += 1
    if bool(e.get("reviewed", False)):
        cell["reviewed"] += 1
    if e.get("subtype") == "graph":
        cell["graph"] += 1
    else:
        cell["text"] += 1
    if (e.get("explanation") or "").strip():
        cell["with_explanation"] += 1


def compute_stats(course: str = DEFAULT_COURSE) -> dict:
    """Agrega métricas de contenido por celda (belt/topic/skill), por cinturón y
    totales globales. Lee cada archivo {belt}_{topic}.json una sola vez.

    Estructura devuelta:
      {
        "cells":  { "<belt>/<topic>/<skill>": {count, reviewed, graph, text, with_explanation} },
        "belts":  { "<belt>": {count, reviewed, graph, text, with_explanation, items} },
        "totals": {count, reviewed, graph, text, with_explanation, items}
      }
    La cobertura (count >= objetivo) se calcula en el cliente con el objetivo configurable.
    """
    catalog = read_catalog(course)
    cells: dict[str, dict] = {}
    belts: dict[str, dict] = {}
    totals = _empty_cell()
    totals_items = 0

    for belt in catalog.get("belts", []):
        bkey = belt["key"]
        belt_cell = _empty_cell()
        for topic in belt.get("topics", []):
            tkey = topic["key"]
            entries = read_exercises(bkey, tkey, course)
            # index por skill para esta (belt, topic)
            by_skill: dict[str, list[dict]] = {}
            for e in entries:
                by_skill.setdefault(e.get("skill"), []).append(e)
            for skill in topic.get("skills", []):
                ckey = f"{bkey}/{tkey}/{skill}"
                cell = _empty_cell()
                for e in by_skill.get(skill, []):
                    _acc(cell, e)
                cells[ckey] = cell
                # rollups
                for k in cell:
                    belt_cell[k] += cell[k]
                    totals[k] += cell[k]
                totals_items += 1
        belt_cell["items"] = sum(len(t.get("skills", [])) for t in belt.get("topics", []))
        belts[bkey] = belt_cell

    totals["items"] = totals_items
    return {"cells": cells, "belts": belts, "totals": totals}


def next_external_id(belt: str, topic: str, skill: str, course: str = DEFAULT_COURSE) -> str:
    """Calcula el próximo external_id con patrón {belt}_{topic}_{skill_lower}_{NN}."""
    prefix = f"{belt}_{topic}_{skill.lower()}_"
    existing = read_exercises(belt, topic, course)
    max_n = 0
    for e in existing:
        eid = e.get("external_id", "")
        if eid.startswith(prefix):
            tail = eid[len(prefix):]
            if tail.isdigit():
                max_n = max(max_n, int(tail))
    return f"{prefix}{max_n + 1:02d}"
