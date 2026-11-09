"""Borrado de la cuenta del juego (Apple 5.1.1(v): si la app deja crear una
cuenta, tiene que dejar borrarla desde adentro).

Qué se borra
------------
El jugador y TODO lo que cuelga de él: intentos, ejercicios, mensajes, votos,
suscripciones de aviso, @ y su historial. Si el jugador tiene cuenta (Clerk), se
borra también la fila de `users` y lo suyo del curso clásico, y la cuenta en
Clerk — es la misma identidad en la web y en la app, no hay forma de borrar solo
una mitad.

Cómo se recorre
---------------
No hay una lista de tablas escrita a mano: se camina `Base.metadata` buscando las
claves foráneas que apuntan a la fila. Una tabla nueva con `player_id` queda
cubierta sin acordarse de tocar este archivo, que es justo el olvido que dejaría
datos personales vivos después de un "borré mi cuenta".

Para cada tabla que apunta a la fila:
  - clave NULL-able  → se pone en NULL (el dato sobrevive sin dueño). Lo que no
    puede sobrevivir sin dueño va en `BORRAR_SIEMPRE`.
  - clave NOT NULL   → se borra la fila (y, recursivo, lo que cuelga de ella).
"""

from __future__ import annotations

import logging

import httpx
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

import auth
from database import Base
from models import GameBoost, GamePlayer, User

log = logging.getLogger("intervalo.borrado")

# Tablas con la clave NULL-able donde dejar la fila huérfana igual identifica a
# la persona: el feed trae el alias escrito en el texto, y un @ activo sin dueño
# bloquearía el nombre para siempre.
BORRAR_SIEMPRE = {"game_events", "handles"}


class ClerkNoRespondio(Exception):
    """Clerk no borró la cuenta: no se toca la base, así se puede reintentar."""


def _borrar_filas(db: Session, tabla, valores: list) -> None:
    """Borra de `tabla` las filas con esa clave primaria (y lo que cuelga)."""
    if not valores:
        return
    pk = list(tabla.primary_key.columns)
    # Todas las tablas del modelo tienen clave primaria de una columna.
    columna = pk[0]

    for hija in Base.metadata.tables.values():
        for fk in hija.foreign_keys:
            if fk.column.table is not tabla or fk.column is not columna:
                continue
            col = fk.parent
            if hija is tabla:
                # Autorreferencia (referred_by): los que reclutó este jugador
                # siguen existiendo, solo pierden el vínculo.
                db.execute(update(hija).where(col.in_(valores)).values({col.name: None}))
            elif col.nullable and hija.name not in BORRAR_SIEMPRE:
                db.execute(update(hija).where(col.in_(valores)).values({col.name: None}))
            else:
                hijas_pk = list(hija.primary_key.columns)[0]
                ids = [r[0] for r in db.execute(select(hijas_pk).where(col.in_(valores)))]
                _borrar_filas(db, hija, ids)

    db.execute(delete(tabla).where(columna.in_(valores)))


def _borrar_en_clerk(clerk_user_id: str) -> None:
    """Borra la cuenta en Clerk. 404 = ya no estaba: cuenta como hecho.

    Sin `CLERK_SECRET_KEY` (desarrollo) no hay a quién llamar y se sigue: en
    producción la variable está siempre, porque sin ella ni se crean las cuentas.
    """
    if not auth.CLERK_SECRET_KEY:
        log.warning("borrado: sin CLERK_SECRET_KEY, no se borra %s en Clerk", clerk_user_id)
        return
    try:
        resp = httpx.delete(
            f"https://api.clerk.com/v1/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {auth.CLERK_SECRET_KEY}"},
            timeout=8.0,
        )
    except httpx.HTTPError as exc:
        raise ClerkNoRespondio(str(exc)) from exc
    if resp.status_code not in (200, 204, 404):
        raise ClerkNoRespondio(f"Clerk respondió {resp.status_code}")


def borrar_cuenta(db: Session, player: GamePlayer) -> None:
    """Borra al jugador y, si tiene cuenta, al usuario. Hace commit.

    Clerk va PRIMERO: si falla, la base queda intacta y la persona puede
    reintentar. Al revés quedaría una cuenta en Clerk sin nada de nuestro lado, y
    el próximo login le crearía un jugador nuevo con el mismo mail.
    """
    user = db.get(User, player.user_id) if player.user_id is not None else None
    clerk_id = user.clerk_user_id if user is not None else None
    if clerk_id:
        _borrar_en_clerk(clerk_id)

    # Los pagos de cafecito se conservan (son contabilidad) pero sin el nombre ni
    # el mail de quien los hizo.
    db.execute(
        update(GameBoost)
        .where(GameBoost.player_id == player.id)
        .values(donor_name=None, donor_email=None)
    )

    jugador_tabla = GamePlayer.__table__
    _borrar_filas(db, jugador_tabla, [player.id])
    if user is not None:
        _borrar_filas(db, User.__table__, [user.id])
    db.commit()
