"""Modelos Pydantic del minijuego (requests y responses)."""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


# Topes de tamaño de todo lo que entra por el cuerpo de un pedido.
#
# Hasta ahora varios campos no tenían ninguno y el recorte pasaba recién al
# guardar, o sea después de haber recibido y parseado el cuerpo entero: un envío
# de varios megabytes se procesaba completo para terminar guardando dos mil
# caracteres. Declararlos acá los rechaza en la puerta, con un 422 que además
# explica cuál campo se pasó.
_MAX_LATEX = 2000
_MAX_ALIAS = 40
_MAX_UNIVERSIDAD = 120
_MAX_ATRIBUCION = 32


class GamePlayerCreateRequest(BaseModel):
    # Atribución de primer contacto (?g=), mismas regex que /user/enroll.
    group_id: Optional[str] = Field(default=None, max_length=_MAX_ATRIBUCION)
    utm_source: Optional[str] = Field(default=None, max_length=_MAX_ATRIBUCION)


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
    # El mismo θ en escala de ajedrez (elo.rating_of). Es el tercer marcador de
    # la card del ejercicio: a diferencia de la XP —que solo sube— este baja
    # cuando se erra, que es lo que lo vuelve una medida de qué tan difícil se
    # está resolviendo y no de cuánto se jugó.
    elo: int = 1000


class GamePlayerCreateResponse(BaseModel):
    player: GamePlayerOut
    # Solo en jugadores guest; el cliente lo guarda en localStorage.
    guest_token: Optional[str] = None


class GameProfilePatchRequest(BaseModel):
    alias: Optional[str] = Field(default=None, max_length=_MAX_ALIAS)
    university: Optional[str] = Field(default=None, max_length=_MAX_UNIVERSIDAD)
    career: Optional[str] = Field(default=None, max_length=8)


class GameExerciseOut(BaseModel):
    exercise_id: int
    prompt_latex: str
    tier: int
    difficulty_stars: int
    combo: int
    # Inventario COMPLETO de teclas desbloqueadas del jugador, en orden canónico
    # (ver game/keyboard.py). No es lo que este ejercicio necesita: es todo lo
    # que la persona ya se ganó, y crece.
    keys: list[str] = []
    # Las que se desbloquean con ESTE ejercicio, subconjunto de `keys`. El front
    # las usa para festejar solo lo nuevo en vez de animar la fila entera.
    new_keys: list[str] = []


class GameSkipRequest(BaseModel):
    exercise_id: int


class GameAnswerRequest(BaseModel):
    exercise_id: int
    answer_latex: str = Field(max_length=_MAX_LATEX)
    # Árbol MathJSON de @cortex-js/compute-engine (ce.parse(latex).json). El
    # tamaño lo acota mathjson.to_sympy durante el recorrido: acá todavía es un
    # objeto cualquiera y no hay forma de medirlo sin recorrerlo.
    answer_mathjson: Any = None
    # Cuánto tardó la persona, medido por el cliente. Acotado a un día: la
    # columna es un Integer de 32 bits y un valor cualquiera —que se puede
    # mandar a mano— rompía el insert con un 500 en el momento de responder.
    response_ms: Optional[int] = Field(default=None, ge=0, le=86_400_000)
    # La tabla de derivadas estuvo abierta en este ejercicio. Lo reporta el
    # cliente porque es el único que lo sabe; no hay nada que validar del lado
    # del server. Mentir acá solo sirve para PERDER (θ y XP), así que no hace
    # falta defenderlo.
    peeked: bool = False


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
    # Empuje de la universidad ya aplicado a `xp_awarded` y `combo_bonus`. 1.0 = sin
    # empuje. Viaja para que el festejo pueda decir por qué el número es más
    # grande que de costumbre.
    xp_multiplier: float = 1.0
    # Correctas acumuladas por el jugador DESPUÉS de esta respuesta. Va acá y no
    # se deduce en el cliente porque los hitos del juego —la pausa para el
    # cafecito, cada N resueltas— se cuentan sobre la partida entera y no sobre
    # la pestaña: contándolas del lado del front, cada recarga volvía el
    # contador a cero y el hito no llegaba nunca.
    exercises_correct: int = 0
    # Correctas de HOY, en hora argentina. Es lo que la pausa del cafecito le
    # dice a la persona ("ya llevás 23 derivadas resueltas hoy"): el total
    # histórico no sirve ahí, porque el mérito del que se está hablando es el de
    # esta sentada.
    correct_today: int = 0
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
    # Puestos ganados (+) o perdidos (−) en los últimos minutos. 0 = sin
    # movimiento reciente, y el front no dibuja flecha.
    rank_delta: int = 0


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


