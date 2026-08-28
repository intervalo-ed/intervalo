"""Escucha las donaciones de Cafecito y aplica el empuje sola, al instante.

Por qué existe
--------------
La mecánica entera depende de que el empuje aparezca YA. Alguien toca el botón,
elige cuántos cafecitos, se va a Cafecito, paga con Mercado Pago y vuelve: si al
volver el juego está igual que cuando se fue, la donación no se siente como una
jugada sino como una transferencia a la nada. Media hora de multiplicador que
llega media hora tarde no llega.

Cafecito no tiene webhook ni API pública, pero sí tiene esto: el canal de alertas
para OBS que se configura en Editar perfil → Alerta para stream. Es un socket que
empuja un evento por cada donación, pensado para que un software automatizado
—OBS, StreamLabs— lo consuma en tu nombre. Es el mismo uso, con otro consumidor.

El protocolo, leído del bundle de la página y verificado contra el servidor de
verdad (backend/scripts/check_cafecito_stream.py):

    conectar wss://cafecito.app/socket/socket.io/?EIO=4&transport=websocket
    <- 0{"pingInterval":25000,...}      apertura de Engine.IO v4
    -> 40                                entrar al namespace por defecto
    <- 40{"sid":"..."}                   adentro
    -> 42["assignUserIdStream",{token}]  decir de qué cuenta somos
    <- 2   ->  3                         ping del servidor, pong nuestro
    <- 42["newMessage",{...}]            UNA DONACIÓN

Se habla a mano en vez de sumar `python-socketio` como dependencia: son cuatro
tramas y ninguna cambia.

El evento
---------
Cafecito manda solo esto (comprobado con alertas de prueba reales):

    cafecito     {"name": "Juan Carlos", "count": 2, "message": "aguante la UBA"}
    suscripción  {"name": "Juan Carlos", "plan": "Latte", "months": 2, "message": "..."}

`count` es la cantidad de cafecitos y `message` es donde vive la sigla. Los planes
se ignoran: no son cafecitos y no tienen cantidad que convertir en multiplicador.

Lo que el evento NO trae es un identificador, así que la idempotencia se fabrica
acá (ver `_referencia`).

Un solo oyente por cuenta
-------------------------
Cafecito entrega cada donación a UNA sola conexión: la última que mandó
`assignUserIdStream`. Los demás oyentes de la misma cuenta quedan sordos sin
enterarse. Por eso el bucle se reanuncia en cada ping — ver el comentario largo
adentro de `_una_vuelta`, que es el que hay que leer antes de sacarlo por
parecer redundante.

Consecuencia práctica: mientras esto corra, la página de alertas de Cafecito y
OBS no van a mostrar nada de esta cuenta. El backend les gana el lugar cada 25
segundos.

Lo que se pierde
----------------
El canal no reproduce lo viejo al conectarse —comprobado: 82 segundos suscripto
en silencio antes de la primera alerta—, así que una donación que llegue con el
proceso caído no se recupera sola. Es el motivo por el que
`backend/scripts/grant_game_boost.py` NO se borra: sigue siendo la red para
aplicar a mano lo que se haya perdido.

Y hay algo peor que el proceso caído, que ya pasó: el 28/08 entraron cinco
cafecitos que NUNCA salieron por este canal. El oyente estaba sano —conexión
establecida contra el borde de Cloudflare, pongs al día, ni un reintento en media
hora— y no llegó una sola trama `newMessage`, cuando ese mismo día habían entrado
bien dos alertas de prueba y dos donaciones reales. O sea: Cafecito a veces no
empuja, y no avisa. Contra eso este módulo no puede hacer nada; lo único que
puede hacer es no dejar dudas de qué lado estuvo la falla, y para eso está el
latido (`PINGS_POR_LATIDO`).
"""

from __future__ import annotations

import hashlib
import json
import os
import threading
import traceback
from datetime import datetime, timedelta

from database import SessionLocal
from models import GameBoost

from . import boosts


def log(mensaje: str) -> None:
    """Una línea de log, con el prefijo con el que se la busca en Railway.

    `print` y no `logging`: el logger raíz de la app queda en WARNING —uvicorn
    configura los suyos y nada más— así que un `logger.info` no se ve en ningún
    lado. El resto del backend ya usa este mismo formato ([seed], [clerk-auth]),
    y para algo que tiene que ser fácil de encontrar cuando alguien reclama su
    empuje, que se vea importa más que que sea elegante.
    """
    print(f"[cafecito] {mensaje}", flush=True)


URL = "wss://cafecito.app/socket/socket.io/?EIO=4&transport=websocket"
ORIGEN = "https://cafecito.app"

# Cuánto se espera antes de reintentar la conexión, y hasta dónde crece. El techo
# es corto a propósito: cada minuto sin escuchar es una donación que puede
# perderse, así que conviene insistir seguido aunque haga ruido en los logs.
ESPERA_INICIAL_S = 2.0
ESPERA_MAXIMA_S = 60.0

