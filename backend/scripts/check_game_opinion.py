"""Verifica la encuesta de dificultad del juego: la fórmula y el endpoint.

Lo que cubre, y por qué cada cosa:

  - **el voto no puede inventar el signo**. Es el testigo del abuso: quien dice
    «muy fácil» sin estarle ganando al motor no se mueve. Si esto se cae, un
    toque compra un color del ranking;
  - **la banda muerta filtra en vez de amplificar**. Hubo un piso sobre la
    salida antes que la banda muerta, y con él quien acertaba 17 de 20 con
    p̂=0,85 —sorpresa exactamente cero— se llevaba 0,15 de θ por el residuo de
    punto flotante de la suma;
  - **el tope acota**, y la fórmula es simétrica;
  - **la ventana descarta segundos intentos y derivadas miradas con la tabla**,
    que es la misma restricción que ya se aplica en la calibración del panel;
  - **el servidor repite el gate** y no le cree al cliente;
  - **los tres votos son los del canal A del clásico**, comparados contra la
    constante de allá y no contra una copia;
  - **`n_updates` no se toca**: un voto no es una respuesta.

Uso:
    python backend/scripts/check_game_opinion.py

Sale con código 1 si algo falla.
"""

import os
import sys
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BACKEND = Path(__file__).resolve().parent.parent
os.environ["DATABASE_URL"] = "sqlite:///" + str(
    Path(tempfile.mkdtemp()) / "game_opinion.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base, GameAttempt, GameDifficultyVote, GameExercise, GamePlayer,
)

Base.metadata.create_all(bind=database.engine)

from fastapi.testclient import TestClient  # noqa: E402
from game import elo  # noqa: E402
from game import opinion  # noqa: E402
import main  # noqa: E402

db = database.SessionLocal()
FAILURES: list[str] = []


def check(condition: bool, label: str) -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label}")
    if not condition:
        FAILURES.append(label)


def tanda(n: int, p: float, aciertos: int) -> list[tuple[float, bool]]:
    return [(p, i < aciertos) for i in range(n)]


API = "/game/derivemos"
client = TestClient(main.app, raise_server_exceptions=True)


# ── 1 · El voto no puede inventar el signo ───────────────────────────────────
print("1. el voto elige el signo, la evidencia elige el tamaño")

# Va 12 de 20 sobre p̂=0,85: le está yendo PEOR que lo prometido.
va_mal = tanda(20, 0.85, 12)
check(opinion.ajuste_de_theta("muy_facil", va_mal).delta == 0.0,
      "quien va 12 de 20 y dice «muy fácil» no se mueve")
check(opinion.ajuste_de_theta("muy_dificil", va_mal).delta < 0,
      "y diciendo «muy difícil» sí baja")

va_bien = tanda(20, 0.85, 20)
check(opinion.ajuste_de_theta("muy_facil", va_bien).delta > 0,
      "quien va 20 de 20 y dice «muy fácil» sube")
check(opinion.ajuste_de_theta("muy_dificil", va_bien).delta == 0.0,
      "y diciendo «muy difícil» no baja")

check(opinion.ajuste_de_theta("justo", va_bien).delta == 0.0,
      "«justo» nunca mueve nada, por bien que venga")
check(opinion.ajuste_de_theta("justo", va_mal).delta == 0.0,
      "ni por mal que venga")


# ── 2 · La banda muerta filtra el ruido, no lo amplifica ─────────────────────
print("2. la banda muerta")

# 17 aciertos sobre 20 con p̂=0,85 es EXACTAMENTE lo prometido: 20 × 0,85 = 17.
# La suma en punto flotante no da cero pelado, y ese residuo no puede convertirse
# en un ajuste. Con un piso sobre la salida se llevaba AJUSTE_MINIMO entero.
justo_lo_prometido = tanda(20, 0.85, 17)
a = opinion.ajuste_de_theta("muy_facil", justo_lo_prometido)
check(a.delta == 0.0,
      f"acertar exactamente lo prometido no mueve nada (dio {a.delta:+.6f}, "
      f"sorpresa {a.sorpresa:+.2e})")
check(abs(a.sorpresa) < 1e-9,
      "y es porque la sorpresa vale cero, no porque la fórmula lo esquive")

