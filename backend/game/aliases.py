"""Aliases autogenerados para guests del minijuego.

Formato palabra+número (ej. "derivador7431"), compatible con las reglas de
usernames.validate_username. Namespace propio: la unicidad es contra
game_players.alias, no contra users.username.
"""

from __future__ import annotations

import random

from sqlalchemy.orm import Session

from models import GamePlayer

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
    return db.query(GamePlayer.id).filter(GamePlayer.alias == alias).first() is not None


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
