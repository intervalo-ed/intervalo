"""La segunda vía para enterarse de una donación: el aviso de Mercado Pago.

Por qué existe
-------------
El canal de alertas de Cafecito (cafecito_stream.py) es la vía principal y es
instantánea, pero no es confiable. El 28/08 entraron cinco cafecitos que nunca
salieron por ahí: el oyente estaba sano —conexión establecida, pongs al día, ni
un reintento en media hora— y no llegó una sola trama, el mismo día que por ese
mismo socket habían entrado bien dos donaciones reales. Cafecito a veces no
empuja, y no avisa.

Mercado Pago sí avisa, y rápido: el mail «Pago aprobado» de esa donación perdida
llegó a los pocos segundos del pago. Trae además algo que el evento de Cafecito
no tiene: un número de operación. O sea una clave de idempotencia de verdad, en
lugar del hash del contenido más una ventana de tiempo que hay que fabricar allá.

La cadena entera:

    Mercado Pago → Gmail personal → (filtro que reenvía) → el buzón de acá
    → Resend lo recibe (MX de intervalo.xyz) → webhook email.received
    → inbound_forward → este módulo → boosts

Esto es una RED, no un reemplazo: Cafecito también cobra por transferencia, y esa
plata no pasa por Mercado Pago ni deja mail. La donación de diez cafecitos del
28/08 a las 15:59 no tiene aviso de Mercado Pago en ningún lado; entró solo por
el socket. Cada vía tapa el agujero de la otra.

Por qué el buzón es un secreto
------------------------------
Este camino reparte empujes a partir de un mail, y un mail lo escribe cualquiera.
La firma del webhook prueba que lo mandó Resend, no quién lo escribió: alguien
que sepa la dirección puede inventarse un «Pago aprobado» y fabricarse cafecitos
gratis.

Por eso la dirección no es adivinable y vive en `CAFECITO_MAIL_BUZON`, que además
es el interruptor: sin esa variable no se procesa nada. Sin secreto, apagado. Es
la única postura sensata para algo que reparte premios a partir de texto que
llega de afuera, y es también lo que hace que este archivo sea inofensivo
mientras la variable no esté puesta.

La segunda defensa es el monto: solo se acepta un múltiplo exacto del precio del
cafecito. Cualquier otro cobro que caiga en ese buzón se ignora.

Lo que NO se usa del mail
-------------------------
El nombre y el mail de quien pagó, que el aviso trae. Mercado Pago manda el
nombre legal del pagador, y no es el que la persona eligió escribir en el
formulario de Cafecito: donar tiene un campo de nombre justamente para elegir
cómo aparecer, y el del documento no es esa elección. Como el cartel del juego lo
ve todo el mundo, acá el empuje sale sin nombre. El destino lo deciden las
intenciones abiertas, que además es la señal más fuerte que hay — el juego ya
sabe de qué universidad es quien tocó el botón.
"""

from __future__ import annotations

import html as _html
import os
import re
import traceback
from datetime import datetime

from database import SessionLocal

from . import boosts


def log(mensaje: str) -> None:
    """Igual que en cafecito_stream: print y no logging, y con prefijo propio.

    Comparte la palabra "cafecito" con el otro canal para que un solo grep los
    traiga a los dos, y se distingue de él para poder saber por dónde entró cada
    donación sin leer el resto de la línea.
    """
    print(f"[cafecito-mail] {mensaje}", flush=True)


# Lo que sale un cafecito, en pesos. Es el divisor que convierte el total del
# pago en cantidad y, de paso, el filtro: un cobro que no es múltiplo exacto de
# esto no es una compra de cafecitos y no se toca.
PRECIO_CAFECITO = 100

# Techo de sanidad. Nadie dona diez mil cafecitos; un número así es un monto mal
# leído, y aplicarlo dejaría el juego en el multiplicador máximo por una hora.
MAX_CAFECITOS = 1000

# El prefijo de `external_ref` de esta vía. Ver boosts.FUENTE_MAIL.
REF = boosts.FUENTE_MAIL


# --- leer el aviso ----------------------------------------------------------

_ETIQUETAS = re.compile(r"<[^>]+>")
_ESPACIOS = re.compile(r"\s+")

# El contenido de <style> y <script> NO es texto del mail, pero tampoco está
# adentro de una etiqueta: sacar las etiquetas lo deja suelto en el medio del
# cuerpo. En un mail maquetado eso son miles de caracteres de CSS llenos de
# números, y un solo bloque de esos entre la etiqueta del total y el monto
# alcanzaba para que la donación no se leyera.
_BLOQUES_MUDOS = re.compile(r"<(style|script)\b.*?</\1>", re.IGNORECASE | re.DOTALL)

# "N.° de operación: 176089085046".
#
# El mail trae el número dos veces: una con los dígitos separados por espacios
# (es un truco de accesibilidad para que el lector de pantalla los deletree) y
# otra entero, pegado a los dos puntos. La primera no matchea porque `\d{6,}`
# necesita dígitos seguidos, así que esto encuentra siempre la buena.
_OPERACION = re.compile(r"operaci[oó]n\s*:\s*(\d{6,})", re.IGNORECASE)

