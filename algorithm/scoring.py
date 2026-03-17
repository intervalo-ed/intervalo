from .config import SM2Config


def quality_from_attempt(is_correct: bool, response_time_s: float, *, config: SM2Config | None = None) -> int:
    """
    Quality score (0..5) inferred from correctness + response time.

    Based on requirements:
    - Correct & < 4s  -> 5
    - Correct & 4-8s  -> 4
    - Correct & > 8s  -> 3
    - Incorrect       -> 1
    """
    config = config or SM2Config()

    if not is_correct:
        return 1

    if response_time_s < config.response_time_threshold_fast:
        return 5
    if response_time_s <= config.response_time_threshold_slow:
        return 4
    return 3

