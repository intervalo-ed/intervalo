"""Verifica que los contadores compartidos no se pierdan escrituras.

Ningún check cubría esto, y es la clase de bug que no se reproduce probando la
app: hace falta que dos cosas pasen a la vez. Los cuatro contadores que importan
son los que se convierten en XP o en un mensaje al teléfono:

  · `users.total_xp` — lo escriben TRES lugares (la respuesta, el pago a un
    reclutador, y el XP fijo de las encuestas), y los tres pueden solaparse:
    la encuesta aparece DURANTE la sesión.
  · `users.streak_days` — lo suma el resumen, que se pide por GET, así que dos
    pestañas o un prefetch del navegador entran a la vez. Un día de más es un
    escalón de multiplicador de más, para siempre.
  · `users.referral_pending` — el resto en centésimas del 10%, que hay que leer
    para partirlo.
  · `users.notify_events_count` — el cupo de avisos por día.

CÓMO SE PRUEBA, Y QUÉ NO PRUEBA
-------------------------------
Con DOS sesiones de SQLAlchemy sobre la misma base, intercaladas a mano: la A
lee, la B escribe y commitea, y recién después la A escribe. Es la carrera
clásica de lectura-modificación-escritura, y con una escritura absoluta la de B
desaparece.

SQLite tiene un solo escritor por archivo, así que lo que NO se puede probar acá
es el `FOR UPDATE`: en SQLite es un no-op. Lo que sí se prueba es que las sumas
sean relativas, que es la mitad que se puede afirmar sin un Postgres de por
medio — y es la mitad que estaba mal.

Uso:
    python backend/scripts/check_concurrencia.py

Sale con código 1 si algo falla.
"""
import os
import sys
import tempfile
from datetime import date, datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "concurrencia.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GamePlayer, User  # noqa: E402

Base.metadata.create_all(database.engine)
S = database.SessionLocal

import push_store  # noqa: E402
import referrals  # noqa: E402

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok   ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


def xp_de(uid: int) -> int:
    db = S()
    try:
        return db.get(User, uid).total_xp
    finally:
        db.close()


bootstrap = S()
bootstrap.add(User(id=1, clerk_user_id="c1", email="a@a.com", name="A", total_xp=100))
bootstrap.commit()
bootstrap.close()

print("1. dos sumas a total_xp no se pisan")
# La escritura de A se prepara con el valor viejo; en el medio B suma lo suyo y
# commitea. Con `SET total_xp = <leído> + n`, el aporte de B se evapora.
import main  # noqa: E402

a = S()
usuario_a = a.get(User, 1)          # A lee: 100
_ = usuario_a.total_xp

b = S()
b.query(User).filter(User.id == 1).update(
    {User.total_xp: User.total_xp + 30}, synchronize_session=False
)
b.commit()
b.close()

main._sumar_xp(a, usuario_a, 5)     # A escribe DESPUÉS
a.commit()
a.close()
check("entraron las dos (100 + 30 + 5)", xp_de(1) == 135, f"(dio {xp_de(1)})")

print("2. el pago a un reclutador tampoco se pisa")
setup = S()
setup.add(User(id=2, clerk_user_id="c2", email="r@r.com", name="R", total_xp=0))
setup.commit()
setup.add(GamePlayer(id=2, alias="reclutador", user_id=2))
setup.commit()
setup.add(User(id=3, clerk_user_id="c3", email="x@x.com", name="X",
               referred_by_player_id=2))
setup.commit()
setup.close()

a = S()
recluta_a = a.get(User, 3)
_ = recluta_a.referral_pending

b = S()
b.query(User).filter(User.id == 2).update(
    {User.total_xp: User.total_xp + 11}, synchronize_session=False
)
b.commit()
b.close()

referrals.acreditar_clasico(a, recluta_a, 200)   # 10% de 200 = 20
a.commit()
a.close()
check("el reclutador cobró los dos aportes (11 + 20)", xp_de(2) == 31,
      f"(dio {xp_de(2)})")

