"""Modelos Pydantic del minijuego (requests y responses)."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class GamePlayerCreateRequest(BaseModel):
    # Atribución de primer contacto (?g=), mismas regex que /user/enroll.
    group_id: Optional[str] = None
    utm_source: Optional[str] = None


class GamePlayerOut(BaseModel):
    player_id: int
    alias: str
    xp: int
    rank: Optional[int] = None
    combo: int
    best_combo: int
    best_rank: Optional[int] = None
    exercises_correct: int
    exercises_attempted: int
    university: Optional[str] = None
    career: Optional[str] = None
    is_guest: bool
    # Nivel 0-3 derivado del θ (elo.level_of): el front lo pinta con los colores
    # de cinturón, como el ranking de Intervalo pinta el cinturón máximo.
    level: int = 0


class GamePlayerCreateResponse(BaseModel):
    player: GamePlayerOut
    # Solo en jugadores guest; el cliente lo guarda en localStorage.
    guest_token: Optional[str] = None


class GameProfilePatchRequest(BaseModel):
    alias: Optional[str] = None
    university: Optional[str] = None
    career: Optional[str] = None


class GameExerciseOut(BaseModel):
    exercise_id: int
    prompt_latex: str
    tier: int
    difficulty_stars: int
    combo: int
    # Fila dinámica del teclado: solo lo que esta derivada necesita más un par de
    # distractores de la misma familia (ver game/keyboard.py). Puede venir vacía.
    keys: list[str] = []


class GameAnswerRequest(BaseModel):
    exercise_id: int
    answer_latex: str
    # Árbol MathJSON de @cortex-js/compute-engine (ce.parse(latex).json).
    answer_mathjson: Any = None
    response_ms: Optional[int] = None


class GameAnswerResponse(BaseModel):
    correct: bool
    parse_ok: bool
    # Mensaje cuando parse_ok=False ("no pudimos evaluar tu respuesta").
    parse_error: Optional[str] = None
    attempt_number: int
    attempts_left: int
    feedback_incorrect: Optional[str] = None
    xp_awarded: int
    xp_total: int
    combo: int
    combo_bonus: int
    # Solo cuando el ejercicio se cierra sin acierto.
    correct_answer_latex: Optional[str] = None
    rank_before: Optional[int] = None
    rank_after: Optional[int] = None
    best_rank: Optional[int] = None
    is_record: bool = False


class GameLeaderboardEntry(BaseModel):
    rank: int
    player_id: int
    alias: str
    xp: int
    exercises_correct: int
    is_current_player: bool
    is_guest: bool
    university: Optional[str] = None
    career: Optional[str] = None
    level: int = 0


class GameLeaderboardMe(BaseModel):
    rank: Optional[int] = None
    xp: int


class GameLeaderboardResponse(BaseModel):
    entries: list[GameLeaderboardEntry]
    total_count: int
    has_more: bool
    me: GameLeaderboardMe


class GameLeaderboardSummary(BaseModel):
    """Los dos números de la cabecera + las universidades para poblar el filtro.

    Cuenta la misma población que muestra la lista de abajo (sembrados
    incluidos): un contador que dijera otra cosa contradiría al ranking.
    """

    players: int
    exercises: int
    universities: list[str]


class GameUniversityRow(BaseModel):
    university: str
    xp: int
    players: int
    careers: dict[str, int]


class GameUniversityLeaderboardResponse(BaseModel):
    rows: list[GameUniversityRow]
    total_players: int
    total_universities: int
