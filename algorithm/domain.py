from __future__ import annotations

from dataclasses import dataclass
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

    Azul — Límites:
        GRAF  Graficación    Interpreta límites desde una gráfica
        RESV  Resolución     Calcula límites con técnicas algebraicas
        CLSF  (reutilizada) Identifica discontinuidades y formas indeterminadas

    Derivadas:
        GRAF  (reutilizada) Lee la derivada geométricamente
        DERI  Derivación     Aplica reglas de derivación
        APLI  Aplicación     Usa derivadas en optimización y análisis

    Integrales:
        GRAF  (reutilizada) Interpreta la integral como área acumulada
        INTG  Integración    Aplica técnicas de integración
        APLI  (reutilizada) Resuelve problemas de área y acumulación
    """
    CLSF = "CLSF"
    LEXI = "LEXI"
    FORM = "FORM"
    GRAF = "GRAF"
    RESV = "RESV"
    DERI = "DERI"
    INTG = "INTG"
    APLI = "APLI"


class Belt(str, Enum):
    WHITE  = "white"
    BLUE   = "blue"
    VIOLET = "violet"  # Derivadas
    BROWN  = "brown"   # Integrales
    BLACK  = "black"   # TBD


@dataclass(frozen=True)
class ItemKey:
    belt: Belt
    topic: str        # topic key, defined per BeltCatalog
    skill: SkillCode


@dataclass
class BeltCatalog:
    belt: Belt
    topics: list[str]
    skills: list[SkillCode]
    stripe_thresholds: list[int]   # graduated items needed for each stripe (e.g. [3, 9])
    promotion_threshold: int       # graduated items needed to unlock next belt

    @property
    def total_items(self) -> int:
        return len(self.topics) * len(self.skills)

    def all_keys(self) -> list[ItemKey]:
        return [
            ItemKey(belt=self.belt, topic=t, skill=s)
            for t in self.topics
            for s in self.skills
        ]


# ── Belt catalogs ──────────────────────────────────────────────────────────────
#
# Topics within each belt use snake_case string keys.
# White belt topics coincide with FunctionFamily values for consistency.

WHITE_BELT = BeltCatalog(
    belt=Belt.WHITE,
    topics=[f.value for f in FunctionFamily],   # 7 function families
    skills=[SkillCode.CLSF, SkillCode.LEXI, SkillCode.FORM],
    stripe_thresholds=[3, 9],
    promotion_threshold=18,
    # total_items = 21 (7 × 3) | mastery at 21
)

BLUE_BELT = BeltCatalog(
    belt=Belt.BLUE,
    topics=[
        "algebraic_limits",
        "lateral_limits",
        "infinite_limits",
        "continuity",
        "indeterminate_forms",
        "lhopital",
    ],
    skills=[SkillCode.GRAF, SkillCode.RESV, SkillCode.CLSF],
    stripe_thresholds=[2, 6],
    promotion_threshold=15,
    # total_items = 18 (6 × 3) | mastery at 18
)

VIOLET_BELT = BeltCatalog(
    belt=Belt.VIOLET,
    topics=[
        "limit_definition",
        "basic_rules",
        "product_quotient",
        "chain_rule",
        "special_functions",
        "implicit_derivatives",
    ],
    skills=[SkillCode.GRAF, SkillCode.DERI, SkillCode.APLI],
    stripe_thresholds=[2, 6],
    promotion_threshold=15,
    # total_items = 18 (6 × 3) | mastery at 18
)

BROWN_BELT = BeltCatalog(
    belt=Belt.BROWN,
    topics=[
        "indefinite_integral",
        "fundamental_theorem",
        "substitution",
        "integration_by_parts",
        "improper_integrals",
    ],
    skills=[SkillCode.GRAF, SkillCode.INTG, SkillCode.APLI],
    stripe_thresholds=[2, 5],
    promotion_threshold=12,
    # total_items = 15 (5 × 3) | mastery at 15
)

BLACK_BELT = BeltCatalog(
    belt=Belt.BLACK,
    topics=[],   # TBD
    skills=[],   # TBD
    stripe_thresholds=[],
    promotion_threshold=0,
)

BELT_CATALOGS: dict[Belt, BeltCatalog] = {
    Belt.WHITE:  WHITE_BELT,
    Belt.BLUE:   BLUE_BELT,
    Belt.VIOLET: VIOLET_BELT,
    Belt.BROWN:  BROWN_BELT,
    Belt.BLACK:  BLACK_BELT,
}
