"""
backfill_usernames.py — Asigna username a todos los usuarios que no tengan uno.

Usa la misma lógica de generación que la creación JIT (usernames.assign_unique_username),
respetando unicidad. Idempotente: solo toca filas con username NULL.

Correr desde backend/:
    python scripts/backfill_usernames.py
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from database import SessionLocal  # noqa: E402
from models import User  # noqa: E402
from usernames import assign_unique_username  # noqa: E402


def main() -> None:
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.username.is_(None)).all()
        print(f"Usuarios sin username: {len(users)}")
        for u in users:
            u.username = assign_unique_username(db, u.name)
            db.flush()  # visible para el siguiente chequeo de unicidad
            print(f"  #{u.id} {u.name!r} -> {u.username}")
        db.commit()
        print("Backfill completo.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
