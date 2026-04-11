from __future__ import annotations

import json
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path


class FunctionFamily(str, Enum):
    LINEAR = "linear"
    QUADRATIC = "quadratic"
    POLYNOMIAL = "polynomial"
    EXPONENTIAL = "exponential"
    LOGARITHMIC = "logarithmic"
    RATIONAL = "rational"
    TRIGONOMETRIC = "trigonometric"


class SkillCode(str, Enum):
    """
    Habilidades del sistema (código de 4 letras mayúsculas).
    Un mismo código puede reutilizarse en distintos cinturones
    con distinto contenido pero la misma naturaleza de tarea.

    Blanco — Funciones:
        CLSF  Clasificación  Identifica la familia desde su gráfica
        LEXI  Léxico         Nombra y clasifica con vocabulario correcto
        FORM  Formulación    Extrae parámetros y construye la expresión
        GRAF  Graficación    Interpreta o construye la gráfica de la función

    Azul — Límites:
        RESL  Resolución     Calcula límites con técnicas algebraicas
        ESTR  Estrategia     Elige la técnica adecuada para el límite
        GRAF  (reutilizada) Interpreta límites desde una gráfica

    Violeta — Derivadas:
        DERI  Derivación     Aplica reglas de derivación
        APLI  Aplicación     Usa derivadas en optimización y análisis
        GRAF  (reutilizada) Lee la derivada geométricamente

    Marrón — Integrales:
        INTG  Integración    Aplica técnicas de integración
        APLI  (reutilizada) Resuelve problemas de área y acumulación
        GRAF  (reutilizada) Interpreta la integral como área acumulada
    """
    CLSF = "CLSF"
    LEXI = "LEXI"
    FORM = "FORM"
    GRAF = "GRAF"
    RESL = "RESL"
    ESTR = "ESTR"
    DERI = "DERI"
    INTG = "INTG"
    APLI = "APLI"


class Belt(str, Enum):
    WHITE  = "white"
    BLUE   = "blue"
    VIOLET = "violet"  # Derivadas
    BROWN  = "brown"   # Integrales
    BLACK  = "black"   # Análisis


@dataclass(frozen=True)
class ItemKey:
    belt: Belt
    topic: str        # topic key, defined per BeltCatalog
    skill: SkillCode


@dataclass(frozen=True)
class TopicSpec:
    """Specifica las habilidades de un tema concreto dentro de un cinturón."""
    key: str
    skills: list[SkillCode]


@dataclass
class BeltCatalog:
    belt: Belt
    topic_specs: list[TopicSpec]
    stripe_thresholds: list[int]   # graduated items needed for each stripe (e.g. [3, 9])
    promotion_threshold: int       # graduated items needed to unlock next belt

    @property
    def total_items(self) -> int:
        return sum(len(ts.skills) for ts in self.topic_specs)

    @property
    def topics(self) -> list[str]:
        """Compatibilidad: retorna los keys de los topics."""
        return [ts.key for ts in self.topic_specs]

    def all_keys(self) -> list[ItemKey]:
        return [
            ItemKey(belt=self.belt, topic=ts.key, skill=s)
            for ts in self.topic_specs
            for s in ts.skills
        ]


# ── Belt catalogs (loaded from JSON per course) ────────────────────────────────
#
# Topics within each belt use snake_case string keys.
# The source of truth lives in backend/content/<course_slug>/catalog.json.
# Use `load_belt_catalogs(course_slug)` to obtain the belts for a given course.

_CONTENT_ROOT = Path(__file__).resolve().parent.parent / "backend" / "content"

# Cache per course_slug so the JSON is only parsed once per process.
_CATALOG_CACHE: dict[str, dict[Belt, BeltCatalog]] = {}


def load_belt_catalogs(course_slug: str) -> dict[Belt, BeltCatalog]:
    """
    Load the belt catalogs for a course from backend/content/<slug>/catalog.json.

    Returns a dict mapping Belt → BeltCatalog. Cached in memory.
    Raises FileNotFoundError if the course/catalog doesn't exist.
    """
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
        topic_specs = [
            TopicSpec(
                key=topic["key"],
                skills=[SkillCode(s) for s in topic["skills"]],
            )
            for topic in belt_entry["topics"]
        ]
        result[belt] = BeltCatalog(
            belt=belt,
            topic_specs=topic_specs,
            stripe_thresholds=list(belt_entry["stripe_thresholds"]),
            promotion_threshold=belt_entry["promotion_threshold"],
        )

    _CATALOG_CACHE[course_slug] = result
    return result


def clear_catalog_cache(course_slug: str | None = None) -> None:
    """Clear the in-memory catalog cache. Useful for tests and hot-reload."""
    if course_slug is None:
        _CATALOG_CACHE.clear()
    else:
        _CATALOG_CACHE.pop(course_slug, None)
