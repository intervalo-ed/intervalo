from __future__ import annotations

from typing import Iterable

from .domain import TopicKey, UnitKey
from .sm2 import SM2UnitState


def is_topic_mastered(
    units: dict[UnitKey, SM2UnitState],
    topic_key: TopicKey,
    expected_types: Iterable[str],
) -> bool:
    """A topic is mastered when every one of its exercise_types is in review."""
    expected = list(expected_types)
    if not expected:
        return False
    for et in expected:
        uk = UnitKey(belt=topic_key.belt, topic=topic_key.topic, exercise_type=et)
        state = units.get(uk)
        if state is None or state.phase != "review":
            return False
    return True


