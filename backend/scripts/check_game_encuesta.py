"""Verifica la pregunta abierta del juego: el endpoint y qué cuenta como salto.

Esta pregunta es distinta de todo lo demás que el juego guarda, y las tres cosas
que la hacen distinta son las tres que se prueban acá:

  - **sale una sola vez en la vida**. No hay segunda oportunidad, así que una
    respuesta perdida está perdida. La impresión y la respuesta tienen que
    encontrarse en una sola fila aunque pasen minutos entre una y otra, que es
    lo que tarda alguien en escribir;
  - **el texto se guarda como lo escribieron**, sin allowlist. La de `chat.py`
    existe porque allá el texto se vuelve público; esto lo lee solo el panel, y
    filtrarlo sería tirar la parte interesante. Un emoji, una barra o un signo
    de pregunta tienen que sobrevivir;
  - **un "." es una respuesta**. La diapo no tiene botón de saltar, así que
    escribir un punto es la forma de decir que no. Se guarda igual y se
    clasifica al LEER (`encuesta.es_salto`), no al escribir: si el POST lo
    tirara, no habría forma de distinguir «no quiso» de «se fue».

Y una cuarta que no es de la pregunta sino del juego: **el endpoint no falla por
contenido**. Aparece en la mitad de una partida, y romperle el juego a alguien
por un dato opcional es el peor intercambio posible.

Uso:
    python backend/scripts/check_game_encuesta.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_encuesta.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GamePlayer, GameSurveyAnswer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import encuesta  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


API = "/game/derivemos"
client = TestClient(main.app, raise_server_exceptions=True)


def jugador(alias: str, token: str) -> GamePlayer:
    p = GamePlayer(alias=alias, theta=0.0, n_updates=20, exercises_correct=18,
                   exercises_attempted=25, is_bot=False, guest_token=token,
                   platform="android")
    db.add(p)
    db.commit()
    return p


def filas(p: GamePlayer) -> list[GameSurveyAnswer]:
    db.expire_all()
    return (db.query(GameSurveyAnswer)
            .filter(GameSurveyAnswer.player_id == p.id)
            .order_by(GameSurveyAnswer.id)
            .all())


# ── 1 · La pregunta que se está haciendo ─────────────────────────────────────
print("1. la pregunta")
check(encuesta.ACTUAL in encuesta.PREGUNTAS,
      "la pregunta activa está declarada en el catálogo")
check(encuesta.PREGUNTAS[encuesta.ACTUAL].endswith("?"),
      "y es una pregunta")
# El enunciado del front y el de acá tienen que ser el mismo texto. El del front
# es el que la persona lee; este es el que queda documentado al lado de las
# respuestas. Si divergen, el panel dice que la gente contestó algo que nadie le
# preguntó.
SLIDE = (BACKEND.parent / "web/src/app/derivadas/encuesta-slide.tsx").read_text(
    encoding="utf-8")
check(f'"{encuesta.ACTUAL}"' in SLIDE,
      f"el front manda la misma clave de pregunta ({encuesta.ACTUAL})")


# ── 2 · Los dos pasos se encuentran en una sola fila ─────────────────────────
print("2. impresión y respuesta, una sola fila")
p1 = jugador("escribe", "tok-escribe")
H1 = {"X-Game-Token": "tok-escribe"}

r = client.post(f"{API}/encuesta", json={"accion": "impression"}, headers=H1)
check(r.status_code == 200 and r.json()["guardado"] is False,
      "la impresión se acepta y dice que todavía no guardó nada")
f = filas(p1)
check(len(f) == 1 and f[0].answered_at is None,
      "y deja una fila sin responder, que es «la vio y se fue» hasta que conteste")
check(f[0].correctas_al_mostrar == 18,
      f"con las derivadas congeladas al mostrar (dio {f[0].correctas_al_mostrar})")

r = client.post(f"{API}/encuesta",
                json={"accion": "answer", "texto": "  más   ejercicios de cadena  "},
                headers=H1)
check(r.status_code == 200 and r.json()["guardado"] is True, "la respuesta se guarda")
f = filas(p1)
check(len(f) == 1, f"y NO abre una fila nueva: la completa (hay {len(f)})")
check(f[0].texto == "más ejercicios de cadena",
      f"con los espacios colapsados (quedó {f[0].texto!r})")
check(f[0].answered_at is not None, "y con fecha de respuesta")


# ── 3 · Sin impresión previa igual se guarda ─────────────────────────────────
print("3. una respuesta sin impresión no se pierde")
# Pasa de verdad: el POST de la impresión es `void` y sin reintento, así que una
# red mala se lo come. Perder por eso la respuesta —lo único que la persona se
# tomó el trabajo de escribir— sería tirar el dato caro para cuidar el barato.
p2 = jugador("sinimpresion", "tok-sin")
r = client.post(f"{API}/encuesta",
                json={"accion": "answer", "texto": "que se pueda jugar de a dos"},
                headers={"X-Game-Token": "tok-sin"})
f = filas(p2)
check(r.status_code == 200 and len(f) == 1 and f[0].answered_at is not None,
      "se crea la fila con la respuesta adentro")


# ── 4 · El texto se guarda como lo escribieron ───────────────────────────────
print("4. sin allowlist de caracteres")
p3 = jugador("emojis", "tok-emoji")
CRUDO = "más difícil 😤 y con gráficos! ¿se puede? http://x.com <b>"
client.post(f"{API}/encuesta", json={"accion": "answer", "texto": CRUDO},
            headers={"X-Game-Token": "tok-emoji"})
check(filas(p3)[0].texto == CRUDO,
      f"el emoji, la barra y el signo sobreviven enteros (quedó {filas(p3)[0].texto!r})")

p4 = jugador("largo", "tok-largo")
client.post(f"{API}/encuesta",
            json={"accion": "answer", "texto": "a" * (encuesta.MAX_LARGO + 300)},
            headers={"X-Game-Token": "tok-largo"})
check(len(filas(p4)[0].texto) == encuesta.MAX_LARGO,
      f"y el tope corta en {encuesta.MAX_LARGO} (quedó {len(filas(p4)[0].texto)})")


# ── 5 · El salto es una respuesta ────────────────────────────────────────────
print("5. un punto también es contestar")
p5 = jugador("punto", "tok-punto")
client.post(f"{API}/encuesta", json={"accion": "answer", "texto": "."},
            headers={"X-Game-Token": "tok-punto"})
f = filas(p5)
check(f[0].texto == "." and f[0].answered_at is not None,
      "el punto se GUARDA, no se descarta")
check(encuesta.es_salto("."), "y se clasifica como salto al leer")
check(encuesta.es_salto("-") and encuesta.es_salto("  ") and encuesta.es_salto(""),
      "igual que la raya y los espacios")
check(not encuesta.es_salto("más ejercicios"), "pero una respuesta de verdad no")
check(not encuesta.es_salto(None),
      "y quien nunca contestó no es un salto: es otro estado")

# El campo vacío no puede pasar por el front (el botón está deshabilitado), así
# que llegar acá con "" es una llamada a mano o un cliente viejo. Se guarda como
# lo que es, un salto, en vez de reventar.
p6 = jugador("vacio", "tok-vacio")
r = client.post(f"{API}/encuesta", json={"accion": "answer", "texto": ""},
                headers={"X-Game-Token": "tok-vacio"})
check(r.status_code == 200 and filas(p6)[0].texto == "",
      "un texto vacío se guarda como salto en vez de romper")


# ── 6 · No falla por contenido ───────────────────────────────────────────────
print("6. nada de esto le rompe la partida a nadie")
p7 = jugador("raro", "tok-raro")
H7 = {"X-Game-Token": "tok-raro"}
r = client.post(f"{API}/encuesta",
                json={"accion": "answer", "pregunta": "no_existe", "texto": "hola"},
                headers=H7)
check(r.status_code == 200, "una pregunta desconocida no rompe")
check(filas(p7)[0].pregunta == encuesta.ACTUAL,
      "y cae en la que se está haciendo, no en una clave inventada")

r = client.post(f"{API}/encuesta", json={"accion": "bailar"}, headers=H7)
check(r.status_code == 422, "una acción desconocida sí es un 422: es un bug del cliente")


# ── 7 · Dos impresiones colgadas, una sola se contesta ───────────────────────
print("7. la respuesta contesta la impresión más reciente")
# Alguien que abrió la diapo, cerró la pestaña y volvió. La vieja se queda como
# lo que fue —una pregunta ignorada— y no se le pega una respuesta que no es
# suya: si las dos se completaran, la tasa de abandono diría cero para siempre.
p8 = jugador("dosveces", "tok-dos")
H8 = {"X-Game-Token": "tok-dos"}
client.post(f"{API}/encuesta", json={"accion": "impression"}, headers=H8)
client.post(f"{API}/encuesta", json={"accion": "impression"}, headers=H8)
client.post(f"{API}/encuesta", json={"accion": "answer", "texto": "un modo sin tiempo"},
            headers=H8)
f = filas(p8)
check(len(f) == 2, f"siguen siendo dos filas (hay {len(f)})")
check(f[0].answered_at is None and f[1].answered_at is not None,
      "la vieja queda ignorada y la nueva contestada")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
