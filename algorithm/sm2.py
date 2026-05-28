from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Literal

from .config import SM2Config


@dataclass
class SM2UnitState:
    """SM-2 state for one learning unit (belt, topic, exercise_type)."""
    phase: Literal["learning", "review"] = "learning"
    step_index: int = 0
    ease_factor: float = 2.5
    interval: int = 0
    repetitions: int = 0
    next_review: date = field(default_factory=date.today)


def update_unit_state(
    state: SM2UnitState,
    quality: int,
    *,
    config: SM2Config | None = None,
    today: date | None = None,
) -> SM2UnitState:
    config = config or SM2Config()
    today = today or date.today()

    if state.phase == "learning":
        return _update_learning(state, quality, config=config, today=today)
    return _update_review(state, quality, config=config, today=today)


def _update_learning(
    state: SM2UnitState,
    quality: int,
    *,
    config: SM2Config,
    today: date,
) -> SM2UnitState:
    steps = config.learning_steps

    if quality >= config.quality_threshold_pass:
        next_step = state.step_index + 1
        if next_step >= len(steps):
            # Mastered: enters reviewing phase
            return SM2UnitState(
                phase="review",
                step_index=0,
                ease_factor=config.ef_initial,
                interval=config.review_initial_interval,
                repetitions=0,
                next_review=today + timedelta(days=config.review_initial_interval),
            )
        interval = steps[next_step]
        return SM2UnitState(
            phase="learning",
            step_index=next_step,
            ease_factor=state.ease_factor,
            interval=interval,
            repetitions=state.repetitions,
            next_review=today + timedelta(days=interval),
        )
    else:
        # Failure: drop back one step (min step 0)
        prev_step = max(0, state.step_index - 1)
        interval = steps[prev_step]
        return SM2UnitState(
            phase="learning",
            step_index=prev_step,
            ease_factor=state.ease_factor,
            interval=interval,
            repetitions=0,
            next_review=today + timedelta(days=interval),
        )


def _update_review(
    state: SM2UnitState,
    quality: int,
    *,
    config: SM2Config,
    today: date,
) -> SM2UnitState:
    ef = state.ease_factor
    interval = state.interval
    repetitions = state.repetitions

    if quality < config.quality_threshold_pass:
        interval = 1
        repetitions = 0
        ef = max(config.ef_min_absolute, ef - 0.8)
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = int(round(interval * ef))

        interval = min(interval, config.post_graduation_max_interval_days)
        repetitions += 1
        ef = max(
            config.ef_min_absolute,
            ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
        )

    return SM2UnitState(
        phase="review",
        step_index=0,
        ease_factor=ef,
        interval=interval,
        repetitions=repetitions,
        next_review=today + timedelta(days=interval),
    )
