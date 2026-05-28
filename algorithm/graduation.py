from __future__ import annotations

from dataclasses import dataclass

from .domain import BeltCatalog, TopicKey
from .sm2 import SM2TopicState


def is_mastered(state: SM2TopicState) -> bool:
    """True when a topic has completed the learning phase and entered review."""
    return state.phase == "review"


@dataclass
class BeltProgress:
    mastered: int    # topics currently in 'review' phase
    total: int       # total topics in the belt
    promoted: bool   # True when every topic in the belt is mastered


def belt_progress(
    topics: dict[TopicKey, SM2TopicState],
    catalog: BeltCatalog,
) -> BeltProgress:
    belt_keys = catalog.all_keys()
    mastered = sum(
        1 for k in belt_keys if topics.get(k, SM2TopicState()).phase == "review"
    )
    total = catalog.total_topics
    return BeltProgress(mastered=mastered, total=total, promoted=mastered >= total)
