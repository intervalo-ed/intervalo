"""Verifica el chat del minijuego: quién puede escribir, qué se acepta y qué cuesta leer.

Es el primer lugar del juego donde algo que escribe una persona se muestra a todas
las demás, así que lo que hay que tener comprobado no es que ande: es que **no se
pueda usar para otra cosa**. Un chat que funciona y deja pasar un link de phishing
a un grupo de estudiantes está peor que uno roto.

Cuatro cosas se prueban acá porque jugando no se ven:

· Quién puede escribir. Escribe cualquiera —el invitado incluido, que es la
  mayoría de la gente que está jugando— y por eso importa más, no menos, que lo
  que queda de freno esté comprobado: lo único que separa al chat del spam son el
  tope de frecuencia y el saneado. Y que a quien SÍ tiene cuenta se le siga
  pidiendo la sesión viva de Clerk: su token de invitado sigue guardado después
  del link, así que sin ese chequeo alcanzaría para publicar en su nombre.
· Qué pasa el saneado. Es una allowlist, y una allowlist mal armada no falla
  ruidosamente: acepta de más y nadie se entera.
· Que los dos cursores devuelvan solo lo nuevo. De eso depende que el chat sea
  gratis: si devolviera todo cada vez, el costo se multiplicaría por la cantidad
  de gente mirando, en silencio.
· Que un mensaje bajado (`hidden`) no vuelva a salir.

Uso:
    python backend/scripts/check_game_chat.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_chat.db"
).replace("\\", "/")
os.environ["GAME_CHAT_ENABLED"] = "1"
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from game import chat as game_chat  # noqa: E402
from game import limits as _lim  # noqa: E402
from models import Base, GameMessage, GamePlayer, User  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402

client = TestClient(main.app, raise_server_exceptions=True)
FALLOS: list[str] = []


def check(cond: bool, label: str) -> None:
    print(f"  [{'ok' if cond else 'FAIL'}] {label}")
    if not cond:
        FALLOS.append(label)


# El endpoint pide sesión de Clerk viva. Acá no hay Clerk, así que se sustituye el
# resolutor por uno que devuelve el user de la fila: lo que se prueba es la regla
# del chat, no el JWT, que ya tiene su propio chequeo.
#
# Se parchea el de `deps` y no el del router: el que decide quién sos es
# `get_current_player`, y el del router solo se usa en /link.
import game.deps as game_deps  # noqa: E402

_clerk_real = game_deps._clerk_user


def _clerk_falso(authorization, db):
    if not authorization:
        return None
    return db.query(User).filter(User.email == "chat@test.dev").first()


game_deps._clerk_user = _clerk_falso

db = database.SessionLocal()

# Un invitado y una cuenta, que es la única distinción que le importa al chat.
r = client.post("/game/derivemos/player", json={})
INVITADO = {"X-Game-Token": r.json()["guest_token"]}

usuario = User(email="chat@test.dev", name="Chat Test", username="chatero")
db.add(usuario)
db.commit()
db.refresh(usuario)

# El jugador con cuenta es un invitado que SE REGISTRÓ, como en la vida real: el
# link le pone el `user_id` y le DEJA su token de invitado (models.py ::
# guest_token). Armarlo así y no como una fila suelta es lo que hace posible el
# chequeo que importa ahora que el chat está abierto: que ese token guardado
# sirva para leer pero NO para escribir en su nombre sin la sesión viva.
r = client.post("/game/derivemos/player", json={})
CUENTA = {"X-Game-Token": r.json()["guest_token"]}
registrado = (
    db.query(GamePlayer)
    .filter(GamePlayer.guest_token == CUENTA["X-Game-Token"])
    .first()
)
registrado.user_id = usuario.id
registrado.alias = "chatero"
registrado.university = "UBA"
db.commit()
db.refresh(registrado)
CUENTA_CLERK = {**CUENTA, "Authorization": "Bearer falso"}


def mandar(texto: str, headers=None):
    _lim.olvidar_todo()
    return client.post(
        "/game/derivemos/message", json={"text": texto}, headers=headers or CUENTA_CLERK
    )


print("\n1. quién puede escribir")
# Escribir pedía cuenta y ya no. Un invitado se crea con un POST sin credenciales
# y su token no vence ni se puede revocar —ese era el argumento— pero un chat al
# que la mayoría de la gente que está jugando no puede contestar no es un chat.
r = mandar("hola a todos", headers=INVITADO)
check(r.status_code == 201, f"un invitado escribe (dio {r.status_code}: {r.text[:120]})")
check(r.json().get("alias"),
      f"y sale con el alias que el juego le puso: @{r.json().get('alias')}")

# Lo que NO se relajó: quien tiene cuenta sigue necesitando la sesión viva. Su
# token de invitado queda guardado después del link (models.py :: guest_token),
# así que sin esto alcanzaría con ese token para publicar bajo su nombre — y
# publicar en nombre de alguien no se deshace desde el otro lado.
r = mandar("hola a todos", headers=CUENTA)
check(r.status_code == 403,
      f"pero con cuenta y sin sesión de Clerk, no (dio {r.status_code})")
check("Iniciá sesión" in r.json().get("detail", ""), "y el 403 le dice qué hacer")

r = mandar("hola a todos")
check(r.status_code == 201, f"con cuenta y sesión sí (dio {r.status_code}: {r.text[:120]})")
check(r.json()["alias"] == "chatero", "el mensaje sale con el @ de quien lo escribió")
check(r.json()["university"] == "UBA", "y con su universidad")
check(r.json()["is_mine"] is True, "y marcado como propio")

print("\n2. el saneado")
CASOS_MALOS = [
    ("<script>alert(1)</script>", "marcado"),
    ("https://spam.example.com/gana-plata", "un link"),
    ("entrá a bit.ly/x", "un link corto"),
    ("mandame mail a hola@spam.com", "un mail"),
    ("x" * 200, "200 caracteres"),
    ("!!!!", "solo signos"),
    ("   ", "solo espacios"),
    ("hola {a} chau", "los marcadores del feed"),
    ("hola 🎉", "emojis"),
]
for texto, que in CASOS_MALOS:
    r = mandar(texto)
    check(r.status_code == 422, f"rechaza {que} (dio {r.status_code})")

CASOS_BUENOS = [
    "hola! alguien más está en la UTN?",
    "me costó la 3, la regla de la cadena me mata",
    "¿alguien sabe por qué da 12x^2?",
    "dale UBA vamos que se puede :)",
    "llegué a 1.500 de XP",
]
for texto in CASOS_BUENOS:
    r = mandar(texto)
    check(r.status_code == 201, f"acepta {texto!r} (dio {r.status_code})")

check(
    game_chat.limpiar("hola     mundo") == "hola mundo",
    "colapsa los espacios horizontales repetidos",
)

print("\n2b. el arte ASCII (multi-renglón)")
# El salto de línea YA NO se come: es la diferencia entre una frase y un
# dibujo. Antes "hola\n\nmundo" daba "hola mundo"; ahora el renglón vacío del
# medio es el aire del dibujo y se conserva (uno solo, nunca una corrida).
check(
    game_chat.limpiar("hola\n\nmundo") == "hola\n\nmundo",
    "un renglón en blanco en el medio se conserva, no se aplana a espacio",
)
check(
    game_chat.limpiar("hola\n\n\n\nmundo") == "hola\n\nmundo",
    "pero nunca más de uno seguido",
)
check(
    game_chat.limpiar("\n\nhola\n\n") == "hola",
    "los renglones en blanco de las puntas se recortan enteros",
)
GATO = " /\\_/\\\n( o.o )\n > ^ <"
check(
    game_chat.limpiar(GATO) == GATO,
    "un gato de tres renglones —barras, paréntesis, mayor/menor— pasa entero, "
    "con la indentación de cada uno intacta",
)
r = mandar("uno\ndos\ntres\ncuatro\ncinco\nseis")
check(r.status_code == 201, f"seis renglones, el tope, todavía entra (dio {r.status_code})")
r = mandar("uno\ndos\ntres\ncuatro\ncinco\nseis\nsiete")
check(r.status_code == 422, f"siete renglones ya no (dio {r.status_code})")
r = mandar("/\\_/\\\n( o.o )")
check(r.status_code == 201, f"el endpoint también lo deja pasar (dio {r.status_code})")

# La concesión es SOLO para más de un renglón: de una línea, un link o un
# `<script>` tienen que seguir cayendo en el mismo filtro estricto de
# siempre. Repite a propósito los casos de CASOS_MALOS de más arriba, esta vez
# como aserción directa sobre `limpiar` y no solo sobre el 422 del endpoint.
for texto in ("<script>alert(1)</script>", "https://spam.example.com/gana-plata",
              "entrá a bit.ly/x", "|/\\|"):
    try:
        game_chat.limpiar(texto)
        check(False, f"una sola línea sigue rechazando {texto!r}")
    except game_chat.TextoRechazado:
        check(True, f"una sola línea sigue rechazando {texto!r}")
# Y sin letras ni dígitos, una sola línea de puros signos sigue siendo ruido
# y no arte — la excepción es solo para el dibujo de VARIOS renglones.
try:
    game_chat.limpiar("!?..,;")
    check(False, "una línea de puros signos sigue rechazando (la excepción es solo multi-renglón)")
except game_chat.TextoRechazado:
    check(True, "una línea de puros signos sigue rechazando (la excepción es solo multi-renglón)")
check(
    game_chat.limpiar("|/\\|\n|\\/|") == "|/\\|\n|\\/|",
    "pero DOS renglones de puros signos sí pasan — es la mitad del punto",
)

print("\n3. hasta tres mensajes por minuto")
_lim.olvidar_todo()
r1 = client.post("/game/derivemos/message", json={"text": "primero"}, headers=CUENTA_CLERK)
r2 = client.post("/game/derivemos/message", json={"text": "segundo"}, headers=CUENTA_CLERK)
r3 = client.post("/game/derivemos/message", json={"text": "tercero"}, headers=CUENTA_CLERK)
check(
    r1.status_code == 201 and r2.status_code == 201 and r3.status_code == 201,
    f"los tres primeros entran ({r1.status_code}/{r2.status_code}/{r3.status_code})",
)
r4 = client.post("/game/derivemos/message", json={"text": "cuarto"}, headers=CUENTA_CLERK)
check(r4.status_code == 429, f"el cuarto espera (dio {r4.status_code})")
check(r4.headers.get("Retry-After") == "30", "con Retry-After, para que el cliente sepa volver")
# El tope del chat es SUYO y no se llena con lo que la persona hace jugando.
# Este chequeo es el que faltaba: el de arriba arranca con el contador en cero y
# solo manda mensajes, así que pasaba con el bug puesto. En producción nadie
# llega al chat recién levantado — llega de responder derivadas, de pedir otra y
# de que se le muestren carteles, y todo eso caía en la MISMA cola que los tres
# mensajes por minuto. Resultado: el primer mensaje se llevaba un 429 y el chat
# estaba cerrado sin que ningún chequeo lo dijera.
_lim.olvidar_todo()
for _ in range(5):
    client.get("/game/derivemos/stats", headers=CUENTA_CLERK)
r = client.post("/game/derivemos/message", json={"text": "recien llegado"}, headers=CUENTA_CLERK)
check(
    r.status_code == 201,
    f"cinco pedidos a otra puerta no gastan el cupo del chat (dio {r.status_code})",
)

# El tope es del JUGADOR y el invitado es un jugador: el cuarto mensaje del
# minuto le tiene que dar 429 igual que a cualquiera. Acá se verificaba lo
# contrario —que le ganara el 403 al 429— porque el invitado ni llegaba al
# limitador.
_lim.olvidar_todo()
for i in range(3):
    client.post("/game/derivemos/message", json={"text": f"mensaje {i}"}, headers=INVITADO)
r = client.post("/game/derivemos/message", json={"text": "el cuarto"}, headers=INVITADO)
check(r.status_code == 429,
      f"al invitado también lo frena el tope por minuto (dio {r.status_code})")

# Y el orden de las dependencias sigue importando para quien tiene cuenta sin
# sesión: el 403 explica qué hacer, el 429 no dice nada.
_lim.olvidar_todo()
client.post("/game/derivemos/message", json={"text": "uno"}, headers=CUENTA)
r = client.post("/game/derivemos/message", json={"text": "dos"}, headers=CUENTA)
check(r.status_code == 403, f"y ahí le gana el 403, no el 429 (dio {r.status_code})")

print("\n4. leer: los dos cursores")
_lim.olvidar_todo()
r = client.get("/game/derivemos/events", headers=INVITADO)
check(r.status_code == 200, "un invitado SÍ puede leer")
cuerpo = r.json()
check("messages" in cuerpo and "events" in cuerpo, "la respuesta trae las dos listas")
check(len(cuerpo["messages"]) > 0, "y los mensajes están ahí")
ultimo = max(m["id"] for m in cuerpo["messages"])

r = client.get(f"/game/derivemos/events?after_msg_id={ultimo}", headers=INVITADO)
check(r.json()["messages"] == [], "con el cursor al día no devuelve nada")
check(len(r.text) < 60, f"y la respuesta pesa casi nada ({len(r.text)} bytes)")

_lim.olvidar_todo()
client.post("/game/derivemos/message", json={"text": "uno nuevo"}, headers=CUENTA_CLERK)
r = client.get(f"/game/derivemos/events?after_msg_id={ultimo}", headers=INVITADO)
check(len(r.json()["messages"]) == 1, "y después del mensaje nuevo devuelve exactamente ese")
check(r.json()["messages"][0]["is_mine"] is False, "que para el invitado no es propio")

print("\n5. bajar un mensaje")
fila = db.query(GameMessage).order_by(GameMessage.id.desc()).first()
fila.hidden = True
db.commit()
r = client.get("/game/derivemos/events", headers=INVITADO)
check(
    all(m["id"] != fila.id for m in r.json()["messages"]),
    "un mensaje con hidden=True no vuelve a salir",
)
check(
    db.query(GameMessage).filter(GameMessage.id == fila.id).first() is not None,
    "pero la fila sigue estando, para saber qué se bajó",
)

print("\n6. el interruptor")
os.environ["GAME_CHAT_ENABLED"] = "0"
_lim.olvidar_todo()
r = client.post("/game/derivemos/message", json={"text": "con el chat apagado"}, headers=CUENTA_CLERK)
check(r.status_code == 503, f"apagado, escribir devuelve 503 (dio {r.status_code})")
r = client.get("/game/derivemos/events", headers=INVITADO)
check(r.status_code == 200 and len(r.json()["messages"]) > 0, "pero leer sigue andando")
os.environ["GAME_CHAT_ENABLED"] = "1"

print("\n7. el mensaje guarda quién era ENTONCES")
_lim.olvidar_todo()
client.post("/game/derivemos/message", json={"text": "soy de la UBA"}, headers=CUENTA_CLERK)
guardado = db.query(GameMessage).order_by(GameMessage.id.desc()).first()
registrado_fresco = db.query(GamePlayer).filter(GamePlayer.id == registrado.id).first()
registrado_fresco.university = "UTN"
registrado_fresco.alias = "otronombre"
db.commit()
r = client.get("/game/derivemos/events", headers=INVITADO)
mio = next(m for m in r.json()["messages"] if m["id"] == guardado.id)
check(mio["university"] == "UBA", "cambiar de universidad no reescribe lo ya dicho")
check(mio["alias"] == "chatero", "ni cambiar el @")

game_deps._clerk_user = _clerk_real
db.close()

print()
if FALLOS:
    print(f"{len(FALLOS)} fallo(s):")
    for f in FALLOS:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
