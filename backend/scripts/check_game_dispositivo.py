"""Verifica la muestra de dispositivo: el endpoint, y que mida lo que dice medir.

Esta tabla existe para contestar «¿a quién le anda mal el juego?», y hay tres
formas conocidas de que una tabla así quede verde midiendo nada. Las tres se
prueban acá:

  - **el endpoint no puede fallar por contenido**. Se manda en la mitad del
    arranque de una partida, así que un valor raro tiene que ignorarse, no
    tirar un 500. Es la misma regla que `/cta`, y el precedente es concreto:
    ahí un `solved` grande reventaba el commit hasta que se le puso tope;
  - **el modelo se extrae bien del User-Agent**. De eso sale la gama del
    teléfono, que es la variable exógena de todo el análisis. Android lo pone
    y iOS no; Chrome, desde que redujo el User-Agent, manda `K`, que no
    distingue nada y no se guarda;
  - **las dos banderas del rescate cuentan lo que tienen que contar**. La
    proporción entre `sin_token_local` y `token_rescatado` es LA medición del
    agujero de iOS: si las dos se escribieran siempre iguales, la tabla diría
    que nunca se borra nada y nadie se enteraría.

Uso:
    python backend/scripts/check_game_dispositivo.py

Sale con código 1 si algo falla.
"""

import os
import re
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_dispositivo.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameDeviceSample, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
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
    p = GamePlayer(alias=alias, theta=0.0, n_updates=0, exercises_correct=0,
                   exercises_attempted=0, is_bot=False, guest_token=token,
                   platform="android")
    db.add(p)
    db.commit()
    return p


def muestras(p: GamePlayer) -> list[GameDeviceSample]:
    db.expire_all()
    return (
        db.query(GameDeviceSample)
        .filter(GameDeviceSample.player_id == p.id)
        .order_by(GameDeviceSample.id)
        .all()
    )


def postear(token: str, cuerpo: dict):
    return client.post(f"{API}/dispositivo", json=cuerpo,
                       headers={"X-Game-Token": token})


print("1. la muestra se guarda entera")
uno = jugador("aparatoUno", "tok-aparato-1")
r = postear("tok-aparato-1", {
    "platform": "android",
    "device_model": "SM-A155M",
    "fcp_ms": 3520,
    "dcl_ms": 5100,
    "sin_token_local": False,
    "token_rescatado": False,
})
check(r.status_code == 204, f"devuelve 204 (dio {r.status_code})")
f = muestras(uno)
check(len(f) == 1, f"escribió una fila (dio {len(f)})")
if f:
    check(f[0].platform == "android" and f[0].device_model == "SM-A155M",
          "guardó plataforma y modelo")
    check(f[0].fcp_ms == 3520 and f[0].dcl_ms == 5100,
          "guardó las dos marcas de tiempo")

print()
print("2. una fila por llamada, sin deduplicar")
# La pregunta de esta tabla es semanal, y quien vuelve mañana con el mismo
# teléfono es una medición nueva y no la de hoy repetida. Deduplicar por
# jugador convertiría la serie en «cuántos teléfonos distintos hay», que es
# otra cosa.
postear("tok-aparato-1", {"platform": "android", "fcp_ms": 2100})
check(len(muestras(uno)) == 2, "la segunda llamada suma otra fila")

print()
print("3. RECORTA en vez de rechazar — un 422 pierde la fila entera")
# La distinción no es un detalle: lo caro de esta fila son las dos banderas del
# rescate, no el milisegundo. Rechazar la llamada por un FCP raro tira también
# la medición del agujero de iOS, que es el motivo por el que la tabla existe.
dos = jugador("aparatoDos", "tok-aparato-2")
for etiqueta, cuerpo in (
    ("cuerpo vacío", {}),
    ("plataforma inventada", {"platform": "nokia"}),
    ("pestaña en segundo plano, FCP de una hora",
     {"fcp_ms": 3_600_000, "sin_token_local": True, "token_rescatado": True}),
    ("modelo larguísimo", {"device_model": "x" * 500}),
):
    r = postear("tok-aparato-2", cuerpo)
    check(r.status_code == 204, f"{etiqueta}: 204 (dio {r.status_code})")
f = muestras(dos)
check(len(f) == 4, f"las cuatro llamadas dejaron su fila (dio {len(f)})")
# Y lo que entra, entra limpio: una plataforma que no es del vocabulario se
# guarda en NULL en vez de ensuciar la columna con la que las series se cortan.
plats = [m.platform for m in f]
check(all(p in (None, "ios", "android", "desktop") for p in plats),
      f"ninguna plataforma fuera del vocabulario (dio {plats})")
