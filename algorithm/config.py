from dataclasses import dataclass, field
from datetime import timedelta


@dataclass
class SM2Config:
    # Learning phase
    learning_steps: list[int] = field(default_factory=lambda: [0, 1, 3])
    max_intra_session_reps: int = 2
    quality_threshold_pass: int = 3

    # Reviewing phase
    review_initial_interval: int = 7
    post_graduation_max_interval_days: int = 30
    ef_initial: float = 2.5
    ef_min_absolute: float = 1.3

    # Session
    max_exercises_per_session: int = 12
    min_topics_before_new_content: int = 5
    min_distance_same_topic: int = 2

    # Exercise subtype selection
    graph_exercise_probability: float = 0.66  # P(graph) vs P(text) per exercise

    @property
    def post_graduation_max_interval(self) -> timedelta:
        return timedelta(days=self.post_graduation_max_interval_days)
