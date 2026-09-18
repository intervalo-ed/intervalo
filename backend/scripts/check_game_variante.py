"""Verifica el brazo de experimento que se guarda en `game_players.variant`.

Un experimento roto no falla: sigue dibujando la pantalla y sigue guardando
filas, solo que con el brazo mal anotado. Después el análisis compara dos
montones que no son los brazos y la conclusión es peor que no haber
experimentado. Todo lo que se fija acá es de esa clase — nada de esto se ve
mirando el juego.

Lo que se cubre:
  - el brazo se guarda al crear la fila, por los TRES caminos de alta (invitado
    nuevo, invitado que vuelve con token, y usuario con sesión de Clerk);
  - es write-once: quien entró en un brazo no se puede mudar al otro mandando
    otro `variant` en la próxima llamada. Si se pudiera, bastaría con recargar
    hasta caer en el brazo que va ganando;
  - lo que no matchea `<experimento>:<brazo>` se descarta en silencio en vez de
    ensuciar la columna, y no rompe el alta;
  - el reparto del hash es parejo y estable. Ese vive en el front
    (web/src/lib/experiments/UseGameVariant.ts) y acá se replica la función para
    fijar la propiedad: si el sorteo se sesgara, los dos brazos dejarían de ser
    comparables y el test mediría el sorteo.

Uso:
    python backend/scripts/check_game_variante.py

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
    Path(tempfile.mkdtemp()) / "game_variante.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from models import Base, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402

client = TestClient(main.app, raise_server_exceptions=True)
FAILURES: list[str] = []

API = "/game/derivemos"
# El experimento y sus brazos se LEEN del front, no se copian acá.
#
# Copiados, este chequeo seguía en verde el día que allá cambiaban de nombre: las
# tres primeras secciones probaban que el backend guarda «dx-puerta-1:control»
# mientras la producción guardaba otra cosa, que es exactamente el modo de falla
# que la sección 1 existe para descartar. Pasó de hecho al pasar de `dx-puerta-1`
# a `dx-puerta-2`.
#
# Se parsea con expresiones regulares y no se importa: es TypeScript, y traer un
# runtime de JS a un chequeo de Python para leer dos constantes es mucho más caro
# que estas cuatro líneas.
_VARIANTE_TS = (Path(__file__).resolve().parents[2]
                / "web/src/lib/experiments/UseGameVariant.ts").read_text(encoding="utf-8")

_m = re.search(r'export const EXPERIMENTO = "([^"]+)"', _VARIANTE_TS)
assert _m, "no se encontró EXPERIMENTO en UseGameVariant.ts"
EXPERIMENTO = _m.group(1)

_m = re.search(r"export const BRAZOS = \[([^\]]+)\]", _VARIANTE_TS)
assert _m, "no se encontró BRAZOS en UseGameVariant.ts"
BRAZOS = re.findall(r'"([^"]+)"', _m.group(1))
assert len(BRAZOS) == 2, f"se esperaban dos brazos y hay {BRAZOS}"

BRAZO_A = f"{EXPERIMENTO}:{BRAZOS[0]}"
BRAZO_B = f"{EXPERIMENTO}:{BRAZOS[1]}"


def check(condition: bool, label: str, detalle: str = "") -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label} {detalle}".rstrip())
    if not condition:
        FAILURES.append(label)


def alta(token: str | None = None, **body) -> tuple[str | None, dict]:
    headers = {"X-Game-Token": token} if token else {}
    r = client.post(f"{API}/player", json=body, headers=headers)
    j = r.json()
    return j.get("guest_token"), j["player"]


def variante_de(player_id: int) -> str | None:
    db = database.SessionLocal()
    try:
        fila = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
        return fila.variant if fila else None
    finally:
        db.close()


print("1. El brazo se guarda al crear la fila")

tok, p = alta(variant=BRAZO_B)
check(variante_de(p["player_id"]) == BRAZO_B, "un invitado nuevo queda anotado en su brazo",
      f'({variante_de(p["player_id"])})')

# Sin `variant` la columna queda en NULL y el alta funciona igual: el campo es
# opcional y un cliente viejo —o uno con el JS a medio cargar— no puede romper
# el alta por no mandarlo.
_tok2, p2 = alta()
check(variante_de(p2["player_id"]) is None, "sin brazo, la columna queda vacía y el alta anda")


print("2. Es write-once")

# El mismo dispositivo vuelve, ahora con el token, y pide el otro brazo.
_t, p_vuelve = alta(token=tok, variant=BRAZO_A)
check(p_vuelve["player_id"] == p["player_id"], "vuelve el MISMO jugador con su token")
check(variante_de(p["player_id"]) == BRAZO_B,
      "y su brazo NO se pisa al mandar otro",
      f'({variante_de(p["player_id"])})')

# Y el caso espejo: el que llegó sin brazo tampoco lo adopta después. Es la otra
# mitad de write-once, y es la que permitiría colar gente a un brazo cuando el
# experimento ya está corriendo.
_t, _ = alta(token=_tok2, variant=BRAZO_A)
check(variante_de(p2["player_id"]) is None,
      "quien ya existía no se enrola después (ver _anotar_variante)",
      f'({variante_de(p2["player_id"])})')


print("3. La basura se descarta sin romper el alta")

for malo in [BRAZOS[0], EXPERIMENTO, "dx puerta:control", "DX:CONTROL",
             f"{BRAZO_A}:extra", "'; drop table game_players; --", ""]:
    _t, px = alta(variant=malo)
    check(variante_de(px["player_id"]) is None,
          f"se descarta {malo[:28]!r}", f"({variante_de(px['player_id'])})")

# Largo: el schema corta en 48 y la columna mide 48. Un valor más largo tiene que
# rebotar con 422 en la puerta y no llegar a la base recortado, que sería la
# forma de que dos brazos distintos terminen con la misma etiqueta.
r = client.post(f"{API}/player", json={"variant": "x" * 40 + ":" + "y" * 40})
check(r.status_code == 422, "un brazo más largo que la columna rebota con 422",
      f"({r.status_code})")


print("4. El sorteo del front reparte parejo")


def hash_fnv1a(texto: str) -> int:
    """El MISMO FNV-1a de UseGameVariant.ts, replicado para poder fijarlo.

    Vive allá porque la decisión tiene que estar tomada en el primer render, del
    lado del cliente. Replicarlo acá no es duplicar lógica de producto: es el
    único lugar donde se puede probar que el reparto no está sesgado sin montar
    un navegador.
    """
    h = 0x811C9DC5
    for ch in texto:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    # La avalancha del final (lowbias32). Sin ella el bit 0 del hash es el XOR de
    # los bits 0 de la entrada —multiplicar por impar no lo toca— y `% 2` usa
    # justo ese. Ver el comentario largo en UseGameVariant.ts.
    h ^= h >> 16
    h = (h * 0x7FEB352D) & 0xFFFFFFFF
    h ^= h >> 15
    h = (h * 0x846CA68B) & 0xFFFFFFFF
    h ^= h >> 16
    return h & 0xFFFFFFFF


import uuid  # noqa: E402

conteo = {b: 0 for b in BRAZOS}
for _ in range(20000):
    ident = str(uuid.uuid4())
    conteo[BRAZOS[hash_fnv1a(f"{EXPERIMENTO}:{ident}") % len(BRAZOS)]] += 1

menor = min(conteo.values())
total = sum(conteo.values())
# ±2% sobre 20.000 sorteos es holgadísimo para un desvío de ~0,35%: lo que se
# quiere atrapar es un sesgo estructural (un hash que devuelve siempre par, un
# módulo mal hecho), no la fluctuación del azar.
check(abs(menor / total - 0.5) < 0.02, "reparte mitad y mitad", f"({conteo})")

# Estable: el mismo dispositivo cae siempre en el mismo brazo. Sin esto, alguien
# vería la pantalla del control y la del test alternándose entre recargas.
ident = str(uuid.uuid4())
uno = BRAZOS[hash_fnv1a(f"{EXPERIMENTO}:{ident}") % len(BRAZOS)]
check(all(BRAZOS[hash_fnv1a(f"{EXPERIMENTO}:{ident}") % len(BRAZOS)] == uno for _ in range(50)),
      "y el mismo dispositivo cae siempre en el mismo brazo")

# El nombre del experimento entra al hash, así que el próximo experimento
# re-sortea a todo el mundo en vez de heredar los brazos de este. Sin eso, quien
# estuvo en el control de la puerta estaría en el control de TODOS los
# experimentos que vengan, y los efectos se confundirían entre sí.
distintos = sum(
    1 for _ in range(2000)
    if (lambda i: BRAZOS[hash_fnv1a(f"{EXPERIMENTO}:{i}") % 2]
        != BRAZOS[hash_fnv1a(f"otro-experimento:{i}") % 2])(str(uuid.uuid4()))
)
check(0.4 < distintos / 2000 < 0.6,
      "y dos experimentos distintos no heredan el mismo reparto",
      f"({100 * distintos / 2000:.1f}% cambia de brazo)")

print("\n%d fallos" % len(FAILURES) if FAILURES else "\ntodo ok")
sys.exit(1 if FAILURES else 0)
