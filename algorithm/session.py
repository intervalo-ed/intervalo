from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable

from .config import SM2Config
from .domain import Belt, BeltCatalog, ItemKey, WHITE_BELT
from .sm2 import SM2ItemState


@dataclass(frozen=True)
class SessionItem:
    key: ItemKey
    state: SM2ItemState


def _topic_distance_ok(session: list[SessionItem], candidate: SessionItem, *, min_distance: int) -> bool:
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
    items: dict[ItemKey, SM2ItemState],
    *,
    today: date | None = None,
    config: SM2Config | None = None,
    introduce_new_item: callable | None = None,
    item_priority: dict[ItemKey, int] | None = None,
    item_attempted: dict[ItemKey, bool] | None = None,
) -> list[SessionItem]:
    """
    Dual-Loop session builder (updated for Nuevo/Aprendiendo/Pendiente/Graduado):
    - Step 1: collect items that are "Nuevo" (not attempted) or "Pendiente" (overdue).
    - Step 2: if fewer than min_items_before_new_content, introduce new items.
    - Step 3: cap at max_exercises_per_session.
    - Step 4: greedy mix ensuring min_distance_same_function between same topics.
    """
    config = config or SM2Config()
    today = today or date.today()
    item_attempted = item_attempted or {}

    # Collect items that are either:
    # - "Nuevo": not attempted yet (attempted=False, in learning phase)
    # - "Pendiente": overdue (next_review <= today), regardless of phase
    candidates = []
    for k, s in items.items():
        is_attempted = item_attempted.get(k, False)
        is_new = not is_attempted and s.phase == "learning"
        is_pending = s.next_review <= today

        if is_new or is_pending:
            candidates.append(SessionItem(key=k, state=s))

    if item_priority is not None:
        candidates.sort(key=lambda x: item_priority.get(x.key, len(item_priority)))
    else:
        # Sort by: new items first, then pending by next_review
        candidates.sort(key=lambda x: (
            not (not item_attempted.get(x.key, False) and x.state.phase == "learning"),  # new items first
            x.state.next_review
        ))

    # Step 2: introduce new content if not enough overdue items.
    if introduce_new_item is not None and len(candidates) < config.min_items_before_new_content:
        needed = config.min_items_before_new_content - len(candidates)
        new_items: list[SessionItem] = []
        for _ in range(needed):
            new_key = introduce_new_item()
            if new_key is None or new_key in items:
                break
            new_items.append(SessionItem(key=new_key, state=SM2ItemState()))
        if item_priority is not None:
            new_items.sort(key=lambda x: item_priority.get(x.key, len(item_priority)))
        candidates.extend(new_items)

    # Step 3: cap total session length.
    candidates = candidates[: config.max_exercises_per_session]

    # Step 4: greedy mix with topic distance constraint.
    session: list[SessionItem] = []
    remaining = candidates[:]
    while remaining:
        placed = False
        for idx, cand in enumerate(remaining):
            if _topic_distance_ok(session, cand, min_distance=config.min_distance_same_function):
                session.append(cand)
                remaining.pop(idx)
                placed = True
                break
        if not placed:
            session.append(remaining.pop(0))

    return session


def should_reinsert(state: SM2ItemState, intra_session_count: int, *, config: SM2Config | None = None) -> bool:
    """
    Returns True if a failed item in step 0 should be reinserted in the current session.
    Called by the session controller after each incorrect answer.
    """
    config = config or SM2Config()
    return (
        state.phase == "learning"
        and state.step_index == 0
        and intra_session_count < config.max_intra_session_reps
    )


def default_catalog(belt: BeltCatalog = WHITE_BELT) -> list[ItemKey]:
    """Returns all ItemKeys for the given belt catalog. Defaults to the white belt."""
    return belt.all_keys()


def belt_item_priority(catalog: BeltCatalog) -> dict[ItemKey, int]:
    """
    Returns a priority map for a belt catalog: CLSF/GRAF first, then LEXI/RESV/DERI/INTG,
    then FORM/APLI. Within each skill group, topics follow catalog order.
    This controls the order in which new items are introduced in a session.
    """
    priority: dict[ItemKey, int] = {}
    idx = 0
    for topic in catalog.topics:
        for skill in catalog.skills:
            priority[ItemKey(belt=catalog.belt, topic=topic, skill=skill)] = idx
            idx += 1
    return priority
