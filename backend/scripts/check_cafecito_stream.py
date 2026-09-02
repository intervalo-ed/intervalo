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
from models import (  # noqa: E402
    Base,
    Enrollment,
    GameBoost,
    GameBoostIntent,
    GamePlayer,
    User,
)
from game import boosts  # noqa: E402
from game import cafecito_stream as cs  # noqa: E402

# El endpoint y no solo `boosts.record_intent`: el respaldo por enrollment que
# prueba el caso 19 vive ahi, que es donde se sabe de que usuario es el jugador.
from game.router import cafecito_intent  # noqa: E402

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
    # Los casos que llegan desde Intervalo clasico dejan usuario y enrollment
    # atras; sin borrarlos, el enrollment de un caso elige la universidad del
    # siguiente.
    db.query(Enrollment).delete()
    db.query(User).delete()
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
# La alerta de prueba de la plataforma llega por el mismo socket y con la misma
# forma que una donación. El 28/08 dos de estas entraron como donaciones y el
# panel informó 28 cafecitos contra los 19 que decía Cafecito.
limpiar()
prueba = cs.aplicar({"name": "Juan Carlos", "count": 2, "message": "aguante la UBA"})
check(prueba == [] and empujes() == [],
      "la alerta de prueba de la plataforma no crea ningún empuje")
check(cs.aplicar({"name": "Juan Carlos Cafecito", "count": 2, "message": "x"}) == [],
      "tampoco con el apellido que a veces le agrega")
limpiar()
real = cs.aplicar({"name": "Juan Carlota", "count": 2, "message": "aguante la UBA"})
check(real != [], "y un nombre que solo empieza parecido sí dona")
# Los checks que siguen cuentan filas desde cero.
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

print("14. la sigla tambien se lee del NOMBRE de quien dona")
# Lo enseño una donacion real: alguien puso "Santi ITBA" de nombre, "Muy bueno!"
# de mensaje y dono diez cafecitos —el tope que aporta una persona—. Como la
# sigla no estaba en el mensaje, el empuje se lo llevo otra universidad.
limpiar()
santi = cs.aplicar({"name": "Santi ITBA", "count": 10, "message": "Muy bueno!"})
check(santi == ["ITBA"], f"el cafecito de Santi va al ITBA (fue a {santi})")

print("15. y el nombre no le gana a las intenciones, se suman")
# La regla de la escalera no cambia: ante la duda cobran las dos.
limpiar()
db = database.SessionLocal()
j = GamePlayer(guest_token="tok-uba2", alias="deuba", university="UBA")
db.add(j); db.commit()
db.add(GameBoostIntent(player_id=j.id, university="UBA", created_at=datetime.utcnow()))
db.commit(); db.close()
ambas = cs.aplicar({"name": "Santi ITBA", "count": 4, "message": "grande"})
check(sorted(ambas) == ["ITBA", "UBA"], f"cobran las dos ({ambas})")

print("16. un nombre sin sigla no inventa destinos")
limpiar()
# El nombre de acá NO puede ser "Juan Carlos": así se llama la alerta de prueba
# de la plataforma y ahora se descarta (ver _es_prueba). Que este check haya
# usado justo ese nombre es la mejor prueba de que el falso positivo existe —
# alguien que se llame así y done de verdad no va a cobrar. Es el precio de que
# Cafecito no marque sus pruebas de ninguna otra forma, y el error barato es
# este: una donación no contada se reclama, una prueba contada como ingreso no
# se ve nunca.
comun = cs.aplicar({"name": "Roberto Gómez", "count": 1, "message": "gracias"})
check(comun == ["TODOS"], f"sin sigla en ningun lado, sigue siendo global ({comun})")

