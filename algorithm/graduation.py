from __future__ import annotations

from dataclasses import dataclass

from .domain import BeltCatalog, ItemKey
from .sm2 import SM2ItemState


def is_graduated(state: SM2ItemState) -> bool:
    """True when a single item has completed the learning loop."""
    return state.phase == "review"


@dataclass
class BeltProgress:
    graduated: int   # items currently in 'review' phase for this belt
    total: int       # total items in the belt catalog
    stripes: int     # stripes earned (0, 1 or 2)
    promoted: bool   # True when graduated >= catalog.promotion_threshold


def belt_progress(
    items: dict[ItemKey, SM2ItemState],
    catalog: BeltCatalog,
) -> BeltProgress:
    """
    Computes graduation progress for a belt.

    Counts items in 'review' phase across the full belt catalog,
    regardless of which items were exercised in the current session.
    Items not yet started are treated as learning/step 0.
    """
    belt_keys = catalog.all_keys()
    graduated = sum(
        1 for k in belt_keys
        if items.get(k, SM2ItemState()).phase == "review"
    )
    stripes = sum(1 for t in catalog.stripe_thresholds if graduated >= t)
    return BeltProgress(
        graduated=graduated,
        total=catalog.total_items,
        stripes=stripes,
        promoted=graduated >= catalog.promotion_threshold,
    )
