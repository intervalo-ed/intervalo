from .config import SM2Config
from .sm2 import SM2ItemState


def is_graduated(state: SM2ItemState, *, config: SM2Config | None = None) -> bool:
    config = config or SM2Config()
    return state.valid_reviews >= config.valid_reviews_to_graduate