# 19 de 20 con p̂=0,94: acertó UNA más de las 18,8 esperadas. Es sorpresa
# positiva, pero del tamaño del ruido.
apenas = opinion.ajuste_de_theta("muy_facil", tanda(20, 0.94, 19))
check(apenas.delta == 0.0,
      f"una sorpresa más chica que la banda muerta tampoco (dio {apenas.delta:+.3f})")
check(apenas.sorpresa > 0,
      "aunque la sorpresa sea positiva")

# Todo ajuste que SÍ sale es de al menos la banda muerta: no hay ajustes
# minúsculos, o se mueve algo que se note o no se mueve nada.
sale = [opinion.ajuste_de_theta("muy_facil", tanda(20, 0.85, k)).delta
        for k in range(18, 21)]
check(all(d == 0.0 or d >= opinion.AJUSTE_MINIMO for d in sale),
      f"ningún ajuste sale entre cero y la banda muerta ({sale})")


# ── 3 · El tope y la simetría ────────────────────────────────────────────────
print("3. el tope acota y la fórmula es simétrica")

extremos = [
    opinion.ajuste_de_theta("muy_facil", tanda(20, 0.5, 20)).delta,
    opinion.ajuste_de_theta("muy_dificil", tanda(20, 0.5, 0)).delta,
]
check(max(abs(d) for d in extremos) <= opinion.TOPE + 1e-9,
      f"ni el caso más extremo pasa el tope ({extremos})")
check(extremos[0] == -extremos[1],
      f"y los dos lados dan lo mismo con el signo dado vuelta ({extremos})")

# Un voto puede hacer subir de nivel, y eso es deliberado: si el registro dice
# que la persona está subvaluada, el color va con ella. Lo que NO puede es
# saltear un nivel entero, y eso se comprueba contra los cortes de verdad y no
# contra un número copiado. Hoy el tope (0,60) es exactamente el ancho de la
# banda más angosta (1,6→2,2), o sea que desde el piso de un nivel se llega
# justo al piso del siguiente y ni un paso más.
_bandas = [b - a for a, b in zip(elo._LEVEL_CUTS, elo._LEVEL_CUTS[1:])]
check(opinion.TOPE <= min(_bandas),
      f"el tope ({opinion.TOPE}) no supera la banda de nivel más angosta "
      f"({min(_bandas):.2f}), así que un voto no puede saltear un nivel")
_peor = max(
    elo.level_of(t + opinion.TOPE) - elo.level_of(t)
    for t in [c - 1e-9 for c in elo._LEVEL_CUTS] + [c for c in elo._LEVEL_CUTS]
    + [0.0, 1.0, 2.0, 3.0]
)
check(_peor <= 1, f"y arrancando desde cualquier borde sube a lo sumo un nivel (dio {_peor})")
# Acá vivía `check(opinion.VENTANA < 30, ...)`, con el 30 —la cadencia de la
# encuesta— clavado a mano. Era el único guardián de «dos votos seguidos no se
# calculan sobre las mismas respuestas», y era un guardián de mentira: comparaba
# dos constantes y nunca tocaba la consulta que arma la ventana. El día que la
# cadencia pasó a ser una escalera que arranca en 10, la comparación seguía dando
# verde y el invariante ya estaba roto.
#
# Ahora eso lo prueba la sección 8, contra el endpoint y la base.


# ── 4 · Los tres votos son los del clásico ───────────────────────────────────
print("4. el vocabulario es el mismo que el del canal A de Intervalo")

from metrics.queries import A_ORDER  # noqa: E402

check(list(opinion.VOTOS) == A_ORDER,
      f"los tres valores, en el mismo orden: {opinion.VOTOS} contra {A_ORDER}")


# ── 5 · Poco historial: se guarda el voto y no se mueve nada ─────────────────
print("5. con poco historial el voto se guarda pero no ajusta")

check(opinion.ajuste_de_theta("muy_facil", tanda(opinion.MIN_RESPUESTAS - 1, 0.5, 99)).delta == 0.0,
      f"con {opinion.MIN_RESPUESTAS - 1} respuestas no se ajusta")
check(opinion.ajuste_de_theta("muy_facil", tanda(opinion.MIN_RESPUESTAS, 0.5, 99)).delta > 0,
      f"con {opinion.MIN_RESPUESTAS} sí")


# ── 6 · La ventana: primeros intentos y sin tabla ────────────────────────────
print("6. la ventana descarta segundos intentos y derivadas miradas")

