def quality_from_correctness(is_correct: bool) -> int:
    """
    Fixed SM-2 quality score:
      - Correct   -> 4
      - Incorrect -> 1
    """
    return 4 if is_correct else 1
