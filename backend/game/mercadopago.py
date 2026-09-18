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
# `precio_de` es el mismo número mirado por país (ver boosts.PRECIO_POR_PAIS).
from .boosts import PRECIO_CAFECITO, precio_de  # noqa: E402

# La moneda, y la única que esta cuenta puede cobrar. No es una decisión nuestra:
# la cuenta es `site_id: MLA` y la API rechaza cualquier otra con
# `{"message": "currency_id invalid", "error": "invalid_items"}` — probado contra
# producción el 18/09/2026. Cobrar en pesos uruguayos necesitaría una cuenta MLU,
# que a su vez necesita cédula y banco uruguayos.
MONEDA = "ARS"

# Cuánto vive una preferencia. Una hora es mucho más de lo que tarda cualquiera
# en pagar (la mediana de los que pagan es 202 segundos) y a la vez evita que un
# link viejo, copiado de una pestaña abierta ayer, siga cobrando a un precio que
# quizá ya cambió.
VENCE_EN_HORAS = 1

# Lo que la persona ve en el resumen de su tarjeta. Trece caracteres es el tope
# que fija Mercado Pago. Importa más de lo que parece: un cargo que no se
# reconoce en el resumen es un contracargo esperando pasar.
#
# Pisa al `soft_descriptor` de la cuenta, que hoy dice "NICOLASVRANC" — ver el
# comentario de MARCA acá abajo, que es el mismo problema en la otra pantalla.
DESCRIPTOR = "INTERVALO"

# La marca, adelante del título del ítem. En minúsculas y con el nombre entero
# porque acá no hay límite de trece caracteres: son dos lugares distintos.
#
# Por qué está. El checkout dibuja arriba de todo el nombre del vendedor, y en
# una cuenta personal ese nombre es el del titular: hoy dice «Nicolás
# Vrancovich». No se puede cambiar sin convertir la cuenta en una empresa con
# CUIT propio (`company.brand_name` existe pero está atado a la identidad de la
# cuenta), así que la única pantalla que controlamos es esta línea.
#
# Y la persona llega acá desde un botón con el ícono de Mercado Pago adentro de
# un juego que se llama Intervalo. Que lo primero que lea sea el nombre de un
# desconocido es exactamente la desconfianza que este módulo vino a sacar del
# camino. Que la marca aparezca en la misma pantalla no borra el nombre, pero lo
# explica.
MARCA = "Intervalo"


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


def _titulo(cafecitos: int, university: str | None, monto: int, pais: str | None) -> str:
    """Lo que se lee arriba del monto, en el checkout y en el mail del pago.

    Para quien mira desde Argentina es la línea de siempre: «10 cafecitos para la
    UTN». Para quien mira desde afuera lleva pegada la moneda, y eso **no es
    adorno, es el arreglo de un error de lectura medido**.

    Mercado Pago dibuja el monto como `$ 1.514` y en ninguna parte de esa pantalla
    aparece la palabra «ARS» — lo verifiqué contra un checkout real. El signo `$`
    también es el peso uruguayo, así que alguien en Montevideo lee mil quinientos
    pesos uruguayos, o sea unos treinta y siete dólares, cuando le están pidiendo
    uno. Es el mismo error que hacía fracasar el salto a Cafecito, con la
    diferencia de que allá se perdía el monto y acá se pierde la unidad.

    El título es lo ÚNICO que controlamos de esa pantalla: no hay forma de
    cambiarle la moneda, ni el formato, ni el símbolo, ni el nombre del vendedor
    que va arriba de todo. Así que todo lo que hay para decir va acá: la marca
    primero —porque es lo que la persona reconoce y lo que el nombre del titular
    no le dice—, después qué compra, y al final la moneda si hace falta.
    """
    destino = f" para la {university}" if university else ""
    cuantos = f"{cafecitos} cafecitos" if cafecitos != 1 else "1 cafecito"
    partes = [MARCA, f"{cuantos}{destino}"]
    if pais is not None:
        partes.append(f"{MONEDA} {monto:,}".replace(",", "."))
    return " · ".join(partes)


