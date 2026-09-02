"""Activa un empuje de XP para una universidad del minijuego de derivadas.

Es el disparador manual de la mecánica de cafecitos: llega una donación, se
mira de qué universidad es, y se corre esto. No hay endpoint porque el backend no
tiene ninguna autenticación de admin, y no vale la pena inventar un esquema de
secretos para algo que se dispara a mano un puñado de veces por día.

Uso:
    python backend/scripts/grant_game_boost.py --university UBA --cafecitos 3
    python backend/scripts/grant_game_boost.py --university utn --cafecitos 1 --donor "Nico"
    python backend/scripts/grant_game_boost.py --list          # empujes vigentes
    python backend/scripts/grant_game_boost.py --expire UBA    # cortarlo ya
    python backend/scripts/grant_game_boost.py --expire TODOS  # cortar el GLOBAL

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


def restante(segundos: int) -> str:
    """"2d 03h", "18h 20m" o "12m 05s", lo que corresponda.

    Antes era siempre minutos y segundos, que con empujes de media hora se leía
    bien y con empujes de un día daba "1439m59s". Se muestran siempre DOS
    unidades: la de arriba sola miente por casi una unidad entera ("1d" para algo
    que dura casi dos días).
    """
    d, resto = divmod(max(0, segundos), 86400)
    h, resto = divmod(resto, 3600)
    m, s = divmod(resto, 60)
    if d:
        return f"{d}d {h:02d}h"
    if h:
        return f"{h}h {m:02d}m"
    return f"{m}m {s:02d}s"


def mostrar(db) -> None:
    activos = boosts.active_boosts(db)
    if not activos:
        print("no hay empujes vigentes")
        return
    print(f"{'universidad':<12} {'mult':>6} {'cafecitos':>10} {'quedan':>9}  donante")
    for b in activos:
        etiqueta = b.university or "TODOS"
        print(
            f"{etiqueta:<12} {b.multiplier:>5.2f}x {b.cafecitos:>10} "
            f"{restante(b.expires_in_seconds):>9}  {b.donor_name or '—'}"
        )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--university", "-u", help="sigla o nombre de la universidad")
    ap.add_argument("--cafecitos", "-c", type=int, default=1)
    ap.add_argument("--donor", "-d", default=None, help="nombre para el cartel")
    ap.add_argument("--minutes", "-m", type=int, default=None,
                    help="override en MINUTOS, para probar sin esperar un día; "
                         "sin valor sale de los cafecitos (24 h, o 48 h al tope)")
    ap.add_argument("--ref", default=None, help="id externo de la donación (idempotencia)")
    ap.add_argument("--message", default=None,
                    help="mensaje de la donación; si trae una sigla, se usa")
    ap.add_argument("--donation", action="store_true",
                    help="resuelve como donación real: sigla del mensaje, si no las "
                         "intenciones abiertas, si no un empuje GLOBAL")
    ap.add_argument("--list", action="store_true", help="lista los empujes vigentes")
    ap.add_argument("--expire", metavar="UNIVERSIDAD",
                    help="vence ya los empujes de esa universidad; TODOS o "
                         "global vence el empuje GLOBAL")
    args = ap.parse_args()

    db = SessionLocal()
    try:
        if args.list:
            mostrar(db)
            return 0

        if args.expire:
            # El empuje GLOBAL (university IS NULL) es el destino por defecto de
            # toda donación que la escalera no supo dirigir, así que es
            # exactamente donde cae un monto mal leído — y hasta acá era el único
            # que este comando NO podía vencer: `canonical_university("TODOS")`
            # devuelve "TODOS" tal cual y nunca matchea NULL. Con empujes de un
            # día, eso dejaba el juego entero en el multiplicador máximo por 24 h
            # sin forma de cortarlo. "TODOS" es la etiqueta que ya usa --list.
            crudo = args.expire.strip()
            global_ = crudo.casefold() in {"todos", "global"}
            uni = None if global_ else (canonical_university(crudo) or "").strip()
            destino = GameBoost.university.is_(None) if global_ else GameBoost.university == uni
            now = datetime.utcnow()
            n = (
                db.query(GameBoost)
                .filter(destino, GameBoost.expires_at > now)
                .update({"expires_at": now}, synchronize_session=False)
            )
            db.commit()
            # No hace falta tocar el caché de empujes: es por proceso (este
            # script no es el server) y además solo memoriza el "no hay
            # ninguno", así que un vencimiento se ve en la consulta siguiente.
            print(f"vencidos {n} empujes de {uni or 'TODOS (empuje global)'}")
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
                      f"por {restante(int((b.expires_at - b.created_at).total_seconds()))}")
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
        # La duración va primero y el instante con fecha: con empujes de un día,
        # un `%H:%M` solo es la misma hora de mañana y se lee como una hora que
        # ya pasó.
        dura = restante(int((boost.expires_at - boost.created_at).total_seconds()))
        print(
            f"{uni}: +{args.cafecitos} cafecito(s) → ×{mult:.2f} "
            f"por {dura} (hasta {boost.expires_at.strftime('%d/%m %H:%M')} UTC), "
            f"alcanza a {alcanzados} jugador(es)"
        )
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
