from .sm2 import SM2ItemState


def is_graduated(state: SM2ItemState) -> bool:
    return state.phase == "review"
