"""Checkout Pro: cobrar el cafecito sin intermediario.

Por qué existe
--------------
El embudo del cafecito está medido (docs/reports/2026-09-17-cafecito-embudo.md) y
dice algo incómodo: el cartel convierte bárbaro —uno de cada tres que ve el
pedido toca «Invitar»— y después se cae todo. De 179 intenciones entraron 27
pagos, y la mediana de los que NO pagan es volver al juego a los **28 segundos**,
contra 202 de los que sí. Veintiocho segundos no alcanzan para leer una página,
desconfiar y arrepentirse; alcanzan para aterrizar, ver algo que no es lo que se
esperaba, y cerrar la pestaña.

Lo que se esperaba también está medido: el botón dice «Invitar 10 cafecitos» con
el ícono de Mercado Pago, y la página que abría decía «Invitame 1 Cafecito ·
ARS $100», de una marca que el cartel nunca nombró. Tres cosas se perdían en el
salto —el monto, el multiplicador prometido y la marca— y este módulo es el que
las deja de perder.

Qué arregla, uno por uno
------------------------
1. **El monto viaja.** `unit_price` es exactamente lo que la persona eligió en el
   slider. El checkout abre en $1.000 si eligió diez, no en $100.
2. **La marca no cambia.** El botón ya llevaba el ícono de Mercado Pago a
   propósito («que se reconozca con qué se paga antes de tocarlo»,
   cafecito-panel.tsx). Ahora además es cierto.
3. **La atribución deja de ser una adivinanza.** `external_reference` lleva el
   jugador y la intención, así que la donación vuelve con nombre y apellido. Hoy
   se resuelve por «las intenciones abiertas de los últimos 30 minutos», y eso ya
   falló: 4 de 27 pagos quedaron ambiguos y a esa gente el juego le dijo
   «todavía no llegó» DESPUÉS de haber pagado.

Por qué `mp:` y no un prefijo nuevo
-----------------------------------
El `external_ref` del empuje se arma como `mp:<payment_id>`, que es el MISMO
prefijo y el mismo número que ya escribe el canal del mail
(game/cafecito_email.py, `FUENTE_MAIL`): lo que Mercado Pago llama «N.° de
operación» en el aviso es el id del pago. Eso no es una coincidencia que
aprovechamos, es el diseño: mientras las dos vías convivan, el UNIQUE de
`game_boosts.external_ref` las deduplica solo, sin ventanas de tiempo ni
comparaciones por monto. Las dos pueden avisar de lo mismo y entra una sola vez.

Lo que este módulo NO hace
--------------------------
Acreditar. Acá se habla con Mercado Pago y nada más: crear la preferencia, leer
un pago, validar una firma. Quién cobra el empuje y por cuánto tiempo sigue
siendo de boosts.py, que es donde vive esa decisión desde el primer día.

El interruptor
--------------
Sin `MP_ACCESS_TOKEN` no se crea ninguna preferencia y el juego sigue saliendo
por donde salía. Misma postura que `CAFECITO_MAIL_BUZON` en cafecito_email.py:
sin el secreto, apagado, y el archivo es inofensivo mientras la variable no esté.
"""

from __future__ import annotations

import hashlib
import hmac
import os
import traceback
from datetime import datetime, timedelta, timezone

import httpx

API = "https://api.mercadopago.com"

# Timeout corto y a propósito: esto corre adentro del pedido que la persona está
# esperando con el dedo sobre el botón. Si Mercado Pago tarda más que esto,
# preferimos contestar que no se pudo —el front se queda en la diapo, que es
# recuperable— antes que dejarla mirando una pantalla trabada.
TIMEOUT_S = 8.0

# Lo que sale un cafecito, en pesos. Se importa de boosts para que haya UN solo
# número: hasta ahora era una copia del precio que fijaba Cafecito, y ahora es el
# precio que fijamos nosotros — el que se le cobra de verdad a la gente.
from .boosts import PRECIO_CAFECITO  # noqa: E402

# Cuánto vive una preferencia. Una hora es mucho más de lo que tarda cualquiera
# en pagar (la mediana de los que pagan es 202 segundos) y a la vez evita que un
# link viejo, copiado de una pestaña abierta ayer, siga cobrando a un precio que
# quizá ya cambió.
VENCE_EN_HORAS = 1

