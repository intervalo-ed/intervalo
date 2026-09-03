"""Cuándo el resumen de sesión pide algo, y cuál de las dos cosas pide.

Suelto y sin base de datos —una función pura de cinco números— para que se pueda
comprobar solo: equivocarse en la cadencia o en la separación no se ve probando
la app (hay que terminar seis sesiones para enterarse) sino semanas después, en
el embudo. Ver backend/scripts/check_pedidos_del_resumen.py.

Es el gemelo de `reclutas-trigger.ts` y `cafecito-cta.tsx` del minijuego, pero
del lado del SERVIDOR, y no por gusto: una de las señales —haber instalado la
PWA— vive en la base y no en el dispositivo (quien la instaló en el teléfono y
abre en la compu tiene que contar igual), y la separación entre los dos pedidos
necesita recordar en qué sesión fue el anterior.
"""

from __future__ import annotations

# Los dos únicos pedidos que hace Intervalo. Como strings y no como enum porque
# viajan tal cual en la respuesta del resumen.
CAFECITO = "cafecito"
RECLUTAS = "reclutas"

# Cada cuántas sesiones sale el cafecito, y en qué resto de esa misma cuenta sale
# el de reclutas.
#
# Seis y tres: café en 6, 12, 18… y WhatsApp en 3, 9, 15…, entrelazados y a tres
# sesiones de distancia. Es la misma forma que el minijuego (RECLUTAS_CADA /
# RECLUTAS_RESTO en reclutas-trigger.ts) y por el mismo motivo: son las dos
# únicas cosas que Intervalo pide, y alternarlas es lo que evita que una tape a
# la otra.
#
# Reclutar cae ANTES que el café en cada vuelta porque no le cuesta plata a
# nadie y es lo que hace crecer la app; el café llega después, con más sesiones
# jugadas que lo justifiquen.
PEDIDO_CADA = 6
RECLUTAS_RESTO = 3

# Sesiones que tienen que pasar entre dos pedidos, sean del tipo que sean.
#
# Con la cadencia sola no alcanza: el cafecito también sale en los HITOS de
# racha, que caen en cualquier número de sesión y pueden aterrizar justo al lado
# de un pedido de reclutas. Sin esta guarda, terminar dos sesiones seguidas
# podía dar WhatsApp y café pegados.
SEPARACION = 2

# Días de actividad antes de los cuales no se pide absolutamente nada. Quien
# todavía está probando la app no tiene por qué recibir un pedido como tercera
# pantalla.
DIAS_MINIMOS = 3


def pedido_del_resumen(
    *,
    session_number: int,
    tier_reached: bool,
    streak_days: int,
    tiene_pwa: bool,
    tiene_handle: bool,
    ultimo_pedido: int | None,
) -> str | None:
    """Qué pedir en el resumen de la sesión `session_number`, o None.

    `tier_reached` es «hoy cayó justo en un hito de racha», o sea la pantalla en
    la que la persona acaba de ver subir su multiplicador. Pedir ahí es distinto
    de pedir en frío, así que el café aprovecha ese momento además de su
    cadencia.

    `tiene_handle` es la señal que le falta al pedido de reclutas: el link lleva
    `?r=<@>`, y sin @ el botón sale apagado sin explicación y el link que se
    muestra abajo no atribuye a nadie. Esa pantalla no es un pedido, es un
    callejón — y encima gastaba el turno, así que el pedido siguiente esperaba
    otra vuelta entera por una pantalla que no ofrecía nada.

    `ultimo_pedido` es el `session_number` del último pedido que se mostró. Si es
    el de ESTA sesión el pedido se repite tal cual: el resumen se puede refetchear
    y no puede apagarse con la persona mirándolo.
    """
    if streak_days < DIAS_MINIMOS:
        return None

    # El café primero, que es la prioridad: cuando los dos caerían en la misma
    # sesión —un hito de racha sobre un múltiplo de reclutas— gana el café y el
    # WhatsApp se saltea esa vuelta, no se apila detrás.
    if tiene_pwa and (tier_reached or session_number % PEDIDO_CADA == 0):
        pedido = CAFECITO
    elif tiene_handle and session_number % PEDIDO_CADA == RECLUTAS_RESTO:
        pedido = RECLUTAS
    else:
        return None

    # La separación mira hacia atrás y no distingue de qué tipo fue el pedido
    # anterior: dos pantallas de pedido seguidas cansan igual sean del mismo o de
    # distinto tipo. La resta negativa también cae acá, que es lo correcto:
    # reabrir el resumen de una sesión VIEJA no vuelve a pedir nada.
    if ultimo_pedido is not None and ultimo_pedido != session_number:
        if session_number - ultimo_pedido < SEPARACION:
            return None

    return pedido
