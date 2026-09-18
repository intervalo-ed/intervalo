"""Verifica el número que se le devuelve a quien invitó un cafecito.

La diapo del cafecito dejó de pedirle plata a quien ya donó y pasó a contarle
cuánta XP extra lleva sumada su universidad desde su donación. Ese número sale de
`game/boosts.py :: efecto_del_empuje` y viaja por `GET /cafecito-status`.

Lo que se fija acá es todo de la clase que no se ve mirando la pantalla:

  - que sume los DOS productos. Hasta que `game_attempts.xp_from_boost` existió,
    la cuenta leía solo `answers`, así que a quien donaba JUGANDO le contaba todo
    menos lo que pasaba en el juego;
  - que `estudiantes` cuente PERSONAS y no filas. La misma persona tiene fila en
    los dos lados, y sumar dos COUNT(DISTINCT) daría de más justo con la gente
    más comprometida;
  - que el estado tenga las dos vidas que tiene que tener: «todavía no llegó»
    caduca a las 6 h, «esto es lo que hizo» aguanta 48;
  - y que un empuje vivo sin nadie jugando devuelva CERO y no un número
    inventado. La pantalla no puede mostrar ese cero, pero el servidor tiene que
    decir la verdad.

Uso:
    python backend/scripts/check_game_cafecito_impacto.py

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
    Path(tempfile.mkdtemp()) / "cafecito_impacto.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Answer,
    Base,
    Enrollment,
    GameAttempt,
    GameBoost,
    GameBoostIntent,
    GamePlayer,
    User,
)
from game import boosts  # noqa: E402

Base.metadata.create_all(bind=database.engine)

FAILURES: list[str] = []
AHORA = datetime(2026, 9, 14, 18, 0, 0)


def check(condition: bool, label: str, detalle: str = "") -> None:
    print(f"  [{'ok' if condition else 'FAIL'}] {label} {detalle}".rstrip())
    if not condition:
        FAILURES.append(label)


def limpiar() -> None:
    db = database.SessionLocal()
    for modelo in (Answer, Enrollment, GameAttempt, GameBoostIntent, GameBoost, GamePlayer, User):
        db.query(modelo).delete()
    db.commit()
    db.close()


def usuario(db, email: str, university: str | None) -> User:
    u = User(email=email, clerk_user_id=email, name=email.split("@")[0])
    db.add(u)
    db.flush()
    if university:
        # `course_id` es un número cualquiera: la cuenta filtra por universidad y
        # no mira el curso, y sqlite no exige las claves foráneas.
        db.add(Enrollment(user_id=u.id, course_id=1, university=university))
    return u


def jugador(db, alias: str, university: str | None, user_id: int | None = None) -> GamePlayer:
    p = GamePlayer(alias=alias, university=university, user_id=user_id)
    db.add(p)
    db.flush()
    return p


def respuesta_clasica(db, user_id: int, cuando: datetime, extra: int) -> None:
    """Una respuesta de Intervalo clásico que cobró empuje.

    `session_id` es un número cualquiera, por lo mismo que `exercise_id` abajo:
    sqlite no exige las claves foráneas y esta cuenta no las mira.
    """
    db.add(
        Answer(
            session_id=1,
            user_id=user_id,
            course_id=1,
            belt="white",
            topic="derivatives",
            exercise_type="RESL",
            is_correct=True,
            answered_at=cuando,
            xp_from_boost=extra,
        )
    )


# Un ejercicio distinto por intento. No es cosmética: `uq_game_attempts_slot` es
# UNIQUE sobre (exercise_id, attempt_number) y rebota el segundo. Inventar un
# ejercicio de verdad no agregaría nada — sqlite no exige las claves foráneas y
# esta cuenta no las mira.
_EJERCICIO = 0


def intento(db, player_id: int, cuando: datetime, extra: int) -> None:
    """Una derivada del juego que cobró empuje."""
    global _EJERCICIO
    _EJERCICIO += 1
    db.add(
        GameAttempt(
            exercise_id=_EJERCICIO,
            player_id=player_id,
            attempt_number=1,
            parse_ok=True,
            is_correct=True,
            xp_awarded=extra * 3,
            xp_from_boost=extra,
            created_at=cuando,
        )
    )


# ── 1. la cuenta suma los dos productos ────────────────────────────────────
print("1. el número sale de los dos productos")
limpiar()
db = database.SessionLocal()
ana = usuario(db, "ana@test", "UBA")
jugador(db, "ana", "UBA", user_id=ana.id)
respuesta_clasica(db, ana.id, AHORA - timedelta(minutes=30), 40)
db.commit()
xp, gente = boosts.efecto_del_empuje(
    db, university="UBA", desde=AHORA - timedelta(hours=2), hasta=AHORA
)
check(xp == 40 and gente == 1, "solo con clásico", f"({xp} XP, {gente})")

p_ana = db.query(GamePlayer).filter(GamePlayer.alias == "ana").first()
intento(db, p_ana.id, AHORA - timedelta(minutes=20), 25)
db.commit()
xp, gente = boosts.efecto_del_empuje(
    db, university="UBA", desde=AHORA - timedelta(hours=2), hasta=AHORA
)
check(xp == 65, "clásico + juego se suman", f"(dio {xp}, esperaba 65)")
check(
    gente == 1,
    "y la misma persona en los dos lados cuenta UNA vez",
    f"(dio {gente})",
)
db.close()

# ── 2. la universidad filtra, y el invitado cuenta ─────────────────────────
print("2. filtra por universidad y no pierde a los invitados")
db = database.SessionLocal()
beto = usuario(db, "beto@test", "UTN")
respuesta_clasica(db, beto.id, AHORA - timedelta(minutes=10), 99)
invitado = jugador(db, "invitado", "UBA", user_id=None)
intento(db, invitado.id, AHORA - timedelta(minutes=5), 30)
db.commit()
xp, gente = boosts.efecto_del_empuje(
    db, university="UBA", desde=AHORA - timedelta(hours=2), hasta=AHORA
)
check(xp == 95, "la UTN no entra en el número de la UBA", f"(dio {xp}, esperaba 95)")
check(gente == 2, "y el invitado sin cuenta cuenta como persona", f"(dio {gente})")

xp_global, gente_global = boosts.efecto_del_empuje(
    db, university=None, desde=AHORA - timedelta(hours=2), hasta=AHORA
)
check(
    xp_global == 194 and gente_global == 3,
    "el empuje global cuenta a todos",
    f"({xp_global} XP, {gente_global})",
)
db.close()

# ── 3. la ventana ──────────────────────────────────────────────────────────
print("3. la ventana corta por los dos lados")
db = database.SessionLocal()
p_ana = db.query(GamePlayer).filter(GamePlayer.alias == "ana").first()
intento(db, p_ana.id, AHORA - timedelta(hours=9), 500)
db.commit()
xp, _ = boosts.efecto_del_empuje(
    db, university="UBA", desde=AHORA - timedelta(hours=2), hasta=AHORA
)
check(xp == 95, "lo de antes de la donación no cuenta", f"(dio {xp}, esperaba 95)")
db.close()

# ── 4. los estados ─────────────────────────────────────────────────────────
print("4. los cuatro estados, con sus dos memorias")


def escenario(*, hace_horas: float, consumida: bool, duracion_h: float, hermanas: int = 1):
    """Deja la base con una donación de hace tanto y devuelve el estado."""
    limpiar()
    db = database.SessionLocal()
    u = usuario(db, "quien@test", "UBA")
    p = jugador(db, "quien", "UBA", user_id=u.id)
    cuando = AHORA - timedelta(hours=hace_horas)
    consumo = cuando + timedelta(minutes=1) if consumida else None
    db.add(GameBoostIntent(player_id=p.id, university="UBA", created_at=cuando, consumed_at=consumo))
    for i in range(hermanas - 1):
        otro = jugador(db, f"otro{i}", "UBA")
        db.add(
            GameBoostIntent(
                player_id=otro.id, university="UBA", created_at=cuando, consumed_at=consumo
            )
        )
    if consumida:
        db.add(
            GameBoost(
                university="UBA",
                cafecitos=3,
                source="cafecito",
                created_at=consumo,
                expires_at=consumo + timedelta(hours=duracion_h),
            )
        )
        # Alguien jugó mientras el empuje corría.
        intento(db, p.id, consumo + timedelta(minutes=5), 70)
    db.commit()
    e = boosts.estado_de_donacion(db, p, AHORA)
    db.close()
    return e


e = escenario(hace_horas=0.2, consumida=False, duracion_h=3)
check(e.state == "pending", "sin consumir y recién, «todavía no llegó»", f"({e.state})")

e = escenario(hace_horas=10, consumida=False, duracion_h=3)
check(
    e.state == "none",
    "sin consumir y hace diez horas, se calla",
    f"({e.state}) — decir «no llegó» a esa altura suena a que algo se rompió",
)

e = escenario(hace_horas=0.2, consumida=True, duracion_h=3, hermanas=2)
check(e.state == "pending", "con dos intenciones a la vez no se afirma nada", f"({e.state})")

e = escenario(hace_horas=1, consumida=True, duracion_h=3)
check(e.state == "credited", "empuje corriendo: acreditado", f"({e.state})")
check(e.xp_extra == 70, "y con su número", f"(dio {e.xp_extra})")
check(e.estudiantes == 1, "y con su gente", f"(dio {e.estudiantes})")
check(e.boost_id is not None, "y con la llave para no repetir el cierre")
check(e.expires_in_seconds > 0, "y con lo que le queda", f"({e.expires_in_seconds}s)")

e = escenario(hace_horas=8, consumida=True, duracion_h=2)
check(e.state == "closed", "vencido y dentro de las 48 h: cierra", f"({e.state})")
check(e.xp_extra == 70, "con el total final", f"(dio {e.xp_extra})")
check(e.expires_in_seconds == 0, "y sin tiempo que prometer")

e = escenario(hace_horas=boosts.MEMORIA_CIERRE_HORAS + 2, consumida=True, duracion_h=2)
check(e.state == "none", "pasadas las 48 h ya no se cuenta", f"({e.state})")

# ── 5. el cero se dice, no se inventa ──────────────────────────────────────
print("5. un empuje que todavía no rindió devuelve cero")
limpiar()
db = database.SessionLocal()
u = usuario(db, "sola@test", "UBA")
p = jugador(db, "sola", "UBA", user_id=u.id)
cuando = AHORA - timedelta(minutes=20)
db.add(
    GameBoostIntent(
        player_id=p.id, university="UBA", created_at=cuando, consumed_at=cuando
    )
)
db.add(
    GameBoost(
        university="UBA",
        cafecitos=2,
        source="cafecito",
        created_at=cuando,
        expires_at=cuando + timedelta(hours=2),
    )
)
db.commit()
e = boosts.estado_de_donacion(db, p, AHORA)
db.close()
check(e.state == "credited", "el empuje está vivo igual", f"({e.state})")
check(
    e.xp_extra == 0 and e.estudiantes == 0,
    "y el número es cero, sin adornos",
    f"({e.xp_extra} XP, {e.estudiantes})",
)
# La pantalla es la que no puede mostrar ese cero (cafecito-panel.tsx ::
# PanelDeImpacto cae en el multiplicador). El servidor tiene que decir la verdad
# para que esa decisión se pueda tomar.
check(e.multiplier > 1.0, "y el multiplicador, que es lo que sí hay", f"(×{e.multiplier})")

print()
if FAILURES:
    print(f"{len(FAILURES)} chequeos fallaron:")
    for f in FAILURES:
        print(f"  - {f}")
    sys.exit(1)
print("todos los chequeos pasaron")
