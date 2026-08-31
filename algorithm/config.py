from dataclasses import dataclass, field


@dataclass
class SM2Config:
    # Learning phase
    # Intervalos (en días) por paso: paso 1 hoy (0), paso 2 mañana (1),
    # paso 3 pasado mañana (2). El paso ya no es una racha estricta: es la
    # cantidad de aciertos dentro de la ventana de `learning_window` intentos
    # (ver learning_window/learning_need y algorithm/sm2.py::_update_learning).
    learning_steps: list[int] = field(default_factory=lambda: [0, 1, 2])
    max_intra_session_reps: int = 2
    quality_threshold_pass: int = 3

    # Portón de graduación: gradúa cuando, de los últimos `learning_window`
    # intentos, al menos `learning_need` fueron aciertos al primer intento (no
    # hace falta que sean consecutivos). Con [4, 3] un resbalón aislado ya no
    # reinicia todo el progreso — con la racha estricta anterior (equivalente a
    # [3, 3] consecutivos) el usuario retenido promedio quedaba con menos de 2
    # ítems graduados. Ver 2026-08-26-motor-de-sesiones.md §3/§8.
    learning_window: int = 4
    learning_need: int = 3

    # Reviewing phase
    review_initial_interval: int = 7
    post_graduation_max_interval_days: int = 30
    ef_initial: float = 2.5
    ef_min_absolute: float = 1.3

    # Calidad de retención por tiempo de respuesta (segundos). Acierto al primer
    # intento: <fast → 5, <medium → 4, resto → 3. El tiempo modula el ease factor.
    review_fast_seconds: float = 10.0
    review_medium_seconds: float = 30.0

    # Session
    max_session_exercises: int = 8
    min_distance_same_topic: int = 2