# "Total de la operación … $ 500".
#
# El `?` es lo que importa: entre la etiqueta y el monto hay maquetación, y al
# ser perezoso se queda con el PRIMER importe que aparece después del rótulo.
# Importa porque el aviso trae tres montos —el total, los costos de Mercado Pago
# y el neto a acreditar— y solo el primero es lo que donaron.
#
# Antes esto pedía que en el medio no hubiera dígitos, que es más estricto y
# parecía más seguro. Era peor: cualquier número que se colara en la maquetación
# hacía que la donación no se leyera, y una donación que no se lee es alguien que
# pagó y no recibió nada. El riesgo que queda —un `$` perdido entre el rótulo y
# el monto— no existe en ningún aviso que hayamos visto.
_TOTAL = re.compile(
    r"total de la operaci[oó]n.{0,300}?\$\s*([\d.,]+)",
    re.IGNORECASE | re.DOTALL,
)


def _plano(email: dict) -> str:
    """El cuerpo del mail en una sola línea, listo para buscarle cosas.

    Se prefiere la versión de texto y se cae a la HTML sin etiquetas, porque no
    todos los avisos traen las dos partes y el reenvío puede quedarse con una
    sola. Aplastar los espacios es lo que permite que los patrones no dependan de
    dónde cortó las líneas el que reenvió.
    """
    crudo = email.get("text") or ""
    if not crudo.strip():
        sin_mudos = _BLOQUES_MUDOS.sub(" ", email.get("html") or "")
        crudo = _html.unescape(_ETIQUETAS.sub(" ", sin_mudos))
    return _ESPACIOS.sub(" ", crudo)


def _centavos(crudo: str) -> int | None:
    """'1.500,50' → 150050. En centavos para que no decida un float."""
    limpio = crudo.replace(".", "").replace(",", ".")
    try:
        return round(float(limpio) * 100)
    except ValueError:
        return None


def leer(email: dict) -> dict | None:
    """Saca la donación de un aviso de pago. None si el mail no es uno.

    Devolver None no es un error: a este buzón puede caer cualquier cosa, y lo
    que no se entiende se deja pasar sin tocar el juego.
    """
    texto = _plano(email)
    op = _OPERACION.search(texto)
    total = _TOTAL.search(texto)
    if not (op and total):
        return None

    centavos = _centavos(total.group(1))
    if centavos is None or centavos <= 0:
        return None

    paso = PRECIO_CAFECITO * 100
    if centavos % paso:
        # Un cobro que no es múltiplo del precio del cafecito no es una donación.
        log(f"pago de ${centavos / 100:.2f} que no es multiplo de {PRECIO_CAFECITO}, ignorado")
        return None

    cafecitos = centavos // paso
    if cafecitos > MAX_CAFECITOS:
        log(f"pago de {cafecitos} cafecitos, arriba del techo; se ignora por las dudas")
        return None

    return {"operacion": op.group(1), "cafecitos": int(cafecitos)}


# --- aplicarlo --------------------------------------------------------------


def _para_el_buzon(email: dict, buzon: str) -> bool:
    destinos = email.get("to") or []
    if isinstance(destinos, str):
        destinos = [destinos]
    return any(buzon in (d or "").lower() for d in destinos)


def aplicar(email: dict, ahora: datetime | None = None) -> list[str]:
    """Convierte un aviso de pago en empujes. Devuelve a quiénes, para el log.

    Nunca levanta excepción: este camino corre adentro del webhook que además
    reenvía el correo, y un problema repartiendo cafecitos no puede terminar en
    un mail que no llega a la casilla.
    """
    datos = leer(email)
    if datos is None:
        log(f"correo en el buzon que no es un aviso de pago: {email.get('subject')!r}")
        return []

    ahora = ahora or datetime.utcnow()
    db = SessionLocal()
    try:
        if boosts.aviso_repetido(db, datos["cafecitos"], REF, now=ahora):
            log(
                f"la donacion de {datos['cafecitos']} cafecito(s) ya habia entrado "
                f"por el socket; no se duplica (op {datos['operacion']})"
            )
            return []

        creados = boosts.resolve_donation(
            db,
            cafecitos=datos["cafecitos"],
            # Sin nombre a propósito: ver la cabecera del módulo.
            donor_name=None,
            message=None,
            external_ref=f"{REF}{datos['operacion']}",
            now=ahora,
        )
        db.commit()
        destinos = [b.university or "TODOS" for b in creados]
        if destinos:
            log(
                f"donacion de {datos['cafecitos']} cafecito(s) por mail "
                f"(op {datos['operacion']}) → {', '.join(destinos)}"
            )
        else:
            log(f"la operacion {datos['operacion']} ya estaba aplicada")
        return destinos
    except Exception:
        db.rollback()
        # Ruidoso y fácil de grepear: si esto aparece, alguien pagó y no recibió
        # nada, y hay que arreglarlo a mano con grant_game_boost.py.
        log(f"FALLO AL APLICAR LA DONACION DEL MAIL (op {datos['operacion']})")
        log(traceback.format_exc())
        return []
    finally:
        db.close()


def procesar(email: dict, ahora: datetime | None = None) -> bool:
    """¿Este correo era para nosotros? True si sí, y ya se aplicó lo que había.

    El valor de vuelta es lo que le dice a inbound_forward que NO lo reenvíe: los
    avisos de pago vienen del buzón personal, y devolverlos ahí es duplicarle a
    alguien un mail que ya tiene.
    """
    buzon = os.environ.get("CAFECITO_MAIL_BUZON", "").strip().lower()
    if not buzon:
        return False
    if not _para_el_buzon(email, buzon):
        return False
    aplicar(email, ahora)
    return True