# Un socket sano recibe un ping cada 25 s. Sin nada en el doble de esa ventana,
# la conexión está muerta aunque el sistema operativo todavía no se haya enterado
# —el caso clásico es la mitad de la conexión que se cae sin FIN— y hay que
# rearmarla en vez de esperar para siempre.
TIMEOUT_RECV_S = 60.0

# Ventana de la deduplicación. Ver `_ya_aplicado`.
VENTANA_REPETIDO_S = 120

# Cada cuántos pings se deja constancia de que el oyente sigue vivo. Doce pings
# son cinco minutos.
#
# El latido existe porque el silencio de este módulo es ambiguo, y esa ambigüedad
# ya costó una tarde. Cuando alguien dona y el empuje no aparece, el log no
# distingue tres cosas muy distintas: que el socket estaba mudo, que el thread se
# murió sin avisar, o que Cafecito no empujó nada. Las tres se ven igual: nada.
#
# Con el latido, la respuesta se lee de un vistazo: si hay latidos hasta la hora
# de la donación, el oyente estaba sano y el evento nunca salió del otro lado —y
# entonces no hay nada que arreglar acá, hay que aplicar a mano con
# grant_game_boost.py y mirar para el lado de Cafecito.
PINGS_POR_LATIDO = 12



def _huella(evento: dict) -> str:
    """Un identificador estable del CONTENIDO de la donación.

    Cafecito no manda ningún id, así que se fabrica con lo que sí manda. No es un
    identificador de la donación —dos donaciones idénticas de dos anónimos dan la
    misma huella— y por eso nunca se usa solo, siempre con una ventana de tiempo.
    """
    crudo = json.dumps(
        {k: evento.get(k) for k in ("name", "count", "message", "plan", "months")},
        sort_keys=True,
        ensure_ascii=False,
    )
    return hashlib.sha1(crudo.encode("utf-8")).hexdigest()[:24]


def _referencia(huella: str, ahora: datetime) -> str:
    """La clave de idempotencia que queda en `game_boosts.external_ref`.

    Lleva la huella del contenido MÁS el momento, porque la huella sola
    rechazaría para siempre una segunda donación idéntica de la misma persona,
    que es algo perfectamente normal.
    """
    return f"{boosts.FUENTE_SOCKET}{huella}:{int(ahora.timestamp())}"


def _ya_aplicado(db, huella: str, ahora: datetime) -> bool:
    """¿Vimos esta misma donación hace muy poquito?

    El UNIQUE de `external_ref` solo atrapa la repetición si las dos inserciones
    escriben la MISMA cadena, y la referencia lleva un timestamp al segundo: dos
    réplicas que reciben el mismo push con 200 ms de diferencia generan dos
    cadenas distintas y el UNIQUE no las junta. Por eso, antes de aplicar, se
    pregunta por el prefijo —que es solo la huella— dentro de una ventana corta.

    Es lo que hace que la deduplicación no dependa de un borde de reloj.
    """
    desde = ahora - timedelta(seconds=VENTANA_REPETIDO_S)
    return (
        db.query(GameBoost.id)
        .filter(
            GameBoost.external_ref.like(f"{boosts.FUENTE_SOCKET}{huella}:%"),
            GameBoost.created_at > desde,
        )
        .first()
        is not None
    )


def aplicar(evento: dict, ahora: datetime | None = None) -> list[str]:
    """Convierte un evento del socket en empujes. Devuelve qué se otorgó, para el log.

    Vive separada del bucle del socket para que el script de verificación pueda
    probar la decisión entera —planes, repetidos, la escalera de destinos— sin
    abrir ninguna conexión.
    """
    ahora = ahora or datetime.utcnow()

    # Las suscripciones no son cafecitos: no traen `count`, así que no hay
    # cantidad que convertir en multiplicador.
    if evento.get("plan"):
        log(f"suscripcion a {evento.get('plan')!r}, no mueve el juego")
        return []

    try:
        cafecitos = int(evento.get("count") or 0)
    except (TypeError, ValueError):
        cafecitos = 0
    if cafecitos <= 0:
        log(f"evento sin cantidad usable, ignorado: {evento!r}")
        return []

    huella = _huella(evento)
    db = SessionLocal()
    try:
        if _ya_aplicado(db, huella, ahora):
            log(f"repetido ({huella}), ignorado")
            return []
        # La otra vía ya pudo haber cobrado esta misma donación: el aviso de
        # Mercado Pago llega tan rápido como éste. Ver boosts.aviso_repetido.
        if boosts.aviso_repetido(db, cafecitos, boosts.FUENTE_SOCKET, now=ahora):
            log(
                f"la donacion de {cafecitos} cafecito(s) ya habia entrado por el "
                f"mail; no se duplica"
            )
            return []
        creados = boosts.resolve_donation(
            db,
            cafecitos=cafecitos,
            donor_name=(evento.get("name") or None),
            message=(evento.get("message") or None),
            external_ref=_referencia(huella, ahora),
            now=ahora,
        )
        db.commit()
        return [b.university or "TODOS" for b in creados]
    except Exception:
        db.rollback()
        # Ruidoso y fácil de grepear: si esto aparece, alguien pagó y no recibió
        # nada, y hay que arreglarlo a mano con grant_game_boost.py.
        log(f"FALLO AL APLICAR DONACION {evento!r}")
        log(traceback.format_exc())
        raise
    finally:
        db.close()


