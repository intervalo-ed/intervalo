"""Verifica la pantalla de arranque: las tres ramas, la ventana y lo que no se repite.

Toda sesión del juego empieza en esta pantalla, así que un error acá lo ve el
100% de la gente el 100% de las veces. Lo que se cuida:

  - **la rama la decide `correct_today`, no un reloj**. Es lo que garantiza que
    «hoy ya resolviste N» nunca pueda decir cero. Con un umbral de horas, quien
    jugó ayer a las 23 y vuelve a las 8 lleva nueve horas afuera y cero
    derivadas hoy, y el renglón sale roto;

  - **la ventana NO es `last_seen_at`**. Esa se pisa durante la sesión —la tocan
    `/next`, `/answer`, `/skip` y el generador—, así que para cuando la pantalla
    se dibuja ya vale «ahora» y el digest saldría vacío siempre. El síntoma
    sería «la pantalla no cuenta nada», que se ve idéntico a «no pasó nada» y
    por eso nadie lo reporta. El chequeo arma justo ese caso: `last_seen_at` al
    día y `digest_seen_at` viejo;

  - **lo contado no se cuenta dos veces**. El renglón de reclutas sale una vez y
    a la vuelta siguiente ya no, porque `referral_xp_digest_seen` avanzó. Es el
    invariante que separa una novedad de un recordatorio;

  - **y se marca DESPUÉS de construir**. Al revés, el digest se contaría a sí
    mismo y el renglón de reclutas no aparecería nunca;

  - **el conteo cae a la ventana semanal** cuando el número no llega al mínimo,
    que es lo que evita el «+1 persona se sumó» — peor que el silencio;

  - **la universidad sale del `?g=`** para quien no la cargó. Es el 77% de los
    que llegan, y sin esto la pantalla de primera vez les habla del mundo en vez
    de hablarles de su gente.

Uso:
    python backend/scripts/check_game_bienvenida.py

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
    Path(tempfile.mkdtemp()) / "game_bienvenida.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import Base, GameAttempt, GameEvent, GameGroup, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import bienvenida  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []
AHORA = datetime.utcnow()
INICIO_DEL_DIA = AHORA.replace(hour=0, minute=0, second=0, microsecond=0)
API = "/game/derivemos"
client = TestClient(main.app, raise_server_exceptions=True)


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def jugador(alias, **kw):
    p = GamePlayer(alias=alias, xp=kw.pop("xp", 0), theta=kw.pop("theta", 0.0),
                   n_updates=kw.pop("n_updates", 0),
                   exercises_correct=kw.pop("correctas", 0),
                   exercises_attempted=0, is_bot=kw.pop("is_bot", False), **kw)
    db.add(p)
    db.commit()
    return p


def construir(p, correct_today=0, ahora=None):
    return bienvenida.construir(db, p, correct_today, INICIO_DEL_DIA, ahora or AHORA)


def claves(b):
    return [n.clave for n in b.novedades]


# ── El mundo ─────────────────────────────────────────────────────────────────
# **Gente y no sembrados.** Cada renglón de esta pantalla es una afirmación
# sobre PERSONAS («ya hay 371 de la UBA jugando»), así que el módulo filtra
# `is_bot` en todas sus cuentas. Un fixture de bots mediría lo contrario de lo
# que producción va a medir — y hoy en producción hay 0 sembrados, así que no
# hay divergencia posible con el ranking, que sí los contaría.
for i in range(40):
    jugador(f"pobla_uba_{i}", university="UBA", correctas=5, theta=1.3, n_updates=9)
for i in range(25):
    jugador(f"pobla_utn_{i}", university="UTN", correctas=5, theta=1.1, n_updates=9)
db.commit()


print("1. la rama la decide correct_today, no un reloj")

vuelve = jugador("elqueVuelve", university="UBA", correctas=30,
                 guest_token="tok-vuelve")
b = construir(vuelve, correct_today=0)
check(b.modo == "vuelve", f"sin derivadas hoy, vuelve (dio {b.modo})")
check(b.titulo == "Mientras no estabas", f"con su encabezado (dio {b.titulo})")
check("{a}" in b.saludo, f"y el saludo lleva el @ (dio {b.saludo})")

b = construir(vuelve, correct_today=8)
check(b.modo == "sigue", f"con 8 hoy, sigue (dio {b.modo})")
check(len(b.novedades) == 1, f"una sola línea (dio {len(b.novedades)})")
check(b.titulo is None, "sin encabezado")
check("8 derivadas" in b.novedades[0].texto,
      f"y dice cuántas (dio «{b.novedades[0].texto}»)")

# El caso que la rama por contador existe para hacer imposible. Con borde de
# palabra: «10 derivadas» contiene «0 derivadas» y sin `\b` este chequeo se
# acusaba a sí mismo.
import re  # noqa: E402

for n in range(1, 40):
    t = construir(vuelve, correct_today=n).novedades[0].texto
    if re.search(r"\b0\s+derivada", t):
        check(False, f"con correct_today={n} el texto dijo cero: «{t}»")
        break
else:
    check(True, "y en ningún valor el renglón puede decir «0 derivadas»")

check(construir(vuelve, correct_today=1).novedades[0].texto.count("derivadas") == 0,
      "con una sola dice «1 derivada», no «1 derivadas»")


print("2. quien nunca resolvió nada es primera vez")

nuevo = jugador("elNuevo", guest_token="tok-nuevo")
b = construir(nuevo)
check(b.modo == "primera", f"modo primera (dio {b.modo})")
check("{a}" not in b.saludo, f"el saludo va sin @ (dio {b.saludo})")
check(b.titulo == "Lo que está pasando", f"otro encabezado (dio {b.titulo})")
check(len(b.novedades) <= bienvenida.MAX_NOVEDADES,
      f"como mucho {bienvenida.MAX_NOVEDADES} renglones (dio {len(b.novedades)})")
check("reclutas" not in claves(b), "y nunca habla de reclutas: no tiene")


print("3. la universidad sale del ?g= cuando no la cargó")

db.add(GameGroup(id="uba262", universidad="UBA", cluster="Exactas",
                 materia="Análisis Matemático II", miembros=180))
db.commit()
delink = jugador("porElLink", first_group_id="uba262", guest_token="tok-link")
check(bienvenida.universidad_del_link(db, delink) == "UBA",
      "el grupo dice de qué universidad es")
b = construir(delink)
check("uni_gente" in claves(b) or "uni_puesto" in claves(b),
      f"y la pantalla le habla de su gente (dio {claves(b)})")
# Un ranking de una sola universidad no es un ranking: «va 1ª de 1» es una tabla
# de una fila con un podio encima. Con dos universidades en el fixture todavía
# no llega al mínimo, así que el renglón del puesto no puede salir.
check("uni_puesto" not in claves(b),
      f"y no le dice el puesto en una tabla de menos de {bienvenida.MIN_TABLA} (dio {claves(b)})")

sinlink = jugador("sinNada", guest_token="tok-sinlink")
check(bienvenida.universidad_del_link(db, sinlink) is None, "sin ?g= no se inventa")
b = construir(sinlink)
check("uni_gente" not in claves(b) and "uni_puesto" not in claves(b),
      f"y no le habla de una universidad que no sabemos (dio {claves(b)})")
check(len(b.novedades) >= 1, "pero igual tiene qué decirle: los fallbacks")

# La cargada gana sobre la del link: si dijo que estudia en otra, es esa.
mudado = jugador("seMudo", university="UTN", first_group_id="uba262",
                 guest_token="tok-mudado")
check(bienvenida.universidad_del_link(db, mudado) == "UTN",
      "la que cargó a mano le gana a la del link")


print("4. la ventana es digest_seen_at y NO last_seen_at")

# El caso exacto del bug: la sesión pisó `last_seen_at` hace un segundo, pero el
# digest no se muestra desde hace tres días. La ventana tiene que ser de tres
# días y no de un segundo.
p = jugador("ventanero", university="UBA", correctas=12, guest_token="tok-vent")
p.last_seen_at = AHORA
p.digest_seen_at = AHORA - timedelta(days=3)
db.commit()
check(bienvenida._ventana(p, AHORA) == AHORA - timedelta(days=3),
      "con las dos puestas manda digest_seen_at")

p.digest_seen_at = None
db.commit()
check(bienvenida._ventana(p, AHORA) == AHORA,
      "sin digest_seen_at cae a last_seen_at, que para el primero es honesto")

p.last_seen_at = AHORA - timedelta(days=90)
db.commit()
check(bienvenida._ventana(p, AHORA) == AHORA - bienvenida.VENTANA_MAXIMA,
      f"y nunca más atrás de {bienvenida.VENTANA_MAXIMA.days} días")


print("5. el conteo cae a la ventana semanal, y no dice «+1»")

casa = jugador("delaCasa", university="UNQ", correctas=20, guest_token="tok-casa")
casa.digest_seen_at = AHORA - timedelta(hours=6)
# Nacido hace rato: si no, ÉL MISMO cuenta como alta dentro de su propia ventana
# y el fixture mide uno de más. Alguien que vuelve no se creó hace un minuto.
casa.created_at = AHORA - timedelta(days=30)
db.commit()
# Cuatro altas en las últimas 6 h: no llega a MIN_CONTEO.
for i in range(bienvenida.MIN_CONTEO - 1):
    j = jugador(f"unq_reciente_{i}", university="UNQ")
    j.created_at = AHORA - timedelta(hours=2)
# Y muchas en la semana.
for i in range(20):
    j = jugador(f"unq_semana_{i}", university="UNQ")
    j.created_at = AHORA - timedelta(days=3)
db.commit()

n = bienvenida._n_altas(db, "UNQ", AHORA - timedelta(hours=6), AHORA, "s")
check(n is not None and n.clave == "altas_semana",
      f"con {bienvenida.MIN_CONTEO - 1} altas recientes usa la semanal (dio {n and n.clave})")
check(n is not None and "semana" in n.texto.lower(),
      f"y lo dice: «{n and n.texto}»")
check(n is not None and "{u0}" in n.texto, "con el hueco de la sigla, como el feed")

# Con suficientes, vuelve a la ventana propia.
for i in range(bienvenida.MIN_CONTEO + 2):
    j = jugador(f"unq_muchas_{i}", university="UNQ")
    j.created_at = AHORA - timedelta(hours=1)
db.commit()
n = bienvenida._n_altas(db, "UNQ", AHORA - timedelta(hours=6), AHORA, "s")
check(n is not None and n.clave == "altas", f"con suficientes usa la propia (dio {n and n.clave})")


print("6. lo que se contó no se vuelve a contar")

rec = jugador("elReclutador", university="UBA", correctas=40, guest_token="tok-rec")
for i in range(3):
    h = jugador(f"recluta_{i}", university="UBA", correctas=4)
    h.referred_by = rec.id
    h.referral_xp_given = 500
db.commit()

b = construir(rec)
check("reclutas" in claves(b), f"la primera vez sale el renglón (dio {claves(b)})")
linea = next(n for n in b.novedades if n.clave == "reclutas")
check("1.500" in linea.texto, f"con la XP acumulada (dio «{linea.texto}»)")
check(linea.emoji == "🪖", f"y el emoji del feed para reclutas (dio {linea.emoji})")

bienvenida.marcar_mostrado(db, rec, AHORA)
db.commit()
b = construir(rec)
check("reclutas" not in claves(b),
      f"y a la vuelta siguiente ya no, que es todo el punto (dio {claves(b)})")

# Pero lo NUEVO sí vuelve a salir.
otro = jugador("recluta_nuevo", university="UBA", correctas=4)
otro.referred_by = rec.id
otro.referral_xp_given = 800
db.commit()
b = construir(rec)
linea = next((n for n in b.novedades if n.clave == "reclutas"), None)
check(linea is not None and "800" in linea.texto,
      f"y lo que llegó después sí (dio «{linea and linea.texto}»)")


print("7. el orden, el tope y la forma de la oración")

b = construir(rec)
puntajes = [n.puntaje for n in
            sorted(b.novedades, key=lambda x: -x.puntaje)]
check([n.puntaje for n in b.novedades] == puntajes, "vienen ordenadas por puntaje")
check(len(b.novedades) <= bienvenida.MAX_NOVEDADES,
      f"y nunca más de {bienvenida.MAX_NOVEDADES}")
for n in b.novedades:
    check(n.texto.rstrip().endswith((".", "?", "!")),
          f"«{n.texto}» termina en punto")
    check(n.emoji != "", f"«{n.clave}» trae emoji")
check(len({n.clave for n in b.novedades}) == len(b.novedades),
      "y no se repite un hecho dos veces")


print("8. el endpoint, y que marque")

H = {"X-Game-Token": "tok-rec"}
r = client.get(f"{API}/bienvenida", headers=H)
check(r.status_code == 200, f"contesta 200 (dio {r.status_code})")
j = r.json()
check(j["modo"] in ("sigue", "vuelve", "primera"), f"modo válido (dio {j['modo']})")
check(isinstance(j["novedades"], list), "trae la lista de novedades")

db.expire_all()
rec2 = db.query(GamePlayer).filter(GamePlayer.alias == "elReclutador").one()
check(rec2.digest_seen_at is not None, "y dejó marcado que se mostró")
antes = rec2.referral_xp_digest_seen
check(antes == 2300, f"con el canal de reclutas al día (dio {antes})")

r2 = client.get(f"{API}/bienvenida", headers=H)
check("reclutas" not in [n["clave"] for n in r2.json()["novedades"]],
      "así que el segundo pedido ya no repite los reclutas")

# Un jugador sin token no debería reventar el endpoint.
r3 = client.get(f"{API}/bienvenida")
check(r3.status_code in (200, 401, 403), f"sin token no revienta (dio {r3.status_code})")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
