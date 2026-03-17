from dataclasses import dataclass
from enum import Enum, auto

from .config import SM2Config


class Difficulty(Enum):
    EASY = auto()
    MEDIUM = auto()
    HARD = auto()


def difficulty_from_ef(ef: float, config: SM2Config | None = None) -> Difficulty:
    config = config or SM2Config()
    if ef < config.ef_threshold_easy:
        return Difficulty.EASY
    if ef > config.ef_threshold_hard:
        return Difficulty.HARD
    return Difficulty.MEDIUM


@dataclass
class GeneratedExercise:
    function_family: str
    difficulty: Difficulty
    payload: dict


def generate_exercise(function_family: str, ef: float, *, config: SM2Config | None = None) -> GeneratedExercise:
    difficulty = difficulty_from_ef(ef, config)
    return GeneratedExercise(
        function_family=function_family,
        difficulty=difficulty,
        payload={"parameters": {}, "difficulty": difficulty.name},
    )

