from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from .config import SM2Config
from .domain import BeltCatalog, TopicKey, UnitKey
from .sm2 import SM2UnitState


@dataclass(frozen=True)
class SessionUnit:
    key: UnitKey
    state: SM2UnitState


def _topic_distance_ok(
    session: list[SessionUnit], candidate: SessionUnit, *, min_distance: int
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
    units: dict[UnitKey, SM2UnitState],
    *,
    today: date | None = None,
    config: SM2Config | None = None,
    introduce_new_topic: callable | None = None,
    topic_priority: dict[TopicKey, int] | None = None,
    unit_attempted: dict[UnitKey, bool] | None = None,
) -> list[SessionUnit]:
    """
    Builds the next session at the unit (belt, topic, exercise_type) granularity:
    - Step 1: collect units that are "new" (not attempted) or "pending" (overdue).
    - Step 2: while candidates < min_session_exercises, ask the caller to
      introduce the next topic (yielding one unit per exercise_type). Stop
      when nothing's left to unlock.
    - Step 3: hard-cap at max_session_exercises. Overflow naturally surfaces
      tomorrow because unintroduced units stay queued.
    - Step 4: greedy mix ensuring min_distance_same_topic between same topics.

    `introduce_new_topic` is expected to return a list[UnitKey] for the next
    unlocked topic (one entry per exercise_type), or [] when there's nothing
    left to unlock.
    """
    config = config or SM2Config()
    today = today or date.today()
    unit_attempted = unit_attempted or {}

    candidates: list[SessionUnit] = []
    for k, s in units.items():
        is_attempted = unit_attempted.get(k, False)
        is_new = not is_attempted and s.phase == "learning"
        is_pending = s.next_review <= today

        if is_new or is_pending:
            candidates.append(SessionUnit(key=k, state=s))

    def _unit_priority(unit: SessionUnit) -> int:
        if topic_priority is None:
            return 0
        return topic_priority.get(unit.key.topic_key, len(topic_priority))

    if topic_priority is not None:
        candidates.sort(key=_unit_priority)
    else:
        candidates.sort(key=lambda x: (
            not (not unit_attempted.get(x.key, False) and x.state.phase == "learning"),
            x.state.next_review,
        ))

    if introduce_new_topic is not None and len(candidates) < config.min_session_exercises:
        guard = 0
        while len(candidates) < config.min_session_exercises and guard < 50:
            guard += 1
            new_keys = introduce_new_topic() or []
            new_units = [
                SessionUnit(key=uk, state=SM2UnitState())
                for uk in new_keys
                if uk not in units
            ]
            if not new_units:
                break
            if topic_priority is not None:
                new_units.sort(key=_unit_priority)
            candidates.extend(new_units)

    candidates = candidates[: config.max_session_exercises]

    session: list[SessionUnit] = []
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
    state: SM2UnitState, intra_session_count: int, *, config: SM2Config | None = None
) -> bool:
    """
    Returns True if a failed unit in step 0 should be reinserted in the current session.
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
