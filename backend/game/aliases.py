"""Aliases autogenerados para guests del minijuego.

Formato palabra+número (ej. "derivador7431"), compatible con las reglas de
usernames.validate_username. Namespace propio: la unicidad es contra
game_players.alias, no contra users.username.
"""

from __future__ import annotations

import random
from datetime import datetime

from sqlalchemy.orm import Session

import handles
from models import GameAliasHistory, GamePlayer

_WORDS = (
    "derivador", "tangente", "pendiente", "limite", "integral", "funcion",
    "parabola", "vertice", "maximo", "minimo", "euler", "newton", "leibniz",
    "matriz", "vector", "escalar", "factorial", "primo", "modulo", "seno",
    "coseno", "exponente", "cociente", "producto", "curva", "recta",
    "asintota", "dominio", "imagen", "abscisa",
)

_MAX_LEN = 15
_ATTEMPTS = 40


def alias_taken(db: Session, alias: str) -> bool:
    """¿Este @ está en uso, o lo estuvo alguna vez?

    Delega en el registro (backend/handles.py), que es la única autoridad. Los
    soltados siguen contando como tomados —un @ viejo sigue resolviendo links de
    reclutamiento, así que dárselo a otra persona sería darle también la gente
    que trajo la primera— y ahora además cuentan los `users.username`, que este
    módulo no miraba y por eso podía entregar un nombre que ya era de alguien.
    """
    return handles.tomado(db, alias)


def retire_alias(db: Session, alias: str, player_id: int) -> None:
    """Deja anotado que ese @ fue de este jugador. No commitea.

    Se llama al cambiar de @ y al fusionar un invitado con una cuenta —los dos
    momentos en que un @ deja de existir con alguien todavía compartiéndolo por
    ahí.
    """
    if not alias:
        return
    # `handles.reclamar` ya retira el @ anterior del mismo dueño, así que este
    # camino queda solo para el resto del código que todavía llama a
    # `retire_alias` explícitamente. Se mantiene `game_alias_history` en sincronía
    # un release más como red de contención: si hay que volver atrás, lo que se
    # muere si no son los links `?r=` repartidos.
    fila = handles.duenio(db, alias)
    if fila is not None and fila.status == "active":
        fila.status = "retired"
        fila.released_at = datetime.utcnow()
        fila.player_id = player_id
    ya = db.query(GameAliasHistory).filter(GameAliasHistory.alias == alias).first()
    if ya is not None:
        # El @ vuelve a soltarse (A→B→A→C): gana el dueño más reciente, que es
        # a quien apuntan los links que se están repartiendo hoy.
        ya.player_id = player_id
        ya.released_at = datetime.utcnow()
        return
    db.add(GameAliasHistory(alias=alias, player_id=player_id, released_at=datetime.utcnow()))


def generate_guest_alias(db: Session, rng: random.Random | None = None) -> str:
    """Elige palabra+sufijo libre. Igual que assign_unique_username, el chequeo
    es un SELECT y el INSERT viene después: llamar desde un loop que capture
    IntegrityError y reintente."""
    rng = rng or random.Random()
    for _ in range(_ATTEMPTS):
        word = rng.choice(_WORDS)
        suffix = str(rng.randint(100, 9999))
        candidate = f"{word[: _MAX_LEN - len(suffix)]}{suffix}"
        if not alias_taken(db, candidate):
            return candidate
    # Salida determinística si el azar viene repetido: sufijo incremental.
    n = 100
    while True:
        candidate = f"jugador{n}"
        if not alias_taken(db, candidate):
            return candidate
        n += 1


def alias_for_user(db: Session, username: str | None, name: str | None) -> str:
    """Alias inicial de un jugador registrado: su username de Intervalo si está
    libre en el namespace del juego; si no, variantes con sufijo."""
    base = (username or "").strip() or None
    if base is None:
        return generate_guest_alias(db)
    if not alias_taken(db, base):
        return base
    n = 2
    while True:
        suffix = str(n)
        candidate = f"{base[: _MAX_LEN - len(suffix)]}{suffix}"
        if not alias_taken(db, candidate):
            return candidate
        n += 1
