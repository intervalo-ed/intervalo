"""
usernames.py — Generación y validación de usernames (handles estilo Instagram).

Reglas de formato (espejadas en el frontend, web/src/lib/username.ts):
- minúsculas, solo `a-z 0-9 . _`
- largo 3–15
- no empieza ni termina en `.`, sin `..` consecutivos

La generación parte del nombre completo de Google (nombre + apellido) probando
combinaciones `inicial(es) del nombre + apellido` y, si todas están tomadas,
agrega un sufijo numérico.
"""

from __future__ import annotations

import re
import unicodedata

from sqlalchemy.orm import Session

from models import User

USERNAME_MIN = 3
USERNAME_MAX = 15

_VALID_RE = re.compile(r"^[a-z0-9._]+$")


def normalize_for_generation(s: str) -> str:
    """Saca tildes (NFKD), pasa a minúscula y conserva solo `[a-z0-9]`."""
    decomposed = unicodedata.normalize("NFKD", s)
    no_accents = "".join(c for c in decomposed if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]", "", no_accents.lower())


def normalize_username(s: str) -> str:
    """Normaliza la entrada manual: trim, minúscula, conserva `a-z0-9._`, recorta a 15."""
    cleaned = re.sub(r"[^a-z0-9._]", "", s.strip().lower())
    return cleaned[:USERNAME_MAX]


def validate_username(s: str) -> tuple[bool, str | None]:
    """Valida formato Instagram. Devuelve (ok, motivo_si_falla)."""
    if not (USERNAME_MIN <= len(s) <= USERNAME_MAX):
        return False, f"El usuario debe tener entre {USERNAME_MIN} y {USERNAME_MAX} caracteres."
    if not _VALID_RE.match(s):
        return False, "Solo se permiten minúsculas, números, punto y guion bajo."
    if s.startswith(".") or s.endswith("."):
        return False, "El usuario no puede empezar ni terminar con punto."
    if ".." in s:
        return False, "El usuario no puede tener dos puntos seguidos."
    return True, None


def generate_candidates(full_name: str, max_len: int = USERNAME_MAX) -> list[str]:
    """Candidatos en orden de preferencia a partir del nombre completo.

    "Nicolás Vrancovich" -> ["nvrancovich", "nivrancovich", "nicvrancovich", ...].
    Sin apellido -> [nombre recortado].
    """
    tokens = [normalize_for_generation(t) for t in full_name.split()]
    tokens = [t for t in tokens if t]

    candidates: list[str] = []

    def _add(c: str) -> None:
        c = c[:max_len]
        if c and c not in candidates:
            candidates.append(c)

    if len(tokens) >= 2:
        first, last = tokens[0], tokens[-1]
        for k in range(1, len(first) + 1):
            _add(first[:k] + last)
        _add(last)  # último recurso antes del sufijo numérico
    elif tokens:
        _add(tokens[0])

    return candidates


def assign_unique_username(db: Session, full_name: str) -> str:
    """Elige el primer candidato libre; si todos están tomados, agrega sufijo numérico."""

    def _taken(u: str) -> bool:
        return db.query(User.id).filter(User.username == u).first() is not None

    candidates = generate_candidates(full_name) or ["usuario"]

    for cand in candidates:
        if len(cand) >= USERNAME_MIN and not _taken(cand):
            return cand

    base = candidates[0]
    n = 2
    while True:
        suffix = str(n)
        trimmed = base[: USERNAME_MAX - len(suffix)]
        candidate = f"{trimmed}{suffix}"
        if not _taken(candidate):
            return candidate
        n += 1
