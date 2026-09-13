"""Top 5 universidades del minijuego /derivadas, para armar la imagen de campaña.

Une los dos números que ya arma `/leaderboard/summary` (Estudiantes,
Derivadas) con el orden por XP que usa `/leaderboard/universities` en modo
"experiencia" (game-ranking.tsx :: porExperiencia) — pero sumados SOLO sobre
las 5 universidades elegidas, no sobre la base entera: la imagen de campaña
necesita "cuántos son estos cinco", no "cuántos hay en total".

Ese "Derivadas por universidad" no lo devuelve ningún endpoint hoy —
`/leaderboard/universities` agrupa por (universidad, carrera) para el
desglose de carreras y solo suma XP, no `exercises_correct`— así que sale de
una consulta propia, agrupando derecho por universidad.

Es de solo lectura. No se corre en CI ni forma parte de run_checks.py (ver
scripts/diag/README.md).

Uso, contra producción:
    railway ssh --service backend -- python backend/scripts/diag/ranking_campana.py
    railway ssh --service backend -- python backend/scripts/diag/ranking_campana.py --top 5

Imprime UN JSON por stdout y nada más, para poder capturarlo del lado de
afuera sin parsear texto de bitácora.
"""
import argparse
import json
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

# Igual que handle_collisions.py: en producción DATABASE_URL viene del
# entorno; en local evita que el default relativo de database.py abra una
# base vacía según desde dónde se corra.
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///" + str(
        BACKEND / "intervalo.db"
    ).replace("\\", "/")

from sqlalchemy import func  # noqa: E402

from database import SessionLocal  # noqa: E402
from game import ranking  # noqa: E402
from models import GamePlayer  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--top", type=int, default=5, help="cuántas universidades (default 5)")
    args = p.parse_args()

    db = SessionLocal()
    try:
        filas = (
            db.query(
                GamePlayer.university,
                func.count(GamePlayer.id),
                func.coalesce(func.sum(GamePlayer.xp), 0),
                func.coalesce(func.sum(GamePlayer.exercises_correct), 0),
            )
            .filter(
                GamePlayer.university.isnot(None),
                GamePlayer.university != "",
                ranking.RESOLVIO_ACA,
            )
            .group_by(GamePlayer.university)
            .order_by(func.coalesce(func.sum(GamePlayer.xp), 0).desc())
            .limit(args.top)
            .all()
        )

        universidades = [
            {
                "universidad": uni,
                "estudiantes": int(players),
                "xp": int(xp),
                "derivadas": int(derivadas),
            }
            for uni, players, xp, derivadas in filas
        ]
        salida = {
            "universidades": universidades,
            "total_estudiantes": sum(u["estudiantes"] for u in universidades),
            "total_derivadas": sum(u["derivadas"] for u in universidades),
        }
        print(json.dumps(salida, ensure_ascii=False))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