jugador = GamePlayer(alias="ventanita", theta=0.0, n_updates=30,
                     exercises_correct=30, exercises_attempted=40, is_bot=False,
                     guest_token="tok-ventanita")
db.add(jugador)
db.commit()


def sembrar(p_hat: float, correcta: bool, *, peeked=False, intento=1, parse_ok=True):
    ex = GameExercise(
        player_id=jugador.id, template_key="t2_sum", prompt_latex="x",
        expected_derivative="1", theta_at_serve=0.0, beta_at_serve=-1.0,
        p_hat=p_hat, status="answered", peeked=peeked,
    )
    db.add(ex)
    db.commit()
    db.add(GameAttempt(exercise_id=ex.id, player_id=jugador.id,
                       attempt_number=intento, is_correct=correcta,
                       parse_ok=parse_ok))
    db.commit()


# 20 limpias que dan justo lo prometido (no mueven), y 4 sucias que, si
# entraran, inclinarían la balanza para arriba.
for i in range(20):
    sembrar(0.85, i < 17)
for _ in range(4):
    sembrar(0.10, True, peeked=True)       # copiada de la tabla
    sembrar(0.10, True, intento=2)          # acertada al segundo intento
    sembrar(0.10, True, parse_ok=False)     # ni siquiera parseó

r = client.post(f"{API}/opinion", json={"accion": "answer", "voto": "muy_facil"},
                headers={"X-Game-Token": "tok-ventanita"})
check(r.status_code == 200, f"el endpoint responde 200 (dio {r.status_code})")
check(r.json()["delta_theta"] == 0.0,
      f"las sucias no entran: sigue sin moverse (dio {r.json()['delta_theta']})")
fila = db.query(GameDifficultyVote).filter_by(player_id=jugador.id).one()
check(fila.ventana == opinion.VENTANA,
      f"la ventana tiene {opinion.VENTANA} respuestas limpias (dio {fila.ventana})")
check(fila.aciertos == 17, f"y 17 aciertos (dio {fila.aciertos})")
check(abs((fila.p_hat_medio or 0) - 0.85) < 1e-9,
      f"con p̂ medio 0,85 (dio {fila.p_hat_medio})")
check(fila.voto == "muy_facil" and fila.answered_at is not None,
      "el voto quedó guardado aunque no haya movido nada")


# ── 7 · El endpoint en dos pasos ─────────────────────────────────────────────
print("7. impresión y respuesta son dos pasos")

otro = GamePlayer(alias="dospasos", theta=0.0, n_updates=30,
                  exercises_correct=30, exercises_attempted=30, is_bot=False,
                  guest_token="tok-dospasos")
db.add(otro)
db.commit()
jugador = otro
for i in range(20):
    sembrar(0.85, True)       # 20 de 20: esto sí mueve

client.post(f"{API}/opinion", json={"accion": "impression"},
            headers={"X-Game-Token": "tok-dospasos"})
pendiente = db.query(GameDifficultyVote).filter_by(player_id=otro.id).one()
check(pendiente.answered_at is None and pendiente.voto is None,
      "la impresión deja la fila abierta: mostrada y sin contestar")

theta_antes, updates_antes = otro.theta, otro.n_updates
r = client.post(f"{API}/opinion", json={"accion": "answer", "voto": "muy_facil"},
                headers={"X-Game-Token": "tok-dospasos"})
j = r.json()
db.refresh(otro)
check(db.query(GameDifficultyVote).filter_by(player_id=otro.id).count() == 1,
      "la respuesta completa la fila abierta en vez de crear otra")
check(j["delta_theta"] > 0, f"y esta vez sí ajusta (dio {j['delta_theta']:+.3f})")
check(abs(otro.theta - (theta_antes + j["delta_theta"])) < 1e-9,
      f"θ se movió exactamente eso ({theta_antes:.3f} → {otro.theta:.3f})")
check(otro.n_updates == updates_antes,
      f"y n_updates no se tocó: un voto no es una respuesta (dio {otro.n_updates})")
check(j["level_before"] == elo.level_of(theta_antes)
      and j["level_after"] == elo.level_of(otro.theta),
      "los dos niveles que viajan son los de antes y después de verdad")

r_raro = client.post(f"{API}/opinion", json={"accion": "answer", "voto": "barbaro"},
                     headers={"X-Game-Token": "tok-dospasos"})
check(r_raro.status_code == 200 and r_raro.json()["delta_theta"] == 0.0,
      "un voto desconocido no rompe nada ni mueve nada")


