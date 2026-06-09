from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Literal

from .config import SM2Config


@dataclass
class SM2UnitState:
    """SM-2 state for one learning unit (belt, topic, exercise_type)."""
    phase: Literal["learning", "review"] = "learning"
    step_index: int = 0
    ease_factor: float = 2.5
    interval: int = 0
    repetitions: int = 0
    next_review: date = field(default_factory=date.today)


def update_unit_state(
    state: SM2UnitState,
    quality: int,
    *,
    config: SM2Config | None = None,
    today: date | None = None,
) -> SM2UnitState:
    config = config or SM2Config()
    today = today or date.today()

    if state.phase == "learning":
        return _update_learning(state, quality, config=config, today=today)
    return _update_review(state, quality, config=config, today=today)


def _update_learning(
    state: SM2UnitState,
    quality: int,
    *,
    config: SM2Config,
    today: date,
) -> SM2UnitState:
    steps = config.learning_steps

    # En aprendizaje solo se avanza con acierto al primer intento (quality 5);
    # cualquier otra cosa (quality < pase) reinicia la racha al paso 1.
    if quality >= config.quality_threshold_pass:
        next_step = state.step_index + 1
        if next_step >= len(steps):
            # Mastered: enters reviewing phase
            return SM2UnitState(
                phase="review",
                step_index=0,
                ease_factor=config.ef_initial,
                interval=config.review_initial_interval,
                repetitions=0,
                next_review=today + timedelta(days=config.review_initial_interval),
            )
        interval = steps[next_step]
        return SM2UnitState(
            phase="learning",
            step_index=next_step,
            ease_factor=state.ease_factor,
            interval=interval,
            repetitions=state.repetitions,
            next_review=today + timedelta(days=interval),
        )
    else:
        # Fallo: reinicia al paso 1 (mismo día) — hay que volver a encadenar
        # los 3 aciertos limpios seguidos.
        interval = steps[0]
        return SM2UnitState(
            phase="learning",
            step_index=0,
            ease_factor=state.ease_factor,
            interval=interval,
            repetitions=0,
            next_review=today + timedelta(days=interval),
        )


def _update_review(
    state: SM2UnitState,
    quality: int,
    *,
    config: SM2Config,
    today: date,
) -> SM2UnitState:
    repetitions = state.repetitions

    # Ease factor SM-2: el tiempo de respuesta define la calidad (5/4/3) y, con
    # ella, cómo se mueve el EF. Pifiar (quality 0) lo penaliza fuerte (-0.8).
    ef = max(
        config.ef_min_absolute,
        state.ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
    )

    if quality < config.quality_threshold_pass:
        # Pifió: vuelve a 0 y se repasa el mismo día (intervalo 0). No vuelve a
        # la fase de aprendizaje: sigue en review, pero su intervalo se recalcula.
        interval = 0
        repetitions = 0
    else:
        # Acierto limpio: el intervalo crece multiplicando por el ease factor.
        # Tras una recaída (intervalo 0) rearranca suave (~1-2 días).
        base = state.interval if state.interval > 0 else 1
        interval = min(
            round(base * ef),
            config.post_graduation_max_interval_days,
        )
        repetitions += 1

    return SM2UnitState(
        phase="review",
        step_index=0,
        ease_factor=ef,
        interval=interval,
        repetitions=repetitions,
        next_review=today + timedelta(days=interval),
    )
