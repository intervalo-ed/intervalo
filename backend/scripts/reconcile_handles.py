"""Deja el registro de nombres consistente con la realidad. Arranca en seco.

Después de la migración `20260902_0067` la tabla `handles` existe y está llena,
pero el backfill NO decide ganadores a propósito: si un string estaba en dos
lados, dejó la primera fila y salteó la segunda. Esto resuelve lo que quedó.

**Por qué no es una migración de Alembic**: renombra personas. Alembic corre solo
en cada deploy de Railway, y un renombrado que te sorprende a las 3 AM no es algo
para automatizar. Acá se corre a mano, se mira, y recién después se aplica.

Dos casos, y solo el segundo toca a alguien:

  · **Sin registrar**: un @ que existe en `users.username` o `game_players.alias`
    y no tiene fila en `handles`. Se le crea la fila. No cambia nada visible.
  · **Divergencia**: una persona registrada cuyo @ del juego difiere de su
    username de clásico. Gana el @ DEL JUEGO — es el que vio en pantalla, el que
    compartió y bajo el que la conocen en el ranking. El username se retira, pero
    no se pierde: sigue siendo suyo y sus links `?r=` siguen resolviendo.

Medido contra producción antes de escribir esto: cero colisiones entre personas
distintas, y tres divergencias. O sea que esto no le saca el @ a nadie para
dárselo a otro; solo unifica el nombre de tres personas consigo mismas.

Uso:
    python backend/scripts/reconcile_handles.py            # en seco, no escribe
    python backend/scripts/reconcile_handles.py --aplicar  # escribe

En producción:
    railway ssh --service backend
    python backend/scripts/reconcile_handles.py
"""
import argparse
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///" + str(
        BACKEND / "intervalo.db"
    ).replace("\\", "/")

from sqlalchemy import func  # noqa: E402

import handles  # noqa: E402
from database import SessionLocal  # noqa: E402
from models import GamePlayer, Handle, User  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--aplicar",
        action="store_true",
        help="escribe los cambios; sin esto solo los lista",
    )
    args = ap.parse_args()
    seco = not args.aplicar

    db = SessionLocal()
    try:
        print("MODO SECO — no se escribe nada\n" if seco else "APLICANDO CAMBIOS\n")
        acciones = 0

        # ── 1. Lo que falta registrar ─────────────────────────────────────────
        sin_registrar_jug = (
            db.query(GamePlayer)
            .outerjoin(Handle, Handle.handle == GamePlayer.alias)
            .filter(Handle.handle.is_(None), GamePlayer.alias.isnot(None))
            .all()
        )
        for p in sin_registrar_jug:
            print(f"  registrar @{p.alias} -> jugador {p.id}")
            acciones += 1
            if not seco:
                handles.reclamar(db, p.alias, user_id=p.user_id, player_id=p.id)

        sin_registrar_usr = (
            db.query(User)
            .outerjoin(Handle, Handle.handle == User.username)
            .filter(Handle.handle.is_(None), User.username.isnot(None))
            .all()
        )
        for u in sin_registrar_usr:
            # Solo si no tiene ya un handle activo: si lo tiene, este username es
            # una divergencia y la resuelve el paso 2, no este.
            if handles.activo_de_usuario(db, u.id) is not None:
                continue
            print(f"  registrar @{u.username} -> usuario {u.id}")
            acciones += 1
            if not seco:
                handles.reclamar(db, u.username, user_id=u.id)

        # ── 2. Divergencias ───────────────────────────────────────────────────
        divergentes = (
            db.query(GamePlayer, User)
            .join(User, User.id == GamePlayer.user_id)
            .filter(GamePlayer.alias != User.username)
            .all()
        )
        for p, u in divergentes:
            # El username se lee ANTES de reclamar: `reclamar` sincroniza el
            # caché, así que leerlo después mostraría el valor ya cambiado y el
            # renglón diría "@hoal -> @hoal".
            username_viejo = u.username
            print(
                f"  unificar persona (jugador {p.id} / usuario {u.id}): "
                f"@{username_viejo} -> @{p.alias}   [gana el @ del juego]"
            )
            acciones += 1
            if not seco:
                # `reclamar` retira el username viejo y lo deja apuntando a esta
                # misma persona, así que sus links `?r=` no se rompen.
                handles.reclamar(db, p.alias, user_id=u.id, player_id=p.id)

        if not seco:
            db.commit()

        # ── 3. Invariantes, siempre ───────────────────────────────────────────
        print()
        dobles_u = (
            db.query(Handle.user_id)
            .filter(Handle.status == "active", Handle.user_id.isnot(None))
            .group_by(Handle.user_id)
            .having(func.count() > 1)
            .count()
        )
        dobles_p = (
            db.query(Handle.player_id)
            .filter(Handle.status == "active", Handle.player_id.isnot(None))
            .group_by(Handle.player_id)
            .having(func.count() > 1)
            .count()
        )
        huerfanos = (
            db.query(GamePlayer)
            .outerjoin(Handle, Handle.handle == GamePlayer.alias)
            .filter(Handle.handle.is_(None))
            .count()
        )
        print(f"invariantes: dueños con dos @ activos = {dobles_u + dobles_p}")
        print(f"             alias sin registrar      = {huerfanos}")
        print(f"\n{acciones} acción(es) {'a aplicar' if seco else 'aplicadas'}")
        if seco and acciones:
            print("Corré de nuevo con --aplicar para escribirlas.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