# Lo que la persona ve en el resumen de su tarjeta. Trece caracteres es el tope
# que fija Mercado Pago. Importa más de lo que parece: un cargo que no se
# reconoce en el resumen es un contracargo esperando pasar.
DESCRIPTOR = "INTERVALO"


def log(mensaje: str) -> None:
    """print y no logging, con prefijo propio, igual que los otros dos canales.

    Comparte la palabra "cafecito" con `cafecito_stream` y `cafecito_email` para
    que un solo grep traiga los tres, y se distingue de ellos para poder saber
    por dónde entró cada cosa sin leer el resto de la línea.
    """
    print(f"[cafecito-mp] {mensaje}", flush=True)


def _token() -> str:
    return (os.environ.get("MP_ACCESS_TOKEN") or "").strip()


def habilitado() -> bool:
    """¿Hay con qué cobrar? Es el interruptor del módulo entero."""
    return bool(_token())


def _headers() -> dict[str, str]:
    # Sin `X-Idempotency-Key`. Tentaba ponerla —el slider pide una preferencia
    # cada vez que se detiene— pero una clave estable devolvería la preferencia
    # vieja también después de que venza, y ahí el enlace llevaría a un checkout
    # muerto. Crear una de más no cuesta nada; servir una vencida sí.
    return {
        "Authorization": f"Bearer {_token()}",
        "Content-Type": "application/json",
    }


def cuerpo_de_preferencia(
    *,
    player_id: int,
    cafecitos: int,
    university: str | None,
    ahora: datetime | None = None,
) -> dict:
    """Lo que se le manda a Mercado Pago. Separado para poder revisarlo sin red.

    En su propia función y no adentro de `crear_preferencia` porque es lo único
    de este módulo que hay que poder verificar en un check: que el monto sea el
    que la persona eligió, que no se cuele el efectivo, que no aparezcan cuotas
    y que la referencia lleve al jugador. Todo eso decide plata, y un check que
    necesita red no corre.
    """
    vence = (ahora or datetime.now(timezone.utc)) + timedelta(hours=VENCE_EN_HORAS)
    destino = f" para la {university}" if university else ""
    return {
        "items": [
            {
                "id": "cafecito",
                # Se ve en el checkout, en el mail de Mercado Pago y en la
                # actividad de quien pagó. Que diga la universidad no es adorno:
                # es lo único que le recuerda, tres pantallas después, qué es lo
                # que está comprando.
                "title": (
                    f"{cafecitos} cafecitos{destino}"
                    if cafecitos != 1
                    else f"1 cafecito{destino}"
                ),
                "quantity": 1,
                "unit_price": cafecitos * PRECIO_CAFECITO,
                "currency_id": "ARS",
            }
        ],
        "external_reference": referencia(player_id),
        "metadata": {
            "player_id": player_id,
            "cafecitos": cafecitos,
            "university": university,
        },
        # SIN `back_urls` ni `auto_return`, y esto costó una prueba real
        # descubrirlo. El botón abre Mercado Pago en otra pestaña —a propósito,
        # por la PWA: ver el comentario largo en cafecito-panel.tsx— así que una
        # URL de retorno redirige ESA pestaña, no la del juego. El resultado era
        # una segunda partida recién arrancada mientras la original seguía
        # esperando con la diapo abierta, en la PWA y en escritorio.
        #
        # La pestaña original ya sabe hacer esto bien: escucha `focus` y
        # `visibilitychange`, pregunta por `/cafecito-status` y muestra el cartel
        # de «tu cafecito llegó». Es el mismo camino que funcionaba con Cafecito,
        # que tampoco tenía URL de retorno. Sin estos dos campos, Mercado Pago se
        # queda en su pantalla de aprobado y la persona vuelve a donde estaba.
        "statement_descriptor": DESCRIPTOR,
        "payment_methods": {
            # Sin efectivo. Rapipago y Pago Fácil acreditan en horas o días: la
            # persona "paga" y el empuje le aparece cuando el multiplicador ya no
            # significa nada para ella, que es la única forma de que una donación
            # real se sienta como una estafa.
            "excluded_payment_types": [{"id": "ticket"}],
            # Sin cuotas. Entre $100 y $1.000 no tienen sentido, y las que son
            # "sin interés" las paga el que cobra.
            "installments": 1,
        },
        "expires": True,
        "expiration_date_to": vence.isoformat(timespec="milliseconds").replace(
            "+00:00", "Z"
        ),
        # `notification_url` NO va a propósito. La URL del webhook está
        # registrada a nivel aplicación (Tus integraciones → Webhooks), que es lo
        # único que viene firmado con el secreto que valida `firma_valida`.
        # Mandarla acá la pisaría, y tendríamos dos lugares donde mirar cuando
        # algo no llegue.
    }


