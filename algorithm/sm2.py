from dataclasses import dataclass
from datetime import date, timedelta

from .config import SM2Config


@dataclass
class SM2ItemState:
    ease_factor: float = 2.5
    interval: int = 1
    repetitions: int = 0
    next_review: date = date.today()
    valid_reviews: int = 0


def update_item_state(
    state: SM2ItemState,
    quality: int,
    *,
    config: SM2Config | None = None,
    today: date | None = None,
) -> SM2ItemState:
    config = config or SM2Config()
    today = today or date.today()

    ef = state.ease_factor
    interval = state.interval
    repetitions = state.repetitions
    valid_reviews = state.valid_reviews

    if quality < 3:
        interval = 1
        repetitions = 0
        valid_reviews = 0
        ef = max(config.ef_min_absolute, ef - 0.8)
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 2
        else:
            interval = int(round(interval * ef))

        interval = min(interval, config.max_interval_days)
        repetitions += 1
        ef = max(config.ef_min_absolute, ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

        if interval >= config.max_interval_days and ef >= config.ef_min_for_valid_review:
            valid_reviews += 1
        else:
            valid_reviews = 0

    next_review = today + timedelta(days=interval)

    return SM2ItemState(
        ease_factor=ef,
        interval=interval,
        repetitions=repetitions,
        next_review=next_review,
        valid_reviews=valid_reviews,
    )

