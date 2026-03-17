from dataclasses import dataclass
from datetime import timedelta


@dataclass
class SM2Config:
    max_interval_days: int = 7
    ef_min_for_valid_review: float = 2.5
    valid_reviews_to_graduate: int = 3
    max_exercises_per_session: int = 10
    ef_initial: float = 2.5
    ef_min_absolute: float = 1.3
    response_time_threshold_fast: float = 4.0
    response_time_threshold_slow: float = 8.0
    post_graduation_max_interval_days: int = 21
    ef_threshold_easy: float = 1.8
    ef_threshold_hard: float = 2.4
    min_items_before_new_content: int = 5
    min_distance_same_function: int = 2

    @property
    def max_interval(self) -> timedelta:
        return timedelta(days=self.max_interval_days)

