def quality_from_attempts(attempts: int) -> int:
    """SM-2 quality. attempts ∈ {1..4}; 4 means user picked by elimination → fail."""
    return {1: 5, 2: 4, 3: 3}.get(attempts, 1)
