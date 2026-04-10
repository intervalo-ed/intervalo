from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


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


# ── Belt catalogs ──────────────────────────────────────────────────────────────
#
# Topics within each belt use snake_case string keys.
# White belt topics coincide with FunctionFamily values for consistency.

WHITE_BELT = BeltCatalog(
    belt=Belt.WHITE,
    topic_specs=[
        TopicSpec("linear",        [SkillCode.CLSF, SkillCode.LEXI, SkillCode.FORM]),
        TopicSpec("quadratic",     [SkillCode.CLSF, SkillCode.LEXI, SkillCode.FORM]),
        TopicSpec("polynomial",    [SkillCode.CLSF, SkillCode.LEXI, SkillCode.FORM]),
        TopicSpec("exponential",   [SkillCode.CLSF, SkillCode.LEXI, SkillCode.FORM]),
        TopicSpec("logarithmic",   [SkillCode.CLSF, SkillCode.LEXI, SkillCode.FORM]),
        TopicSpec("rational",      [SkillCode.CLSF, SkillCode.LEXI, SkillCode.FORM, SkillCode.GRAF]),
        TopicSpec("trigonometric", [SkillCode.CLSF, SkillCode.LEXI, SkillCode.FORM, SkillCode.GRAF]),
    ],
    stripe_thresholds=[3, 9],
    promotion_threshold=20,
    # total_items = 23  (5×3 + 2×4)
)

BLUE_BELT = BeltCatalog(
    belt=Belt.BLUE,
    topic_specs=[
        TopicSpec("algebraic_limits", [SkillCode.LEXI, SkillCode.RESL, SkillCode.ESTR]),
        TopicSpec("lateral_limits",   [SkillCode.LEXI, SkillCode.RESL, SkillCode.GRAF]),
        TopicSpec("infinite_limits",  [SkillCode.LEXI, SkillCode.RESL, SkillCode.GRAF]),
        TopicSpec("continuity",       [SkillCode.CLSF, SkillCode.RESL, SkillCode.GRAF]),
        TopicSpec("factorizacion",    [SkillCode.LEXI, SkillCode.RESL, SkillCode.ESTR]),
        TopicSpec("racionalizacion",  [SkillCode.RESL, SkillCode.ESTR]),
    ],
    stripe_thresholds=[3, 8],
    promotion_threshold=14,
    # total_items = 17  (5×3 + 1×2)
)

VIOLET_BELT = BeltCatalog(
    belt=Belt.VIOLET,
    topic_specs=[
        TopicSpec("limit_definition",       [SkillCode.LEXI, SkillCode.ESTR, SkillCode.CLSF, SkillCode.GRAF]),
        TopicSpec("geometric_interpretation",[SkillCode.LEXI, SkillCode.GRAF, SkillCode.APLI, SkillCode.ESTR]),
        TopicSpec("basic_rules",            [SkillCode.LEXI, SkillCode.DERI, SkillCode.ESTR]),
        TopicSpec("product_quotient",       [SkillCode.DERI, SkillCode.ESTR, SkillCode.APLI]),
        TopicSpec("chain_rule",             [SkillCode.DERI, SkillCode.ESTR, SkillCode.APLI]),
        TopicSpec("lhopital",               [SkillCode.RESL, SkillCode.ESTR, SkillCode.APLI]),
    ],
    stripe_thresholds=[4, 10],
    promotion_threshold=17,
    # total_items = 20  (2×4 + 4×3)
)

BROWN_BELT = BeltCatalog(
    belt=Belt.BROWN,
    topic_specs=[
        TopicSpec("indefinite_integral",    [SkillCode.LEXI, SkillCode.INTG, SkillCode.ESTR]),
        TopicSpec("substitution",           [SkillCode.INTG, SkillCode.ESTR, SkillCode.APLI]),
        TopicSpec("integration_by_parts",   [SkillCode.INTG, SkillCode.ESTR, SkillCode.APLI]),
        TopicSpec("definite_integral",      [SkillCode.INTG, SkillCode.GRAF, SkillCode.APLI]),
    ],
    stripe_thresholds=[3, 7],
    promotion_threshold=10,
    # total_items = 12  (4×3)
)

BLACK_BELT = BeltCatalog(
    belt=Belt.BLACK,
    topic_specs=[
        TopicSpec("function_analysis", [SkillCode.DERI, SkillCode.APLI, SkillCode.CLSF, SkillCode.GRAF]),
        TopicSpec("optimization",      [SkillCode.DERI, SkillCode.APLI, SkillCode.ESTR]),
        TopicSpec("area_calculation",  [SkillCode.INTG, SkillCode.APLI, SkillCode.GRAF]),
        TopicSpec("ftc",               [SkillCode.INTG, SkillCode.APLI, SkillCode.ESTR]),
    ],
    stripe_thresholds=[5, 9],
    promotion_threshold=13,
    # total_items = 13  (1×4 + 3×3)
)

BELT_CATALOGS: dict[Belt, BeltCatalog] = {
    Belt.WHITE:  WHITE_BELT,
    Belt.BLUE:   BLUE_BELT,
    Belt.VIOLET: VIOLET_BELT,
    Belt.BROWN:  BROWN_BELT,
    Belt.BLACK:  BLACK_BELT,
}
