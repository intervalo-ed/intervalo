"""El empuje de cafecito, visto desde Intervalo clásico.

Un cafecito invitado en el minijuego multiplica el XP de toda una universidad
durante un día (game/boosts.py). Este módulo es lo único que hace falta para que
ese mismo empuje valga también acá: no define una segunda mecánica, ni una
segunda tabla, ni un segundo multiplicador. Traduce "qué universidad es esta
persona" del vocabulario de clásico (`enrollments`) al que `boosts` ya entiende,
y le pregunta a él.

Por qué la traducción no es trivial, y es todo lo que hay acá:

  · La universidad de un jugador del minijuego está en su propia fila
    (`game_players.university`). La de un usuario de clásico está en
    `enrollments`, que es por curso, así que hay que elegir cuál.
  · El candado antimudanza necesita saber CUÁNDO se cargó, y esa columna
    (`university_set_at`) hasta ahora existía solo del lado del juego.

Lo que este módulo NO hace, a propósito: no toca `game_boosts` (solo lee), no
crea empujes, y no sabe nada de cafecito.app. La ingesta sigue viviendo entera
en game/, que es donde está el socket y el mail.
"""

from __future__ import annotations

from datetime import datetime
from typing import NamedTuple

from sqlalchemy import select
from sqlalchemy.orm import Session

from game import boosts
from models import Enrollment


def enrollment_de_referencia(db: Session, user_id: int) -> Enrollment | None:
    """El enrollment que define de qué universidad es esta persona.

    El MÁS ANTIGUO, sin importar el curso — exactamente el mismo criterio que
    `main._first_enrollment_subq`, que es el que decide el tag de universidad en
    el leaderboard y la fila del ranking por universidad. Que el empuje use otro
    criterio sería peor que cualquiera de los dos: alguien podría ver su
    universidad impulsada en el ranking y cobrar la de otra al responder.

    El desempate por `id` también es el mismo: dos enrollments con el mismo
    `enrolled_at` elegían una fila arbitraria según cómo ordenara el motor.

    Es el ÚNICO criterio del repo, y eso costó unificarlo: convivían tres, y el
    docstring que estaba acá los enumeraba en vez de arreglarlos. Los otros dos
    eran `main._emoji_bucket` (ordenaba por `enrolled_at` sin desempatar, así que
    dos filas con la misma fecha elegían cualquiera) y
    `push_store._university_user_ids` (filtraba `course_id == 1` y se quedaba con
    todas las filas que matchearan, así que alguien inscripto primero en otro
    curso aportaba a la ventana semanal de una universidad y veía impulsada otra).
    Los dos pasan por acá ahora. El del leaderboard es el mismo criterio escrito
    en SQL (`main._first_enrollment_subq`), porque ahí hace falta como subquery.
    """
    return db.scalars(
        select(Enrollment)
        .where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.asc(), Enrollment.id.asc())
        .limit(1)
    ).first()


def universidades_de(db: Session, user_ids: list[int]) -> dict[int, str]:
    """`{user_id: sigla}` para varios usuarios, con el criterio de arriba.

    La forma de lote de `enrollment_de_referencia`, para los lugares que
    necesitan la universidad de una lista de personas y no de una. Mismo orden y
    mismo desempate, resuelto en Python sobre una sola consulta: la lista viene
    acotada (los reclutas de alguien) y armar un ROW_NUMBER para eso sería
    pagarle a la base una complejidad que no hace falta.

    Los que no tienen enrollment no aparecen en el dict. Ausente y "sin
    universidad" son la misma cosa acá, y el que llama decide cómo mostrarlo.
    """
    if not user_ids:
        return {}
    filas = db.scalars(
        select(Enrollment)
        .where(Enrollment.user_id.in_(user_ids))
        .order_by(Enrollment.enrolled_at.asc(), Enrollment.id.asc())
    ).all()
    salida: dict[int, str] = {}
    for fila in filas:
        # La primera que aparece por usuario es la más antigua: el order_by ya
        # dejó la lista en el orden que decide el criterio.
        if fila.user_id not in salida and fila.university:
            salida[fila.user_id] = fila.university
    return salida


class Empuje(NamedTuple):
    """Lo que le toca a una persona: el número que paga y de dónde sale.

    Los dos juntos y no cada uno por su cuenta, porque preguntarlos separado
    resolvía dos veces el enrollment y dos veces el candado — y el dashboard pide
    `/user/progress` de los tres cursos en paralelo, así que eran ~30 consultas
    redundantes por carga. Y cada llamada tomaba su propio `utcnow()`: con un
    empuje venciendo en ese instante, el multiplicador podía salir de un lado y
    los tramos del otro.
    """

    multiplier: float
    tramos: list[boosts.BoostView]


def empuje_de_usuario(
    db: Session, user_id: int, now: datetime | None = None
) -> Empuje:
    """El empuje que le toca a este usuario: multiplicador y tramos, de una.

    La primera línea es la que hace que esto se pueda llamar en el camino
    caliente de cada respuesta: casi siempre no hay ningún empuje vigente, y
    `hay_empujes` memoriza ese "no" unos segundos por proceso. Sin ese atajo,
    cada respuesta de Intervalo pagaría dos consultas para averiguar que no pasa
    nada.

    Los tramos son una LISTA y no un empuje solo porque puede estar cobrando dos
    a la vez: el global y el de su universidad, con dos donantes y dos
    vencimientos distintos. El número que se paga es la suma de los dos, así que
    no le pertenece a ninguno de los dos tramos — mostrar uno y llamarlo "el
    empuje" hace que la cuenta regresiva llegue a cero con el multiplicador
    todavía arriba de 1.
    """
    now = now or datetime.utcnow()
    if not boosts.hay_empujes(db, now):
        return Empuje(1.0, [])

    fila = enrollment_de_referencia(db, user_id)
    propia = fila.university if fila is not None else None
    set_at = fila.university_set_at if fila is not None else None
    if propia and not boosts.aplica_el_empuje(propia, set_at, db, now):
        propia = None

    total = boosts.global_cafecitos(db, now)
    if propia:
        total += boosts.cafecitos_de(db, propia, now)

    return Empuje(
        boosts.multiplier_from_cafecitos(total),
        [
            v
            for v in boosts.active_boosts(db, now)
            if v.university is None or v.university == propia
        ],
    )


def multiplier_for_user(
    db: Session, user_id: int, now: datetime | None = None
) -> float:
    """Solo el multiplicador. Para el camino de cada respuesta, que no dibuja
    ningún cartel y no tiene por qué pagar `active_boosts`."""
    now = now or datetime.utcnow()
    if not boosts.hay_empujes(db, now):
        return 1.0
    fila = enrollment_de_referencia(db, user_id)
    return boosts.multiplier_desde(
        db,
        fila.university if fila is not None else None,
        fila.university_set_at if fila is not None else None,
        now,
    )


def tramos_de_usuario(
    db: Session, user_id: int, now: datetime | None = None
) -> list[boosts.BoostView]:
    """Solo los tramos. Ver `empuje_de_usuario`."""
    return empuje_de_usuario(db, user_id, now).tramos
