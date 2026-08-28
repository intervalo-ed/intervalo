"""Borra un jugador del minijuego para poder probarlo como recién llegado.

El endpoint `/game/derivemos/reset` reinicia el PROGRESO pero conserva la
identidad: alias, universidad, carrera y la cuenta enlazada siguen ahí. Sirve
para "empezar de nuevo" dentro del juego, no para ver lo que ve alguien que
entra por primera vez —la intro, el alias autogenerado, el teclado en cero, el
pedido de universidad—. Eso último necesita que la fila no exista.

Uso:
    python backend/scripts/reset_game_account.py --list
    python backend/scripts/reset_game_account.py --player 2
    python backend/scripts/reset_game_account.py --alias nvrancovich
    python backend/scripts/reset_game_account.py --alias nvrancovich --dry-run

Nunca borra sin un objetivo explícito, y nunca toca bots: es un script de mano
sobre una base de desarrollo, y el modo de fallar más caro sería vaciar la tabla
por un flag olvidado.
"""

import argparse
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

# Mismo cuidado que grant_game_boost.py: el default de database.py es relativo al
# directorio desde el que se corre, así que invocarlo desde la raíz del repo
# abriría una base vacía en vez de backend/intervalo.db.
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///" + str(BACKEND / "intervalo.db").replace("\\", "/")

from database import SessionLocal  # noqa: E402
from models import (  # noqa: E402
    GameAttempt,
    GameBoostIntent,
    GameCtaEvent,
    GameEvent,
    GameExercise,
    GamePlayer,
)
from game import simulation  # noqa: E402

# El orden importa: los intentos cuelgan de los ejercicios.
HIJAS = [
    ("intentos", GameAttempt),
    ("ejercicios", GameExercise),
    ("eventos del historial", GameEvent),
    ("eventos de CTA", GameCtaEvent),
    ("intenciones de cafecito", GameBoostIntent),
]


def humanos(db):
    return (
        db.query(GamePlayer)
        .filter(GamePlayer.is_bot.is_(False))
        .order_by(GamePlayer.last_seen_at.desc())
        .all()
    )


def listar(db) -> None:
    print(f"{'id':>4}  {'alias':<20} {'uni':<8} {'xp':>7} {'hechas':>7}  quién")
    for p in humanos(db):
        quien = f"user #{p.user_id}" if p.user_id else "guest"
        print(
            f"{p.id:>4}  {p.alias or '—':<20} {p.university or '—':<8} "
            f"{p.xp:>7} {p.exercises_attempted:>7}  {quien}"
        )


def borrar(db, player: GamePlayer, dry_run: bool) -> None:
    quien = f"#{player.id} {player.alias}" + (f" (user #{player.user_id})" if player.user_id else " (guest)")
    print(f"{'[dry-run] ' if dry_run else ''}borrando {quien}")
    for etiqueta, modelo in HIJAS:
        q = db.query(modelo).filter(modelo.player_id == player.id)
        n = q.count()
        print(f"  {etiqueta}: {n}")
        if not dry_run and n:
            q.delete(synchronize_session=False)
    if dry_run:
        db.rollback()
        return
    db.delete(player)
    # Se fue del ranking, así que el resto se corre un puesto.
    simulation.bump_version(db)
    db.commit()
    print("listo: borrá el localStorage del navegador y vas a entrar como alguien nuevo")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--list", action="store_true", help="lista los jugadores humanos")
    ap.add_argument("--player", type=int, help="id del jugador a borrar")
    ap.add_argument("--alias", help="alias del jugador a borrar")
    ap.add_argument("--dry-run", action="store_true", help="cuenta lo que borraría y no borra")
    args = ap.parse_args()

    db = SessionLocal()
    try:
        if args.list or (args.player is None and not args.alias):
            listar(db)
            if not args.list:
                print("\nelegí uno con --player <id> o --alias <alias>")
            return 0

        q = db.query(GamePlayer)
        if args.player is not None:
            player = q.filter(GamePlayer.id == args.player).first()
            aguja = f"#{args.player}"
        else:
            player = q.filter(GamePlayer.alias == args.alias).first()
            aguja = args.alias
        if player is None:
            print(f"no existe ningún jugador {aguja}")
            return 1
        if player.is_bot:
            print(f"{aguja} es un bot de la simulación; se borran con seed_game_bots.py")
            return 1

        borrar(db, player, args.dry_run)
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
