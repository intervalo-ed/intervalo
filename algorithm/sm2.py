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
    # Últimos `learning_window` resultados en fase de aprendizaje ("1"/"0" por
    # intento, más reciente al final). Vacío en fase de retención — el portón
    # de ventana solo aplica en aprendizaje. Ver _update_learning.
    recent_results: str = ""


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

    # Portón de ventana: gradúa con `learning_need` aciertos de los últimos
    # `learning_window` intentos, no necesariamente seguidos. Un fallo aislado
    # ya no reinicia todo el progreso a cero — antes, con una racha estricta,
    # el ítem podía agotar el pool entero de ejercicios sin graduar nunca
    # (ver 2026-08-26-motor-de-sesiones.md §3-ter, caso u193).
    passed = quality >= config.quality_threshold_pass
    recent = (state.recent_results + ("1" if passed else "0"))[-config.learning_window:]
    aciertos = recent.count("1")

    if aciertos >= config.learning_need:
        # Mastered: enters reviewing phase
        return SM2UnitState(
            phase="review",
            step_index=0,
            ease_factor=config.ef_initial,
            interval=config.review_initial_interval,
            repetitions=0,
            next_review=today + timedelta(days=config.review_initial_interval),
            recent_results="",
        )

    # No gradúa todavía: la posición en `learning_steps` (y por lo tanto cuán
    # lejos se programa la próxima revisión) sigue la cantidad de aciertos
    # acumulados en la ventana, no un contador de racha que un solo fallo
    # borra entero.
    step = min(aciertos, len(steps) - 1)
    interval = steps[step]
    return SM2UnitState(
        phase="learning",
        step_index=step,
        ease_factor=state.ease_factor,
        interval=interval,
        repetitions=state.repetitions,
        next_review=today + timedelta(days=interval),
        recent_results=recent,
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
