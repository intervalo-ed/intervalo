from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class FunctionFamily(str, Enum):
    LINEAR = "linear"
    QUADRATIC = "quadratic"
    POLYNOMIAL = "polynomial"
    EXPONENTIAL = "exponential"
    LOGARITHMIC = "logarithmic"
    TRIGONOMETRIC = "trigonometric"
    RATIONAL = "rational"


class SkillType(str, Enum):
    VISUAL_RECOGNITION = "visual_recognition"
    VOCABULARY = "vocabulary"
    PARAMETER_IDENTIFICATION = "parameter_identification"


@dataclass(frozen=True)
class ItemKey:
    function_family: FunctionFamily
    skill_type: SkillType

