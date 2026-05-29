from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from .domain import BeltCatalog, TopicKey, UnitKey
from .sm2 import SM2UnitState


def is_mastered(state: SM2UnitState) -> bool:
    """True when a single unit has completed learning and entered review."""
    return state.phase == "review"


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


@dataclass
class BeltProgress:
    mastered: int    # topics whose units are all in 'review' phase
    total: int       # total topics in the belt
    promoted: bool   # True when every topic in the belt is mastered


def belt_progress(
    units: dict[UnitKey, SM2UnitState],
    catalog: BeltCatalog,
    *,
    topic_types: dict[TopicKey, list[str]],
) -> BeltProgress:
    """
    Count topics in `catalog` whose exercise_types are all in review.

    `topic_types` declares the expected exercise_types per topic — discovered
    from the exercise bank by the caller (algorithm package stays DB-agnostic).
    """
    belt_keys = catalog.all_keys()
    mastered = sum(
        1
        for tk in belt_keys
        if is_topic_mastered(units, tk, topic_types.get(tk, []))
    )
    total = catalog.total_topics
    return BeltProgress(mastered=mastered, total=total, promoted=mastered >= total)