print("3. el resto en centésimas sobrevive dos pagos seguidos")
# Cuatro respuestas de 5 XP: el 10% de cada una son 0,5, así que recién a la
# segunda se paga 1 entero. Si el resto se perdiera, el 10% prometido se
# convertiría en 0%.
setup = S()
setup.add(User(id=4, clerk_user_id="c4", email="y@y.com", name="Y",
               referred_by_player_id=2))
setup.commit()
setup.close()

db = S()
recluta = db.get(User, 4)
pagos = [referrals.acreditar_clasico(db, recluta, 5) for _ in range(4)]
db.commit()
check("cuatro respuestas de 5 XP pagan 2 enteros en total", sum(pagos) == 2,
      f"(dio {pagos})")
check("y el resto quedó en cero, sin migajas colgadas",
      db.get(User, 4).referral_pending == 0,
      f"(dio {db.get(User, 4).referral_pending})")
db.close()

print("4. la racha se gana UNA vez por día, aunque dos requests entren juntos")
# El resumen se pide por GET: dos pestañas, un refetch o el prefetch del
# navegador pueden pedirlo a la vez. El `WHERE` es lo que reparte — gana una
# transacción y la otra actualiza cero filas.
setup = S()
setup.add(User(id=5, clerk_user_id="c5", email="s@s.com", name="S",
               streak_days=7, streak_last_date=date(2026, 9, 1)))
setup.commit()
setup.close()

hoy = date(2026, 9, 2)


def gana_el_dia(db) -> bool:
    from sqlalchemy import or_ as sa_or

    filas = (
        db.query(User)
        .filter(
            User.id == 5,
            sa_or(User.streak_last_date.is_(None), User.streak_last_date != hoy),
        )
        .update(
            {User.streak_last_date: hoy, User.streak_days: User.streak_days + 1},
            synchronize_session=False,
        )
    )
    return filas == 1


a = S()
primero = gana_el_dia(a)
a.commit()
a.close()
b = S()
segundo = gana_el_dia(b)
b.commit()
b.close()

check("el primero gana el día", primero)
check("el segundo NO", not segundo)
db = S()
check("y la racha subió exactamente uno", db.get(User, 5).streak_days == 8,
      f"(dio {db.get(User, 5).streak_days})")
db.close()

print("5. el cupo de avisos se consume al concederse")
setup = S()
setup.add(User(id=6, clerk_user_id="c6", email="n@n.com", name="N",
               notify_enabled=True, notify_time="09:00", notify_timezone="UTC"))
setup.commit()
setup.close()

db = S()
u = db.get(User, 6)
concedidos = [push_store.claim_event_slot(db, u, hoy) for _ in range(4)]
db.commit()
check("se conceden exactamente los del tope",
      concedidos == [True] * push_store.MAX_EVENTOS_POR_DIA
      + [False] * (4 - push_store.MAX_EVENTOS_POR_DIA),
      f"(dio {concedidos})")
check("y el contador quedó en el tope, no arriba",
      db.get(User, 6).notify_events_count == push_store.MAX_EVENTOS_POR_DIA,
      f"(dio {db.get(User, 6).notify_events_count})")
db.close()

# Y el claim relee la fila: si otra transacción ya gastó el cupo, esta lo tiene
# que ver. Sin `populate_existing` se tomaba el candado y se decidía con los
# números viejos del identity map, que es no tomar candado en absoluto.
a = S()
usuario = a.get(User, 6)
_ = usuario.notify_events_count          # A lo carga en memoria: 2
a.query(User).filter(User.id == 6).update(
    {User.notify_events_on: None, User.notify_events_count: 0},
    synchronize_session=False,
)
a.commit()

b = S()
otro = b.get(User, 6)
push_store.claim_event_slot(b, otro, hoy)
push_store.claim_event_slot(b, otro, hoy)
b.commit()
b.close()

sobra = push_store.claim_event_slot(a, usuario, hoy)
a.rollback()
a.close()
check("el claim ve lo que gastó la otra transacción, no su copia vieja",
      not sobra)

print()
if fallos:
    print(f"{len(fallos)} chequeos fallaron:")
    for f in fallos:
        print(f"  - {f}")
    raise SystemExit(1)
print("todo ok")
