"""`dx-rampa-1`: el teclado que crece y las ayudas a la vista.

**La hipótesis.** El 18,3% de la gente a la que el juego le sirve su primera
derivada **no escribe nada**: la ve y se va. Y de los que sí escriben, el 18,8%
contesta una sola. Medido sobre 2.056 personas, solo el **61,92%** llega a la
tercera derivada. Este experimento prueba dos cosas contra eso:

  * **el teclado en rampa** — la primera derivada es `x`, o sea que la respuesta
    es `1`. Arrancar con veinticuatro teclas para eso es cobrar un impuesto de
    atención antes de que la persona sepa de qué se trata. El teclado empieza
    con lo que la respuesta pide y crece;
  * **las ayudas a la vista** — saltear y la tabla en una fila propia, con el
    espacio que libera el teclado. Hoy la tabla la abre el **2,6%** en el primer
    paso, y abrirla NO predice irse (14,0% contra 18,8%, p=0,41): o sea que está
    invisible y la usa el que se queda.

**Por qué son dos palancas y no una.** Mueven parámetros distintos de la misma
distribución. El teclado mueve el riesgo del PRIMER paso, y eso multiplica la
curva entera por una constante: una ganancia de una sola vez. Las ayudas mueven
el riesgo de CADA paso, y eso compone. Los dos experimentos de la puerta
movieron el primero y se evaporaron —`dx-puerta-1` ganó 71 personas en la
derivada 1 y −1 en la 3—, así que separarlos es el punto.

**La escalera.** Cuatro brazos, cada uno agrega una cosa al anterior:

    control  →  teclado  →  + ayudas  →  + pantalla de arranque

y por eso las comparaciones son cada escalón contra el anterior. No es un
factorial: la celda «ayudas sin teclado» pediría el teclado completo MÁS dos
filas de botones, y el alto de esa pantalla no existe —el propio
`exercise-card.tsx` documenta que en Safari, con la barra de URL comiendo alto
real, el panel ya se pasaba de largo—. Las dos cosas están acopladas por diseño:
el espacio que las ayudas necesitan lo libera el teclado.

**El cuarto escalón es de OTRA naturaleza que los otros dos**, y conviene
tenerlo a la vista al leerlo. El teclado y las ayudas cambian la pantalla del
ejercicio; la bienvenida cambia la pantalla ANTERIOR —la intro, antes de que se
sirva la primera derivada—. O sea que es la única de las tres que puede mover la
BASE de la métrica y no solo el numerador: si hace que más gente toque
Continuar, cambia cuántas personas entran a «se le sirvió el ejercicio 1».

Eso no rompe nada mientras se lea como escalera —cada brazo contra el anterior,
sobre la misma base de aterrizados— pero sí quiere decir que el contraste del
cuarto escalón hay que mirarlo también sobre los que llegan, no solo sobre los
que resuelven.

**El teclado es palanca de TELÉFONO.** En escritorio el teclado del juego no
tiene números —se tipean— y el físico sigue funcionando en paralelo, así que la
rampa ahí no significa nada. Las ayudas sí aplican en los dos. Eso deja, de
yapa, un contraste limpio en escritorio: `control` y `teclado` son idénticos ahí,
así que juntarlos y compararlos contra `ayudas` mide las ayudas SOLAS.

**Lo que este módulo NO decide** es cómo se dibuja nada. Dice en qué brazo cayó
cada persona y qué teclas tiene; que el teclado de escritorio ignore la rampa lo
decide el cliente, que es el único que sabe qué está dibujando.
"""

from __future__ import annotations

import os
from datetime import datetime
from zoneinfo import ZoneInfo

from . import sorteo

EXPERIMENTO = "dx-rampa-1"

# El índice ES el bucket (ver `sorteo.brazo_de`), así que el orden no se toca:
# reordenarlos re-sortea a todo el mundo a mitad del experimento.
BRAZOS = ("control", "teclado", "ayudas", "bienvenida")

# El interruptor. Arranca ENCENDIDO, al revés que `MURO_ENABLED`, y la asimetría
# es a propósito: un muro puede hacer daño en horas —le corta el juego a alguien—
# mientras que lo peor que puede hacer una rampa de teclado es no servir. Lo que
# sí hace falta es poder apagarla desde Railway en segundos si algo sale mal, sin
# esperar un deploy.
ENV_ENCENDIDO = "RAMPA_ENABLED"

