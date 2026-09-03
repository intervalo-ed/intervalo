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

    Ojo, para el que venga a unificar esto: en el repo conviven TRES criterios de
    "de qué universidad es esta persona". Este y el del leaderboard son el mismo;
    `main._emoji_bucket` ordena por `enrolled_at` sin desempatar, y
    `push_store._university_user_ids` filtra por `course_id == 1` y se queda con
    todas las filas que matcheen. No son intercambiables.
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


def multiplier_for_user(
    db: Session, user_id: int, now: datetime | None = None
) -> float:
    """El multiplicador de empuje que le toca a este usuario. 1.0 si no hay.

    Mismo reparto que en el juego (`boosts.multiplier_for_player`): lo global le
    toca a todo el mundo, incluso a quien no cargó universidad, y lo dirigido se
    suma solo si el candado antimudanza lo deja pasar.

    La primera línea es la que hace que esto se pueda llamar en el camino
    caliente de cada respuesta: casi siempre no hay ningún empuje vigente, y
    `hay_empujes` memoriza ese "no" unos segundos por proceso. Sin ese atajo,
    cada respuesta de Intervalo pagaría dos consultas para averiguar que no pasa
    nada. El SÍ no se memoriza: es el caso raro y es el que tiene que estar bien.
    """
    now = now or datetime.utcnow()
    if not boosts.hay_empujes(db, now):
        return 1.0

    total = boosts.global_cafecitos(db, now)
    fila = enrollment_de_referencia(db, user_id)
    if fila is not None and fila.university:
        if boosts.aplica_el_empuje(fila.university, fila.university_set_at, db, now):
            total += boosts.cafecitos_de(db, fila.university, now)
    return boosts.multiplier_from_cafecitos(total)


def tramos_de_usuario(
    db: Session, user_id: int, now: datetime | None = None
) -> list[boosts.BoostView]:
    """Los empujes vigentes que le tocan a este usuario, uno por origen.

    Devuelve una LISTA y no un empuje solo porque puede estar cobrando dos a la
    vez: el global y el de su universidad, con dos donantes y dos vencimientos
    distintos. El número que se paga es la suma de los dos
    (`multiplier_for_user`), así que no le pertenece a ninguno de los dos
    tramos — mostrar uno y llamarlo "el empuje" hace que la cuenta regresiva
    llegue a cero con el multiplicador todavía arriba de 1.
    """
    now = now or datetime.utcnow()
    if not boosts.hay_empujes(db, now):
        return []

    fila = enrollment_de_referencia(db, user_id)
    propia = fila.university if fila is not None else None
    if propia and not boosts.aplica_el_empuje(propia, fila.university_set_at, db, now):
        propia = None

    return [
        v
        for v in boosts.active_boosts(db, now)
        if v.university is None or v.university == propia
    ]