# ── 8 · El corte: nadie cobra dos veces la misma sorpresa ────────────────────
print("8. la ventana arranca en el último voto que cobró")

# Esta sección es la que reemplaza al `VENTANA < 30` de la 3, y la diferencia es
# que prueba el comportamiento en vez de comparar dos números. `tok-dospasos`
# acaba de votar «muy fácil» sobre 20 de 20 y se llevó un ajuste.
primer_delta = j["delta_theta"]
# El endpoint escribe desde SU sesión y esta es otra: la fila que la sección 7 ya
# había leído sigue en el identity map de acá con los valores de antes del voto.
# Sin esto, `corte_ejercicio_id` se lee como None y el chequeo falla por un
# detalle de la herramienta y no por el código.
db.expire_all()
cobrado = db.query(GameDifficultyVote).filter(
    GameDifficultyVote.player_id == otro.id,
    GameDifficultyVote.delta_theta != 0,
).one()
check(cobrado.corte_ejercicio_id is not None,
      "el voto que cobró dejó anotado hasta dónde llegó")

# Votar otra vez sin haber resuelto nada: la ventana queda vacía y no hay nada
# que cobrar. Antes del corte, este voto volvía a cobrar las mismas 20.
theta_antes_2 = otro.theta
r2 = client.post(f"{API}/opinion", json={"accion": "answer", "voto": "muy_facil"},
                 headers={"X-Game-Token": "tok-dospasos"})
db.refresh(otro)
check(r2.json()["delta_theta"] == 0.0,
      f"votar de nuevo sin resolver nada no mueve nada (dio {r2.json()['delta_theta']})")
check(abs(otro.theta - theta_antes_2) < 1e-9, "así que θ quedó donde estaba")
vacia = db.query(GameDifficultyVote).filter_by(player_id=otro.id).order_by(
    GameDifficultyVote.id.desc()).first()
check(vacia.ventana == 0 and vacia.voto == "muy_facil",
      f"y el voto se guardó igual, con ventana en cero (dio {vacia.ventana})")

# Y con respuestas nuevas, solo entran LAS NUEVAS. Diez y no veinte, que es el
# hueco más corto de la escalera del front (OPINION_CADENCIAS[0]).
for _ in range(10):
    sembrar(0.85, True)
r3 = client.post(f"{API}/opinion", json={"accion": "answer", "voto": "muy_facil"},
                 headers={"X-Game-Token": "tok-dospasos"})
tercero = db.query(GameDifficultyVote).filter_by(player_id=otro.id).order_by(
    GameDifficultyVote.id.desc()).first()
check(tercero.ventana == 10,
      f"con 10 respuestas nuevas la ventana tiene 10 y no {opinion.VENTANA} "
      f"(dio {tercero.ventana})")
check(tercero.aciertos == 10, f"y las 10 son las nuevas (dio {tercero.aciertos})")
segundo_delta = r3.json()["delta_theta"]
check(segundo_delta > 0, f"un voto respaldado sigue moviendo (dio {segundo_delta:+.3f})")
# El encogimiento por I0_PRIOR es lo que hace que media ventana compre menos de
# medio ajuste, sin ninguna constante nueva. Es el argumento que justifica que la
# cadencia pueda bajar a 10 sin tocar el TOPE.
check(segundo_delta < primer_delta,
      f"pero menos que con la ventana entera ({segundo_delta:+.3f} contra "
      f"{primer_delta:+.3f})")

# Un voto que NO cobra no corre el corte: sus respuestas siguen disponibles. Si
# lo corriera, «justo» se convertiría en una forma de tirar evidencia a la basura.
antes_del_justo = cobrado.corte_ejercicio_id
corte_del_tercero = tercero.corte_ejercicio_id
client.post(f"{API}/opinion", json={"accion": "answer", "voto": "justo"},
            headers={"X-Game-Token": "tok-dospasos"})
justo = db.query(GameDifficultyVote).filter_by(player_id=otro.id).order_by(
    GameDifficultyVote.id.desc()).first()
check(justo.voto == "justo" and justo.delta_theta == 0.0, "«justo» no mueve nada")
check(justo.corte_ejercicio_id is None,
      "y no corre el corte, así que sus respuestas quedan para el voto siguiente")
check(corte_del_tercero is not None and corte_del_tercero > antes_del_justo,
      "el corte avanzó solo con los votos que cobraron")


print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