def crear_preferencia(
    *,
    player_id: int,
    cafecitos: int,
    university: str | None,
) -> str | None:
    """La preferencia del pago. Devuelve el `init_point`, o None si no se pudo.

    Nunca levanta: esto corre adentro del pedido que dispara el botón, y un error
    de red de Mercado Pago no puede convertirse en un 500 en la cara de alguien
    que estaba por donar. Devolver None es «no se pudo», y quien llama decide qué
    mostrar.

    `external_reference` es la pieza que cambia el juego. Lleva el jugador, así
    que cuando el pago vuelve —por webhook o por la URL de retorno— ya no hay que
    adivinar de quién era: se lee. La ventana de 30 minutos y el reparto entre
    intenciones abiertas siguen existiendo para las donaciones que entren por el
    mail, pero dejan de ser el único camino.

    `metadata` va además del `external_reference` y no en su lugar: el primero es
    un string plano que viaja a todos lados (incluida la URL de retorno), y el
    segundo es estructurado y solo se ve consultando el pago. Tener los dos es lo
    que permite reconstruir qué se cobró sin cruzar contra nuestra base.
    """
    if not habilitado():
        return None
    cuerpo = cuerpo_de_preferencia(
        player_id=player_id, cafecitos=cafecitos, university=university
    )
    try:
        r = httpx.post(
            f"{API}/checkout/preferences",
            json=cuerpo,
            headers=_headers(),
            timeout=TIMEOUT_S,
        )
        r.raise_for_status()
        datos = r.json()
    except Exception as e:  # noqa: BLE001 — ver el docstring: acá no se levanta
        log(f"no se pudo crear la preferencia del jugador {player_id}: {e}")
        return None

    destino_url = datos.get("init_point")
    if not destino_url:
        log(f"preferencia sin init_point para el jugador {player_id}: {datos}")
        return None
    log(f"preferencia {datos.get('id')} · jugador {player_id} · {cafecitos} cafecitos")
    return destino_url


def referencia(player_id: int) -> str:
    """`dx:<jugador>`, la clave que hace exacta la atribución.

    En una función y no interpolada en los dos lugares donde se usa, porque
    escribirla y leerla tienen que coincidir carácter por carácter: si se
    separan, el pago vuelve y no se le encuentra dueño — que es exactamente el
    problema que este módulo vino a resolver.

    Lleva el jugador y no la intención porque la preferencia se crea ANTES de
    que exista la intención: el `href` del enlace tiene que estar listo antes
    del click (ver `router.cafecito_checkout`). Alcanza de sobra — lo que hacía
    falta era saber de quién es el pago, y el pago ya trae su propio id único
    para no contarse dos veces.
    """
    return f"dx:{player_id}"


def leer_referencia(externa: str | None) -> int | None:
    """El jugador de una `external_reference`. None si no es una de las nuestras.

    Tolerante a propósito: a la cuenta pueden entrar pagos que no salieron del
    juego —el link de Mercado Pago circulando suelto, un cobro por otra cosa— y
    esos no tienen que romper nada, solo caer al camino de siempre.
    """
    if not externa or not externa.startswith("dx:"):
        return None
    partes = externa.split(":")
    if len(partes) < 2:
        return None
    try:
        return int(partes[1])
    except ValueError:
        return None


