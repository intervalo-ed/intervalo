from dataclasses import dataclass
from enum import Enum, auto

from .config import SM2Config
from .sm2 import SM2ItemState


class Difficulty(Enum):
    EASY = auto()
    MEDIUM = auto()
    HARD = auto()


def difficulty_from_state(state: SM2ItemState, config: SM2Config | None = None) -> Difficulty:
    config = config or SM2Config()
    if state.phase == "learning":
        return Difficulty.EASY if state.step_index == 0 else Difficulty.MEDIUM
    # review: usa EF
    if state.ease_factor < config.ef_threshold_easy:
        return Difficulty.EASY
    if state.ease_factor > config.ef_threshold_hard:
        return Difficulty.HARD
    return Difficulty.MEDIUM


@dataclass
class GeneratedExercise:
    function_family: str
    difficulty: Difficulty
    payload: dict


def generate_exercise(function_family: str, state: SM2ItemState, *, config: SM2Config | None = None) -> GeneratedExercise:
    difficulty = difficulty_from_state(state, config)
    return GeneratedExercise(
        function_family=function_family,
        difficulty=difficulty,
        payload={"parameters": {}, "difficulty": difficulty.name},
    )
