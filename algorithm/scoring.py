from .config import SM2Config


def quality_from_attempts(attempts: int) -> int:
    """SM-2 quality. attempts ∈ {1..4}; 4 means user picked by elimination → fail."""
    return {1: 5, 2: 4, 3: 3}.get(attempts, 1)


def quality_from_time(
    response_time_s: float,
    *,
    config: SM2Config | None = None,
) -> int:
    """Calidad de retención según el tiempo de respuesta (acierto al primer intento).

    <fast → 5 (máxima), <medium → 4, resto → 3. Se usa solo en fase de review;
    si el usuario pifia (no acierta al primer intento) la calidad es 0 aparte.
    """
    config = config or SM2Config()
    if response_time_s < config.review_fast_seconds:
        return 5
    if response_time_s < config.review_medium_seconds:
        return 4
    return 3
