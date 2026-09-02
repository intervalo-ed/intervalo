"""Verifica el orden del ranking individual: por XP y por Elo.

El selector de la cabecera (web/src/app/derivadas/desktop-layout.tsx) ordena la
lista de personas por experiencia o por Elo. Lo que hay que tener comprobado no
es que la lista salga ordenada —eso se ve mirándola— sino las dos cosas que NO
se ven jugando:

· Que `_rank_of_elo` diga exactamente lo mismo que `_ORDEN_ELO`. Son dos
  implementaciones del mismo orden: una cuenta cuántos van delante y la otra
  ordena. Si se separan, la ventana `around_me` se centra en una fila que no es
  la propia, y el síntoma es "a veces mi fila aparece corrida", que nadie
  reporta como bug.
· Que los provisorios queden al fondo. Con menos de elo.RAMP_UPDATES respuestas
  el theta es ruido, y sin el corte una racha de suerte encabeza la tabla del
  juego entero. Es un dato que solo aparece con jugadores nuevos, o sea justo
  cuando el link se está compartiendo.

Y de paso, que el orden por Elo no cambie QUIÉNES entran: cambiar de columna
mueve a la gente de puesto, no la saca del ranking.

Uso:
    python backend/scripts/check_game_ranking_sort.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_sort.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

from fastapi.testclient import TestClient  # noqa: E402

import database  # noqa: E402
from game import elo  # noqa: E402
from game import router as game_router  # noqa: E402
from models import Base, GamePlayer  # noqa: E402

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402

client = TestClient(main.app, raise_server_exceptions=True)
FALLOS: list[str] = []


def check(cond: bool, label: str) -> None:
    print(f"  [{'ok' if cond else 'FAIL'}] {label}")
    if not cond:
        FALLOS.append(label)


# El jugador desde el que se mira: es el que fija la ventana `around_me` y el
# único que puede aparecer con xp == 0.
r = client.post("/game/derivemos/player", json={})
YO = {"X-Game-Token": r.json()["guest_token"]}

db = database.SessionLocal()
yo = db.query(GamePlayer).order_by(GamePlayer.id.desc()).first()

# Una población a propósito ADVERSA para el orden: la XP y el theta van al
# revés uno del otro, así ordenar por Elo no puede dar por casualidad la misma
# lista que ordenar por XP. Y un tercio son provisorios con theta ALTÍSIMO, que
# es el caso que el corte de la rampa existe para atajar.
for i in range(30):
    provisorio = i % 3 == 0
    db.add(
        GamePlayer(
            alias=f"p{i:02d}",
            xp=1000 - i * 7,
            theta=(3.0 if provisorio else (i - 15) * 0.11),
            n_updates=(elo.RAMP_UPDATES - 1) if provisorio else (elo.RAMP_UPDATES + i),
            university="UBA" if i % 2 else "UTN",
            exercises_correct=i,
        )
    )
# El jugador propio, en el medio de la tabla y ya calificado.
yo.xp = 900
yo.theta = 0.4
yo.n_updates = elo.RAMP_UPDATES + 3
# Y con derivadas resueltas, que es lo que decide quién entra al ranking (ver
# game/router.py :: RESOLVIO_ACA). Sin esto el fixture describía a alguien
# imposible de otra manera —900 de XP sin haber resuelto nada— y ese jugador
# entraba a la lista solo por la excepción "el propio se ve siempre", que
# `_rank_of_elo` no comparte a propósito: cuenta quiénes van delante entre los
# que compiten. La comparación fila por fila de abajo mezclaba las dos reglas y
# marcaba desalineadas a las filas que van después de la propia.
yo.exercises_correct = 12
db.commit()


def pedir(**q):
    r = client.get("/game/derivemos/leaderboard", params=q, headers=YO)
    assert r.status_code == 200, r.text
    return r.json()


print("\n1. el orden por XP no se movió")
xp = pedir(limit=200)
check(
    [e["xp"] for e in xp["entries"]] == sorted((e["xp"] for e in xp["entries"]), reverse=True),
    "por XP sale de mayor a menor",
)
check(
    [e["rank"] for e in xp["entries"]] == list(range(1, len(xp["entries"]) + 1)),
    "y los puestos son 1..n",
)

print("\n2. el orden por Elo")
el = pedir(limit=200, sort="elo")
check(len(el["entries"]) == len(xp["entries"]), "entra exactamente la misma gente")
check(
    {e["player_id"] for e in el["entries"]} == {e["player_id"] for e in xp["entries"]},
    "y son las mismas personas, no la misma cantidad",
)
check(
    [e["player_id"] for e in el["entries"]] != [e["player_id"] for e in xp["entries"]],
    "pero en otro orden (si no, el test no está probando nada)",
)
calificados = [e for e in el["entries"] if e["elo_ranked"]]
provisorios = [e for e in el["entries"] if not e["elo_ranked"]]
check(len(calificados) > 0 and len(provisorios) > 0, "la muestra tiene de los dos")
check(
    [e["elo_ranked"] for e in el["entries"]] == [True] * len(calificados) + [False] * len(provisorios),
    "los provisorios van todos al fondo, ninguno mezclado",
)
check(
    [e["elo"] for e in calificados] == sorted((e["elo"] for e in calificados), reverse=True),
    "y entre los calificados manda el Elo, de mayor a menor",
)
check(
    all(e["elo"] == elo.rating_of(0.0) or e["elo"] > 0 for e in el["entries"]),
    "cada fila trae su Elo",
)
check(
    max(e["elo"] for e in provisorios) > max(e["elo"] for e in calificados),
    "el provisorio de theta más alto tiene MÁS Elo que el primero y aun así va al fondo",
)

print("\n3. sin flecha en el orden por Elo")
check(all(e["rank_delta"] == 0 for e in el["entries"]), "rank_delta es 0 en todas las filas")

print("\n4. el puesto propio: contar y ordenar dicen lo mismo")
# Es el chequeo que justifica el script: `_rank_of_elo` cuenta cuántos van
# delante, `_ORDEN_ELO` ordena. Que coincidan es lo que hace que `around_me`
# centre la fila propia y no la de al lado.
for orden in ("xp", "elo"):
    pagina = pedir(limit=200, sort=orden)
    mio = next(e for e in pagina["entries"] if e["is_current_player"])
    puesto_en_la_lista = pagina["entries"].index(mio) + 1
    check(
        mio["rank"] == puesto_en_la_lista == pagina["me"]["rank"],
        f"[{orden}] rank={mio['rank']}, posición={puesto_en_la_lista}, me.rank={pagina['me']['rank']}",
    )

print("\n5. around_me devuelve la ventana centrada en la fila propia")
# Contra la lista ENTERA y no contra "quedó más o menos en el medio": la
# ventana se recorta sola cuando la fila propia está cerca de una punta, así
# que el invariante de verdad es que sea exactamente esta rebanada.
W = game_router.AROUND_WINDOW
for orden in ("xp", "elo"):
    completa = [e["player_id"] for e in pedir(limit=200, sort=orden)["entries"]]
    i = completa.index(yo.id)
    ventana = [e["player_id"] for e in pedir(around_me=True, sort=orden)["entries"]]
    check(
        ventana == completa[max(0, i - W) : i + W + 1],
        f"[{orden}] la ventana es la rebanada de {W} arriba y {W} abajo de la propia",
    )

print("\n6. el scope se respeta con los dos órdenes")
for orden in ("xp", "elo"):
    uba = pedir(limit=200, sort=orden, university="UBA")
    check(
        all(e["university"] in ("UBA", None) for e in uba["entries"]),
        f"[{orden}] filtrado por UBA no trae de otra universidad",
    )
    check(
        uba["total_count"] < xp["total_count"],
        f"[{orden}] y el total es el del scope, no el de todos",
    )

print("\n7. un sort inventado se rechaza")
r = client.get("/game/derivemos/leaderboard", params={"sort": "xp; drop table"}, headers=YO)
check(r.status_code == 422, f"?sort=basura devuelve 422 (dio {r.status_code})")

print("\n8. las dos implementaciones del orden por Elo, fila por fila")
# No solo la propia: se recorre TODA la tabla preguntándole a `_rank_of_elo` el
# puesto de cada uno y comparándolo con dónde lo puso el `order_by`.
desalineados = [
    e["alias"]
    for e in el["entries"]
    if game_router._rank_of_elo(db, db.get(GamePlayer, e["player_id"])) != e["rank"]
]
check(not desalineados, f"ninguna fila desalineada (desalineadas: {desalineados[:5]})")

print("\n9. quien tiene XP pero no resolvió nada NO entra al ranking")
# El caso no es hipotético: `referrals.acreditar` le suma XP al reclutador con
# un UPDATE crudo, así que se puede llegar a XP alta sin haber derivado nunca —
# y con los reclutas cruzando de producto, alguien que solo estudia en Intervalo
# clásico le paga XP de juego a quien lo trajo.
p05 = db.query(GamePlayer).filter_by(alias="p05").first()
puesto_antes = game_router._rank_of(db, p05)
total_antes = pedir(limit=1)["total_count"]

db.add(GamePlayer(alias="soloreclutas", xp=5000, theta=0.5,
                  n_updates=elo.RAMP_UPDATES + 5, university="UBA",
                  exercises_correct=0))
db.commit()

for orden in ("xp", "elo"):
    tabla = pedir(limit=200, sort=orden)
    check(
        "soloreclutas" not in [e["alias"] for e in tabla["entries"]],
        f"[{orden}] con 5000 de XP y cero resueltas sigue fuera de la tabla",
    )
# Y lo que importa de verdad: no le corre el puesto a nadie. Con la XP más alta
# de la tabla, si entrara empujaría a todos un lugar para abajo.
check(
    game_router._rank_of(db, p05) == puesto_antes,
    f"y no le corre el puesto a nadie (p05 sigue {puesto_antes})",
)
check(
    pedir(limit=1)["total_count"] == total_antes,
    "ni infla el total que se muestra arriba de la tabla",
)

db.close()

print()
if FALLOS:
    print(f"{len(FALLOS)} fallo(s):")
    for f in FALLOS:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
