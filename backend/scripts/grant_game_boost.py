"""Activa un empuje de XP para una universidad del minijuego de derivadas.

Es el disparador manual de la mecánica de cafecitos: llega una donación, se
mira de qué universidad es, y se corre esto. No hay endpoint porque el backend no
tiene ninguna autenticación de admin, y no vale la pena inventar un esquema de
secretos para algo que se dispara a mano un puñado de veces por día.

Uso:
    python backend/scripts/grant_game_boost.py --university UBA --cafecitos 3
    python backend/scripts/grant_game_boost.py --university utn --cafecitos 1 --donor "Nico"
    python backend/scripts/grant_game_boost.py --list        # empujes vigentes
    python backend/scripts/grant_game_boost.py --expire UBA  # cortarlo ya

La sigla se canonicaliza sola, así que `uba`, `UBA` y "Universidad de Buenos
Aires" son lo mismo.

En producción va por `railway ssh --service backend` (misma DATABASE_URL que la
app), igual que seed_game_bots.py.
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

# En producción DATABASE_URL viene del entorno y esto no hace nada. En local, el
# default de database.py es `sqlite:///./intervalo.db` —relativo al directorio
# desde el que se corre—, así que llamar al script desde la raíz del repo abría
# una base vacía en vez de backend/intervalo.db. Este script se invoca a mano y
# desde cualquier lado; que dependa del cwd es una trampa.
import os  # noqa: E402

if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///" + str(BACKEND / "intervalo.db").replace("\\", "/")

from database import SessionLocal  # noqa: E402
from models import GameBoost, GamePlayer  # noqa: E402
from universities import canonical_university  # noqa: E402
from game import boosts  # noqa: E402


def mostrar(db) -> None:
    activos = boosts.active_boosts(db)
    if not activos:
        print("no hay empujes vigentes")
        return
    print(f"{'universidad':<12} {'mult':>6} {'cafecitos':>10} {'quedan':>9}  donante")
    for b in activos:
        etiqueta = b.university or "TODOS"
        mins = b.expires_in_seconds // 60
        segs = b.expires_in_seconds % 60
        print(
            f"{etiqueta:<12} {b.multiplier:>5.2f}x {b.cafecitos:>10} "
            f"{mins:>6}m{segs:02d}s  {b.donor_name or '—'}"
        )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--university", "-u", help="sigla o nombre de la universidad")
    ap.add_argument("--cafecitos", "-c", type=int, default=1)
    ap.add_argument("--donor", "-d", default=None, help="nombre para el cartel")
    ap.add_argument("--minutes", "-m", type=int, default=None,
                    help="sin valor, sale de los cafecitos (15 min c/u, tope 60)")
    ap.add_argument("--ref", default=None, help="id externo de la donación (idempotencia)")
    ap.add_argument("--message", default=None,
                    help="mensaje de la donación; si trae una sigla, se usa")
    ap.add_argument("--donation", action="store_true",
                    help="resuelve como donación real: sigla del mensaje, si no las "
                         "intenciones abiertas, si no un empuje GLOBAL")
    ap.add_argument("--list", action="store_true", help="lista los empujes vigentes")
    ap.add_argument("--expire", metavar="UNIVERSIDAD", help="vence ya los empujes de esa universidad")
    args = ap.parse_args()

    db = SessionLocal()
    try:
        if args.list:
            mostrar(db)
            return 0

        if args.expire:
            uni = (canonical_university(args.expire) or "").strip()
            now = datetime.utcnow()
            n = (
                db.query(GameBoost)
                .filter(GameBoost.university == uni, GameBoost.expires_at > now)
                .update({"expires_at": now}, synchronize_session=False)
            )
            db.commit()
            print(f"vencidos {n} empujes de {uni}")
            return 0

        # Modo donación: no se elige a mano a quién va, lo decide la escalera.
        if args.donation:
            creados = boosts.resolve_donation(
                db, cafecitos=args.cafecitos, donor_name=args.donor,
                message=args.message, external_ref=args.ref, minutes=args.minutes,
            )
            db.commit()
            if not creados:
                print(f"ya se había registrado la donación '{args.ref}'; no se hizo nada")
                return 0
            for b in creados:
                destino = b.university or "TODOS (empuje global)"
                print(f"{destino}: +{args.cafecitos} cafecito(s) → "
                      f"×{boosts.multiplier_for(db, b.university):.2f} "
                      f"por {int((b.expires_at - b.created_at).total_seconds()//60)} min")
            return 0

        if not args.university:
            ap.error("hace falta --university (o --list / --expire / --donation)")

        uni = (canonical_university(args.university) or "").strip()
        if not uni:
            print("universidad vacía", file=sys.stderr)
            return 1

        # Aviso, no error: una universidad sin jugadores es un empuje que no le
        # llega a nadie, y casi siempre significa que la sigla está mal escrita.
        alcanzados = (
            db.query(GamePlayer).filter(GamePlayer.university == uni).count()
        )
        if alcanzados == 0:
            print(f"ojo: no hay ningún jugador con universidad '{uni}'")

        boost = boosts.grant(
            db,
            university=uni,
            cafecitos=args.cafecitos,
            donor_name=args.donor,
            source="manual",
            external_ref=args.ref,
            minutes=args.minutes,
        )
        if boost is None:
            print(f"ya se había registrado la donación '{args.ref}'; no se hizo nada")
            return 0
        db.commit()

        mult = boosts.multiplier_for(db, uni)
        print(
            f"{uni}: +{args.cafecitos} cafecito(s) → ×{mult:.2f} "
            f"por {boost.expires_at.strftime('%H:%M')} UTC, alcanza a {alcanzados} jugador(es)"
        )
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
