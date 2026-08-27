"""Endpoints del minijuego de derivadas — primer APIRouter del repo.

main.py solo hace `app.include_router(game_router)`; todo el bounded context
vive en este paquete. La correctitud la decide el SERVER (validación numérica
contra la derivada esperada), a diferencia de las sesiones de Intervalo donde
la reporta el cliente.
"""

from __future__ import annotations

import re
from datetime import datetime

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import and_ as sa_and, case, func, or_ as sa_or
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import GameAttempt, GameExercise, GamePlayer
from usernames import normalize_username, validate_username

from . import elo
from . import keyboard as game_keyboard
from . import simulation
from . import xp as game_xp
from .aliases import alias_taken
from .deps import (
    create_guest_player,
    create_player_for_user,
    get_current_player,
    get_db,
    link_guest_to_user,
    player_for_guest_token,
    _clerk_user,
)
from .generator import get_or_create_stat, serve_exercise, template_for
from .mathjson import MathJsonError, to_sympy
from .schemas import (
    GameAnswerRequest,
    GameAnswerResponse,
    GameExerciseOut,
    GameLeaderboardEntry,
    GameLeaderboardMe,
    GameLeaderboardResponse,
    GameLeaderboardSummary,
    GamePulse,
    GamePlayerCreateRequest,
    GamePlayerCreateResponse,
    GamePlayerOut,
    GameProfilePatchRequest,
    GameSkipRequest,
    GameUniversityLeaderboardResponse,
    GameUniversityRow,
)
from .templates import GENERIC_FEEDBACK, latex_es
from .validator import (
    AnswerRejected,
    expr_from_stored,
    guard_candidate,
    match_common_error,
    numerically_equivalent,
)

router = APIRouter(prefix="/game/derivadas", tags=["game"])

MAX_ATTEMPTS = 2
AROUND_WINDOW = 15

# Mismas regex que /user/enroll (main.py): lo que no matchea se descarta para
# no crear cohortes fantasma.
_GROUP_ID_RE = re.compile(r"[a-z]{2,6}\d{1,5}")
_UTM_RE = re.compile(r"[a-z]{2,20}")

_KNOWN_CAREERS = ("E", "S", "T", "M")

# Bucket de carrera, espejo de `_career_bucket_sql` en main.py: la carrera si es
# conocida, "Otra" en cualquier otro caso (incluido NULL).
_CAREER_BUCKET = case((GamePlayer.career.in_(_KNOWN_CAREERS), GamePlayer.career), else_="Otra")


def _scope_filters(university: str | None, career: str | None) -> list:
    """Filtros de scope del ranking, iguales a los del leaderboard principal."""
    filters = []
    if university is not None:
        filters.append(GamePlayer.university == university)
    if career is not None:
        filters.append(_CAREER_BUCKET == career)
    return filters


def _rank_of(db: Session, player: GamePlayer, scope: list | None = None) -> int:
    """Puesto 1-based en el orden canónico (xp DESC, id ASC). Los que nunca
    sumaron XP no compiten (espejo del leaderboard principal)."""
    ahead = (
        db.query(GamePlayer.id)
        .filter(
            *(scope or []),
            GamePlayer.xp > 0,
            sa_or(
                GamePlayer.xp > player.xp,
                sa_and(GamePlayer.xp == player.xp, GamePlayer.id < player.id),
            ),
        )
        .count()
    )
    return ahead + 1


def _player_out(db: Session, player: GamePlayer, with_rank: bool = True) -> GamePlayerOut:
    return GamePlayerOut(
        player_id=player.id,
        alias=player.alias,
        xp=player.xp,
        rank=_rank_of(db, player) if with_rank else None,
        combo=player.current_combo,
        best_combo=player.best_combo,
        best_rank=player.best_rank,
        exercises_correct=player.exercises_correct,
        exercises_attempted=player.exercises_attempted,
        university=player.university,
        career=player.career,
        is_guest=player.user_id is None,
        level=elo.level_of(player.theta),
    )


def _persist_attribution(player: GamePlayer, group_id: str | None, utm_source: str | None) -> None:
    if player.first_group_id is None and group_id and _GROUP_ID_RE.fullmatch(group_id):
        player.first_group_id = group_id
    if player.first_utm_source is None and utm_source and _UTM_RE.fullmatch(utm_source):
        player.first_utm_source = utm_source


