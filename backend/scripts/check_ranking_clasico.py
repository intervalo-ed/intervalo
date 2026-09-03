"""Verifica que el ranking de Intervalo clásico traiga las mecánicas del minijuego.

Lo que se prueba es lo que se rompe en silencio:

· Que los empujes de cafecito lleguen a la cabecera del ranking con TODAS las
  universidades, no solo la de quien mira. Ese es el motor de la mecánica
  (context/gamification.md): ver que la otra está en ×2,0 es lo que hace donar.
· Que el filtro de carrera/universidad NO los apague. Filtrar el ranking a la UBA
  deja de mostrar filas de la UTN, pero el cafecito de la UTN sigue corriendo, y
  un cartel que desaparece al filtrar estaría diciendo que se terminó.
· Que el chip y lo que se paga digan el MISMO número. Es el bug que ya pasó una
  vez del lado del juego: `cafecitos` en crudo contra un multiplicador topeado
  fila por fila, con una donación de 30 anunciando ×3,0 mientras la respuesta
  pagaba ×2,0.
· Que el cinturón de un recluta sea el mismo que el de su fila del ranking
  individual. Es la misma persona en las dos tablas y la pinta el mismo color.
· Que "de qué universidad es esta persona" siga siendo UN solo criterio. En el
  repo conviven tres (ver xp_boost.enrollment_de_referencia); el que se agrega
  acá tiene que ser el mismo del tag del ranking, o alguien vería impulsada una
  universidad y cobraría la de otra.

Uso:
    python backend/scripts/check_ranking_clasico.py

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
    Path(tempfile.mkdtemp()) / "ranking_clasico.db"
).replace("\\", "/")
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND.parent))

import database  # noqa: E402
from models import (  # noqa: E402
    Base,
    Course,
    Enrollment,
    GameBoost,
    GamePlayer,
    UnitState,
    User,
)

Base.metadata.create_all(bind=database.engine)

import main  # noqa: E402
import xp_boost  # noqa: E402
from game import boosts as game_boosts  # noqa: E402

fallos: list[str] = []


def check(nombre: str, cond: bool, detalle: str = "") -> None:
    print(f"{'ok   ' if cond else 'FALLA'}  {nombre} {detalle}".rstrip())
    if not cond:
        fallos.append(nombre)


db = database.SessionLocal()
AHORA = datetime.utcnow()

db.add(Course(id=1, slug="analisis", name="Análisis"))
db.add(Course(id=2, slug="algebra", name="Álgebra"))
db.commit()


def alta(uid: int, universidad: str, xp: int = 100) -> User:
    u = User(
        id=uid,
        clerk_user_id=f"c{uid}",
        email=f"u{uid}@x.com",
        name=f"U{uid}",
        username=f"u{uid}",
        total_xp=xp,
    )
    db.add(u)
    db.commit()
    db.add(
        Enrollment(
            user_id=uid,
            course_id=1,
            university=universidad,
            career="Ingeniería",
            enrolled_at=AHORA - timedelta(days=30),
        )
    )
    db.commit()
    return u


mirador = alta(1, "UBA")  # quien mira el ranking
otro_uba = alta(2, "UBA")
de_utn = alta(3, "UTN")

# El empuje: 4 cafecitos para la UBA. Nadie donó para la UTN.
db.add(
    GameBoost(
        university="UBA",
        cafecitos=4,
        donor_name="Nico",
        created_at=AHORA,
        expires_at=AHORA + timedelta(hours=24),
    )
)
db.commit()
# El "no hay ningún empuje" se memoriza unos segundos por proceso, y este script
# acaba de crear uno: sin esto, todo lo de abajo mediría el caché y no la base.
game_boosts.olvidar_cache_de_empujes()


def resumen(university=None, career=None, quien=mirador):
    return main.get_leaderboard_summary(
        university=university, career=career, current_user=quien, db=db
    )


print("1. los empujes llegan a la cabecera del ranking")
r = resumen()
check("viaja el empuje de la UBA", len(r.boosts) == 1, f"(vinieron {len(r.boosts)})")
uba = r.boosts[0]
check("con su sigla", uba.university == "UBA")
check("y con el nombre de quien invitó", uba.donor_name == "Nico")
check("el reloj es en segundos y no un instante", uba.expires_in_seconds > 0)

print("2. el chip dice el MISMO número que se paga")
check(
    "el multiplicador del chip es el que cobra un alumno de la UBA",
    abs(uba.multiplier - xp_boost.multiplier_for_user(db, mirador.id)) < 1e-9,
    f"(chip {uba.multiplier}, paga {xp_boost.multiplier_for_user(db, mirador.id)})",
)
check(
    "y el de la UTN no cobra nada",
    xp_boost.multiplier_for_user(db, de_utn.id) == 1.0,
)

print("3. el filtro del ranking NO apaga los empujes")
# Filtrar a la UTN deja de mostrar filas de la UBA, pero el cafecito de la UBA
# sigue corriendo. Un cartel que se apaga al filtrar diría que se terminó.
r_utn = resumen(university="UTN")
check(
    "filtrando a la UTN sigue viéndose el empuje de la UBA",
    [b.university for b in r_utn.boosts] == ["UBA"],
)
r_carrera = resumen(career="E")
check(
    "y filtrando por carrera también",
    [b.university for b in r_carrera.boosts] == ["UBA"],
)
check(
    "el filtro sí acota los números de arriba",
    r_utn.total_students == 1,
    f"(dio {r_utn.total_students})",
)

print("4. una donación grande no promete lo que no paga")
# El tope por donación se aplica FILA POR FILA (boosts._CAPPED). Una de 30 vale
# ×2,0 aunque el cartel cuente los 30 enteros: es el bug que ya pasó en el juego.
db.add(
    GameBoost(
        university="UNSAM",
        cafecitos=30,
        created_at=AHORA,
        expires_at=AHORA + timedelta(hours=48),
    )
)
db.commit()
unsam = [b for b in resumen().boosts if b.university == "UNSAM"][0]
check("el cartel cuenta la donación entera", unsam.cafecitos == 30)
# El tope que aplica es el POR DONACIÓN (10 cafecitos → ×2,0), no el del juego
# entero (×3,0): ese se alcanza sumando varias donaciones, que es lo que
# boosts.py promete con todas las letras («el ×3 no se compra, se junta»).
topeado = game_boosts.multiplier_from_cafecitos(
    game_boosts.MAX_CAFECITOS_PER_DONATION
)
check(
    "pero el multiplicador está topeado por donación",
    unsam.multiplier == topeado,
    f"(dio {unsam.multiplier}, tope por donación {topeado})",
)
check(
    "y una sola donación no llega al tope del juego",
    topeado < game_boosts.MAX_MULTIPLIER,
    f"({topeado} < {game_boosts.MAX_MULTIPLIER})",
)

print("5. un empuje vencido no se muestra")
db.add(
    GameBoost(
        university="UTDT",
        cafecitos=5,
        created_at=AHORA - timedelta(hours=50),
        expires_at=AHORA - timedelta(minutes=1),
    )
)
db.commit()
check(
    "el de la UTDT ya no viaja",
    "UTDT" not in [b.university for b in resumen().boosts],
)

print("6. la universidad de quien mira, con el criterio de siempre")
check("la del mirador es la UBA", resumen().university == "UBA")
check("y la de otro es la suya", resumen(quien=de_utn).university == "UTN")
# El criterio es el enrollment MÁS ANTIGUO, no el último ni el del curso 1: es el
# mismo que decide el tag de universidad en la fila del ranking y el que usa el
# empuje para pagar. Que difieran haría que alguien vea impulsada una y cobre otra.
db.add(
    Enrollment(
        user_id=de_utn.id,
        course_id=2,
        university="UBA",
        enrolled_at=AHORA - timedelta(days=1),
    )
)
db.commit()
check(
    "un enrollment más nuevo no le cambia la universidad",
    resumen(quien=de_utn).university == "UTN",
    f"(dio {resumen(quien=de_utn).university})",
)
check(
    "y el que paga el empuje piensa lo mismo",
    (xp_boost.enrollment_de_referencia(db, de_utn.id).university) == "UTN",
)

print("7. los reclutas llevan su cinturón")
# El reclutador necesita fila de jugador: la arista cuelga de `game_players.id`.
db.add(GamePlayer(id=1, alias="reclutador", user_id=mirador.id))
db.commit()
recluta = alta(4, "UBA", xp=500)
recluta.referred_by_player_id = 1
recluta.referral_xp_given = 50
# Cinturón violeta en un curso y azul en otro: el que vale es el MÁS ALTO.
db.add(UnitState(user_id=4, course_id=1, belt="blue", topic="t", exercise_type="e"))
db.add(UnitState(user_id=4, course_id=2, belt="violet", topic="t", exercise_type="e"))
# Una unidad suspendida con un cinturón todavía más alto: no cuenta.
db.add(
    UnitState(
        user_id=4,
        course_id=1,
        belt="brown",
        topic="t2",
        exercise_type="e",
        suspended=True,
    )
)
db.commit()

recs = main.get_recruits(current_user=mirador, db=db)
check("aparece el recluta", len(recs.entries) == 1, f"(vinieron {len(recs.entries)})")
fila = recs.entries[0]
check("con el cinturón más alto de sus cursos", fila.belt == "violet", f"(dio {fila.belt})")
check(
    "el mismo que le daría el ranking individual",
    fila.belt == main._max_belt_by_user(db, [4]).get(4),
)
check("y lo que aportó", fila.xp_given == 50)

# Sin cinturón todavía: blanco, no vacío ni None. Es el mismo default que el
# ranking individual, y el color del nombre lo lee sin ramas.
recluta2 = alta(5, "UTN", xp=10)
recluta2.referred_by_player_id = 1
recluta2.referral_xp_given = 12
db.commit()
recs = main.get_recruits(current_user=mirador, db=db)
sin_cinturon = [e for e in recs.entries if e.username == "u5"][0]
check("quien no desbloqueó nada es 'white'", sin_cinturon.belt == "white")

print("8. quién aparece en el ranking: haber resuelto, no haber reclutado")
# El agujero que esto cierra es el mismo que el minijuego cerró en esta serie:
# `referrals.acreditar_clasico` le suma a `total_xp` del reclutador con un UPDATE
# crudo, así que con el filtro viejo (`total_xp > 0`) alcanzaba con traer a
# alguien para entrar a la tabla sin haber respondido nunca un ejercicio.
solo_recluto = alta(9, "UBA", xp=0)
solo_recluto.total_xp = 120
solo_recluto.referral_xp_earned = 120
db.commit()

visibles = [e.username for e in main.get_leaderboard(
    university=None, career=None, limit=50, offset=0, around_me=False,
    current_user=mirador, db=db,
).entries]
check("quien solo reclutó NO entra", "u9" not in visibles, f"(dio {visibles})")
check("y los que estudiaron siguen estando", "u2" in visibles and "u3" in visibles)

# Una sola respuesta propia ya lo hace visible: el corte es "resolvió algo acá",
# no "resolvió mucho".
solo_recluto.total_xp = 121
db.commit()
visibles = [e.username for e in main.get_leaderboard(
    university=None, career=None, limit=50, offset=0, around_me=False,
    current_user=mirador, db=db,
).entries]
check("con 1 XP propia ya entra", "u9" in visibles, f"(dio {visibles})")

# Y los agregados de la cabecera tienen que contar exactamente a los mismos: si
# el total no filtra igual que la lista, los números de arriba no cuadran con las
# filas de abajo.
solo_recluto.total_xp = 120
db.commit()
r_vis = resumen()
check(
    "el total de estudiantes cuenta a los mismos que la lista",
    r_vis.total_students == len(visibles) - 1,
    f"(total {r_vis.total_students}, lista {len(visibles) - 1})",
)

print()
if fallos:
    print(f"{len(fallos)} FALLA(S): " + ", ".join(fallos))
    sys.exit(1)
print("todo ok")
