"""Verifica la actividad simulada del ranking del minijuego.

Cubre lo que no se ve a ojo y es donde está el riesgo:
  1. El tick respeta su intervalo y NO se pone al día (un tick por turno, no
     trescientos porque nadie miró en una hora).
  2. Dos requests simultáneas no adelantan dos veces: el UPDATE condicional
     entrega el turno a una sola.
  3. El `version` del pulso cambia solo cuando el ranking cambió.
  4. Las fotos del puesto corren como registro de desplazamiento y la flechita
     mide un movimiento real, no ruido.
  5. Una foto vieja no dibuja flecha.

Uso:
    python backend/scripts/check_game_simulation.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_sim.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GamePlayer, GameSimState  # noqa: E402
from game import simulation  # noqa: E402

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    status = "ok" if condition else "FAIL"
    print(f"  [{status}] {label}")
    if not condition:
        FAILURES.append(label)


Base.metadata.create_all(bind=database.engine)
db = database.SessionLocal()

# 40 sembrados con XP repartida, para que haya orden que alterar.
for i in range(40):
    db.add(
        GamePlayer(
            alias=f"bot{i:02d}",
            is_bot=True,
            xp=100 + i * 25,
            exercises_correct=4 + i,
            exercises_attempted=6 + i,
        )
    )
db.commit()

print("1. ritmo del tick")
check(simulation.maybe_tick(db), "el primer tick avanza")
check(not simulation.maybe_tick(db), "el segundo, enseguida, no avanza")

state = db.query(GameSimState).filter(GameSimState.id == 1).first()
# Simular que nadie miró el ranking por una hora.
state.last_tick_at = datetime.utcnow() - timedelta(hours=1)
db.commit()
xp_before = dict(db.query(GamePlayer.id, GamePlayer.xp).all())
check(simulation.maybe_tick(db), "tras el intervalo vuelve a avanzar")
xp_after = dict(db.query(GamePlayer.id, GamePlayer.xp).all())
moved = [i for i in xp_before if xp_after[i] != xp_before[i]]
gained = sum(xp_after[i] - xp_before[i] for i in moved)
lo, hi = simulation.BOTS_PER_TICK
check(lo <= len(moved) <= hi, f"se movieron {len(moved)} sembrados (esperado {lo}-{hi})")
check(
    gained <= hi * simulation.XP_PER_MOVE[1],
    f"no se pone al día tras una hora quieto (sumó {gained} xp, no miles)",
)
check(all(xp_after[i] > xp_before[i] for i in moved), "la XP solo sube")

print("2. dos requests a la vez")
state = db.query(GameSimState).filter(GameSimState.id == 1).first()
state.last_tick_at = datetime.utcnow() - timedelta(seconds=simulation.TICK_SECONDS + 1)
db.commit()
now = datetime.utcnow()
db_a, db_b = database.SessionLocal(), database.SessionLocal()
claim_a = simulation._claim_tick(db_a, now)
db_a.commit()
claim_b = simulation._claim_tick(db_b, now)
db_b.commit()
check(claim_a and not claim_b, f"solo una toma el turno (a={claim_a}, b={claim_b})")
db_a.close()
db_b.close()

print("3. version del pulso")
before = simulation.get_state(db).version
db.commit()
state = db.query(GameSimState).filter(GameSimState.id == 1).first()
state.last_tick_at = datetime.utcnow() - timedelta(seconds=simulation.TICK_SECONDS + 1)
db.commit()
simulation.maybe_tick(db)
after_move = simulation.get_state(db).version
db.commit()
check(after_move > before, f"tickear con movimiento sube la version ({before} -> {after_move})")
simulation.maybe_tick(db)  # enseguida: no le toca
db.commit()
check(
    simulation.get_state(db).version == after_move,
    "un tick que no avanza no toca la version",
)

print("4. fotos del puesto y flechita")
now = datetime.utcnow()
# Partir de cero: los ticks de arriba ya corrieron el registro, y lo que se
# quiere probar acá es cómo arranca.
db.query(GamePlayer).update(
    {"rank_snapshot": None, "rank_snapshot_at": None, "rank_recent": None, "rank_recent_at": None},
    synchronize_session=False,
)
state = db.query(GameSimState).filter(GameSimState.id == 1).first()
state.last_snapshot_at = None
db.commit()
simulation._refresh_snapshots(db, now)
db.commit()
sample = db.query(GamePlayer).filter(GamePlayer.is_bot.is_(True)).first()
check(sample.rank_recent is not None, "la primera foto llena la reciente")
check(sample.rank_snapshot is None, "todavía no hay foto de referencia")
check(
    simulation.rank_delta(sample, sample.rank_recent, now) == 0,
    "sin movimiento no hay flecha",
)

# Segundo corrimiento: la reciente pasa a referencia y se toma una nueva.
state.last_snapshot_at = now - timedelta(seconds=simulation.SNAPSHOT_REFRESH_SECONDS + 1)
db.commit()
later = now + timedelta(seconds=simulation.SNAPSHOT_REFRESH_SECONDS + 1)
simulation._refresh_snapshots(db, later)
db.commit()
db.refresh(sample)
check(sample.rank_snapshot is not None, "el registro corrió: ya hay referencia")
check(
    sample.rank_snapshot_at is not None
    and abs((sample.rank_snapshot_at - now).total_seconds()) < 2,
    "la referencia es la foto vieja, no la nueva",
)
check(
    simulation.rank_delta(sample, sample.rank_snapshot - 3, later) == 3,
    "subir 3 puestos da flecha de 3",
)
check(
    simulation.rank_delta(sample, sample.rank_snapshot + 2, later) == -2,
    "bajar 2 puestos da flecha de -2",
)

print("5. una foto vieja no dibuja flecha")
stale = later + timedelta(seconds=simulation.RANK_WINDOW_SECONDS + 10)
check(
    simulation.rank_delta(sample, sample.rank_snapshot - 5, stale) == 0,
    "fuera de la ventana no hay flecha, por más que se haya movido",
)

db.close()

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
