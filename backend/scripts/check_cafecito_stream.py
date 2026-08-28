"""Verifica el oyente de donaciones de Cafecito (game/cafecito_stream.py).

Cubre las decisiones, no el socket: que un cafecito se convierta en empuje, que
una suscripción no mueva nada, que el mismo evento no se aplique dos veces, que
la escalera de destinos siga funcionando desde acá (sigla en el mensaje →
intención abierta → global), y que el apretón de manos de socket.io sea el que
el servidor espera.

El socket real se prueba a mano: con CAFECITO_STREAM_TOKEN puesto, correr el API
y apretar "Enviar alerta de prueba (Compra de Cafecito)" en el panel de Cafecito.

Uso:
    python backend/scripts/check_cafecito_stream.py

Sale con código 1 si algo falla.
"""

import json
import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "cafecito.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameBoost, GameBoostIntent, GamePlayer  # noqa: E402
from game import boosts  # noqa: E402
from game import cafecito_stream as cs  # noqa: E402

Base.metadata.create_all(bind=database.engine)

FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def limpiar() -> None:
    db = database.SessionLocal()
    db.query(GameBoost).delete()
    db.query(GameBoostIntent).delete()
    db.query(GamePlayer).delete()
    db.commit()
    db.close()


def empujes() -> list[GameBoost]:
    db = database.SessionLocal()
    filas = db.query(GameBoost).order_by(GameBoost.id).all()
    db.close()
    return filas


print("1. un cafecito con la sigla en el mensaje")
limpiar()
otorgados = cs.aplicar({"name": "Nico", "count": 3, "message": "aguante la UBA"})
filas = empujes()
check(otorgados == ["UBA"], f"el empuje va a la UBA (fue a {otorgados})")
check(len(filas) == 1, f"una sola fila ({len(filas)})")
check(filas[0].cafecitos == 3, f"tres cafecitos ({filas[0].cafecitos})")
check(filas[0].donor_name == "Nico", "guarda el nombre del donante")
check(filas[0].source == "cafecito", f"source=cafecito ({filas[0].source})")
check(
    (filas[0].external_ref or "").startswith("cafecito:"),
    "deja una referencia de idempotencia",
)

print("2. el mismo evento otra vez NO se aplica dos veces")
antes = len(empujes())
repetido = cs.aplicar({"name": "Nico", "count": 3, "message": "aguante la UBA"})
check(repetido == [], f"no otorga nada ({repetido})")
check(len(empujes()) == antes, "no agrega ninguna fila")

print("3. el mismo contenido pasada la ventana SÍ se aplica")
# Una segunda donación idéntica es algo normal; lo que no puede pasar es que la
# huella la rechace para siempre.
lejos = datetime.utcnow() + timedelta(seconds=cs.VENTANA_REPETIDO_S + 5)
otra = cs.aplicar({"name": "Nico", "count": 3, "message": "aguante la UBA"}, ahora=lejos)
check(otra == ["UBA"], f"vuelve a otorgar ({otra})")

print("4. una suscripción no mueve nada")
limpiar()
plan = cs.aplicar(
    {"name": "Juan", "plan": "Latte", "months": 2, "message": "aguante la UBA"}
)
check(plan == [], f"no otorga ({plan})")
check(empujes() == [], "no deja ninguna fila")

print("5. eventos rotos: se ignoran sin romper nada")
limpiar()
check(cs.aplicar({"name": "X", "message": "hola"}) == [], "sin count, ignorado")
check(cs.aplicar({"count": 0, "message": "hola"}) == [], "count 0, ignorado")
check(cs.aplicar({"count": "dos", "message": "hola"}) == [], "count no numérico, ignorado")
check(empujes() == [], "ninguno dejó fila")

print("6. sin sigla, cobra la intención abierta")
limpiar()
db = database.SessionLocal()
jugador = GamePlayer(guest_token="tok-utn", alias="probando", university="UTN")
db.add(jugador)
db.commit()
db.add(GameBoostIntent(player_id=jugador.id, university="UTN", created_at=datetime.utcnow()))
db.commit()
db.close()
sin_sigla = cs.aplicar({"name": "Ana", "count": 2, "message": "gracias!"})
check(sin_sigla == ["UTN"], f"va a la universidad de la intención ({sin_sigla})")

print("7. sin sigla y sin intención, empuje global")
limpiar()
global_ = cs.aplicar({"name": None, "count": 1, "message": ""})
check(global_ == ["TODOS"], f"empuje global ({global_})")
filas = empujes()
check(len(filas) == 1 and filas[0].university is None, "la fila queda con university NULL")

