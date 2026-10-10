"""Limpia `game_players.university`: variantes de una misma sigla y basura.

Arranca EN SECO: sin `--aplicar` imprime lo que haría y no escribe nada.

Qué hace, en este orden y por jugador:

  1. **Remapeos explícitos** (`REMAPEOS`): textos que sabemos de qué universidad
     son pero que `canonical_university` no puede deducir ("UNP Paraguay").
  2. **Canonicalización**: pasa cada valor por `canonical_university`, que junta
     "Fing", "fing" y "FING" en una sola sigla y resuelve "Uba" → "UBA".
  3. **Basura**: lo que `is_junk_university` marca (teclazos, números) más los
     textos de `BASURA_EXPLICITA` pasa a NULL. El jugador sigue jugando, pero
     deja de ocupar una fila en el ranking de universidades.

Lo que NO hace: no toca `university_set_at` (sella cuándo eligió y decide si le
aplica un empuje ya corriendo; una corrección nuestra no puede darle ni quitarle
un multiplicador), no toca `enrollments` de Intervalo clásico, y NO adivina de
qué universidad es una facultad: FING y FCEA existen en más de un país.

Uso (contra la base real, con la URL pública del servicio BBDD en DATABASE_URL):
    python backend/scripts/diag/limpiar_universidades.py
    python backend/scripts/diag/limpiar_universidades.py --aplicar
"""

from __future__ import annotations

import argparse
import os
import sys
from collections import Counter
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

if not os.environ.get("DATABASE_URL"):
    print("Falta DATABASE_URL: este script se corre contra la base REAL.")
    sys.exit(2)

import database  # noqa: E402
from models import GamePlayer  # noqa: E402
from universities import canonical_university, is_junk_university  # noqa: E402

# Valor guardado (tal cual está en la base) → sigla del catálogo.
REMAPEOS: dict[str, str] = {
    "Universidad Católica Chile": "PUC",
    "UNP Paraguay": "UNP",
    "Unp": "UNP",
}

# Texto que no es una institución y que la heurística no atrapa por sí sola.
BASURA_EXPLICITA: set[str] = {"Ser f", "UN"}


def destino_de(actual: str | None) -> str | None:
    """A qué valor tiene que quedar. None = NULL (basura)."""
    if actual is None:
        return None
    if actual in BASURA_EXPLICITA:
        return None
    destino = REMAPEOS.get(actual, canonical_university(actual))
    if destino is None or is_junk_university(destino):
        return None
    return destino


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--aplicar", action="store_true", help="escribe; sin esto solo muestra")
    args = ap.parse_args()

    db = database.SessionLocal()
    try:
        jugadores = (
            db.query(GamePlayer)
            .filter(GamePlayer.university.isnot(None), GamePlayer.university != "")
            .all()
        )
        cambios: Counter[tuple[str, str | None]] = Counter()
        a_tocar: list[tuple[GamePlayer, str | None]] = []
        for j in jugadores:
            nuevo = destino_de(j.university)
            if nuevo != j.university:
                cambios[(j.university, nuevo)] += 1
                a_tocar.append((j, nuevo))

        if not cambios:
            print("Nada que limpiar.")
            return 0

        print(f"{len(a_tocar)} jugadores de {len(jugadores)} con universidad:\n")
        for (antes, despues), n in sorted(cambios.items(), key=lambda kv: -kv[1]):
            print(f"  {n:3d}  {antes!r:34} → {despues!r}")

        if not args.aplicar:
            print("\nEn seco. Volvé a correrlo con --aplicar para escribir.")
            return 0

        for j, nuevo in a_tocar:
            j.university = nuevo
        db.commit()
        print("\nListo.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
