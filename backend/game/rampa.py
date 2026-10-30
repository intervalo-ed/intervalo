"""`dx-rampa-1`: el teclado que crece y las ayudas a la vista.
**CERRADO el 30/10/2026, por decisión de producto y no por lectura.** Ganó el
escalón de arriba de la escalera —`bienvenida`: teclado en rampa, fila de
ayudas y pantalla de arranque con novedades— y eso es ahora el juego para todo
el mundo, viejos y nuevos. Este módulo ya no decide nada: el router sirve
siempre la rampa (`keyboard.unlock`), el front dibuja siempre la fila de Tabla
y Saltear, y `/bienvenida` le cuenta novedades a cualquiera. Lo que queda acá es
lo que el panel necesita para mostrar lo que se juntó mientras corrió —el
sorteo, que es determinista, y la fecha de arranque— y nada más.

**Por qué se cerró sin llegar al n comprometido.** El juego se porta a una app
nativa (React Native) y se quiere UN flujo, sin lógica de experimento que
replicar del otro lado. Se queda la punta de la escalera porque es el producto
completo que se diseñó; el panel lo dice con todas las letras
(`metrics/game_queries.py :: EXPERIMENTO_RAMPA`): no es un veredicto.

Lo que sobrevivió del experimento como comportamiento del motor es que los tres
primeros ejercicios no mueven el Elo, y vive en `elo.py :: SIN_ELO_HASTA`.

## Qué era

**La hipótesis.** El 18,3% de la gente a la que el juego le sirve su primera
derivada **no escribe nada**: la ve y se va. Y de los que sí escriben, el 18,8%
contesta una sola. Medido sobre 2.056 personas, solo el **61,92%** llega a la
tercera derivada. Este experimento probaba dos cosas contra eso:

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
"""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from . import sorteo

EXPERIMENTO = "dx-rampa-1"

# El índice ES el bucket (ver `sorteo.brazo_de`). Con el experimento cerrado ya
# no reparte nada, pero el panel reconstruye el brazo de cada uno con esto, así
# que el orden sigue sin tocarse.
BRAZOS = ("control", "teclado", "ayudas", "bienvenida")


def brazo_de(player_id: int) -> str:
    """El brazo que le tocó a cada jugador mientras el experimento corrió. El
    hash es determinista, así que se puede reconstruir sin columna."""
    return sorteo.brazo_de(player_id, EXPERIMENTO, BRAZOS)


# Desde cuándo el brazo decidía la pantalla de arranque, en UTC ingenuo — que es
# la escala de `game_players.created_at`. Mientras corrió, quien había nacido
# antes la veía igual (salió al 100% el 27/09 y sacársela habría sido
# desinstalarle una feature para medir a otra gente). Queda como referencia de
# quién entró al experimento.
_TZ_JUEGO = ZoneInfo("America/Argentina/Buenos_Aires")
NACIDO_DESPUES_DE = (
    datetime(2026, 9, 28, tzinfo=_TZ_JUEGO)
    .astimezone(ZoneInfo("UTC"))
    .replace(tzinfo=None)
)
