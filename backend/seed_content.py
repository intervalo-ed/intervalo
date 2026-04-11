"""
seed_content.py — Seeder idempotente del contenido del curso.

Lee los archivos JSON en backend/content/<course-slug>/ y hace upsert a la BBDD:
  - course.json     → upsert en `courses` por slug
  - belt_info.json  → upsert en `belt_info` por (course_id, belt)
  - exercises/*.json → upsert en `exercises` por (course_id, external_id)

El catálogo (catalog.json) NO se carga a BBDD: se lee en runtime desde
algorithm.domain.load_belt_catalogs().

Uso:
    python seed_content.py --all                         # todos los cursos
    python seed_content.py --course analisis-1           # uno solo
    python seed_content.py --course analisis-1 --prune   # borra ejercicios del curso
                                                         # que ya no están en los JSON
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session as DBSession

# Resolver imports cuando el script se corre como `python seed_content.py`
# desde backend/ directamente.
_THIS_DIR = Path(__file__).resolve().parent
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))

from database import SessionLocal  # noqa: E402
from models import BeltInfo, Course, Exercise  # noqa: E402


CONTENT_ROOT = _THIS_DIR / "content"


# ── Helpers ────────────────────────────────────────────────────────────────────

def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _validate_exercise(entry: dict, source: Path, idx: int) -> None:
    required = [
        "external_id", "belt", "topic", "skill", "subtype",
        "question", "options", "correct_index",
        "feedback_correct", "feedback_incorrect",
    ]
    missing = [k for k in required if k not in entry]
    if missing:
        raise ValueError(
            f"{source.name}[{idx}]: faltan campos requeridos: {missing}"
        )
    if not isinstance(entry["options"], list) or len(entry["options"]) != 4:
        raise ValueError(
            f"{source.name}[{idx}] ({entry['external_id']}): "
            f"'options' debe ser una lista de 4 strings"
        )
    if entry["correct_index"] not in (0, 1, 2, 3):
        raise ValueError(
            f"{source.name}[{idx}] ({entry['external_id']}): "
            f"'correct_index' debe estar en 0..3"
        )
    if entry["subtype"] not in ("text", "graph"):
        raise ValueError(
            f"{source.name}[{idx}] ({entry['external_id']}): "
            f"'subtype' debe ser 'text' o 'graph'"
        )


def _serialize_graph_view(gv: Any) -> str | None:
    """content JSON usa lista [xmin,xmax,ymin,ymax]; la columna guarda un string."""
    if gv is None:
        return None
    if isinstance(gv, str):
        return gv
    return json.dumps(gv)


# ── Seeders por tabla ──────────────────────────────────────────────────────────

def seed_course(db: DBSession, course_dir: Path) -> Course:
    data = _load_json(course_dir / "course.json")
    slug = data["slug"]

    course = db.query(Course).filter(Course.slug == slug).first()
    if course is None:
        course = Course(
            slug=slug,
            name=data["name"],
            description=data.get("description"),
        )
        db.add(course)
        db.flush()
        print(f"  [course] insert {slug}")
    else:
        changed = False
        if course.name != data["name"]:
            course.name = data["name"]
            changed = True
        if course.description != data.get("description"):
            course.description = data.get("description")
            changed = True
        if changed:
            print(f"  [course] update {slug}")
    return course


def seed_belt_info(db: DBSession, course: Course, course_dir: Path) -> int:
    path = course_dir / "belt_info.json"
    if not path.exists():
        return 0

    entries = _load_json(path)
    inserted = updated = 0

    for entry in entries:
        existing = (
            db.query(BeltInfo)
            .filter(
                BeltInfo.course_id == course.id,
                BeltInfo.belt == entry["belt"],
            )
            .first()
        )
        if existing is None:
            db.add(BeltInfo(
                course_id=course.id,
                belt=entry["belt"],
                headline=entry["headline"],
                description=entry["description"],
            ))
            inserted += 1
        else:
            if (existing.headline != entry["headline"]
                    or existing.description != entry["description"]):
                existing.headline = entry["headline"]
                existing.description = entry["description"]
                updated += 1

    total = len(entries)
    print(f"  [belt_info] {total} entries ({inserted} inserted, {updated} updated)")
    return total


def seed_exercises(
    db: DBSession,
    course: Course,
    course_dir: Path,
    prune: bool = False,
) -> int:
    exercises_dir = course_dir / "exercises"
    if not exercises_dir.exists():
        print("  [exercises] (no exercises dir)")
        return 0

    # Backfill: si hay filas legacy sin external_id (venidas del seed de la
    # migración a1b2c3d4e5f6), las matcheamos con los JSON y les asignamos el
    # external_id correspondiente ANTES del loop de upsert. Hacerlo después
    # crearía duplicados (la misma key en dos filas pendientes de commit).
    _backfill_legacy_external_ids(db, course, exercises_dir)
    db.flush()

    seen_external_ids: set[str] = set()
    inserted = updated = 0
    total = 0

    for json_file in sorted(exercises_dir.glob("*.json")):
        entries = _load_json(json_file)
        if not isinstance(entries, list):
            raise ValueError(f"{json_file.name}: el contenido raíz debe ser una lista")

        for idx, entry in enumerate(entries):
            _validate_exercise(entry, json_file, idx)
            ext_id = entry["external_id"]
            if ext_id in seen_external_ids:
                raise ValueError(
                    f"external_id duplicado en el curso {course.slug}: {ext_id}"
                )
            seen_external_ids.add(ext_id)
            total += 1

            options = entry["options"]
            existing = (
                db.query(Exercise)
                .filter(
                    Exercise.course_id == course.id,
                    Exercise.external_id == ext_id,
                )
                .first()
            )

            if existing is None:
                db.add(Exercise(
                    course_id=course.id,
                    external_id=ext_id,
                    belt=entry["belt"],
                    topic=entry["topic"],
                    skill=entry["skill"],
                    subtype=entry["subtype"],
                    question=entry["question"],
                    option_a=options[0],
                    option_b=options[1],
                    option_c=options[2],
                    option_d=options[3],
                    correct_index=entry["correct_index"],
                    has_math=bool(entry.get("has_math", False)),
                    feedback_correct=entry["feedback_correct"],
                    feedback_incorrect=entry["feedback_incorrect"],
                    graph_fn=entry.get("graph_fn"),
                    graph_view=_serialize_graph_view(entry.get("graph_view")),
                ))
                inserted += 1
            else:
                fields = {
                    "belt":               entry["belt"],
                    "topic":              entry["topic"],
                    "skill":              entry["skill"],
                    "subtype":            entry["subtype"],
                    "question":           entry["question"],
                    "option_a":           options[0],
                    "option_b":           options[1],
                    "option_c":           options[2],
                    "option_d":           options[3],
                    "correct_index":      entry["correct_index"],
                    "has_math":           bool(entry.get("has_math", False)),
                    "feedback_correct":   entry["feedback_correct"],
                    "feedback_incorrect": entry["feedback_incorrect"],
                    "graph_fn":           entry.get("graph_fn"),
                    "graph_view":         _serialize_graph_view(entry.get("graph_view")),
                }
                changed = False
                for k, v in fields.items():
                    if getattr(existing, k) != v:
                        setattr(existing, k, v)
                        changed = True
                if changed:
                    updated += 1

    # Prune: borra ejercicios del curso que no aparecieron en los JSON.
    if prune:
        to_delete = (
            db.query(Exercise)
            .filter(
                Exercise.course_id == course.id,
                Exercise.external_id.notin_(seen_external_ids) | (Exercise.external_id.is_(None)),
            )
            .all()
        )
        for ex in to_delete:
            db.delete(ex)
        if to_delete:
            print(f"  [exercises] pruned {len(to_delete)} stale rows")

    print(
        f"  [exercises] {total} entries ({inserted} inserted, {updated} updated)"
    )
    return total


def _backfill_legacy_external_ids(
    db: DBSession, course: Course, exercises_dir: Path
) -> None:
    """
    Si la BBDD tenía ejercicios seeded sin external_id (del legacy seed en la
    migración Alembic), los matcheamos con los JSON por (belt, topic, skill,
    subtype, question) y les asignamos el external_id correspondiente.

    Si alguna fila legacy no puede matchearse (ej. texto con escapes Unicode
    distintos), se elimina — el loop de upsert insertará la versión limpia del JSON.

    Solo hace algo en la primera corrida post-migración c3d4e5f6a7b8.
    """
    legacy_rows = (
        db.query(Exercise)
        .filter(Exercise.course_id == course.id, Exercise.external_id.is_(None))
        .all()
    )
    if not legacy_rows:
        return

    # Indexar JSON por (belt, topic, skill, subtype, question) → external_id.
    # También guardamos una versión con los escapes Unicode decodificados para
    # el caso en que la migración almacenó el texto como raw unicode escapes.
    index: dict[tuple, str] = {}
    for json_file in sorted(exercises_dir.glob("*.json")):
        entries = _load_json(json_file)
        for entry in entries:
            q = entry["question"]
            base_key = (entry["belt"], entry["topic"], entry["skill"], entry["subtype"], q)
            index[base_key] = entry["external_id"]
            # fallback: raw unicode-escaped version (e.g. stored by old migration)
            escaped_key = (
                entry["belt"], entry["topic"], entry["skill"], entry["subtype"],
                q.encode("unicode_escape").decode("ascii"),
            )
            if escaped_key != base_key:
                index[escaped_key] = entry["external_id"]

    matched = deleted = 0
    for row in legacy_rows:
        key = (row.belt, row.topic, row.skill, row.subtype, row.question)
        ext_id = index.get(key)
        if ext_id:
            row.external_id = ext_id
            matched += 1
        else:
            db.delete(row)
            deleted += 1

    if matched:
        print(f"  [exercises] backfilled external_id on {matched} legacy rows")
    if deleted:
        print(f"  [exercises] removed {deleted} unmatchable legacy rows (will be reinserted)")


# ── Entrypoints ────────────────────────────────────────────────────────────────

def seed_one_course(slug: str, db: DBSession, prune: bool = False) -> None:
    course_dir = CONTENT_ROOT / slug
    if not course_dir.is_dir():
        raise FileNotFoundError(f"Curso no encontrado: {course_dir}")

    print(f"[seed] {slug}")
    course = seed_course(db, course_dir)
    seed_belt_info(db, course, course_dir)
    seed_exercises(db, course, course_dir, prune=prune)
    db.commit()


def seed_all(db: DBSession, prune: bool = False) -> None:
    if not CONTENT_ROOT.is_dir():
        print(f"[seed] (no content directory at {CONTENT_ROOT})")
        return
    course_dirs = [p for p in sorted(CONTENT_ROOT.iterdir()) if p.is_dir()]
    if not course_dirs:
        print("[seed] (no courses found)")
        return
    for course_dir in course_dirs:
        seed_one_course(course_dir.name, db, prune=prune)


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed content from backend/content/ to DB")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--all", action="store_true", help="Seedear todos los cursos en content/")
    group.add_argument("--course", help="Seedear un curso específico por slug")
    parser.add_argument(
        "--prune", action="store_true",
        help="Borrar ejercicios del curso que no aparecen en los JSON (opt-in)",
    )
    args = parser.parse_args()

    if not args.all and not args.course:
        args.all = True  # default: seedear todo

    db = SessionLocal()
    try:
        if args.all:
            seed_all(db, prune=args.prune)
        else:
            seed_one_course(args.course, db, prune=args.prune)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
