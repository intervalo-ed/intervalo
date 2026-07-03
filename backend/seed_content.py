"""
seed_content.py — Seeder idempotente del contenido del curso.

Lee la nueva estructura de carpetas en backend/content/<course-slug>/ y hace
upsert a la BBDD. La fuente única de estructura es `course.json` (consolida lo
que antes vivía en course.json + belt_info.json + catalog.json):
  - course.json (slug/name/description) → upsert en `courses` por slug
  - course.json (belts[].headline/description) → upsert en `belt_info` por (course_id, belt)
  - {belt}/{unit}/{topic}/{SKILL}.json → upsert en `exercises` por (course_id, external_id)

Los metadatos de cada ejercicio (belt, topic, exercise_type, external_id) se
infieren de la ruta — no se leen desde los campos del JSON.

Uso:
    python seed_content.py --all                    # todos los cursos en content/
    python seed_content.py --course analisis         # uno solo
    python seed_content.py --course analisis --prune # borra ejercicios del curso
                                                     # que ya no están en los JSON
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session as DBSession

_THIS_DIR = Path(__file__).resolve().parent
if str(_THIS_DIR) not in sys.path:
    sys.path.insert(0, str(_THIS_DIR))

from database import SessionLocal  # noqa: E402
from models import BeltInfo, Course, Exercise  # noqa: E402


CONTENT_ROOT = _THIS_DIR / "content"

# Filenames that are course-level metadata, not exercise files.
_META_FILES = frozenset({"course.json", "catalog.json", "belt_info.json"})


# ── Helpers ────────────────────────────────────────────────────────────────────

def _load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _validate_exercise(entry: dict, source: Path, idx: int) -> None:
    required = [
        "question", "options", "correct_index",
        "feedback_correct", "feedback_incorrect",
    ]
    missing = [k for k in required if k not in entry]
    if missing:
        raise ValueError(
            f"{source}[{idx}]: faltan campos requeridos: {missing}"
        )
    opts = entry["options"]
    if not isinstance(opts, list) or not (2 <= len(opts) <= 4):
        raise ValueError(
            f"{source}[{idx}]: 'options' debe ser una lista de 2-4 strings "
            f"(got {len(opts) if isinstance(opts, list) else type(opts).__name__})"
        )
    if entry["correct_index"] not in range(len(opts)):
        raise ValueError(
            f"{source}[{idx}]: 'correct_index' debe estar en 0..{len(opts)-1}"
        )


def _serialize_graph_view(gv: Any) -> str | None:
    if gv is None:
        return None
    if isinstance(gv, str):
        return gv
    if isinstance(gv, dict):
        try:
            gv = [gv["xMin"], gv["xMax"], gv["yMin"], gv["yMax"]]
        except KeyError:
            return None
    return json.dumps(gv)


def _serialize_feedback_incorrect(fi: Any) -> str:
    """Store list as JSON string; keep plain string as-is."""
    if isinstance(fi, list):
        return json.dumps(fi, ensure_ascii=False)
    return fi if isinstance(fi, str) else ""


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
    """Upsert headline/description por cinturón desde course.json (belts[]).

    La tabla `belt_info` se mantiene como storage; la fuente ahora es el
    course.json unificado (antes: belt_info.json)."""
    data = _load_json(course_dir / "course.json")
    entries = [
        {
            "belt": b["key"],
            "headline": b.get("headline", ""),
            "description": b.get("description", ""),
        }
        for b in data.get("belts", [])
    ]
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
    seen_external_ids: set[str] = set()
    seen_skills: set[tuple[str, str, str]] = set()  # (belt, topic, skill)
    inserted = updated = 0
    total = 0

    # Walk belt/unit/topic/SKILL.json (exactly 4 path components from course_dir)
    for skill_file in sorted(course_dir.rglob("*.json")):
        if skill_file.name in _META_FILES:
            continue
        rel = skill_file.relative_to(course_dir)
        if len(rel.parts) != 4:
            continue  # not a skill file

        belt, _unit, topic, skill_name = rel.parts
        skill = Path(skill_name).stem  # drop .json extension
        seen_skills.add((belt, topic, skill))

        entries = _load_json(skill_file)
        if not isinstance(entries, list):
            raise ValueError(f"{skill_file}: root must be a list")

        for idx, entry in enumerate(entries):
            _validate_exercise(entry, skill_file, idx)
            external_id = f"{belt}_{topic}_{skill}_{idx+1:02d}"

            if external_id in seen_external_ids:
                raise ValueError(
                    f"external_id duplicado en el curso {course.slug}: {external_id}"
                )
            seen_external_ids.add(external_id)
            total += 1

            options = entry["options"]
            opt_a = options[0]
            opt_b = options[1]
            opt_c = options[2] if len(options) > 2 else None
            opt_d = options[3] if len(options) > 3 else None
            fi_stored = _serialize_feedback_incorrect(entry["feedback_incorrect"])

            existing = (
                db.query(Exercise)
                .filter(
                    Exercise.course_id == course.id,
                    Exercise.external_id == external_id,
                )
                .first()
            )

            if existing is None:
                db.add(Exercise(
                    course_id=course.id,
                    external_id=external_id,
                    belt=belt,
                    topic=topic,
                    exercise_type=skill,
                    question=entry["question"],
                    option_a=opt_a,
                    option_b=opt_b,
                    option_c=opt_c,
                    option_d=opt_d,
                    correct_index=entry["correct_index"],
                    has_math=bool(entry.get("has_math", False)),
                    feedback_correct=entry["feedback_correct"],
                    feedback_incorrect=fi_stored,
                    graph_fn=entry.get("graph_fn"),
                    graph_view=_serialize_graph_view(entry.get("graph_view")),
                    explanation=entry.get("explanation"),
                ))
                inserted += 1
            else:
                fields = {
                    "belt":               belt,
                    "topic":              topic,
                    "exercise_type":      skill,
                    "question":           entry["question"],
                    "option_a":           opt_a,
                    "option_b":           opt_b,
                    "option_c":           opt_c,
                    "option_d":           opt_d,
                    "correct_index":      entry["correct_index"],
                    "has_math":           bool(entry.get("has_math", False)),
                    "feedback_correct":   entry["feedback_correct"],
                    "feedback_incorrect": fi_stored,
                    "graph_fn":           entry.get("graph_fn"),
                    "graph_view":         _serialize_graph_view(entry.get("graph_view")),
                    "explanation":        entry.get("explanation"),
                }
                changed = False
                for k, v in fields.items():
                    if getattr(existing, k) != v:
                        setattr(existing, k, v)
                        changed = True
                if changed:
                    updated += 1

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

    _validate_declared_skills(course_dir, seen_skills)

    print(
        f"  [exercises] {total} entries ({inserted} inserted, {updated} updated)"
    )
    return total


def _validate_declared_skills(
    course_dir: Path, seen_skills: set[tuple[str, str, str]]
) -> None:
    """Warn if the SKILL.json files on disk don't match course.json topic.skills."""
    data = _load_json(course_dir / "course.json")
    declared: set[tuple[str, str, str]] = set()
    for belt in data.get("belts", []):
        for unit in belt.get("units", []):
            for topic in unit.get("topics", []):
                for skill in topic.get("skills", []):
                    declared.add((belt["key"], topic["key"], skill))
    missing = declared - seen_skills   # declared pero sin archivo
    extra = seen_skills - declared     # archivo sin declarar en course.json
    if missing:
        print(f"  [warn] skills declarados sin archivo: {sorted(missing)}")
    if extra:
        print(f"  [warn] archivos SKILL sin declarar en course.json: {sorted(extra)}")


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
        args.all = True

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
