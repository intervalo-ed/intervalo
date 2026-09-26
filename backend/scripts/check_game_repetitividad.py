"""Verifica la encuesta de repetitividad del juego: los contadores y el endpoint.

Es la segunda pregunta del juego («¿te están saliendo repetidas?») y la única
que no mueve nada, así que lo que hay que cuidar acá es otra cosa que en su
hermana: no que el ajuste sea justo, sino que **el dato objetivo diga la verdad**.
Sin eso, el voto no se distingue de una segunda opinión sobre la dificultad, que
es exactamente el problema que esta pregunta viene a resolver.

Lo que cubre, y por qué cada cosa:

  - **los dos contadores miden cosas distintas**. `plantillas_distintas` responde
    «¿cuántas reglas?» y `enunciados_distintos` «¿cuántas derivadas literales?».
    El bug del 10/09 era del segundo tipo —ocho plantillas que eran siempre el
    mismo enunciado— así que si los dos dieran siempre lo mismo, el que sobra
    estaría tapando justo el caso que originó todo;
  - **la ventana cuenta TODO lo servido**, salteados y mirados con la tabla
    incluidos. Es al revés que la de dificultad y es a propósito: lo que se mide
    es lo que la persona VIO. Un filtro copiado de `_tanda_reciente` rompería
    esto sin que nada más se notara;
  - **con poco historial los contadores no se guardan**. «Vio 5 plantillas
    distintas» no dice si el juego es variado o si recién empezó;
  - **el voto no mueve θ**. Si algún día lo mueve, que sea una decisión y no un
    copy-paste del endpoint de al lado;
  - **el protocolo de dos pasos**, que es lo que permite medir cuánta gente la
    ignora;
  - **los tres valores son los de `repetitividad.VOTOS`**, comparados contra la
    constante y no contra una copia.

Uso:
    python backend/scripts/check_game_repetitividad.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_repetitividad.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base, GameAttempt, GameExercise, GamePlayer, GameRepetitionVote,
)

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import repetitividad  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


API = "/game/derivemos"
client = TestClient(main.app, raise_server_exceptions=True)


# ── 1 · Los dos contadores no son el mismo número ────────────────────────────
print("1. plantillas y enunciados se cuentan aparte")

# Tres plantillas, pero una de ellas aparece siempre con el MISMO enunciado. Es
# la forma exacta del bug del 10/09: `sen(x)/x` se sirvió 626 veces y era
# literalmente la misma expresión todas las veces.
mezcla = (
    [("t5_sin_over_x", "\\frac{\\sin x}{x}")] * 6
    + [("t6_sin_lineal", f"\\sin({k}x+1)") for k in range(1, 4)]
    + [("t1_pow", f"x^{{{k}}}") for k in range(2, 4)]
)
r = repetitividad.resumen(mezcla)
check(r.ventana == 11, f"la ventana cuenta los 11 vistos (dio {r.ventana})")
check(r.plantillas_distintas == 3,
      f"tres plantillas distintas (dio {r.plantillas_distintas})")
check(r.enunciados_distintos == 6,
      f"pero seis enunciados distintos (dio {r.enunciados_distintos})")
check(r.plantillas_distintas != r.enunciados_distintos,
      "los dos números no son el mismo, que es todo el motivo de guardar dos")

# El caso degenerado: la misma derivada una y otra vez.
uno = repetitividad.resumen([("t5_sin_over_x", "\\frac{\\sin x}{x}")] * 30)
check(uno.plantillas_distintas == 1 and uno.enunciados_distintos == 1,
      "treinta veces la misma da 1 y 1")

# Y el recorte a la ventana, que tiene que pasar dentro de la función y no solo
# en la query: si no, un script que le pase el historial entero mediría otra cosa
# que producción.
largo = repetitividad.resumen(
    [(f"t{i}", f"e{i}") for i in range(repetitividad.VENTANA * 3)]
)
check(largo.ventana == repetitividad.VENTANA,
      f"una lista más larga se recorta a {repetitividad.VENTANA} (dio {largo.ventana})")


# ── 2 · El mínimo de vistos ──────────────────────────────────────────────────
print("2. con poco historial los contadores no dicen nada")

poco = repetitividad.resumen([(f"t{i}", f"e{i}") for i in range(repetitividad.MIN_VISTOS - 1)])
check(not poco.suficiente,
      f"con {repetitividad.MIN_VISTOS - 1} vistos no alcanza")
justo_alcanza = repetitividad.resumen(
    [(f"t{i}", f"e{i}") for i in range(repetitividad.MIN_VISTOS)]
)
check(justo_alcanza.suficiente, f"con {repetitividad.MIN_VISTOS} sí")
check(repetitividad.MIN_VISTOS <= repetitividad.VENTANA,
      "y el mínimo no puede ser más grande que la ventana, o nunca alcanzaría")


# ── 3 · El vocabulario ───────────────────────────────────────────────────────
print("3. los tres valores")

check(repetitividad.VOTOS == ("variado", "justo", "repetitivo"),
      f"son los tres esperados, en orden ({repetitividad.VOTOS})")
# `justo` tiene que ser la misma palabra que en las otras dos encuestas: los tres
# canales se cruzan sin tabla de traducción en el medio. Se compara contra la
# constante de allá y no contra el literal.
from game import opinion  # noqa: E402

check(repetitividad.JUSTO == opinion.JUSTO,
      f"y el del medio es la misma palabra que en dificultad ({repetitividad.JUSTO})")


# ── 4 · La ventana cuenta lo que la persona VIO ──────────────────────────────
print("4. la ventana no filtra salteados ni mirados con la tabla")

jugador = GamePlayer(alias="repetido", theta=0.0, n_updates=40,
                     exercises_correct=40, exercises_attempted=50, is_bot=False,
                     guest_token="tok-repetido")
db.add(jugador)
db.commit()


def sembrar(clave: str, enunciado: str, *, status="answered", peeked=False,
            responder=True, intento=1):
    ex = GameExercise(
        player_id=jugador.id, template_key=clave, prompt_latex=enunciado,
        expected_derivative="1", theta_at_serve=0.0, beta_at_serve=-1.0,
        p_hat=0.85, status=status, peeked=peeked,
    )
    db.add(ex)
    db.commit()
    if responder:
        db.add(GameAttempt(exercise_id=ex.id, player_id=jugador.id,
                           attempt_number=intento, is_correct=True, parse_ok=True))
        db.commit()


# Diez limpias de plantillas distintas, más cinco que la ventana de dificultad
# descartaría: una salteada (sin intento), dos miradas con la tabla y dos al
# segundo intento. Acá las cinco CUENTAN, y son de una plantilla que no aparece
# entre las diez limpias — así que si el filtro se colara, el contador bajaría.
for i in range(10):
    sembrar(f"t_limpia_{i}", f"x^{{{i}}}")
sembrar("t_sucia", "\\tan x", status="skipped", responder=False)
sembrar("t_sucia", "\\tan(2x)", peeked=True)
sembrar("t_sucia", "\\tan(3x)", peeked=True)
sembrar("t_sucia", "\\tan(4x)", intento=2)
sembrar("t_sucia", "\\tan(5x)", intento=2)

r = client.post(f"{API}/repetitividad",
                json={"accion": "answer", "voto": "repetitivo"},
                headers={"X-Game-Token": "tok-repetido"})
check(r.status_code == 200, f"el endpoint responde 200 (dio {r.status_code})")
check(r.json()["guardado"] is True, "y dice que guardó")
fila = db.query(GameRepetitionVote).filter_by(player_id=jugador.id).one()
check(fila.ventana == 15,
      f"la ventana tiene los 15 servidos, sucios incluidos (dio {fila.ventana})")
check(fila.plantillas_distintas == 11,
      f"once plantillas: las diez limpias más la sucia (dio {fila.plantillas_distintas})")
check(fila.enunciados_distintos == 15,
      f"y quince enunciados, todos distintos (dio {fila.enunciados_distintos})")
check(fila.voto == "repetitivo" and fila.answered_at is not None,
      "el voto quedó guardado")


# ── 5 · El voto no mueve θ ───────────────────────────────────────────────────
print("5. el voto se guarda y no ajusta nada")

db.refresh(jugador)
check(jugador.theta == 0.0,
      f"θ sigue en cero después de votar «repetitivo» (dio {jugador.theta})")
check(jugador.n_updates == 40,
      f"y n_updates tampoco se tocó (dio {jugador.n_updates})")
# El contrato no devuelve ningún número, y eso es parte de la decisión: si algún
# día este voto mueve algo, el schema tiene que crecer y el front enterarse.
check(set(r.json().keys()) == {"guardado"},
      f"la respuesta es un booleano y nada más ({sorted(r.json().keys())})")


# ── 6 · Dos pasos, y poco historial ──────────────────────────────────────────
print("6. impresión y respuesta son dos pasos")

nuevo = GamePlayer(alias="recienllega", theta=0.0, n_updates=4,
                   exercises_correct=4, exercises_attempted=4, is_bot=False,
                   guest_token="tok-recien")
db.add(nuevo)
db.commit()
jugador = nuevo
for i in range(4):
    sembrar(f"t_nuevo_{i}", f"x^{{{i}}}")

client.post(f"{API}/repetitividad", json={"accion": "impression"},
            headers={"X-Game-Token": "tok-recien"})
pendiente = db.query(GameRepetitionVote).filter_by(player_id=nuevo.id).one()
check(pendiente.answered_at is None and pendiente.voto is None,
      "la impresión deja la fila abierta: mostrada y sin contestar")

client.post(f"{API}/repetitividad", json={"accion": "answer", "voto": "variado"},
            headers={"X-Game-Token": "tok-recien"})
db.expire_all()
check(db.query(GameRepetitionVote).filter_by(player_id=nuevo.id).count() == 1,
      "la respuesta completa la fila abierta en vez de crear otra")
fila = db.query(GameRepetitionVote).filter_by(player_id=nuevo.id).one()
check(fila.voto == "variado" and fila.answered_at is not None, "y quedó contestada")
check(fila.ventana == 4, f"la ventana dice cuántos vio de verdad (dio {fila.ventana})")
check(fila.plantillas_distintas == 0 and fila.enunciados_distintos == 0,
      f"pero con menos de {repetitividad.MIN_VISTOS} vistos los contadores quedan "
      f"en cero (dio {fila.plantillas_distintas} y {fila.enunciados_distintos})")

r_raro = client.post(f"{API}/repetitividad",
                     json={"accion": "answer", "voto": "barbaro"},
                     headers={"X-Game-Token": "tok-recien"})
check(r_raro.status_code == 200 and r_raro.json()["guardado"] is False,
      "un voto desconocido no rompe nada y avisa que no guardó")
r_mala = client.post(f"{API}/repetitividad", json={"accion": "inventada"},
                     headers={"X-Game-Token": "tok-recien"})
check(r_mala.status_code == 422, f"una acción desconocida sí es 422 (dio {r_mala.status_code})")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