def _una_vuelta(token: str, parar: threading.Event) -> None:
    """Una conexión, de punta a punta. Vuelve al cortarse, para que se reintente."""
    # Import local: si el paquete faltara, que no voltee el import del módulo —y
    # con él el arranque del API— por una función que quizá ni se use.
    import websocket

    ws = websocket.create_connection(
        URL,
        origin=ORIGEN,
        header={"User-Agent": "intervalo-boost/1.0"},
        timeout=TIMEOUT_RECV_S,
    )
    log("conectado")

    def identificarse() -> None:
        ws.send('42["assignUserIdStream",%s]' % json.dumps({"token": token}))

    pings = 0
    donaciones = 0

    try:
        while not parar.is_set():
            trama = ws.recv()
            if not trama:
                # `recv` devuelve "" para todo lo que no sea texto ni binario: un
                # cierre, un ping del propio websocket. No debería pasar seguido,
                # y si pasa seguido es justo lo que hay que ver.
                log("trama vacia (cierre o ping de websocket)")
                continue
            if trama.startswith("0"):
                ws.send("40")
            elif trama.startswith("40"):
                identificarse()
                log("escuchando donaciones")
            elif trama == "2":
                ws.send("3")
                # Y de paso se reclama el lugar, en CADA ping.
                #
                # No es redundante: Cafecito entrega cada donación a UNA sola
                # conexión, la última que mandó `assignUserIdStream`. Dos oyentes
                # de la misma cuenta no reciben uno cada uno ni los dos — recibe
                # el más nuevo y el otro queda SORDO, con la conexión
                # establecida, recibiendo pings y sin un solo error que lo
                # delate. Medido con dos oyentes en paralelo: el de las 11:07
                # recibió el evento y el de las 10:59 no vio nada.
                #
                # Sin esto, abrir la página del stream o conectar OBS deja al
                # backend mudo PARA SIEMPRE sin avisar. Como el servidor resuelve
                # por "el último gana", reanunciarse lo recupera solo.
                #
                # El ping es el reloj —llega cada 25 s— así que no hace falta ni
                # un timer ni otro thread, y esa es la ventana máxima que se
                # puede quedar sordo. Es también lo que hace que varias réplicas
                # no necesiten coordinarse: el lugar rota entre ellas y cada
                # donación le llega a exactamente una.
                identificarse()

                pings += 1
                if pings % PINGS_POR_LATIDO == 0:
                    log(f"vivo: {pings} pings, {donaciones} donaciones en esta conexion")
            elif trama.startswith("42"):
                nombre, *resto = json.loads(trama[2:])
                if nombre != "newMessage":
                    # No se conoce ningún otro evento en este canal, así que si
                    # aparece uno hay que verlo entero: puede ser el aviso que
                    # estamos esperando con otro nombre.
                    log(f"evento {nombre!r} ignorado: {trama[:300]}")
                    continue
                evento = resto[0] if resto else {}
                donaciones += 1
                log(f"donacion {evento!r}")
                try:
                    otorgados = aplicar(evento)
                except Exception:
                    continue  # ya quedó registrado adentro de `aplicar`
                if otorgados:
                    log(f"empuje para {', '.join(otorgados)}")
            else:
                log(f"trama inesperada: {trama[:120]!r}")
    finally:
        try:
            ws.close()
        except Exception:
            pass


def escuchar(parar: threading.Event) -> None:
    """El bucle de siempre: conectar, escuchar y, si se cae, volver a intentar.

    Corre en un thread (lo arranca el lifespan de main.py) porque
    `websocket-client` y SQLAlchemy son sincrónicos: meterlos en el event loop
    bloquearía todo lo demás.
    """
    token = os.getenv("CAFECITO_STREAM_TOKEN", "").strip()
    if not token:
        log("sin CAFECITO_STREAM_TOKEN, el oyente no arranca")
        return

    espera = ESPERA_INICIAL_S
    while not parar.is_set():
        try:
            _una_vuelta(token, parar)
            espera = ESPERA_INICIAL_S  # se cortó después de haber andado bien
        except Exception as e:
            log(f"conexion caida ({e}); reintento en {espera:.0f}s")
        if parar.wait(espera):
            break
        espera = min(espera * 2, ESPERA_MAXIMA_S)
    log("oyente detenido")