@router.post("/player", response_model=GamePlayerCreateResponse)
def create_player(
    body: GamePlayerCreateRequest,
    authorization: str = Header(None),
    x_game_token: str = Header(None),
    db: Session = Depends(get_db),
):
    """Alta de jugador. Sin auth crea un guest (devuelve el token); con Clerk
    crea/devuelve el jugador del usuario. Idempotente: si ya hay jugador para
    el token/user, se devuelve ese."""
    user = _clerk_user(authorization, db)
    if user is not None:
        player = db.query(GamePlayer).filter(GamePlayer.user_id == user.id).first()
        if player is None:
            guest = player_for_guest_token(db, x_game_token)
            if guest is not None and guest.user_id is None:
                player = link_guest_to_user(db, guest, user)
            else:
                player = create_player_for_user(db, user)
        _persist_attribution(player, body.group_id, body.utm_source)
        db.commit()
        return GamePlayerCreateResponse(player=_player_out(db, player), guest_token=None)

    existing = player_for_guest_token(db, x_game_token)
    if existing is not None:
        _persist_attribution(existing, body.group_id, body.utm_source)
        db.commit()
        return GamePlayerCreateResponse(
            player=_player_out(db, existing), guest_token=existing.guest_token
        )

    player = create_guest_player(db)
    _persist_attribution(player, body.group_id, body.utm_source)
    db.commit()
    return GamePlayerCreateResponse(player=_player_out(db, player), guest_token=player.guest_token)


