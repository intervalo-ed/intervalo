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

**Sin DATABASE_URL en el entorno, este script CORTA.** No hay fallback
silencioso a una base local — lo tenía antes (mismo patrón que
handle_collisions.py) y el 14/9 eso mandó la imagen de campaña con los
números de `backend/intervalo.db` (una base de prueba vieja) en vez de los
de producción: nadie lo notó hasta que la imagen ya estaba armada, porque el
script no avisó nada, solo imprimió un JSON con forma correcta y números
inventados. Automatizarlo sobre una imagen que se manda a grupos reales es
peor que frenar. Para probar de verdad contra la base local a propósito, hay
que pasar `--permitir-local` explícito.
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

# Se mira `sys.argv` a mano y no con argparse (que corre recién en `main()`)
# porque esto tiene que decidirse ANTES del `import database`, que ya lee
# DATABASE_URL al cargarse.
if not os.getenv("DATABASE_URL"):
    if "--permitir-local" not in sys.argv:
        print(
            "ERROR: falta DATABASE_URL. Este script es de solo lectura pero "
            "alimenta la imagen que se manda a grupos reales — no arranca sin "
            "saber contra qué base está corriendo.\n"
            "  · Contra producción: railway ssh --service backend -- python "
            "backend/scripts/diag/ranking_campana.py\n"
            "  · Contra la base local, a propósito: agregá --permitir-local",
            file=sys.stderr,
        )
        raise SystemExit(1)
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
    # Ya se miró a mano, ANTES del import de database.py (ver más arriba) —
    # se vuelve a declarar acá solo para que argparse no la rechace.
    p.add_argument("--permitir-local", action="store_true",
                    help="corre contra backend/intervalo.db si no hay DATABASE_URL")
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
