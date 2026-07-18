from __future__ import annotations

import json
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class Belt(str, Enum):
    WHITE  = "white"
    BLUE   = "blue"
    VIOLET = "violet"
    BROWN  = "brown"
    BLACK  = "black"


@dataclass(frozen=True)
class TopicKey:
    belt: Belt
    topic: str


@dataclass(frozen=True)
class UnitKey:
    """A (belt, topic, exercise_type) triple — the spaced-repetition *skill* state.

    NOTE: this is the SR unit of knowledge tracked per-user in the `unit_states`
    table. It is NOT the structural `Unit` tier below (a block of topics inside a
    belt). The names collide for historical reasons; `UnitKey`/`UnitState` are the
    per-user SR skill-state, `Unit` is content structure.
    """
    belt: Belt
    topic: str
    exercise_type: str

    @property
    def topic_key(self) -> "TopicKey":
        return TopicKey(belt=self.belt, topic=self.topic)


@dataclass(frozen=True)
class Topic:
    key: str
    name: str
    tooltip: str
    short_description: str = ""
    skills: tuple[str, ...] = ()


@dataclass(frozen=True)
class Unit:
    """Structural content block inside a belt: an ordered set of topics.

    A belt has one or more units (análisis: one per belt; other courses may have
    several). Completing a belt requires completing all its units, in order.
    """
    key: str
    name: str
    topics: tuple[Topic, ...]


@dataclass
class BeltCatalog:
    belt: Belt
    units: list[Unit]
    headline: str = ""
    description: str = ""

    @property
    def topics(self) -> list[Topic]:
        """Flat, ordered list of topics across all units (units in order)."""
        return [t for u in self.units for t in u.topics]

    @property
    def total_topics(self) -> int:
        return len(self.topics)

    def all_keys(self) -> list[TopicKey]:
        return [TopicKey(belt=self.belt, topic=t.key) for t in self.topics]


# ── Course structure (loaded from JSON per course) ─────────────────────────────
#
# The single source of truth lives in backend/content/<course_slug>/course.json.
# Use `load_belt_catalogs(course_slug)` for the belt→unit→topic hierarchy used by
# the SR algorithm, or `load_course_structure(course_slug)` for the raw payload
# (served verbatim by the API).

_CONTENT_ROOT = Path(__file__).resolve().parent.parent / "backend" / "content"

_CATALOG_CACHE: dict[str, dict[Belt, BeltCatalog]] = {}
_STRUCTURE_CACHE: dict[str, dict] = {}


def _course_path(course_slug: str) -> Path:
    path = _CONTENT_ROOT / course_slug / "course.json"
    if not path.exists():
        raise FileNotFoundError(
            f"course.json no encontrado para el curso '{course_slug}': {path}"
        )
    return path


def load_course_structure(course_slug: str) -> dict:
    """Raw parsed course.json (structure payload). Cached."""
    cached = _STRUCTURE_CACHE.get(course_slug)
    if cached is not None:
        return cached
    with _course_path(course_slug).open("r", encoding="utf-8") as f:
        data = json.load(f)
    # Belts marcados "hidden": true quedan fuera de la estructura servida:
    # desactivados/ocultos del usuario, aunque sus JSON sigan en /content.
    data = {**data, "belts": [b for b in data.get("belts", []) if not b.get("hidden")]}
    _STRUCTURE_CACHE[course_slug] = data
    return data


def load_belt_catalogs(course_slug: str) -> dict[Belt, BeltCatalog]:
    cached = _CATALOG_CACHE.get(course_slug)
    if cached is not None:
        return cached

    data = load_course_structure(course_slug)

    result: dict[Belt, BeltCatalog] = {}
    for belt_entry in data["belts"]:
        belt = Belt(belt_entry["key"])
        units: list[Unit] = []
        # Los course.json pueden traer `units[]` (analisis) o `topics[]` directo
        # bajo el cinturón (probabilidad). En el caso flat, envolvemos los
        # topics bajo una unidad sintética con la key del cinturón para que el
        # resto del sistema (folder walk, agregaciones) siga viendo la misma
        # jerarquía belt → unit → topic.
        raw_units = belt_entry.get("units")
        if raw_units:
            unit_iter = raw_units
        else:
            unit_iter = [{
                "key": belt_entry["key"],
                "name": belt_entry.get("headline", belt_entry["key"]),
                "topics": belt_entry.get("topics", []),
            }]
        for u in unit_iter:
            topics = tuple(
                Topic(
                    key=t["key"],
                    name=t["name"],
                    tooltip=t.get("tooltip", ""),
                    short_description=t.get("short_description", ""),
                    skills=tuple(t.get("skills", ())),
                )
                for t in u["topics"]
            )
            units.append(Unit(key=u["key"], name=u["name"], topics=topics))
        result[belt] = BeltCatalog(
            belt=belt,
            units=units,
            headline=belt_entry.get("headline", ""),
            description=belt_entry.get("description", ""),
        )

    _CATALOG_CACHE[course_slug] = result
    return result


def clear_catalog_cache(course_slug: str | None = None) -> None:
    if course_slug is None:
        _CATALOG_CACHE.clear()
        _STRUCTURE_CACHE.clear()
    else:
        _CATALOG_CACHE.pop(course_slug, None)
        _STRUCTURE_CACHE.pop(course_slug, None)
