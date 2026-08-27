"""Siembra el ranking del minijuego de derivadas con 100 jugadores.

Por qué: un ranking vacío no engancha. El gancho del juego es ver a quién
podés pasar, y el primero en entrar no tiene a nadie arriba. Estos jugadores
dan esa escalera desde el minuto cero, con universidades y carreras variadas
para que los cortes por universidad tengan sentido desde el principio.

Los sembrados NO son jugables: `user_id` y `guest_token` quedan en NULL, así
que `get_current_player` no los puede resolver con ningún header. Van marcados
con `is_bot` para poder excluirlos de cualquier métrica de uso.

Idempotente: identifica por alias. Si el alias ya existe y es sembrado, le
refresca los números; si existe y es de una persona real, no lo toca.

Uso:
    python backend/scripts/seed_game_bots.py            # siembra/actualiza
    python backend/scripts/seed_game_bots.py --dry-run  # muestra sin escribir
    python backend/scripts/seed_game_bots.py --purge    # borra los sembrados

En producción va por `railway ssh --service backend` (misma variable
DATABASE_URL que la app).
"""

import argparse
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from database import SessionLocal  # noqa: E402
from models import GamePlayer  # noqa: E402

BOT_COUNT = 100

# Seed fija: correr el script dos veces da el mismo padrón, así que actualizar
# no reordena el ranking ni cambia nombres.
SEED = 20260827

NOMBRES = [
    "sofia", "mateo", "valen", "juana", "tomas", "lucia", "santi", "camila",
    "nico", "martina", "joaco", "delfi", "franco", "agus", "bruno", "pilar",
    "ivan", "rocio", "lauta", "guada", "facu", "ailen", "gonza", "mica",
    "thiago", "abril", "leo", "julieta", "ramiro", "flor", "ale", "candela",
    "manu", "belu", "gaston", "romi", "diego", "nacho", "vicky", "emi",
    "seba", "ana", "pedro", "clara", "andy", "malena", "juli", "cris",
    "lucas", "paula",
]

APELLIDOS = [
    "gomez", "ferrari", "rossi", "lopez", "silva", "vera", "cabral", "molina",
    "quiroga", "peralta", "aguirre", "ibarra", "medina", "ojeda", "sosa",
    "bravo", "correa", "duarte", "escobar", "farias", "godoy", "herrera",
    "juarez", "leiva", "maidana", "nunez", "ortiz", "paz", "rios", "salas",
    "torres", "vega", "zarate", "acosta", "benitez", "castro", "diaz",
    "esquivel", "figueroa", "guzman",
]

# Peso ≈ tráfico real de Intervalo: UBA y UTN mandan, después cola larga.
# Siglas canónicas de backend/universities.py (canonical_university las valida).
UNIVERSIDADES = [
    ("UBA", 20), ("UTN", 18), ("UNLP", 9), ("UNC", 8), ("UNSAM", 6),
    ("UNL", 5), ("UNR", 5), ("ITBA", 4), ("UNS", 3), ("UNCUYO", 3),
    ("UNMDP", 3), ("UNQ", 3), ("UNGS", 2), ("UNT", 2), ("UNLaM", 2),
    ("UADE", 2), ("UNLU", 2), ("UNICEN", 1), ("UTDT", 1), ("UNRC", 1),
]

# E = ingeniería, T = tecnología, S = ciencia, M = matemática (game/router.py).
CARRERAS = [("E", 46), ("T", 27), ("S", 18), ("M", 9)]

# Tramos de XP: pocos cracks arriba, mayoría abajo. Da una escalera pareja para
# quien recién arranca (los primeros puestos se ganan rápido) sin que el techo
# quede al alcance en una sesión. Los números están expresados en ejercicios
# resueltos × XP_POR_CORRECTA: si cambia la XP por acierto hay que reescalarlos,
# si no la escalera se sube al doble de rápido.
TRAMOS = [
    (12, 3750, 7250),
    (20, 1550, 3700),
    (30, 525, 1525),
    (38, 45, 512),
]

# XP promedio por ejercicio resuelto: 25 de base al primer intento, con el
# multiplicador de dificultad y el combo (ver game/xp.py).
XP_POR_CORRECTA = 28.0


def weighted(rng: random.Random, options: list[tuple[str, int]]) -> str:
    values = [v for v, _ in options]
    weights = [w for _, w in options]
    return rng.choices(values, weights=weights, k=1)[0]


