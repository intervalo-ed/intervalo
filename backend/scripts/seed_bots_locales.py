"""Llena la base LOCAL con jugadores falsos para ver cómo se ve el ranking.

Sirve para probar tamaños y cortes de línea del ranking (web y app) con una
tabla que no sea de un solo jugador: XP de 1 a 7 dígitos, alias cortos y de 30
caracteres, universidades de sigla corta y larga, y gente sin universidad.

Es solo para desarrollo: se niega a correr contra otra cosa que no sea SQLite,
porque escribe jugadores inventados. Todos llevan el alias `bot_…` y el
guest_token `bot-…`, así que `--limpiar` los saca sin tocar a nadie más.

Uso (desde la raíz del repo, con el backend local apagado o prendido):
    python backend/scripts/seed_bots_locales.py            # suma 60 bots
    python backend/scripts/seed_bots_locales.py --cantidad 120
    python backend/scripts/seed_bots_locales.py --limpiar
"""

import argparse
import random
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import GamePlayer  # noqa: E402

PREFIJO = "bot_"

UNIVERSIDADES = ["UBA", "UTN", "UNSAM", "UNLP", "UNC", "UNR", "UNL", "UNT", "UNS", "UADE", "ITBA", None]
NOMBRES = [
    "lucas", "sofi", "mati", "cande", "fede", "vale", "nico", "mica", "agus", "romi",
    "tomi", "pau", "juani", "flor", "santi", "lola", "bauti", "mora", "theo", "emi",
]
# Los extremos que rompen un layout: el alias más largo que entra y el más corto.
ALIAS_LARGOS = [
    "bot_el_maestro_de_las_derivadas_",
    "bot_integral_definida_del_amor_x",
]


def _alias(i: int, rng: random.Random) -> str:
    if i < len(ALIAS_LARGOS):
        return ALIAS_LARGOS[i][:30]
    return f"{PREFIJO}{rng.choice(NOMBRES)}{rng.randint(1, 999)}"[:30]


def _xp(i: int, rng: random.Random) -> int:
    """Reparto con cola larga: unos pocos arriba con muchos dígitos."""
    if i == 0:
        return 1_234_567
    if i == 1:
        return 99_999
    return int(rng.paretovariate(1.1) * 40)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--cantidad", type=int, default=60)
    ap.add_argument("--limpiar", action="store_true")
    args = ap.parse_args()

    if not database.DATABASE_URL.startswith("sqlite"):
        sys.exit("Solo corre contra SQLite local: DATABASE_URL apunta a otra cosa.")

    db = database.SessionLocal()
    try:
        viejos = db.query(GamePlayer).filter(GamePlayer.guest_token.like("bot-%"))
        borrados = viejos.delete(synchronize_session=False)
        if args.limpiar:
            db.commit()
            print(f"Bots borrados: {borrados}")
            return

        rng = random.Random(7)
        usados: set[str] = set()
        for i in range(args.cantidad):
            alias = _alias(i, rng)
            while alias in usados or db.query(GamePlayer).filter_by(alias=alias).first():
                alias = f"{PREFIJO}{rng.choice(NOMBRES)}{rng.randint(1, 9999)}"[:30]
            usados.add(alias)
            xp = _xp(i, rng)
            correctas = max(1, xp // 25)
            db.add(
                GamePlayer(
                    guest_token=f"bot-{i:04d}",
                    alias=alias,
                    alias_is_generated=False,
                    university=rng.choice(UNIVERSIDADES),
                    career=rng.choice(["A", "B", "C", None]),
                    theta=rng.gauss(0, 1.2),
                    n_updates=max(correctas, 12),
                    xp=xp,
                    best_combo=rng.randint(1, 30),
                    exercises_correct=correctas,
                    exercises_attempted=correctas + rng.randint(0, correctas),
                )
            )
        db.commit()
        print(f"Bots: {borrados} anteriores borrados, {args.cantidad} nuevos.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
