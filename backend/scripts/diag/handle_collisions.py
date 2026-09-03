"""Cuenta las colisiones entre los dos namespaces de @ antes de unificarlos.

Hoy `users.username` y `game_players.alias` son namespaces SEPARADOS que se
ignoran mutuamente al validar: `usernames.py` mira solo `users`, y
`game/aliases.py` mira `game_players ∪ game_alias_history` y nunca `users`.
Unificarlos —un @ por persona, el mismo en los dos productos— obliga a decidir
qué pasa cuando el mismo string ya es de DOS personas distintas.

Este script NO cambia nada: cuenta, lista y sale. Es el paso que tiene que
correrse contra PRODUCCIÓN antes de escribir la migración, porque el número
decide si la reconciliación se hace con un script o revisando caso por caso.

Los cinco casos, que no son lo mismo:

  (a) Mismo string, MISMA persona. No es colisión: es exactamente lo que la
      unificación quiere. Ya pasa porque `alias_for_user` siembra el alias con
      el username cuando está libre.
  (b) Mismo string, personas DISTINTAS. La colisión de verdad. Alguien se tiene
      que renombrar.
  (b-bis) Un username vivo que pisa un alias ya RETIRADO de otra persona. Cuenta
      como colisión aunque ese @ no esté en uso: la fila retirada existe para que
      los links `?r=` viejos sigan resolviendo, así que entregarle ese @ a un
      tercero le regala los reclutas de otro.
  (c) Un jugador registrado cuyo alias ≠ el username de su propio user. No es
      colisión sino divergencia: hay que elegir cuál de los dos sobrevive, pero
      nadie pierde nada frente a un tercero.
  (d) Usuarios sin username. No rompen nada, pero hay que saber cuántos son
      antes de asumir que la columna está llena.

Uso:
    python backend/scripts/diag/handle_collisions.py

Contra producción, con la misma DATABASE_URL que la app:
    railway ssh --service backend
    python backend/scripts/diag/handle_collisions.py
"""
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

# Igual que grant_game_boost.py: en producción DATABASE_URL viene del entorno y
# esto no hace nada; en local evita que el default relativo de database.py abra
# una base vacía según desde dónde se corra.
if not os.getenv("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///" + str(
        BACKEND / "intervalo.db"
    ).replace("\\", "/")

from sqlalchemy import func, or_  # noqa: E402

from database import SessionLocal  # noqa: E402
from models import GameAliasHistory, GamePlayer, User  # noqa: E402


def main() -> int:
    db = SessionLocal()
    try:
        usuarios = db.query(func.count(User.id)).scalar() or 0
        sin_username = (
            db.query(func.count(User.id)).filter(User.username.is_(None)).scalar() or 0
        )
        jugadores = db.query(func.count(GamePlayer.id)).scalar() or 0
        bots = (
            db.query(func.count(GamePlayer.id))
            .filter(GamePlayer.is_bot.is_(True))
            .scalar()
            or 0
        )
        invitados = (
            db.query(func.count(GamePlayer.id))
            .filter(GamePlayer.user_id.is_(None), GamePlayer.is_bot.is_(False))
            .scalar()
            or 0
        )
        retirados = db.query(func.count(GameAliasHistory.alias)).scalar() or 0

        print(f"usuarios: {usuarios}  (sin username: {sin_username})")
        print(f"jugadores: {jugadores}  (bots: {bots}, invitados: {invitados})")
        print(f"@ retirados en game_alias_history: {retirados}")
        print()

        # (a) mismo string, misma persona
        mismos = (
            db.query(func.count())
            .select_from(User)
            .join(GamePlayer, GamePlayer.alias == User.username)
            .filter(GamePlayer.user_id == User.id)
            .scalar()
            or 0
        )
        print(f"(a) mismo @, MISMA persona (ya unificados): {mismos}")

        # (b) mismo string, personas distintas
        choques = (
            db.query(
                User.id, User.username, User.email, GamePlayer.id, GamePlayer.is_bot
            )
            .join(GamePlayer, GamePlayer.alias == User.username)
            .filter(or_(GamePlayer.user_id.is_(None), GamePlayer.user_id != User.id))
            .order_by(User.created_at.asc())
            .all()
        )
        print(f"(b) mismo @, personas DISTINTAS  ->  COLISIONES REALES: {len(choques)}")
        for uid, uname, email, pid, es_bot in choques[:40]:
            quien = "bot sembrado" if es_bot else "jugador"
            print(f"      @{uname:<20} user {uid} ({email})  vs  {quien} {pid}")
        if len(choques) > 40:
            print(f"      ... y {len(choques) - 40} mas")

        # (b-bis) username vivo que pisa un alias retirado de OTRA persona
        pisados = (
            db.query(User.id, User.username, GameAliasHistory.player_id)
            .join(GameAliasHistory, GameAliasHistory.alias == User.username)
            .outerjoin(GamePlayer, GamePlayer.id == GameAliasHistory.player_id)
            .filter(or_(GamePlayer.user_id.is_(None), GamePlayer.user_id != User.id))
            .all()
        )
        print(f"(b-bis) username que pisa un @ RETIRADO de otro: {len(pisados)}")
        for uid, uname, pid in pisados[:20]:
            print(f"      @{uname:<20} user {uid}  vs  historia del jugador {pid}")

        # (c) divergencias
        divergentes = (
            db.query(GamePlayer.id, GamePlayer.alias, User.id, User.username)
            .join(User, User.id == GamePlayer.user_id)
            .filter(or_(User.username.is_(None), GamePlayer.alias != User.username))
            .all()
        )
        print(f"(c) registrado con alias != su propio username: {len(divergentes)}")
        for pid, alias, uid, uname in divergentes[:40]:
            print(f"      jugador {pid} @{alias:<20} vs user {uid} @{uname}")
        if len(divergentes) > 40:
            print(f"      ... y {len(divergentes) - 40} mas")

        print()
        humanas = [c for c in choques if not c[4]]
        print("-- resumen --")
        print(
            f"colisiones que obligan a renombrar a ALGUIEN: {len(choques) + len(pisados)}"
        )
        print(f"   de esas, entre personas reales (sin bots): {len(humanas) + len(pisados)}")
        print(f"divergencias a resolver sin renombrar a nadie: {len(divergentes)}")
        if len(humanas) + len(pisados) == 0:
            print()
            print("Ninguna persona real pierde su @: la reconciliacion se puede")
            print("hacer con el script, sin revisar caso por caso.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
