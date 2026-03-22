from dataclasses import dataclass, field
from datetime import timedelta


@dataclass
class SM2Config:
    # Loop corto (learning)
    learning_steps: list[int] = field(default_factory=lambda: [0, 1, 3])
    max_intra_session_reps: int = 2
    quality_threshold_pass: int = 3

    # Loop largo (review / SM-2)
    review_initial_interval: int = 7
    post_graduation_max_interval_days: int = 21
    ef_initial: float = 2.5
    ef_min_absolute: float = 1.3
    ef_min_for_valid_review: float = 2.5

    # Scoring
    response_time_threshold_fast: float = 6.0
    response_time_threshold_slow: float = 12.0

    # Session
    max_exercises_per_session: int = 12
    min_items_before_new_content: int = 5
    min_distance_same_function: int = 2

    # Generator
    ef_threshold_easy: float = 1.8
    ef_threshold_hard: float = 2.4

    # Exercise subtype selection
    graph_exercise_probability: float = 0.66  # P(graph) vs P(text) por ejercicio

    @property
    def post_graduation_max_interval(self) -> timedelta:
        return timedelta(days=self.post_graduation_max_interval_days)
