from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from .config import SM2Config
from .domain import UnitKey
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
    unit_attempted: dict[UnitKey, bool] | None = None,
) -> list[SessionUnit]:
    """
    Builds the next session at the unit (belt, topic, exercise_type) granularity:
    - Step 1: collect units that are "new" (not attempted) or "pending" (overdue),
      priorizando las nuevas y, dentro de cada grupo, las de vencimiento más viejo.
    - Step 2: hard-cap at max_session_exercises. Overflow naturally surfaces
      tomorrow because the leftover units stay queued.
    - Step 3: greedy mix ensuring min_distance_same_topic between same topics.

    Qué units están disponibles lo decide el caller (backend/session_store.py,
    `_ensure_active_units`, que respeta el `active_cap` del usuario): acá no se
    introducen temas nuevos.
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

    candidates.sort(key=lambda x: (
        not (not unit_attempted.get(x.key, False) and x.state.phase == "learning"),
        x.state.next_review,
    ))

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


