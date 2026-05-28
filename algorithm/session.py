from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from .config import SM2Config
from .domain import BeltCatalog, TopicKey
from .sm2 import SM2TopicState


@dataclass(frozen=True)
class SessionTopic:
    key: TopicKey
    state: SM2TopicState


def _topic_distance_ok(
    session: list[SessionTopic], candidate: SessionTopic, *, min_distance: int
) -> bool:
    if min_distance <= 0:
        return True
    last_same_idx = None
    for i in range(len(session) - 1, -1, -1):
        if session[i].key.topic == candidate.key.topic:
            last_same_idx = i
            break
    if last_same_idx is None:
        return True
    return (len(session) - 1) - last_same_idx >= min_distance


def build_session(
    topics: dict[TopicKey, SM2TopicState],
    *,
    today: date | None = None,
    config: SM2Config | None = None,
    introduce_new_topic: callable | None = None,
    topic_priority: dict[TopicKey, int] | None = None,
    topic_attempted: dict[TopicKey, bool] | None = None,
) -> list[SessionTopic]:
    """
    Builds the next session:
    - Step 1: collect topics that are "new" (not attempted) or "pending" (overdue).
    - Step 2: if fewer than min_topics_before_new_content, introduce new topics.
    - Step 3: cap at max_exercises_per_session.
    - Step 4: greedy mix ensuring min_distance_same_topic between same topics.
    """
    config = config or SM2Config()
    today = today or date.today()
    topic_attempted = topic_attempted or {}

    candidates: list[SessionTopic] = []
    for k, s in topics.items():
        is_attempted = topic_attempted.get(k, False)
        is_new = not is_attempted and s.phase == "learning"
        is_pending = s.next_review <= today

        if is_new or is_pending:
            candidates.append(SessionTopic(key=k, state=s))

    if topic_priority is not None:
        candidates.sort(key=lambda x: topic_priority.get(x.key, len(topic_priority)))
    else:
        candidates.sort(key=lambda x: (
            not (not topic_attempted.get(x.key, False) and x.state.phase == "learning"),
            x.state.next_review,
        ))

    if introduce_new_topic is not None and len(candidates) < config.min_topics_before_new_content:
        needed = config.min_topics_before_new_content - len(candidates)
        new_topics: list[SessionTopic] = []
        for _ in range(needed):
            new_key = introduce_new_topic()
            if new_key is None or new_key in topics:
                break
            new_topics.append(SessionTopic(key=new_key, state=SM2TopicState()))
        if topic_priority is not None:
            new_topics.sort(key=lambda x: topic_priority.get(x.key, len(topic_priority)))
        candidates.extend(new_topics)

    candidates = candidates[: config.max_exercises_per_session]

    session: list[SessionTopic] = []
    remaining = candidates[:]
    while remaining:
        placed = False
        for idx, cand in enumerate(remaining):
            if _topic_distance_ok(session, cand, min_distance=config.min_distance_same_topic):
                session.append(cand)
                remaining.pop(idx)
                placed = True
                break
        if not placed:
            session.append(remaining.pop(0))

    return session


def should_reinsert(
    state: SM2TopicState, intra_session_count: int, *, config: SM2Config | None = None
) -> bool:
    """
    Returns True if a failed topic in step 0 should be reinserted in the current session.
    """
    config = config or SM2Config()
    return (
        state.phase == "learning"
        and state.step_index == 0
        and intra_session_count < config.max_intra_session_reps
    )


def default_catalog(belt: BeltCatalog) -> list[TopicKey]:
    """Returns all TopicKeys for the given belt catalog."""
    return belt.all_keys()


def belt_topic_priority(catalog: BeltCatalog) -> dict[TopicKey, int]:
    """
    Returns a priority map for a belt catalog following the topic order.
    Topics are introduced in the order they appear in the catalog.
    """
    return {
        TopicKey(belt=catalog.belt, topic=t.key): idx
        for idx, t in enumerate(catalog.topics)
    }