def cuerpo_de_preferencia(
    *,
    player_id: int,
    cafecitos: int,
    university: str | None,
    pais: str | None = None,
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
    unitario = precio_de(pais)
    monto = cafecitos * unitario
    return {
        "items": [
            {
                "id": "cafecito",
                # Se ve en el checkout, en el mail de Mercado Pago y en la
                # actividad de quien pagó. Que diga la universidad no es adorno:
                # es lo único que le recuerda, tres pantallas después, qué es lo
                # que está comprando.
                "title": _titulo(cafecitos, university, monto, pais),
                "quantity": 1,
                "unit_price": monto,
                "currency_id": MONEDA,
            }
        ],
        "external_reference": referencia(player_id),
        # Lo que se cobró, escrito en el pago mismo.
        #
        # `cafecitos` está acá desde el primer día, pero hasta ahora era
        # decorativo: quien acreditaba lo deducía dividiendo el monto por el
        # precio. Eso funcionaba mientras hubiera UN precio y dejó de funcionar
        # el día que hay uno por país — una donación uruguaya de $1.500 se habría
        # acreditado como quince cafecitos en vez de diez, en silencio y sin
        # error. Ahora `aplicar` lee este número y `precio_unitario` es con lo
        # que lo verifica, así que el precio puede moverse sin que se rompa nada.
        "metadata": {
            "player_id": player_id,
            "cafecitos": cafecitos,
            "university": university,
            "precio_unitario": unitario,
            "pais": pais,
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
    pais: str | None = None,
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
        player_id=player_id, cafecitos=cafecitos, university=university, pais=pais
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


def _cuantos_cafecitos(pago: dict) -> int | None:
    """Cuántos cafecitos son. None si el monto no cierra con ningún precio.

    **Se leen de la metadata y se verifican contra el monto**, en ese orden, y el
    orden es el arreglo. Antes se hacía solo la cuenta —monto dividido cien— y
    eso alcanzaba mientras un cafecito valiera lo mismo para todo el mundo. Desde
    que el precio depende del país (boosts.PRECIO_POR_PAIS), la división acredita
    mal sin quejarse: los diez cafecitos de un uruguayo son $1.500, y $1.500
    dividido cien son quince.

    La metadata es confiable porque es NUESTRA: la escribimos al crear la
    preferencia y Mercado Pago nos la devuelve tal cual. No la manda quien paga y
    no se puede tocar desde afuera. Aun así se verifica contra el monto, porque
    metadata y plata que no coinciden significan que algo se cobró distinto de lo
    que se prometió, y eso hay que mirarlo antes que acreditarlo.

    El camino viejo sigue vivo abajo, y no por nostalgia: los pagos que entraron
    antes de este cambio no tienen `precio_unitario`, y la reconciliación mira un
    día para atrás.
    """
    centavos = round(float(pago.get("transaction_amount") or 0) * 100)
    if centavos <= 0:
        return None

    from . import boosts

    meta = pago.get("metadata") or {}
    if "precio_unitario" in meta:
        # Pago creado DESPUÉS del precio por país. Acá la metadata manda, y si no
        # cierra no se acredita nada: caer al camino de abajo sería volver a
        # dividir por el precio argentino, que es exactamente el error que esta
        # función viene a evitar. Un pago nuestro que no se entiende es algo para
        # mirar, no para adivinar.
        declarados = meta.get("cafecitos")
        unitario = meta.get("precio_unitario")
        if (
            _entero(declarados)
            and _entero(unitario)
            and 1 <= declarados <= boosts.MAX_CAFECITOS_PER_DONATION
            and unitario > 0
            and centavos == declarados * unitario * 100
        ):
            return declarados
        return None

    # Sin `precio_unitario`: es un pago anterior a este cambio —la reconciliación
    # mira un día para atrás— y de esos sabemos que se cobraron al precio
    # argentino. La cuenta de siempre.
    paso = PRECIO_CAFECITO * 100
    if centavos % paso:
        return None
    return int(centavos // paso)


def _entero(v) -> bool:
    """int de verdad. `isinstance(True, int)` es True en Python, y un booleano
    donde va una cantidad es un dato roto, no una cantidad de uno."""
    return isinstance(v, int) and not isinstance(v, bool)


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

    cafecitos = _cuantos_cafecitos(pago)
    if cafecitos is None:
        monto = float(pago.get("transaction_amount") or 0)
        return f"pago {pago_id} de ${monto:.2f}, que no cierra con ningún precio"

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
