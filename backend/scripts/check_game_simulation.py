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

print("4. la foto del día y la flecha")
# Mediodía de Buenos Aires de un día fijo: lejos de la medianoche, para que el
# check no dependa de la hora a la que corre.
HOY = datetime(2026, 10, 5, 15, 0, 0)        # 12:00 en Buenos Aires
AYER = HOY - timedelta(days=1)
MANANA = HOY + timedelta(days=1)
check(simulation.inicio_del_dia(HOY) == datetime(2026, 10, 5, 3, 0, 0),
      "el día arranca a la medianoche de Buenos Aires (03:00 UTC)")
check(simulation.inicio_del_dia(datetime(2026, 10, 5, 2, 59, 0)) == datetime(2026, 10, 4, 3, 0, 0),
      "y a las 23:59 de allá todavía es el día anterior")

# Partir de cero: los ticks de arriba ya sacaron una foto.
db.query(GamePlayer).update(
    {"rank_snapshot": None, "rank_snapshot_at": None, "rank_recent": None, "rank_recent_at": None},
    synchronize_session=False,
)
state = db.query(GameSimState).filter(GameSimState.id == 1).first()
state.last_snapshot_at = None
db.commit()
check(not simulation.hay_foto_de_hoy(db, HOY), "sin foto, no hay foto de hoy")

# La población del ranking es `exercises_correct > 0`, no `xp > 0`. Uno de cada
# clase que NO coincide, para que la foto no pueda numerar la tabla equivocada.
solo_xp = GamePlayer(alias="soloXp", xp=10_000_000, exercises_correct=0,
                     exercises_attempted=0, theta=0.0, n_updates=0)
db.add(solo_xp)
db.commit()

simulation._refresh_snapshots(db, HOY)
db.commit()
check(simulation.hay_foto_de_hoy(db, HOY), "el primer refresco del día saca la foto")
db.refresh(solo_xp)
check(solo_xp.rank_snapshot is None,
      "quien tiene XP sin haber resuelto nada no está en el ranking, y no sale en la foto")
en_tabla = (db.query(GamePlayer).filter(GamePlayer.exercises_correct > 0)
            .order_by(GamePlayer.xp.desc(), GamePlayer.id.asc()).all())
check(all(p.rank_snapshot == i + 1 for i, p in enumerate(en_tabla)),
      "la foto numera en el MISMO orden y la misma población que el ranking")
check(all(p.rank_recent is None for p in en_tabla),
      "y ya no escribe la foto reciente, que quedó sin uso")
TOTAL = len(en_tabla)
sample = en_tabla[TOTAL // 2]


def flecha(p, puesto, cuando=HOY, hay=True):
    return simulation.rank_delta(p, puesto, cuando, ultimo_puesto=TOTAL, hay_foto=hay)


check(flecha(sample, sample.rank_snapshot) == 0, "sin movimiento no hay flecha")
check(flecha(sample, sample.rank_snapshot - 3) == 3, "subir 3 puestos da flecha de 3")
check(flecha(sample, sample.rank_snapshot + 2) == -2, "bajar 2 puestos da flecha de -2")

# Una foto por día: horas después, el mismo día, no se vuelve a sacar.
foto = sample.rank_snapshot_at
simulation._refresh_snapshots(db, HOY + timedelta(hours=6))
db.commit()
db.refresh(sample)
check(sample.rank_snapshot_at == foto, "el mismo día la foto no se vuelve a sacar")
check(flecha(sample, sample.rank_snapshot - 40, HOY + timedelta(hours=6)) == 40,
      "y la flecha sigue contando horas después: es lo del día, no lo de los últimos minutos")

print("5. quien entra hoy cuenta desde abajo, y a la medianoche se apaga")
nuevo = GamePlayer(alias="llegoHoy", xp=15, exercises_correct=1,
                   exercises_attempted=1, theta=0.0, n_updates=1)
db.add(nuevo)
db.commit()
TOTAL += 1
check(nuevo.rank_snapshot is None, "el que resolvió su primera derivada hoy no tiene foto")
check(flecha(nuevo, TOTAL) == 0, "último, recién entrado: sin flecha")
check(flecha(nuevo, TOTAL - 235) == 235,
      "y cada puesto que sube cuenta desde su PRIMERA derivada, sin esperar una foto")

# Al día siguiente, antes del primer tick: la foto de ayer no sirve.
check(not simulation.hay_foto_de_hoy(db, MANANA), "pasada la medianoche la foto es de ayer")
check(flecha(sample, sample.rank_snapshot - 40, MANANA, hay=False) == 0,
      "sin foto de hoy no hay flecha, por más que ayer se haya movido")
simulation._refresh_snapshots(db, MANANA)
db.commit()
db.refresh(sample)
db.refresh(nuevo)
check(simulation.hay_foto_de_hoy(db, MANANA), "el primer tick del día nuevo la saca")
check(nuevo.rank_snapshot is not None, "y el que entró ayer ya sale en ella")
check(flecha(sample, sample.rank_snapshot, MANANA) == 0,
      "todos arrancan el día en cero")
# Una foto con fecha de ayer en una fila, con la de hoy ya sacada: no se usa
# como referencia (sería contar lo de ayer); cuenta como recién entrado.
sample.rank_snapshot_at = AYER
db.commit()
check(flecha(sample, TOTAL - 7, MANANA) == 7,
      "una fila con foto vieja se trata como entrada de hoy, no con el puesto de ayer")

db.close()

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