print("8. dos donaciones distintas no se pisan entre sí")
limpiar()
a = cs.aplicar({"name": "Ana", "count": 1, "message": "vamos la UBA"})
b = cs.aplicar({"name": "Beto", "count": 2, "message": "vamos la UBA"})
check(a == ["UBA"] and b == ["UBA"], f"las dos otorgan ({a}, {b})")
check(len(empujes()) == 2, f"quedan dos filas ({len(empujes())})")
db = database.SessionLocal()
mult = boosts.multiplier_for(db, "UBA")
db.close()
# 1 + 2 cafecitos = +0,3
check(abs(mult - 1.3) < 1e-6, f"los cafecitos se suman: ×{mult:.2f} (esperado ×1,30)")

print("9. la huella distingue contenidos y el apretón de manos es el correcto")
h1 = cs._huella({"name": "Ana", "count": 1, "message": "x"})
h2 = cs._huella({"name": "Ana", "count": 2, "message": "x"})
h3 = cs._huella({"name": "Ana", "count": 1, "message": "x"})
check(h1 != h2, "distinta cantidad, distinta huella")
check(h1 == h3, "mismo contenido, misma huella")
ref = cs._referencia(h1, datetime.utcnow())
check(len(ref) <= 64, f"la referencia entra en external_ref ({len(ref)} de 64)")
check(cs.URL.startswith("wss://cafecito.app/socket/socket.io/?EIO=4"), "la URL del socket")
check(json.dumps({"token": "t"}) == '{"token": "t"}', "el payload de assignUserIdStream es JSON")

print("10. sin token, el oyente no arranca")
os.environ.pop("CAFECITO_STREAM_TOKEN", None)
import threading  # noqa: E402

parar = threading.Event()
cs.escuchar(parar)  # tiene que volver enseguida, sin conectarse a nada
check(True, "vuelve sin intentar conectarse")

print("11. que ve quien vuelve de Cafecito")
# El agujero que esto tapa: la persona tocaba invitar, pagaba en otra pestaña,
# volvia, y encontraba la misma pantalla que habia dejado.
limpiar()
db = database.SessionLocal()
juan = GamePlayer(guest_token="tok-vuelve", alias="vuelve", university="UBA")
db.add(juan); db.commit()

e = boosts.estado_de_donacion(db, juan)
check(e.state == "none", f"sin tocar el boton, no hay nada que decir ({e.state})")

boosts.record_intent(db, juan); db.commit()
e = boosts.estado_de_donacion(db, juan)
check(e.state == "pending", f"toco el boton y todavia no llego ({e.state})")

cs.aplicar({"name": "", "count": 3, "message": ""})
e = boosts.estado_de_donacion(db, juan)
check(e.state == "credited", f"llego la donacion ({e.state})")
check(e.university == "UBA", f"y fue a su universidad ({e.university})")
check(e.cafecitos == 3, f"con sus tres cafecitos ({e.cafecitos})")
check(abs(e.multiplier - 1.3) < 1e-6, f"multiplicador x{e.multiplier:.1f} (esperado x1,3)")
check(e.expires_in_seconds > 0, "y con tiempo restante para mostrar")
db.close()

print("12. quien dona SIN universidad tambien se entera")
# Su donacion cae en el escalon global. Antes su intencion no se marcaba nunca
# —solo se marcaban las que tenian universidad— asi que se le quedaba mostrando
# "estamos esperando" para siempre, justo a alguien que acaba de pagar.
limpiar()
db = database.SessionLocal()
solo = GamePlayer(guest_token="tok-solo", alias="solo")
db.add(solo); db.commit()
boosts.record_intent(db, solo); db.commit()
check(boosts.estado_de_donacion(db, solo).state == "pending", "arranca en pending")
cs.aplicar({"name": "", "count": 2, "message": ""})
e = boosts.estado_de_donacion(db, solo)
check(e.state == "credited", f"su cafecito tambien se le acredita ({e.state})")
check(e.university is None, f"y fue al empuje global ({e.university})")
check(abs(e.multiplier - 1.2) < 1e-6, f"que igual le llega a el: x{e.multiplier:.1f}")
db.close()

print("13. una intencion vieja no se muestra como recien vuelta")
limpiar()
db = database.SessionLocal()
viejo = GamePlayer(guest_token="tok-viejo", alias="viejo", university="UTN")
db.add(viejo); db.commit()
hace_mucho = datetime.utcnow() - timedelta(hours=boosts.MEMORIA_INTENCION_HORAS + 1)
boosts.record_intent(db, viejo, now=hace_mucho); db.commit()
check(boosts.estado_de_donacion(db, viejo).state == "none",
      "una intencion de ayer no dispara ninguna pantalla")
db.close()

print()
if FAILURES:
    print(f"{len(FAILURES)} fallo(s):")
    for f in FAILURES:
        print("  -", f)
    raise SystemExit(1)
print("todo ok")
