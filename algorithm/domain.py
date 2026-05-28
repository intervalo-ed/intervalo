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
class Topic:
    key: str
    name: str
    tooltip: str


@dataclass
class BeltCatalog:
    belt: Belt
    topics: list[Topic]

    @property
    def total_topics(self) -> int:
        return len(self.topics)

    def all_keys(self) -> list[TopicKey]:
        return [TopicKey(belt=self.belt, topic=t.key) for t in self.topics]


# ── Belt catalogs (loaded from JSON per course) ────────────────────────────────
#
# The source of truth lives in backend/content/<course_slug>/catalog.json.
# Use `load_belt_catalogs(course_slug)` to obtain the belts for a given course.

_CONTENT_ROOT = Path(__file__).resolve().parent.parent / "backend" / "content"

_CATALOG_CACHE: dict[str, dict[Belt, BeltCatalog]] = {}


def load_belt_catalogs(course_slug: str) -> dict[Belt, BeltCatalog]:
    cached = _CATALOG_CACHE.get(course_slug)
    if cached is not None:
        return cached

    catalog_path = _CONTENT_ROOT / course_slug / "catalog.json"
    if not catalog_path.exists():
        raise FileNotFoundError(
            f"Catálogo no encontrado para el curso '{course_slug}': {catalog_path}"
        )

    with catalog_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    result: dict[Belt, BeltCatalog] = {}
    for belt_entry in data["belts"]:
        belt = Belt(belt_entry["key"])
        topics = [
            Topic(key=t["key"], name=t["name"], tooltip=t["tooltip"])
            for t in belt_entry["topics"]
        ]
        result[belt] = BeltCatalog(belt=belt, topics=topics)

    _CATALOG_CACHE[course_slug] = result
    return result


def clear_catalog_cache(course_slug: str | None = None) -> None:
    if course_slug is None:
        _CATALOG_CACHE.clear()
    else:
        _CATALOG_CACHE.pop(course_slug, None)
