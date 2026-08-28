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

from . import keyboard
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
    """Merge guest→user. Commitea. Devuelve el jugador vigente.

    Idempotente solo en el caso fácil: si el invitado YA es de este usuario se
    devuelve tal cual. Si hay que fusionar, no lo es —la fila del invitado se
    borra— así que llamar dos veces con el mismo invitado da 401 la segunda,
    porque el token ya no resuelve a nadie.
    """
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
    from models import (  # import local, evita ciclo
        GameAttempt,
        GameBoostIntent,
        GameCtaEvent,
        GameEvent,
        GameExercise,
    )

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
    # El teclado se UNE, no se elige uno de los dos. Es progresión ganada
    # resolviendo derivadas —cada tecla apareció porque una la exigía— y perderla
    # justo al registrarse castiga exactamente el paso que se quiere fomentar.
    existing.unlocked_keys = keyboard.serialize(
        keyboard.parse_unlocked(existing.unlocked_keys)
        | keyboard.parse_unlocked(guest.unlocked_keys)
    )

    # TODAS las tablas que apuntan al invitado, no solo las dos del progreso.
    #
    # El feed, las métricas de CTA y las intenciones de donación también lo
    # referencian, y quedaban colgadas apuntando a una fila borrada. En la base
    # de producción eso pasaba en silencio —las migraciones que crearon esas tres
    # tablas se olvidaron la clave foránea que models.py sí declara— pero en una
    # base armada con create_all, que es la que usan los scripts de chequeo, el
    # borrado levanta IntegrityError desde adentro de get_current_player, o sea
    # en CUALQUIER endpoint y en bucle.
    for tabla in (GameExercise, GameAttempt, GameEvent, GameCtaEvent, GameBoostIntent):
        db.query(tabla).filter(tabla.player_id == guest.id).update(
            {"player_id": existing.id}, synchronize_session=False
        )
    db.delete(guest)
    db.commit()
    db.refresh(existing)
    return existing


def lock_player(db: Session, player: GamePlayer) -> GamePlayer:
    """Vuelve a leer la fila del jugador tomando su candado, para los endpoints
    que le suman cosas.

    Sin esto, `/answer` y `/skip` leen los contadores en Python y los escriben de
    vuelta con el valor ya calculado (`SET xp = 125`, no `SET xp = xp + 25`). Con
    dos respuestas en vuelo —un doble toque, o el reintento que dispara el
    teléfono cuando la primera tardó demasiado— las dos leen 100, las dos
    escriben 125, y una recompensa entera desaparece. Lo mismo con los ejercicios
    resueltos, los intentos y la racha, que además puede ir para atrás.

    Es un candado de FILA: solo se serializan las respuestas de un mismo jugador,
    que es algo que igual pasa de a una. En SQLite el dialecto lo ignora, así que
    los scripts de chequeo siguen andando igual.

    La simulación ya lo hacía bien para los bots (simulation.py, con incrementos
    del lado de SQL); el camino humano no.
    """
    return (
        db.query(GamePlayer)
        .filter(GamePlayer.id == player.id)
        .with_for_update()
        .one()
    )


def get_current_player(
    authorization: str = Header(None),
    x_game_token: str = Header(None),
    db: Session = Depends(get_db),
) -> GamePlayer:
    user = _clerk_user(authorization, db)
    if user is not None:
        # Mismo criterio que `router._jugador_del_usuario`, repetido acá porque
        # el router importa de este módulo y no al revés. Si cambia uno tiene que
        # cambiar el otro: lo único que los diferencia a propósito es que el del
        # router además anuncia el registro en el feed, y este no puede hacerlo
        # porque corre en TODOS los endpoints, no solo al entrar.
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
