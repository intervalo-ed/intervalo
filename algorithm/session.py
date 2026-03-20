from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable

from .config import SM2Config
from .domain import FunctionFamily, ItemKey
from .sm2 import SM2ItemState


@dataclass(frozen=True)
class SessionItem:
    key: ItemKey
    state: SM2ItemState


def _function_distance_ok(session: list[SessionItem], candidate: SessionItem, *, min_distance: int) -> bool:
    if min_distance <= 0:
        return True
    last_same_idx = None
    for i in range(len(session) - 1, -1, -1):
        if session[i].key.function_family == candidate.key.function_family:
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
) -> list[SessionItem]:
    """
    Dual-Loop session builder:
    - Step 1: collect overdue items. Learning items have priority over review.
              If item_priority provided, sorts by priority (lower index = higher priority).
              Otherwise: learning sorted by step_index asc, review by next_review asc.
    - Step 2: if fewer than min_items_before_new_content, introduce new items.
    - Step 3: cap at max_exercises_per_session.
    - Step 4: greedy mix ensuring min_distance_same_function between same families.
    """
    config = config or SM2Config()
    today = today or date.today()

    overdue = [
        SessionItem(key=k, state=s) for k, s in items.items() if s.next_review <= today
    ]

    learning_overdue = [i for i in overdue if i.state.phase == "learning"]
    review_overdue = [i for i in overdue if i.state.phase == "review"]

    if item_priority is not None:
        learning_overdue.sort(key=lambda x: item_priority.get(x.key, len(item_priority)))
        review_overdue.sort(key=lambda x: item_priority.get(x.key, len(item_priority)))
    else:
        learning_overdue.sort(key=lambda x: x.state.step_index)
        review_overdue.sort(key=lambda x: x.state.next_review)

    candidates = learning_overdue + review_overdue

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

    # Step 4: greedy mix with distance constraint.
    session: list[SessionItem] = []
    remaining = candidates[:]
    while remaining:
        placed = False
        for idx, cand in enumerate(remaining):
            if _function_distance_ok(session, cand, min_distance=config.min_distance_same_function):
                session.append(cand)
                remaining.pop(idx)
                placed = True
                break
        if not placed:
            session.append(remaining.pop(0))

    return session


def should_reinsert(state: SM2ItemState, intra_session_count: int, *, config: SM2Config | None = None) -> bool:
    """
    Retorna True si un ítem fallido en step 0 debe reinsertarse en la sesión actual.
    El backend/controlador de sesión llama a esta función después de cada respuesta incorrecta.
    """
    config = config or SM2Config()
    return (
        state.phase == "learning"
        and state.step_index == 0
        and intra_session_count < config.max_intra_session_reps
    )


def default_catalog() -> list[ItemKey]:
    """Convenience: full MVP catalog = all function families x 3 skill types."""
    from .domain import SkillType

    keys: list[ItemKey] = []
    for fam in FunctionFamily:
        for skill in SkillType:
            keys.append(ItemKey(function_family=fam, skill_type=skill))
    return keys