# Cuántos ejercicios de la rampa NO mueven el Elo, en LOS DOS BRAZOS.
#
# Los tres primeros están fijados por diseño (`x`, `x²`, `2x²`; p̂ 0,82-0,85 con
# θ=0) y el motor recién toma el control en el cuarto, donde p̂ cae a 0,77 y la
# mediana de tiempo salta de 5,8 a 17,7 segundos. Como el tratamiento los vuelve
# casi seguros, dejarlos actualizando θ le daría al brazo tratado un θ más alto
# al entrar al motor, o sea ejercicios MÁS difíciles, y perdería profundidad por
# algo que no es el tratamiento.
#
# Se apaga en los dos brazos y no solo en el tratado: si se apagara en uno, la
# diferencia de θ sería el tratamiento. Apagado en ambos, los dos entran al motor
# desde el mismo θ y la comparación mide lo que dice medir.
SIN_ELO_HASTA = 3


def habilitado() -> bool:
    """¿Está encendido el sorteo?

    Se lee en cada pedido y no una vez al importar: apagarlo tiene que ser
    cambiar la variable en Railway y que el próximo `/next` ya pase, sin esperar
    a que el proceso se reinicie.
    """
    crudo = os.getenv(ENV_ENCENDIDO)
    if crudo is None:
        return True
    return crudo.strip().lower() not in {"0", "false", "no", "off", ""}


def brazo_de(player_id: int) -> str:
    """En qué brazo de `dx-rampa-1` cayó esta persona.

    Determinístico y sin estado, igual que el del motor: la misma cuenta da el
    mismo brazo hoy, cuando esa persona vuelva en un mes y cuando el panel lea.
    """
    return sorteo.brazo_de(player_id, EXPERIMENTO, BRAZOS)


def etiqueta_de(player_id: int) -> str:
    """`dx-rampa-1:teclado`, con el formato de `game_players.variant`."""
    return f"{EXPERIMENTO}:{brazo_de(player_id)}"


# Desde cuándo el brazo decide la pantalla de arranque, en UTC ingenuo — que es
# la escala de `game_players.created_at`.
#
# **Existe solo para el cuarto brazo.** Los otros tres no lo necesitan: a quien
# ya venía jugando el teclado le salió completo desde siempre y sus teclas ya
# están desbloqueadas, así que la rampa no le pasa nada y el gate es implícito.
# La bienvenida no tiene esa suerte — salió al 100% el 27/09 y un veterano en el
# brazo `control` la PERDERÍA. Este corte es lo que la deja puesta para toda la
# base que ya la tiene y la vuelve variable solo para quien entra al experimento.
_TZ_JUEGO = ZoneInfo("America/Argentina/Buenos_Aires")
NACIDO_DESPUES_DE = (
    datetime(2026, 9, 28, tzinfo=_TZ_JUEGO)
    .astimezone(ZoneInfo("UTC"))
    .replace(tzinfo=None)
)


def muestra_digest(player) -> bool:
    """Si a esta persona la pantalla de arranque le cuenta novedades.

    Tres casos, y el orden importa:

      1. experimento apagado → sí, para todos. `RAMPA_ENABLED=0` tiene que
         devolver el producto a como estaba, y como estaba la bienvenida era de
         todos;
      2. nació antes del arranque → sí. No está en el experimento y ya la tiene
         puesta desde el 27/09; sacársela sería desinstalarle una feature para
         medir a otra gente;
      3. entró al experimento → solo en el cuarto brazo, que es el punto.
    """
    if not habilitado():
        return True
    nacio = getattr(player, "created_at", None)
    if nacio is None or nacio < NACIDO_DESPUES_DE:
        return True
    return brazo_de(player.id) == "bienvenida"


def con_rampa(player_id: int) -> bool:
    """¿A esta persona le crece el teclado?

    Los dos brazos tratados la tienen: `ayudas` es `teclado` MÁS la fila de
    botones, no otra cosa. Que sea una escalera y no un factorial vive acá.
    """
    return habilitado() and brazo_de(player_id) in ("teclado", "ayudas", "bienvenida")


def con_ayudas(player_id: int) -> bool:
    """¿Esta persona ve la fila de Tabla y Saltear?"""
    return habilitado() and brazo_de(player_id) in ("ayudas", "bienvenida")


def sin_elo(n_servidos: int) -> bool:
    """¿Este ejercicio queda afuera del Elo?

    Va por el NÚMERO de ejercicio y no por el brazo, justamente para que valga
    para los tres. `n_servidos` es 1 para el primero.
    """
    return habilitado() and n_servidos <= SIN_ELO_HASTA