@router.get("/me", response_model=GamePlayerOut)
def get_me(
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    return _player_out(db, player)


@router.patch("/me", response_model=GamePlayerOut)
def patch_me(
    body: GameProfilePatchRequest,
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    if body.alias is not None:
        if player.user_id is None:
            # Elegir el @ es el gancho del registro.
            raise HTTPException(status_code=403, detail="Registrate para elegir tu @.")
        alias = normalize_username(body.alias)
        ok, reason = validate_username(alias)
        if not ok:
            raise HTTPException(status_code=422, detail=reason)
        if alias != player.alias and alias_taken(db, alias):
            raise HTTPException(status_code=409, detail="Ese @ ya está tomado.")
        player.alias = alias

    if body.university is not None:
        from universities import canonical_university

        # canonical_university ya devuelve la sigla o el texto sin bordes.
        player.university = (canonical_university(body.university) or "")[:120] or None
    if body.career is not None:
        # Solo se persisten los códigos conocidos; "Otra" (o basura) queda NULL,
        # el mismo bucket que usa el leaderboard principal.
        career = body.career.strip()
        player.career = career if career in _KNOWN_CAREERS else None

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Ese @ ya está tomado.")
    db.refresh(player)
    return _player_out(db, player)


@router.post("/reset", response_model=GamePlayerOut)
def reset_player(
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    """Reinicia el PROGRESO del jugador desde el panel de configuración.

    Vuelve a cero XP, racha, ejercicios y el Elo — así que el juego arranca otra
    vez por la rampa inicial, con las derivadas más fáciles. Conserva identidad
    (alias, carrera, universidad, cuenta) y atribución, y no borra los intentos
    ya registrados: el historial sigue sirviendo para analítica y el Elo de las
    plantillas (game_template_stats) es global, no del jugador.
    """
    player.xp = 0
    player.current_combo = 0
    player.best_combo = 0
    player.best_rank = None
    player.exercises_correct = 0
    player.exercises_attempted = 0
    player.theta = 0.0
    player.n_updates = 0
    player.last_seen_at = datetime.utcnow()
    # El ejercicio abierto pertenece a la partida vieja.
    db.query(GameExercise).filter(
        GameExercise.player_id == player.id, GameExercise.status == "served"
    ).update({"status": "expired"}, synchronize_session=False)
    # Volver al fondo también mueve el ranking de los demás.
    simulation.bump_version(db)
    db.commit()
    db.refresh(player)
    return _player_out(db, player)


def _exercise_out(exercise: GameExercise, player: GamePlayer) -> GameExerciseOut:
    template = template_for(exercise)
    return GameExerciseOut(
        exercise_id=exercise.id,
        prompt_latex=exercise.prompt_latex,
        tier=template.tier if template else 0,
        difficulty_stars=elo.difficulty_stars(exercise.p_hat),
        combo=player.current_combo,
        # Se deduce de la derivada esperada, que ya está guardada: el teclado
        # muestra lo que hace falta para ESTE ejercicio, no todo el vocabulario.
        keys=game_keyboard.keys_for(
            expr_from_stored(exercise.expected_derivative), exercise.id
        ),
    )


@router.post("/next", response_model=GameExerciseOut)
def next_exercise(
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    exercise = serve_exercise(db, player)
    db.commit()
    return _exercise_out(exercise, player)


@router.post("/skip", response_model=GameExerciseOut)
def skip_exercise(
    body: GameSkipRequest,
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    """Saltear: cierra el ejercicio sin responderlo y sirve uno más fácil.

    Saltear NO es responder, así que no mueve la beta de la plantilla ni suma a
    los ejercicios intentados: pedir algo más fácil es información sobre el
    jugador, no sobre la plantilla, y contarlo como intento inflaría el
    denominador de la tasa de acierto. Sí baja un poco el θ y corta la racha —
    si no, saltear todo lo difícil sería la forma óptima de sostener un combo.
    Tampoco da XP, y como la XP escala con la dificultad, encadenar salteos
    hasta el piso rinde cada vez menos: la mecánica se autolimita.
    """
    exercise = (
        db.query(GameExercise)
        .filter(GameExercise.id == body.exercise_id, GameExercise.player_id == player.id)
        .first()
    )
    if exercise is None:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    if exercise.status != "served":
        raise HTTPException(status_code=409, detail="Ese ejercicio ya se cerró")

    template = template_for(exercise)
    exercise.status = "skipped"
    exercise.answered_at = datetime.utcnow()
    # Antes de servir: serve_exercise expira en bloque lo que siga en "served",
    # y con el cambio todavía pendiente en la sesión este ejercicio entraría en
    # esa barrida y terminaría marcado "expired" en vez de "skipped".
    db.flush()

    player.theta -= elo.SKIP_THETA_PENALTY
    player.current_combo = 0

    nxt = serve_exercise(db, player, max_tier=(template.tier - 1) if template else None)
    db.commit()
    return _exercise_out(nxt, player)


@router.post("/answer", response_model=GameAnswerResponse)
def answer_exercise(
    body: GameAnswerRequest,
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    exercise = (
        db.query(GameExercise)
        .filter(GameExercise.id == body.exercise_id, GameExercise.player_id == player.id)
        .first()
    )
    if exercise is None:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    if exercise.status != "served":
        raise HTTPException(status_code=409, detail="Ese ejercicio ya se cerró")

    prior_attempts = (
        db.query(GameAttempt).filter(GameAttempt.exercise_id == exercise.id).count()
    )
    attempt_number = prior_attempts + 1
    if attempt_number > MAX_ATTEMPTS:
        raise HTTPException(status_code=409, detail="Ese ejercicio ya se cerró")

    expected = expr_from_stored(exercise.expected_derivative)

    # Parseo + guardas. Un fallo acá NO consume intento ni mueve el Elo.
    parse_error: str | None = None
    candidate = None
    try:
        if body.answer_mathjson is None:
            raise MathJsonError("falta answer_mathjson")
        candidate = to_sympy(body.answer_mathjson)
        guard_candidate(candidate)
        correct = numerically_equivalent(expected, candidate)
    except (MathJsonError, AnswerRejected) as exc:
        parse_error = str(exc) or "no pudimos evaluar tu respuesta"
        return GameAnswerResponse(
            correct=False,
            parse_ok=False,
            parse_error=parse_error,
            attempt_number=prior_attempts,
            attempts_left=MAX_ATTEMPTS - prior_attempts,
            xp_awarded=0,
            xp_total=player.xp,
            combo=player.current_combo,
            combo_bonus=0,
        )

    rank_before = _rank_of(db, player)

    # Elo: solo el primer intento, y solo si la tabla no estuvo abierta. Con la
    # tabla a la vista el resultado no dice nada sobre el jugador NI sobre la
    # plantilla, así que no mueve θ ni β: meterlo al Elo ensuciaría la
    # calibración con observaciones que no son de nadie. Tampoco cuenta para la
    # rampa (n_updates), por lo mismo.
    theta_before = theta_after = None
    if attempt_number == 1:
        if not body.peeked:
            stat = get_or_create_stat(db, template_for(exercise))
            theta_before = player.theta
            theta_after, beta_after = elo.update(
                player.theta, player.n_updates, stat.beta, stat.n_observations, correct
            )
            player.theta = theta_after
            player.n_updates += 1
            stat.beta = beta_after
            stat.n_observations += 1
            if correct:
                stat.n_correct += 1
        player.exercises_attempted += 1
        # La racha no distingue: mirar la tabla no la corta, errar sí.
        player.current_combo = player.current_combo + 1 if correct else 0
        player.best_combo = max(player.best_combo, player.current_combo)

    if body.peeked:
        xp_awarded, combo_bonus = game_xp.xp_for_peeked(correct)
    else:
        xp_awarded, combo_bonus = game_xp.xp_for_answer(
            attempt_number, correct, exercise.p_hat, player.current_combo
        )
    if correct:
        player.xp += xp_awarded
        player.exercises_correct += 1

    closed = correct or attempt_number >= MAX_ATTEMPTS
    if closed:
        exercise.status = "answered"
        exercise.answered_at = datetime.utcnow()

    feedback = None
    if not correct:
        feedback = match_common_error(exercise.common_errors_json, candidate)
        if feedback is None:
            template = template_for(exercise)
            feedback = template.generic_feedback if template else GENERIC_FEEDBACK

    db.add(
        GameAttempt(
            exercise_id=exercise.id,
            player_id=player.id,
            attempt_number=attempt_number,
            answer_latex=(body.answer_latex or "")[:2000],
            answer_parsed=str(candidate),
            parse_ok=True,
            is_correct=correct,
            response_ms=body.response_ms,
            xp_awarded=xp_awarded,
            theta_before=theta_before,
            theta_after=theta_after,
            created_at=datetime.utcnow(),
        )
    )
    player.last_seen_at = datetime.utcnow()

    rank_after = _rank_of(db, player)
    if correct:
        # El ranking cambió: el pulso lo va a notar y los demás refrescan.
        simulation.bump_version(db)
    is_record = False
    if correct and (player.best_rank is None or rank_after < player.best_rank):
        is_record = player.best_rank is not None
        player.best_rank = rank_after

    db.commit()

    return GameAnswerResponse(
        correct=correct,
        parse_ok=True,
        attempt_number=attempt_number,
        attempts_left=0 if closed else MAX_ATTEMPTS - attempt_number,
        feedback_incorrect=feedback,
        xp_awarded=xp_awarded,
        xp_total=player.xp,
        combo=player.current_combo,
        combo_bonus=combo_bonus,
        correct_answer_latex=latex_es(expected) if (closed and not correct) else None,
        rank_before=rank_before,
        rank_after=rank_after,
        best_rank=player.best_rank,
        is_record=is_record,
    )


@router.get("/leaderboard/pulse", response_model=GamePulse)
def game_pulse(
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    """Latido del ranking: un número que cambia cuando cambia la tabla.

    Este pedido es además lo que hace avanzar la actividad simulada. No hay
    worker ni cron: el ranking se mueve mientras haya alguien mirándolo, que es
    justo cuando importa que se mueva.
    """
    simulation.maybe_tick(db)
    return GamePulse(version=simulation.get_state(db).version or 0)


@router.get("/leaderboard/summary", response_model=GameLeaderboardSummary)
def game_leaderboard_summary(
    university: str | None = Query(default=None),
    career: str | None = Query(default=None),
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    """Los dos números de la cabecera del ranking, más las universidades para
    poblar el filtro (esas van siempre sin scope)."""
    scope = _scope_filters(university, career)
    players, exercises = (
        db.query(
            func.count(GamePlayer.id),
            func.coalesce(func.sum(GamePlayer.exercises_correct), 0),
        )
        .filter(*scope, GamePlayer.xp > 0)
        .one()
    )
    universities = [
        u
        for (u,) in db.query(GamePlayer.university)
        .filter(GamePlayer.university.isnot(None), GamePlayer.university != "")
        .distinct()
        .order_by(GamePlayer.university.asc())
        .all()
    ]
    return GameLeaderboardSummary(
        players=int(players), exercises=int(exercises), universities=universities
    )


@router.get("/leaderboard/universities", response_model=GameUniversityLeaderboardResponse)
def game_university_leaderboard(
    university: str | None = Query(default=None),
    career: str | None = Query(default=None),
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    """Ranking por universidad: agrega XP y jugadores. Espejo de
    /leaderboard/universities, sobre game_players y con la agregación en la BD."""
    filters = [
        GamePlayer.university.isnot(None),
        GamePlayer.university != "",
        GamePlayer.xp > 0,
        *_scope_filters(university, career),
    ]
    grouped = (
        db.query(
            GamePlayer.university,
            _CAREER_BUCKET.label("bucket"),
            func.count(GamePlayer.id),
            func.coalesce(func.sum(GamePlayer.xp), 0),
        )
        .filter(*filters)
        .group_by(GamePlayer.university, _CAREER_BUCKET)
        .all()
    )

    by_uni: dict[str, dict] = {}
    total_players = 0
    for uni, bucket, players, xp in grouped:
        total_players += players
        agg = by_uni.setdefault(
            uni, {"xp": 0, "players": 0, "careers": {c: 0 for c in (*_KNOWN_CAREERS, "Otra")}}
        )
        agg["xp"] += int(xp)
        agg["players"] += players
        agg["careers"][bucket] += players

    rows = [
        GameUniversityRow(
            university=uni, xp=agg["xp"], players=agg["players"], careers=agg["careers"]
        )
        for uni, agg in by_uni.items()
    ]
    rows.sort(key=lambda r: (r.xp, r.players), reverse=True)
    return GameUniversityLeaderboardResponse(
        rows=rows, total_players=total_players, total_universities=len(by_uni)
    )


@router.get("/leaderboard", response_model=GameLeaderboardResponse)
def game_leaderboard(
    university: str | None = Query(default=None),
    career: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    around_me: bool = Query(default=False),
    player: GamePlayer = Depends(get_current_player),
    db: Session = Depends(get_db),
):
    """Espejo del /leaderboard principal sobre game_players: orden canónico
    (xp DESC, id ASC), solo jugadores con xp > 0 más el propio jugador.

    `university` y `career` acotan el scope igual que en el principal: el rank,
    los totales y la página se calculan todos dentro del scope elegido.
    """
    scope = _scope_filters(university, career)
    visible = sa_or(GamePlayer.xp > 0, GamePlayer.id == player.id)

    total_count = db.query(GamePlayer.id).filter(*scope, visible).count()
    # Con un filtro puesto el jugador puede quedar fuera del scope (filtró por
    # otra universidad): ahí no tiene puesto y la ventana arranca del principio.
    in_scope = (
        db.query(GamePlayer.id).filter(GamePlayer.id == player.id, *scope).first() is not None
    )
    my_rank = _rank_of(db, player, scope) if in_scope else None
    my_index = (my_rank - 1) if my_rank is not None else None

    if around_me and my_index is not None:
        page_offset = max(0, my_index - AROUND_WINDOW)
        page_size = (my_index + AROUND_WINDOW + 1) - page_offset
    elif around_me:
        page_offset = 0
        page_size = AROUND_WINDOW * 2 + 1
    else:
        page_offset = offset
        page_size = limit

    page = (
        db.query(GamePlayer)
        .filter(*scope, visible)
        .order_by(GamePlayer.xp.desc(), GamePlayer.id.asc())
        .offset(page_offset)
        .limit(page_size)
        .all()
    )

    now = datetime.utcnow()
    entries = [
        GameLeaderboardEntry(
            rank=page_offset + index + 1,
            player_id=row.id,
            alias=row.alias,
            xp=row.xp,
            exercises_correct=row.exercises_correct,
            is_current_player=row.id == player.id,
            # Los sembrados cuentan como registrados: is_guest marca "todavía no
            # eligió su nombre", y eso solo aplica a gente real.
            is_guest=row.user_id is None and not row.is_bot,
            university=row.university,
            career=row.career,
            level=elo.level_of(row.theta),
            rank_delta=simulation.rank_delta(row, page_offset + index + 1, now),
        )
        for index, row in enumerate(page)
    ]
    return GameLeaderboardResponse(
        entries=entries,
        total_count=total_count,
        has_more=page_offset + len(page) < total_count,
        me=GameLeaderboardMe(rank=my_rank, xp=player.xp),
    )


@router.post("/link", response_model=GamePlayerOut)
def link_player(
    authorization: str = Header(None),
    x_game_token: str = Header(None),
    db: Session = Depends(get_db),
):
    """Merge explícito guest→user tras el registro. Idempotente."""
    user = _clerk_user(authorization, db)
    if user is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    guest = player_for_guest_token(db, x_game_token)
    if guest is not None and guest.user_id in (None, user.id):
        player = link_guest_to_user(db, guest, user) if guest.user_id is None else guest
    else:
        player = db.query(GamePlayer).filter(GamePlayer.user_id == user.id).first()
        if player is None:
            player = create_player_for_user(db, user)
    return _player_out(db, player)