def leer_pago(payment_id: str | int) -> dict | None:
    """El pago, consultado a Mercado Pago. None si no se pudo leer.

    Se consulta SIEMPRE, incluso cuando el dato llega por la URL de retorno con
    el estado adentro: esos parámetros los escribe el navegador de quien paga y
    cualquiera puede inventarlos. Lo único que vale es lo que contesta la API con
    nuestro token.
    """
    if not habilitado():
        return None
    try:
        r = httpx.get(
            f"{API}/v1/payments/{payment_id}",
            headers=_headers(),
            timeout=TIMEOUT_S,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:  # noqa: BLE001
        log(f"no se pudo leer el pago {payment_id}: {e}")
        return None


def aplicar(db, pago: dict) -> str:
    """Un pago de Mercado Pago convertido en empuje. Devuelve qué pasó, para el log.

    **Es el único lugar donde eso ocurre**, y por eso existe: la llaman las dos
    vías —el webhook, que es el push, y la reconciliación, que es la red de
    abajo— y si cada una tuviera su copia terminarían acreditando distinto. Es
    la misma razón por la que `_sesiones` vive en un solo lado en el panel.

    Lo que decide acá es la traducción —de quién es, cuántos cafecitos son— y
    nada más. Cuánto dura el empuje y a qué universidad va lo sigue decidiendo
    boosts.py, que es donde vive esa regla desde el primer día.
    """
    from models import GamePlayer  # local: models importa medio mundo

    from . import boosts

    pago_id = pago.get("id")
    if pago.get("status") != "approved":
        return f"pago {pago_id} en estado {pago.get('status')}, no se acredita"

    player_id = leer_referencia(pago.get("external_reference"))
    if player_id is None:
        # Un cobro que no salió del juego. En una cuenta personal esto es lo
        # normal, no la excepción: conviven los cobros de otras cosas.
        return f"pago {pago_id} ajeno al juego, ignorado"

    centavos = round(float(pago.get("transaction_amount") or 0) * 100)
    paso = PRECIO_CAFECITO * 100
    if centavos <= 0 or centavos % paso:
        return f"pago {pago_id} de ${centavos / 100:.2f}, que no es múltiplo del precio"
    cafecitos = int(centavos // paso)

    player = db.query(GamePlayer).filter(GamePlayer.id == player_id).first()
    if player is None:
        return f"pago {pago_id} de un jugador que no existe ({player_id})"

    # El mail con el que pagó. Es lo único que permite agradecerle a quien donó
    # sin cuenta, que es la mitad de los donantes — ver el comentario de la
    # columna en models.py sobre para qué SÍ y para qué NO se puede usar.
    correo = ((pago.get("payer") or {}).get("email") or "").strip() or None
    boost = boosts.acreditar_pago(db, player, cafecitos, pago_id, donor_email=correo)
    if boost is None:
        return f"pago {pago_id} ya estaba aplicado"
    return (
        f"pago {pago_id} · {cafecitos} cafecitos · "
        f"@{player.alias} · {player.university or 'GLOBAL'}"
    )


# --- la red de abajo: reconciliar contra la fuente de verdad -----------------

# Cada cuánto se revisa si falta acreditar algo. Diez minutos es más rápido que
# el primer reintento de Mercado Pago (15 min) sin ser un sondeo: en el caso
# normal la consulta devuelve los mismos pagos que ya están y no escribe nada.
RECONCILIAR_CADA_S = 600

# Cuánto para atrás se mira en cada vuelta. Un día es mucho más que cualquier
# corte imaginable y alcanza para que un despliegue largo, o un webhook que se
# perdió entero, se recupere solo antes de que nadie se entere.
VENTANA_DIAS = 1


def pagos_del_juego(dias: int = VENTANA_DIAS) -> list[dict]:
    """Los pagos aprobados de los últimos `dias` que salieron del juego.

    El filtro por `external_reference` se hace acá y no en la consulta porque la
    API filtra por referencia EXACTA y lo que hace falta es un prefijo: son
    todos los jugadores, no uno. Traer la ventana entera y descartar lo ajeno
    también es lo que hace que esto sea seguro en una cuenta personal — que es
    justo el caso: en la cuenta conviven 618 pagos, la mayoría de otra cosa.
    """
    if not habilitado():
        return []
    try:
        r = httpx.get(
            f"{API}/v1/payments/search",
            params={
                "sort": "date_created",
                "criteria": "desc",
                "range": "date_created",
                "begin_date": f"NOW-{dias}DAYS",
                "end_date": "NOW",
                "limit": 100,
            },
            headers=_headers(),
            timeout=TIMEOUT_S * 2,
        )
        r.raise_for_status()
        filas = r.json().get("results") or []
    except Exception as e:  # noqa: BLE001
        log(f"no se pudo listar los pagos: {e}")
        return []
    return [
        p
        for p in filas
        if p.get("status") == "approved"
        and leer_referencia(p.get("external_reference")) is not None
    ]


def reconciliar(dias: int = VENTANA_DIAS) -> int:
    """Acredita lo que el webhook no trajo. Devuelve cuántos rescató.

    Es el reemplazo del canal del mail, y lo reemplaza siendo mejor en las tres
    cosas que a aquel le faltaban:

    - **No depende de nadie.** El mail viajaba por Gmail, un filtro y Resend;
      tres eslabones de terceros entre el pago y el empuje. Esto le pregunta a
      Mercado Pago por lo que Mercado Pago sabe.
    - **No confunde un cobro ajeno con una donación.** La única guarda del mail
      era que el monto fuera múltiplo de $100, y la cuenta es personal: un cobro
      de $6.000 por otra cosa entraba como sesenta cafecitos. Acá entra solo lo
      que lleva nuestra `external_reference`.
    - **No puede duplicar.** Todo pasa por `aplicar`, y el UNIQUE de
      `external_ref` rebota lo que ya entró.

    Que no escriba nada es el caso normal y no una señal de que sobra: existe
    para el día que Mercado Pago reintente cinco veces contra un backend caído,
    o para el pago cuyo aviso nunca llegue. Es el mismo seguro que
    `grant_game_boost.py` era hasta hoy, pero sin que haya que acordarse.
    """
    from database import SessionLocal

    pagos = pagos_del_juego(dias)
    if not pagos:
        return 0
    rescatados = 0
    db = SessionLocal()
    try:
        for pago in pagos:
            resultado = aplicar(db, pago)
            if "cafecitos ·" in resultado:
                db.commit()
                rescatados += 1
                log(f"RESCATADO por reconciliación — {resultado}")
            else:
                db.rollback()
    finally:
        db.close()
    return rescatados


def vigilar(parar) -> None:
    """El hilo que reconcilia cada tanto. Mismo molde que el oyente de Cafecito.

    Daemon y con un `threading.Event` para frenarlo, igual que
    `cafecito_stream.escuchar`: es el mismo lugar del arranque y el mismo
    contrato, solo que mirando la fuente de verdad en vez de un socket que no
    reproduce lo que se perdió.

    La primera vuelta espera antes de correr: recién arrancado el proceso, lo
    último que hace falta es una consulta más mientras se levanta todo.
    """
    if not habilitado():
        log("sin MP_ACCESS_TOKEN: la reconciliación no arranca")
        return
    log(f"reconciliación cada {RECONCILIAR_CADA_S}s, mirando {VENTANA_DIAS} día(s) atrás")
    while not parar.wait(RECONCILIAR_CADA_S):
        try:
            reconciliar()
        except Exception:  # noqa: BLE001
            # Nunca muere: es la red de abajo, y una red que se cae con la
            # primera excepción no es una red.
            log("la reconciliación falló esta vuelta:\n" + traceback.format_exc())


def firma_valida(
    x_signature: str | None,
    x_request_id: str | None,
    data_id: str | None,
) -> bool:
    """¿La notificación la mandó Mercado Pago?

    El header `x-signature` viene como `ts=<epoch>,v1=<hmac>`, y el HMAC-SHA256
    se calcula sobre este molde exacto, con el secreto de la aplicación:

        id:<data.id>;request-id:<x-request-id>;ts:<ts>;

    Sin esto, el endpoint sería un botón público para fabricarse empujes: basta
    con postear un id de pago ajeno. Es la misma postura que el webhook de
    Resend, que también verifica antes de mirar el cuerpo.

    Sin `MP_WEBHOOK_SECRET` devuelve False y no True: un secreto que falta es una
    configuración a medias, y ante la duda no se acredita nada.
    """
    secreto = (os.environ.get("MP_WEBHOOK_SECRET") or "").strip()
    if not (secreto and x_signature and data_id):
        return False

    partes = {}
    for trozo in x_signature.split(","):
        if "=" in trozo:
            clave, valor = trozo.split("=", 1)
            partes[clave.strip()] = valor.strip()
    ts, recibida = partes.get("ts"), partes.get("v1")
    if not (ts and recibida):
        return False

    # En minúsculas porque Mercado Pago lo pide explícitamente para los ids
    # alfanuméricos (los de Orders llegan en mayúsculas); para un id numérico es
    # un no-op y deja el código andando igual si algún día cambia el formato.
    molde = f"id:{str(data_id).lower()};request-id:{x_request_id or ''};ts:{ts};"
    esperada = hmac.new(
        secreto.encode("utf-8"), molde.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(esperada, recibida)
