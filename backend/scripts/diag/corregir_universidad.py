"""Corrige la universidad de un jugador del minijuego.

Arranca EN SECO: sin `--aplicar` imprime lo que haría y no escribe nada.

**Por qué hace falta un script.** El campo tiene un "Otra" de texto libre, así
que entra cualquier cosa: siglas de FACULTAD (`FADU`, `FIUBA`), nombres a medias,
typos. `canonical_university` limpia las variantes de una universidad CONOCIDA
—"Uba", "universidad de buenos aires"— pero no puede adivinar de qué casa de
estudios es una facultad, y no debería: `FADU` es de la UBA y también de la UNL,
así que un mapeo automático le pondría la universidad equivocada a alguien.

Es una decisión por caso, y por eso es un script con confirmación y no una regla.

**Qué NO hace.** No toca `enrollments` de Intervalo: son dos columnas distintas
y quien tiene las dos las cargó por separado. Si hay que corregir las dos, se
corre dos veces mirando cada una.

**Qué se lleva puesto el cambio.** La universidad del jugador decide de qué
ranking participa, qué empuje de cafecito le aplica y a qué universidad le suma
su XP de acá en adelante. Lo YA sumado no se recalcula: la XP vive en el jugador
y los rankings la agregan al vuelo, así que el cambio se ve en la próxima
consulta sin migrar nada.

Uso:
    python backend/scripts/diag/corregir_universidad.py 114 UBA
    python backend/scripts/diag/corregir_universidad.py 114 UBA --aplicar
"""

from __future__ import annotations

import argparse
import os
import sys
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
from universities import UNIVERSITIES, canonical_university  # noqa: E402

SIGLAS = {sigla for sigla, _ in UNIVERSITIES}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("player_id", type=int, help="id de game_players")
    ap.add_argument("universidad", help="sigla del catálogo, p. ej. UBA")
    ap.add_argument("--aplicar", action="store_true",
                    help="escribe; sin esto solo muestra")
    args = ap.parse_args()

    # La sigla se canonicaliza igual que en el alta: así `uba` o "Universidad de
    # Buenos Aires" entran bien, y lo que no está en el catálogo se rechaza acá
    # en vez de guardarse y volver a ensuciar la columna.
    destino = canonical_university(args.universidad)
    if destino not in SIGLAS:
        print(f"«{args.universidad}» no está en el catálogo (universities.py).")
        print("Siglas válidas: " + ", ".join(sorted(SIGLAS)))
        return 2

    db = database.SessionLocal()
    try:
        jugador = db.get(GamePlayer, args.player_id)
        if jugador is None:
            print(f"No existe el jugador {args.player_id}.")
            return 1

        print(f"jugador {jugador.id} @{jugador.alias}")
        print(f"  universidad : {jugador.university!r} → {destino!r}")
        print(f"  xp          : {jugador.xp}")
        print(f"  cuenta      : {'sí, user_id=' + str(jugador.user_id) if jugador.user_id else 'invitado'}")

        if jugador.university == destino:
            print("\nYa estaba en esa universidad: no hay nada que hacer.")
            return 0

        if not args.aplicar:
            print("\nEn seco. Volvé a correrlo con --aplicar para escribir.")
            return 0

        jugador.university = destino
        # `university_set_at` NO se toca: sella cuándo la persona la eligió, y es
        # lo que decide si le aplica un empuje que ya estaba corriendo (ver
        # game/boosts.py :: aplica_el_empuje). Una corrección nuestra no puede
        # darle ni sacarle un multiplicador que ya venía cobrando.
        db.commit()
        print("\nListo.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