print("17. con varias intenciones abiertas, a nadie se le dice que llego lo suyo")
# Cafecito no dice quien dono. Si habia varias intenciones abiertas, cualquiera
# pudo haber sido: el empuje se reparte igual —equivocarse ahi es barato— pero la
# frase "llego tu cafecito" no se dice, porque decirsela a quien no pago es lo
# unico que puede hacer sentir estafado a quien la lee.
#
# Lo enseño un caso real: alguien dono ANTES de jugar, y su donacion la cobraron
# las intenciones abiertas de tres desconocidos.
limpiar()
db = database.SessionLocal()
ana = GamePlayer(guest_token="tok-ana", alias="ana", university="UBA")
beto = GamePlayer(guest_token="tok-beto", alias="beto", university="UBA")
db.add_all([ana, beto]); db.commit()
boosts.record_intent(db, ana); boosts.record_intent(db, beto); db.commit()
cs.aplicar({"name": "", "count": 5, "message": ""})
ea, eb = boosts.estado_de_donacion(db, ana), boosts.estado_de_donacion(db, beto)
check(ea.state == "pending", f"a Ana no se le afirma nada ({ea.state})")
check(eb.state == "pending", f"ni a Beto ({eb.state})")
# Pero el empuje SI se reparte: quien pago ve su multiplicador igual.
check(abs(boosts.multiplier_for(db, "UBA") - 1.5) < 1e-6,
      f"y la UBA igual recibe el empuje (x{boosts.multiplier_for(db, 'UBA'):.1f})")
db.close()

print("18. con UNA sola intencion abierta, si se le dice")
limpiar()
db = database.SessionLocal()
sola = GamePlayer(guest_token="tok-sola", alias="sola", university="UTN")
db.add(sola); db.commit()
boosts.record_intent(db, sola); db.commit()
cs.aplicar({"name": "", "count": 4, "message": ""})
e = boosts.estado_de_donacion(db, sola)
check(e.state == "credited", f"sin ambiguedad, se le confirma ({e.state})")
check(e.university == "UTN", f"y a su universidad ({e.university})")
db.close()

print("19. quien dona desde Intervalo clasico cobra para SU universidad")
# La configuracion de Intervalo clasico abre la misma diapo del cafecito
# (profile-content.tsx -> cafecito-sheet.tsx). Quien llega por ahi puede no haber
# jugado nunca: su GamePlayer se crea al vuelo para servir el pedido y no tiene
# universidad, aunque su enrollment de Intervalo si la sepa.
#
# Sin el respaldo del endpoint la intencion se anotaba con university=None, y esa
# no dirige nada (pending_intents la descarta): la donacion caia en el reparto
# global. O sea que donar desde clasico no le sumaba a la universidad propia.
limpiar()
db = database.SessionLocal()
u = User(clerk_user_id="clerk-clasico", email="clasico@test.dev", name="Clasica")
db.add(u); db.flush()
# Texto libre del onboarding, escrito como lo escribe la gente: el endpoint tiene
# que canonizarlo a la sigla, que es como se buscan los empujes.
db.add(Enrollment(user_id=u.id, course_id=1, university="Universidad de Buenos Aires",
                  enrolled_at=datetime.utcnow()))
jugador = GamePlayer(user_id=u.id, alias="reciencreada", university=None)
db.add(jugador); db.commit()

cafecito_intent(player=jugador, db=db)
anotada = db.query(GameBoostIntent).filter(GameBoostIntent.player_id == jugador.id).first()
check(anotada is not None and anotada.university == "UBA",
      f"la intencion toma la universidad del enrollment ({anotada and anotada.university})")

cs.aplicar({"name": "", "count": 3, "message": ""})
check([b.university for b in empujes()] == ["UBA"],
      f"y la donacion va a la UBA, no al reparto global (fue a {[b.university for b in empujes()]})")
db.close()

# Y el jugador que SI tiene universidad sigue mandando el, sin que el enrollment
# se la pise: es el camino de siempre y es el que mas se usa.
limpiar()
db = database.SessionLocal()
u2 = User(clerk_user_id="clerk-jugador", email="jugador@test.dev", name="Jugador")
db.add(u2); db.flush()
db.add(Enrollment(user_id=u2.id, course_id=1, university="UBA", enrolled_at=datetime.utcnow()))
propio = GamePlayer(user_id=u2.id, alias="yaeligio", university="UTN")
db.add(propio); db.commit()
cafecito_intent(player=propio, db=db)
suya = db.query(GameBoostIntent).filter(GameBoostIntent.player_id == propio.id).first()
check(suya is not None and suya.university == "UTN",
      f"la que eligio en el juego le gana al enrollment ({suya and suya.university})")
db.close()

print()
if FAILURES:
    print(f"{len(FAILURES)} fallo(s):")
    for f in FAILURES:
        print("  -", f)
    raise SystemExit(1)
print("todo ok")