class GameBoostOut(BaseModel):
    """Un empuje de XP vigente, agregado por universidad (ver game/boosts.py)."""

    # NULL = empuje GLOBAL, para todo el juego. Es a dónde va la donación que no
    # se pudo atribuir a ninguna universidad.
    university: Optional[str] = None
    multiplier: float
    cafecitos: int
    donor_name: Optional[str] = None
    # Segundos que le quedan, NO un instante. Los datetime del proyecto son
    # naive UTC, y mandar un instante sin zona a un cliente que lo va a comparar
    # contra su reloj local es pedir un bug de zonas horarias. Un entero de
    # segundos no tiene ambigüedad.
    expires_in_seconds: int


class GamePulse(BaseModel):
    """Latido del ranking. El cliente lo consulta cada 10 s y solo refresca la
    lista si `version` cambió — y de paso ese mismo pedido es lo que hace
    avanzar la actividad simulada (ver game/simulation.py).

    Los empujes vigentes viajan acá y no en un endpoint propio: este pedido ya
    late cada 10 s desde los dos layouts, así que el cartel se entera sin sumar
    ni una request."""

    version: int
    boosts: list[GameBoostOut] = []


class GameEventOut(BaseModel):
    """Una línea del historial. El emoji viaja aparte del texto para que el
    cliente lo pueda poner siempre al final, sin depender del copy."""

    id: int
    kind: str
    # Con marcadores: `{a}` es el protagonista y `{u0}`/`{u1}` las siglas. El
    # cliente los reemplaza por la tag de cada universidad y por el nombre pintado
    # con el color de su nivel. Las filas viejas no traen marcadores y salen tal
    # cual, que es exactamente lo que corresponde.
    text: str
    emoji: str
    actor_alias: Optional[str] = None
    # Nivel del protagonista, para pintarlo igual que en el ranking. NULL cuando
    # el nombre no es de un jugador (quien invita un cafecito).
    actor_level: Optional[int] = None
    # En el mismo orden en que aparecen {u0} y {u1}.
    universities: list[str] = []
    # Los dos resaltados del feed: "esto sos vos" y "esto es tu universidad".
    is_mine: bool = False
    is_my_university: bool = False
    # Segundos, no un instante: mismo motivo que en GameBoostOut.
    seconds_ago: int


class GameEventsResponse(BaseModel):
    events: list[GameEventOut]


class GameUniversityRow(BaseModel):
    university: str
    xp: int
    players: int
    # Elo promedio de la universidad, en la escala de ajedrez (elo.rating_of).
    # Es el número por el que ordena el ranking Y el que se muestra: ordenar por
    # uno y mostrar otro se lee como un bug.
    #
    # Elo y no XP: la XP mide cuánto jugaste y el Elo qué tan difícil resolvés.
    # Con XP promedio gana la universidad que más horas le puso; con Elo, la que
    # mejor deriva — que es la pelea que el juego quiere tener.
    rating_avg: int
    # Jugadores con Elo ya establecido (los que cuentan para `rating_avg`).
    rated_players: int = 0
    # False = tiene menos de MIN_PLAYERS_RANKED jugadores con Elo. No se la esconde: se
    # devuelve igual, y la UI la muestra apagada al pie. Un ranking que borra tu
    # universidad sin explicación es peor que uno imperfecto.
    ranked: bool = True
    careers: dict[str, int]


class GameUniversityLeaderboardResponse(BaseModel):
    rows: list[GameUniversityRow]
    total_players: int
    total_universities: int


class GameCtaRequest(BaseModel):
    """Telemetría de un llamado a la acción. Todo opcional salvo qué y qué pasó:
    el cliente manda lo que sabe y el server no discute."""

    cta: str = Field(max_length=32)
    action: str = Field(max_length=32)
    placement: Optional[str] = Field(default=None, max_length=24)
    # Mismo caso que response_ms: es un Integer en la base, y este endpoint está
    # documentado como "nunca falla por contenido". Sin el tope, un valor grande
    # lo hacía fallar con un 500 en el commit.
    solved: Optional[int] = Field(default=None, ge=0, le=1_000_000)
