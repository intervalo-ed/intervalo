"""El tope diario de derivadas, y el pase que lo levanta.

**Es el primer experimento de monetización del producto.** Hasta acá un cafecito
compraba un multiplicador de XP para TODA una universidad, y `boosts.py` promete
con todas las letras que eso es a propósito: «el ×3 no se compra, se junta».
Poner un tope y venderle a una persona la llave de su propio tope es lo primero
que se le cobra a alguien por algo que solo recibe esa persona. No es un detalle
de implementación y por eso está escrito acá arriba: ver la sección
«El tope diario y el pase» en context/gamification.md.

Lo que este módulo decide es una sola cosa —si a esta persona, hoy, le queda
alguna derivada— y lo decide en cuatro pasos:

  1. ¿Está encendido el experimento? (`habilitado`, una variable de entorno)
  2. ¿Participa? (`participa`: **solo los jugadores nuevos**, ver `ARRANQUE`)
  3. ¿En qué brazo cayó? (`brazo_de`, un hash de su id, sin columna nueva)
  4. ¿Tiene el pase? (`tiene_pase`, derivado de `game_boosts`)

**Por qué no hay tabla de pases.** Tener el pase es exactamente «esta persona
puso plata alguna vez», y eso ya está escrito en `game_boosts`, una fila por
donación y ninguna se muta nunca. Derivarlo en vez de persistirlo
sale igual que lo que hace `sorteo.py` con el brazo, y trae tres cosas gratis:

  · **es retroactivo** — los catorce donantes que ya existen tienen el pase puesto
    el día uno, que es lo justo y además es imposible de conseguir con una tabla
    nueva sin un backfill que adivine fechas;
  · **`grant_game_boost.py` ya sirve** para comp y para reparar, sin escribir una
    herramienta nueva;
  · **no hay dos verdades** que se puedan desincronizar sobre la misma pregunta.

El costo, dicho para que nadie lo descubra solo: el pase no se puede revocar ni
regalar sin una fila de empuje.

**El pase NO VENCE** (03/10). Nació durando treinta días (`PASE_DIAS = 30`) y
se cambió por decisión de producto antes de que el experimento empezara a
leerse (`metrics/game_queries.py :: LECTURA_DESDE`): un cafecito levanta el
tope para siempre. Como el pase se deriva al leer, el cambio fue retroactivo y
sin migración —quien había donado hace más de un mes lo recuperó en el mismo
deploy—. Si alguna vez vuelve a tener duración, vuelve acá como una constante
de lectura, con el mismo efecto para todos a la vez.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Sequence
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from models import GameAttempt, GameBoost, GamePlayer

from . import aforo, sorteo

# Cuántas derivadas RESUELTAS por día. La unidad es la misma que el juego ya
# lleva y ya le muestra a la persona en la diapo del cafecito («ya llevás 23
# resueltas hoy»): `router._correctas_de_hoy`, o sea intentos con `is_correct`
# sin filtrar `attempt_number`. Una derivada acertada en el segundo intento
# cuenta, y una errada no consume nada.
#
# **Treinta, y el número está medido** (26/09, sobre 2.120 jugador-día y 54.362
# resueltas). La distribución por día es p50 9 · p75 21 · p90 53 · p99 320:
#
#   · deja intacto al 82% de los jugador-día, y al jugador mediano ni lo roza;
#   · no puede tocar el OMTM —la activación son 3 resueltas en la primera
#     tanda— y eso es lo que separa este experimento de uno que se coma el
#     embudo de entrada;
#   · cae en una pausa que ya existe: quien pasa 30 en un día lo hace en 2,38
#     sentadas (p50 = 2), así que el tope no corta el primer impulso sino la
#     vuelta de más tarde;
#   · llega después de que la persona ya vio la diapo del cafecito dos veces
#     (`cafecito-cta.tsx`: la 14 y la 20), así que el tope no es la
#     presentación del cafecito sino un motivo más;
#   · y es el número más chico que se puede LEER este semestre: lo cruzan entre
#     92 y 107 personas por semana, que son ~50 por brazo.
#
# Lo que cuesta, también medido: la primera tanda tiene p90 = 32, así que el tope
# corta la primera sentada de alrededor de 1 de cada 9 recién llegados, y el
# 59,6% de los días que bloquea son el primer día de esa persona. Es el precio
# del experimento y la razón por la que el guardarraíl de días activos se mira
# antes que el resultado.
TOPE_DIARIO = 30

# El pase que compra un cafecito no tiene duración: es para siempre, con uno o
# con diez (ver la cabecera). El empuje de la universidad ya escala con la
# cantidad (`boosts.horas_de` y `multiplier_from_cafecitos`), y el propio
# comentario de `BOOST_HOURS_BASE` avisa que dos premios que crecen a la vez se
# leen peor que uno solo.

# El interruptor, y no es una formalidad. Un tope es lo único que este producto
# puede hacer que lastime en horas en vez de en semanas, así que tiene que poder
# apagarse desde Railway sin un deploy. Mismo mecanismo que `GAME_CHAT_ENABLED`.
#
# Apagado por default: quien levante este repo en local no se encuentra un muro
# que no pidió, y el día del despliegue el encendido es un acto explícito y
# fechado en vez de un efecto secundario de mergear.
ENV_ENCENDIDO = "MURO_ENABLED"

# ── El experimento ──────────────────────────────────────────────────────────
#
# `dx-muro-1`. El brazo se sortea del lado del SERVIDOR, con el hash de
# `sorteo.brazo_de` y sin columna.
#
# **Ojo con el motivo, porque cambió.** Cuando esto se escribió, el sorteo tenía
# que ser del servidor porque `game_players.variant` se escribe al CREAR la fila
# y los que llegaban a 30 en un día existían todos desde hacía semanas: con el
# sorteo de creación el experimento habría medido a cero personas. Con la
# excepción de los veteranos (`ARRANQUE`) eso ya no es cierto —ahora todos los
# participantes se crean DESPUÉS del arranque, así que la variante de creación
# también funcionaría—. El hash se queda igual, por tres razones distintas de la
# original: ya está repartido y verificado contra producción con el experimento
# corriendo, cambiar el mecanismo re-sortearía a quien ya está inscripto, y el
# panel puede recalcular el brazo de cualquiera en tiempo de lectura sin
# depender de que una columna se haya escrito bien.
EXPERIMENTO = "dx-muro-1"

# El índice ES el bucket, igual que en los otros dos sorteos: agregar un brazo
# al final no remueve a nadie de los que ya estaban.
BRAZOS: tuple[str, ...] = ("control", "muro")

# Qué tope le toca a cada brazo. `None` es «sin tope», que es el juego de hoy.
TOPES: dict[str, int | None] = {"control": None, "muro": TOPE_DIARIO}

# ── Quiénes participan ──────────────────────────────────────────────────────
#
# **Solo los jugadores NUEVOS.** Quien ya venía jugando antes del arranque no
# tiene tope —ni en el brazo tratado, ni nunca— y el panel tampoco lo cuenta.
#
# No es una concesión para que no se enoje nadie: es lo que hace que el
# experimento mida lo que dice medir. Un veterano que a los cuarenta días se
# encuentra una pared reacciona a que le QUITARON algo que tenía; un recién
# llegado reacciona a cómo es el producto. Son dos cantidades distintas, y la
# que contesta «¿este producto puede tener un tope?» es la segunda. Con la
# excepción, todos los inscriptos conocieron una sola regla desde su primera
# derivada.
#
# **Lo que cuesta, medido el 26/09.** De las 270 personas que alguna vez
# llegaron a 30 resueltas en un día, 232 lo hicieron **el mismo día que se
# crearon** (86%) y el p90 de la demora es UN día. Así que la excepción no vacía
# el experimento: le saca los ~117 veteranos que ya estaban arriba del tope
# —casi todos se habrían inscripto en la primera semana— y después casi no se
# nota. El ritmo pasa de ~111 a ~91-98 personas por semana.
#
# **Y lo que ya no se va a poder concluir.** El resultado va a valer para
# jugadores nuevos y nada más. Si sale que pagan, eso no dice qué haría un
# veterano, y ahí está la plata de hoy: los catorce donantes y la punta del
# ranking son todos de antes del arranque. Encender el tope para todos seguiría
# siendo un cambio sin medir.
ARRANQUE = date(2026, 9, 27)

# El huso del juego, para traducir `ARRANQUE` a la escala en que está escrita la
# base. Se define acá en vez de importarlo de `router` porque router importa este
# módulo; es el mismo duplicado que ya tiene `aforo.py`, y por el mismo motivo.
_TZ_JUEGO = ZoneInfo("America/Argentina/Buenos_Aires")

# El instante del corte, en UTC ingenuo, que es la escala de
# `game_players.created_at` (escrito con `datetime.utcnow`). Se calcula una vez
# al importar: es una fecha fija y Argentina no mueve el reloj desde 2009.
NACIDO_DESPUES_DE = (
    datetime(ARRANQUE.year, ARRANQUE.month, ARRANQUE.day, tzinfo=_TZ_JUEGO)
    .astimezone(ZoneInfo("UTC"))
    .replace(tzinfo=None)
)


# ── Los números del cartel ──────────────────────────────────────────────────

# Qué porcentaje de jugadores NUNCA llegó a `TOPE_DIARIO` en un día. Medido el
# 26/09: 1.285 de 1.555 que resolvieron algo.
#
# Es un número CONSTANTE para todo el que ve el cartel —con tope duro, todos los
# que lo ven hicieron exactamente 30— así que se usa una sola vez por día y por
# persona. En las vueltas siguientes habla `percentil_de_velocidad`, que sí
# cambia según lo que esa persona hizo.
PCT_NUNCA_LLEGA = 82.6

# «Más rápido que el N%», por minutos de juego efectivo hasta la número 30.
# Medido el 26/09 sobre los 392 días que llegaron a 30: p10 11 min, p25 16,
# p50 25, p75 83, p90 353.
#
# Tabla y no fórmula porque la distribución tiene una cola larguísima y
# cualquier curva suave mentiría justo donde más gente cae. Se lee de arriba
# hacia abajo y gana el primer umbral que alcanza.
VELOCIDAD: tuple[tuple[int, int], ...] = (
    (11, 90), (16, 75), (20, 62), (25, 51), (30, 42), (35, 38),
    (40, 34), (45, 33), (60, 30), (75, 27), (90, 24), (120, 21),
    (180, 17), (240, 13),
)

# Hueco máximo entre dos respuestas para que sigan siendo la misma sentada. Es
# el mismo corte con el que el análisis define «tanda», y es lo que hace que el
# cartel diga «en 24 minutos» y no «en 9 h 40 min» a quien resolvió quince a la
# mañana y quince a la noche. Medido: de la primera a la trigésima el reloj de
# pared tiene mediana 25 min pero p90 de 353, o sea que una de cada diez
# felicitaciones sería una burla.
HUECO_SENTADA_MINUTOS = 30


def habilitado() -> bool:
    """¿Está encendido el experimento del tope?

    Se lee en cada pedido y no una vez al importar: apagarlo tiene que ser
    cambiar la variable en Railway y que el próximo `/next` ya pase, sin esperar
    a que el proceso se reinicie.
    """
    return os.getenv(ENV_ENCENDIDO, "").strip().lower() in {"1", "true", "yes", "on"}


def brazo_de(player_id: int) -> str:
    """En qué brazo de `dx-muro-1` cayó esta persona."""
    return sorteo.brazo_de(player_id, EXPERIMENTO, BRAZOS)


def participa(player: GamePlayer) -> bool:
    """¿Este jugador entra al experimento del tope?

    Solo los creados a partir de `ARRANQUE`. Con `created_at` en NULL la
    respuesta es NO: no puede pasar —la columna tiene default— pero la única
    forma de equivocarse acá es ponerle un tope a alguien que no debía tenerlo,
    así que el caso raro cae del lado seguro.

    Un detalle que conviene saber antes de que alguien lo descubra solo: borrar
    el navegador crea un jugador NUEVO, así que un veterano que limpie su
    `localStorage` **pierde la excepción** junto con su XP. Es el reverso exacto
    de la puerta de atrás que este experimento ya tenía anotada como riesgo, y
    no hace falta taparlo: nadie borra su progreso para conseguir un tope.
    """
    nacio = player.created_at
    return nacio is not None and nacio >= NACIDO_DESPUES_DE


def tope_de(player: GamePlayer) -> int | None:
    """El tope diario de esta persona, o `None` si no tiene.

    `None` sale por TRES caminos que el llamador no tiene que distinguir: el
    experimento está apagado, la persona ya jugaba antes del arranque, o le tocó
    el control. Los tres significan lo mismo para quien juega —no hay tope— y
    mezclarlos acá evita que cada lugar que pregunta tenga que acordarse de los
    tres.

    Toma el jugador y no su id justamente por eso: con la firma vieja
    (`tope_de(player_id)`) cualquier llamador nuevo podía preguntar por el brazo
    y saltearse la excepción sin enterarse.
    """
    if not habilitado():
        return None
    if not participa(player):
        return None
    return TOPES[brazo_de(player.id)]


def tiene_pase(db: Session, player: GamePlayer) -> bool:
    """Si esta persona tiene el tope levantado. Es para siempre.

    Alcanza con una donación con su nombre, de cualquier fecha. Se excluye el
    empuje de aforo porque ese no lo pagó nadie (`aforo.SOURCE`): es el premio
    por traer diez personas en un día, y regalar el acceso con él sería
    convertir el reclutamiento en la forma gratis de saltear el tope.
    """
    return (
        db.query(GameBoost.id)
        .filter(
            GameBoost.player_id == player.id,
            GameBoost.source != aforo.SOURCE,
        )
        .first()
        is not None
    )


def minutos_jugando(momentos: Sequence[datetime]) -> int:
    """Minutos EFECTIVOS que abarcan esas respuestas, sin contar los recreos.

    Suma los huecos de hasta `HUECO_SENTADA_MINUTOS`; los más largos valen cero.
    Pura y sin base a propósito, para que el chequeo la pueda probar con una
    lista escrita a mano.

    Con una sola respuesta el resultado es 0, que es correcto: no hay intervalo
    que medir. El cartel no lo va a mostrar nunca —aparece recién en la 30— pero
    una función de este tipo no puede tener un caso que explote.
    """
    orden = sorted(momentos)
    tope = timedelta(minutes=HUECO_SENTADA_MINUTOS)
    total = timedelta()
    for antes, despues in zip(orden, orden[1:]):
        hueco = despues - antes
        if hueco <= tope:
            total += hueco
    return int(total.total_seconds() // 60)


def percentil_de_velocidad(minutos: int) -> int:
    """«Más rápido que el N%» de los que llegan al tope, según la tabla medida."""
    for umbral, pct in VELOCIDAD:
        if minutos <= umbral:
            return pct
    return VELOCIDAD[-1][1]


@dataclass(frozen=True)
class Muro:
    """El estado del tope para esta persona, ahora.

    Viaja al cliente entero en vez de por pedacitos porque el cliente tiene que
    poder decidir DOS cosas con esto —si dibujar el cartel y qué números
    ponerle— y partirlo obligaría a una segunda llamada justo en el momento en
    que la persona acaba de acertar.
    """

    tope: int | None
    hechas_hoy: int
    bloqueado: bool
    con_pase: bool
    libre_en_segundos: int | None
    minutos_jugando: int
    pct_mas_que: float
    pct_mas_rapido: int


def _momentos_de_hoy(db: Session, player_id: int, desde: datetime) -> list[datetime]:
    """Cuándo acertó hoy, en orden. Usa `ix_game_attempts_player_created`."""
    filas = (
        db.query(GameAttempt.created_at)
        .filter(
            GameAttempt.player_id == player_id,
            GameAttempt.is_correct.is_(True),
            GameAttempt.created_at >= desde,
        )
        .order_by(GameAttempt.created_at)
        .all()
    )
    return [f[0] for f in filas]


def estado(
    db: Session,
    player: GamePlayer,
    hechas_hoy: int,
    inicio_del_dia: datetime,
    proxima_medianoche: datetime,
    ahora: datetime | None = None,
) -> Muro:
    """Todo lo que el cliente necesita saber sobre el tope.

    Las dos fechas llegan de afuera y no se calculan acá porque el «hoy» del
    juego es una decisión que ya está tomada en un solo lugar
    (`router._inicio_del_dia`, huso de Buenos Aires) y tener dos relojes sería
    tener dos días.

    **La consulta de los momentos solo corre cuando hace falta**, o sea cuando
    la persona efectivamente llegó al tope. En el 82% de los días esto no se
    ejecuta nunca, así que el cartel no le cuesta una consulta por respuesta a
    todo el mundo.
    """
    ahora = ahora or datetime.utcnow()
    tope = tope_de(player)
    con_pase = tiene_pase(db, player) if tope is not None else False
    alcanzo = tope is not None and hechas_hoy >= tope
    bloqueado = alcanzo and not con_pase

    minutos = pct_rapido = 0
    if alcanzo:
        minutos = minutos_jugando(_momentos_de_hoy(db, player.id, inicio_del_dia))
        pct_rapido = percentil_de_velocidad(minutos)

    return Muro(
        tope=tope,
        hechas_hoy=hechas_hoy,
        bloqueado=bloqueado,
        con_pase=con_pase,
        libre_en_segundos=(
            max(0, int((proxima_medianoche - ahora).total_seconds()))
            if bloqueado else None
        ),
        minutos_jugando=minutos,
        pct_mas_que=PCT_NUNCA_LLEGA,
        pct_mas_rapido=pct_rapido,
    )