def build_alias(rng: random.Random, taken: set[str]) -> str:
    """Handle creíble y válido para usernames.validate_username (3-15, a-z0-9._)."""
    for _ in range(200):
        nombre = rng.choice(NOMBRES)
        style = rng.random()
        if style < 0.30:
            alias = f"{nombre}{rng.choice(APELLIDOS)}"
        elif style < 0.52:
            alias = f"{nombre}.{rng.choice(APELLIDOS)}"
        elif style < 0.70:
            alias = f"{nombre}{rng.randint(2, 99)}"
        elif style < 0.85:
            alias = f"{nombre}_{rng.choice(APELLIDOS)[0]}"
        else:
            alias = f"{nombre}{rng.choice(APELLIDOS)[0]}{rng.randint(2, 9)}"
        alias = alias[:15].strip("._")
        if len(alias) >= 3 and alias not in taken:
            taken.add(alias)
            return alias
    raise RuntimeError("no se pudo generar un alias libre")


# θ del Elo, que es lo que pinta el color del nombre en el ranking (nivel 0-3,
# ver game/elo.py :: level_of). Tiene que seguir de cerca al XP: con un sorteo
# ancho, el primer puesto podía salir en blanco —"principiante"— al lado de uno
# con la mitad de XP en violeta, y el color dejaba de leerse como progreso.
# El ruido gaussiano deja variedad sin romper la correlación.
THETA_AT_TOP = 2.8
THETA_FLOOR = -0.3
THETA_FULL_XP = 5000
THETA_NOISE = 0.25


def seeded_theta(rng: random.Random, xp: int) -> float:
    progress = min(1.0, xp / THETA_FULL_XP)
    theta = THETA_FLOOR + THETA_AT_TOP * progress + rng.gauss(0, THETA_NOISE)
    return round(max(THETA_FLOOR, min(THETA_AT_TOP, theta)), 3)


def build_bots(rng: random.Random) -> list[dict]:
    taken: set[str] = set()
    bots: list[dict] = []
    now = datetime.utcnow()

    for count, xp_min, xp_max in TRAMOS:
        for _ in range(count):
            xp = rng.randint(xp_min, xp_max)
            correct = max(1, round(xp / XP_POR_CORRECTA))
            # Nadie acierta todo: entre 62% y 88% de aciertos al primer intento.
            attempted = round(correct / rng.uniform(0.62, 0.88))
            bots.append(
                {
                    "alias": build_alias(rng, taken),
                    "university": weighted(rng, UNIVERSIDADES),
                    "career": weighted(rng, CARRERAS),
                    "xp": xp,
                    "exercises_correct": correct,
                    "exercises_attempted": attempted,
                    "theta": seeded_theta(rng, xp),
                    "n_updates": attempted,
                    "best_combo": rng.randint(3, 24),
                    "created_at": now - timedelta(days=rng.randint(1, 21), minutes=rng.randint(0, 1440)),
                    "last_seen_at": now - timedelta(hours=rng.randint(1, 72)),
                }
            )

    # Mezclar para que el orden de inserción no correlacione con el XP: el
    # desempate del ranking es por id, y con los tramos ordenados los empates
    # quedarían siempre a favor de los primeros tramos.
    rng.shuffle(bots)
    return bots


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--purge", action="store_true", help="borra los sembrados y sale")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.purge:
            n = db.query(GamePlayer).filter(GamePlayer.is_bot.is_(True)).delete()
            if args.dry_run:
                db.rollback()
                print(f"[dry-run] borraría {n} sembrados")
            else:
                db.commit()
                print(f"borrados {n} sembrados")
            return 0

        rng = random.Random(SEED)
        bots = build_bots(rng)
        existing = {
            p.alias: p
            for p in db.query(GamePlayer)
            .filter(GamePlayer.alias.in_([b["alias"] for b in bots]))
            .all()
        }

        created = updated = skipped = 0
        for bot in bots:
            current = existing.get(bot["alias"])
            if current is not None and not current.is_bot:
                # Alias tomado por una persona real: no se toca.
                skipped += 1
                continue
            if current is None:
                db.add(GamePlayer(is_bot=True, **bot))
                created += 1
            else:
                for field, value in bot.items():
                    if field not in ("created_at",):
                        setattr(current, field, value)
                updated += 1

        if args.dry_run:
            db.rollback()
            print(f"[dry-run] crearía {created}, actualizaría {updated}, saltearía {skipped}")
            sample = bots[:5]
        else:
            db.commit()
            print(f"creados {created}, actualizados {updated}, salteados {skipped}")
            sample = bots[:5]

        print("\nmuestra:")
        for bot in sample:
            print(
                f"  @{bot['alias']:<16} {bot['university']:<7} {bot['career']} "
                f"{bot['xp']:>5} xp  {bot['exercises_correct']:>4} correctas"
            )

        total = db.query(GamePlayer).filter(GamePlayer.is_bot.is_(True)).count()
        top = (
            db.query(GamePlayer)
            .filter(GamePlayer.is_bot.is_(True))
            .order_by(GamePlayer.xp.desc())
            .first()
        )
        print(f"\nsembrados en la base: {total}" + (f" · líder: @{top.alias} ({top.xp} xp)" if top else ""))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
