"""Auth dual del minijuego: Clerk JWT o guest token (X-Game-Token).

Prioridad: Clerk gana. Si el JWT resuelve a un user sin jugador y además viene
un guest token válido, el jugador guest se linkea en el acto (es el caso
"volvió del OAuth de Google": conserva xp/alias/theta sin paso extra).
"""

from __future__ import annotations

import secrets
from datetime import datetime

from fastapi import Depends, Header, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_or_create_user_from_clerk, verify_clerk_token
from database import SessionLocal
from models import GamePlayer, User

from .aliases import alias_for_user, generate_guest_alias

_CREATE_ATTEMPTS = 3


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def new_guest_token() -> str:
    return secrets.token_urlsafe(32)


def _clerk_user(authorization: str | None, db: Session) -> User | None:
    """Resuelve el user de Clerk o None. 401 solo si el header vino y es inválido."""
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError()
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    try:
        claims = verify_clerk_token(token)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    if not claims:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    try:
        return get_or_create_user_from_clerk(db, claims)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=503, detail="No pudimos crear tu cuenta. Probá de nuevo."
        )


def player_for_guest_token(db: Session, x_game_token: str | None) -> GamePlayer | None:
    if not x_game_token:
        return None
    return db.query(GamePlayer).filter(GamePlayer.guest_token == x_game_token).first()


def create_guest_player(db: Session) -> GamePlayer:
    """Crea un jugador guest con token y alias nuevos. Commitea."""
    for _ in range(_CREATE_ATTEMPTS):
        try:
            player = GamePlayer(
                guest_token=new_guest_token(),
                alias=generate_guest_alias(db),
                created_at=datetime.utcnow(),
                last_seen_at=datetime.utcnow(),
            )
            db.add(player)
            db.commit()
            db.refresh(player)
            return player
        except IntegrityError:
            db.rollback()
    raise HTTPException(status_code=503, detail="No pudimos crear tu jugador. Probá de nuevo.")


def create_player_for_user(db: Session, user: User) -> GamePlayer:
    """Jugador para un user registrado sin jugador previo. Commitea."""
    for _ in range(_CREATE_ATTEMPTS):
        try:
            player = GamePlayer(
                user_id=user.id,
                alias=alias_for_user(db, user.username, user.name),
                created_at=datetime.utcnow(),
                last_seen_at=datetime.utcnow(),
            )
            db.add(player)
            db.commit()
            db.refresh(player)
            return player
        except IntegrityError:
            db.rollback()
            # Carrera consigo mismo (dos pestañas): la fila del ganador sirve.
            existing = db.query(GamePlayer).filter(GamePlayer.user_id == user.id).first()
            if existing:
                return existing
    raise HTTPException(status_code=503, detail="No pudimos crear tu jugador. Probá de nuevo.")


def link_guest_to_user(db: Session, guest: GamePlayer, user: User) -> GamePlayer:
    """Merge guest→user. Idempotente; commitea. Devuelve el jugador vigente."""
    if guest.user_id == user.id:
        return guest
    if guest.user_id is not None:
        # El token pertenece a otro usuario registrado: no se transfiere.
        raise HTTPException(status_code=409, detail="Ese progreso ya pertenece a otra cuenta.")

    existing = db.query(GamePlayer).filter(GamePlayer.user_id == user.id).first()
    if existing is None:
        guest.user_id = user.id
        db.commit()
        db.refresh(guest)
        return guest

    # El user ya tenía jugador (jugó registrado en otro dispositivo): sobrevive
    # esa fila; se suman contadores y gana el Elo con más evidencia.
    from models import GameAttempt, GameExercise  # import local, evita ciclo

    existing.xp += guest.xp
    existing.exercises_correct += guest.exercises_correct
    existing.exercises_attempted += guest.exercises_attempted
    existing.best_combo = max(existing.best_combo, guest.best_combo)
    if guest.best_rank is not None:
        existing.best_rank = (
            guest.best_rank
            if existing.best_rank is None
            else min(existing.best_rank, guest.best_rank)
        )
    if guest.n_updates > existing.n_updates:
        existing.theta = guest.theta
        existing.n_updates = guest.n_updates
    if existing.university is None:
        existing.university = guest.university
    if existing.career is None:
        existing.career = guest.career
    if existing.first_group_id is None:
        existing.first_group_id = guest.first_group_id
    if existing.first_utm_source is None:
        existing.first_utm_source = guest.first_utm_source

    db.query(GameExercise).filter(GameExercise.player_id == guest.id).update(
        {"player_id": existing.id}, synchronize_session=False
    )
    db.query(GameAttempt).filter(GameAttempt.player_id == guest.id).update(
        {"player_id": existing.id}, synchronize_session=False
    )
    db.delete(guest)
    db.commit()
    db.refresh(existing)
    return existing


def get_current_player(
    authorization: str = Header(None),
    x_game_token: str = Header(None),
    db: Session = Depends(get_db),
) -> GamePlayer:
    user = _clerk_user(authorization, db)
    if user is not None:
        player = db.query(GamePlayer).filter(GamePlayer.user_id == user.id).first()
        if player is not None:
            return player
        guest = player_for_guest_token(db, x_game_token)
        if guest is not None and guest.user_id is None:
            return link_guest_to_user(db, guest, user)
        # Token ausente o de otro usuario: jugador propio nuevo.
        return create_player_for_user(db, user)

    guest = player_for_guest_token(db, x_game_token)
    if guest is not None:
        return guest
    raise HTTPException(status_code=401, detail="Jugador no encontrado")