largos = [m.fcp_ms for m in f if m.fcp_ms is not None]
check(all(v <= 600_000 for v in largos),
      f"el FCP quedó recortado al tope (dio {largos})")
check(any(m.token_rescatado for m in f),
      "y la bandera del rescate sobrevivió al recorte")
modelos = [m.device_model for m in f if m.device_model is not None]
check(all(len(m) <= 64 for m in modelos),
      f"el modelo entra en la columna (dio {[len(m) for m in modelos]})")

print()
print("4. sin jugador no se escribe nada")
antes = db.query(GameDeviceSample).count()
r = postear("tok-que-no-existe", {"platform": "ios"})
check(r.status_code in (401, 403, 404),
      f"un token desconocido no pasa (dio {r.status_code})")
check(db.query(GameDeviceSample).count() == antes,
      "y no dejó ninguna fila huérfana")

print()
print("5. las dos banderas del rescate se distinguen")
# Es LA medición del agujero de iOS: cuántas «altas» eran en realidad vueltas
# de alguien a quien Safari le borró el almacenamiento. Si las dos banderas se
# escribieran siempre iguales, la tabla diría que eso no pasa nunca.
tres = jugador("aparatoTres", "tok-aparato-3")
postear("tok-aparato-3", {"sin_token_local": True, "token_rescatado": True})
postear("tok-aparato-3", {"sin_token_local": True, "token_rescatado": False})
postear("tok-aparato-3", {"sin_token_local": False, "token_rescatado": False})
f = muestras(tres)
check([(m.sin_token_local, m.token_rescatado) for m in f]
      == [(True, True), (True, False), (False, False)],
      "las tres combinaciones llegan distintas a la base")

print()
print("6. el respaldo del User-Agent, y por qué es solo un respaldo")
# Espejo de `modeloSegunUserAgent` en UseMuestraDelAparato.ts.
#
# **El camino principal NO es este.** Chrome redujo el User-Agent y manda
# `(Linux; Android 10; K)` para todos los teléfonos: medido sobre 30 días de
# producción, 30.274 de 31.055 eventos de Android (97,5%) llegan así. El modelo
# real solo se consigue con
# `navigator.userAgentData.getHighEntropyValues(["model"])`, y de ahí lo saca
# también PostHog — por eso PostHog conoce el modelo de 30.395 de esos 31.055
# eventos mientras el User-Agent crudo de los mismos dice `K`.
#
# La primera versión de esto usaba solo el User-Agent y dejaba la columna vacía.
# Se vio en producción con las dos primeras muestras de Android reales.
#
# Lo que se fija acá es que el respaldo siga leyendo bien los User-Agent que
# todavía traen modelo (WebViews, navegadores sin reducir) y que descarte la
# `K`, que no distingue nada.
RE = re.compile(r"Android\s[\d.]+;\s*([^;)]+)")


def modelo(ua: str) -> str | None:
    m = RE.search(ua)
    if m is None:
        return None
    limpio = re.sub(r"\s+Build/.*$", "", m.group(1)).strip()
    if limpio == "" or limpio == "K":
        return None
    return limpio[:64]


CASOS = [
    ("Mozilla/5.0 (Linux; Android 14; SM-A155M) AppleWebKit/537.36", "SM-A155M"),
    ("Mozilla/5.0 (Linux; Android 13; moto g24 power) AppleWebKit/537.36",
     "moto g24 power"),
    # WebView: el modelo viene pegado a su Build/, que no aporta nada.
    ("Mozilla/5.0 (Linux; Android 10; SM-A105M Build/QP1A.190711.020; wv)",
     "SM-A105M"),
    # El 97,5% de Android llega así. Por eso el respaldo devuelve None acá y el
    # modelo de verdad lo trae Client Hints.
    ("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36", None),
    # iOS no publica el modelo nunca.
    ("Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15",
     None),
    ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", None),
]
for ua, esperado in CASOS:
    dio = modelo(ua)
    check(dio == esperado, f"«{ua[:44]}…» → {dio!r} (esperado {esperado!r})")

print()
if FAILURES:
    print(f"FALLARON {len(FAILURES)}:")
    for f_ in FAILURES:
        print(f"  - {f_}")
    sys.exit(1)
print("todo ok")
