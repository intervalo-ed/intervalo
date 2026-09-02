"""El chat del minijuego: escribir un mensaje y leer los últimos.

Es la primera vez que algo escrito por una persona se vuelve contenido público
del juego para todos los demás. El feed de novedades (`events.py`) no cuenta: ahí
las oraciones las arma el servidor. Así que todo lo que este módulo hace de más
—y hace bastante— es porque acá hay alguien del otro lado escribiendo.

Las tres defensas, en orden de importancia:

1. **Escribir pide cuenta.** No está acá sino en el router, pero es lo que
   sostiene todo lo demás: un invitado se crea con un POST sin credenciales, y su
   token no vence ni se puede revocar. Un mensaje de invitado no tendría a nadie
   detrás a quien pedirle cuentas. Es el mismo criterio con el que `PATCH /me` le
   niega a los invitados elegir su @.
2. **Allowlist, no lista negra.** Se acepta un conjunto chico de caracteres en vez
   de prohibir uno grande. Una lista negra se esquiva con acentos raros,
   homoglifos o un espacio en el medio; la allowlist deja afuera de un saque los
   enlaces, el marcado y los emojis. Es exactamente lo que ya hace
   `_universidad_aceptable` en router.py, que hasta hoy era el único texto libre
   compartido del juego. El arte ASCII (`_TEXTO_ARTE_RE`) es la única excepción,
   y solo para un mensaje de más de un renglón — ver su comentario.
3. **Hasta tres mensajes por minuto.** No vive acá tampoco (es
   `limits.por_jugador(3)`) pero es la tercera pata: sin tope de frecuencia, lo
   demás alcanza para que el mensaje sea corto y sin links, no para que no sean
   mil.

Lo que este módulo NO hace, a propósito: no filtra malas palabras. No hay lista ni
clasificador, y escribir una a mano es garantizar falsos positivos en un país
donde media conversación es puteada afectuosa. Bajar un mensaje se hace con un
UPDATE sobre `hidden`.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.orm import Session

from models import GameMessage, GamePlayer

from . import elo

# Cuántos mensajes se muestran de arranque. Los mismos cuarenta que el feed de
# novedades: es la misma pantalla y no hay motivo para que uno arrastre más
# historia que el otro.
CHAT_LIMIT = 40

# El techo de lo que se puede pedir de una. Gemelo de `events.MAX_LIMIT`: el de
# arriba es el tamaño de la primera pantalla, este es el freno.
MAX_LIMIT = 100

# Qué puede tener un mensaje DE UNA LÍNEA (ver `_TEXTO_ARTE_RE` más abajo para
# el de un dibujo).
#
# Letras con acentos y ñ, dígitos, espacios y la puntuación que se usa
# escribiendo de verdad. Eso deja afuera, sin nombrarlos: los enlaces (no hay
# `/`), el marcado (no hay `<`, `>`, `*`, `_`), los emojis, y los marcadores
# `{a}`/`{u0}` que el feed interpola del lado del cliente.
#
# El `@` queda AFUERA aunque duela: sin él no se puede mencionar a nadie, pero
# tampoco se puede escribir un mail. Mencionar no está en el alcance de esto.
#
# El `^` entra desde el principio: esto es un chat de un juego de derivadas,
# donde «por qué da 12x^2» es una frase normal.
_TEXTO_RE = re.compile(r"^[0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ .,;:!?¡¿'\"()\-+=%°^]+$")

# El de un DIBUJO: todo lo de arriba más los trazos con los que se arma un
# arte ASCII chico (una carita, una caja, un gato de `=^..^=`) y el salto de
# línea. `| \ / _ * ~ # < > [ ] { }` REABREN lo que `_TEXTO_RE` cierra a
# propósito —el marcado (`<`, `>`) y el enlace (`/`)—, y por eso este patrón
# SOLO se usa cuando el mensaje tiene más de un renglón (ver `limpiar`): un
# link o un `<script>` se escriben en una línea, nadie arma uno de casualidad
# adentro de un dibujo de cuatro renglones. Separado así, un mensaje de una
# sola línea sigue pasando exactamente por el mismo filtro que siempre pasó.
#
# El riesgo que `_TEXTO_RE` cerraba nunca fue técnico, de cualquier forma: el
# mensaje se muestra como texto de React (`{mensaje.text}` en chat-panel.tsx,
# sin `dangerouslySetInnerHTML`), así que un `<script>` tipeado se ve tal cual
# se escribió, nunca se ejecuta. Lo que cerraba era la LECTURA —que pareciera
# marcado, o una URL clickeable a mano—, y esa lectura sigue cerrada para
# cualquier mensaje de una línea.
_TEXTO_ARTE_RE = re.compile(
    r"^[0-9A-Za-zÁÉÍÓÚÜÑáéíóúüñ .,;:!?¡¿'\"()\-+=%°^|\\/_*~#<>\[\]{}\n]+$"
)

# Ciento cuarenta caracteres. No es un guiño a nadie: es el largo en el que un
# mensaje sigue entrando en dos renglones de una columna de 420 px, que es el
# ancho del panel del ranking. Más que eso y un solo mensaje se come el chat.
# Sigue siendo el presupuesto TOTAL de un dibujo de varios renglones: un gato
# de cuatro líneas entra cómodo mucho antes de llegar a 140.
MAX_TEXTO = 140

# Renglones de un dibujo. "Pequeñas imágenes", no un mural: más que esto y un
# solo mensaje empuja el resto de la conversación fuera de pantalla.
MAX_LINEAS = 6


class TextoRechazado(Exception):
    """El mensaje no pasa el saneado. `motivo` va tal cual al usuario."""

    def __init__(self, motivo: str):
        super().__init__(motivo)
        self.motivo = motivo


def limpiar(texto: str | None) -> str:
    """El mensaje tal como se guarda, o `TextoRechazado` con el porqué.

    Lo que sale de acá es lo que se muestra: no hay una segunda pasada al leer.
    """
    if not texto:
        raise TextoRechazado("Escribí algo.")
    # Primera pasada: separar en renglones y sacarle a cada uno el espacio
    # sobrante del FINAL —invisible, no aporta nada— para poder decidir cuáles
    # están vacíos. Todavía no se toca el espaciado de ADENTRO de cada
    # renglón: eso depende de si esto termina siendo una frase o un dibujo, y
    # recién se sabe después de sacar los renglones en blanco de las puntas.
    renglones = [r.rstrip() for r in texto.split("\n")]
    # Sin blancos de sobra en las puntas: uno en el medio puede ser el aire que
    # el dibujo necesita, pero abrir o cerrar el mensaje con renglones vacíos
    # no suma nada.
    while renglones and not renglones[0]:
        renglones.pop(0)
    while renglones and not renglones[-1]:
        renglones.pop()
    # Y nunca más de uno seguido: es la misma idea que colapsar espacios
    # repetidos, un nivel más arriba.
    comprimidos: list[str] = []
    for r in renglones:
        if r == "" and comprimidos and comprimidos[-1] == "":
            continue
        comprimidos.append(r)
    if len(comprimidos) > MAX_LINEAS:
        raise TextoRechazado(f"Máximo {MAX_LINEAS} renglones.")
    if len(comprimidos) > 1:
        # Un dibujo vive de su espaciado: correr una sola línea un carácter
        # rompe la alineación entera (un renglón que empieza más adentro que
        # el de arriba, por ejemplo, es lo que dibuja un triángulo). El
        # espacio sobrante del final ya se sacó arriba; el de adentro y el
        # del principio de cada renglón se respetan tal cual se escribieron.
        limpio = "\n".join(comprimidos)
    else:
        # Una frase no depende de la posición exacta de cada espacio: los
        # repetidos se colapsan, como siempre.
        limpio = " ".join(comprimidos[0].split()) if comprimidos else ""
    if not limpio:
        raise TextoRechazado("Escribí algo.")
    if len(limpio) > MAX_TEXTO:
        raise TextoRechazado(f"Máximo {MAX_TEXTO} caracteres.")
    # El patrón ampliado —el que deja `<`, `>`, `/` y compañía— solo se prueba
    # con más de un renglón. Un mensaje de una sola línea pasa por el mismo
    # filtro estricto de siempre, sin excepciones.
    patron = _TEXTO_ARTE_RE if "\n" in limpio else _TEXTO_RE
    if not patron.fullmatch(limpio):
        mensaje = (
            "Solo letras, números, puntuación y símbolos de arte ASCII."
            if "\n" in limpio
            else "Solo letras, números y puntuación. Sin links ni símbolos raros."
        )
        raise TextoRechazado(mensaje)
    # Tiene que decir algo, no ser solo signos — PERO solo en un mensaje de un
    # renglón: ahí una tanda de signos sueltos ("!!!!", "?!?!") es más probable
    # que sea ruido que arte. De dos renglones para arriba nadie arma eso por
    # accidente, así que se lo deja pasar sin letras: un dibujo entero puede
    # ser pura puntuación (una caja, un gato de `=^..^=`).
    if "\n" not in limpio and not any(c.isalnum() for c in limpio):
        raise TextoRechazado("Eso no dice nada.")
    return limpio


def publicar(db: Session, player: GamePlayer, texto: str) -> GameMessage:
    """Guarda un mensaje ya saneado. No commitea: eso lo hace el endpoint.

    El @, la universidad y el nivel se copian ACÁ y no se leen después: un mensaje
    es lo que se dijo en un momento, y quien lo dijo puede cambiar de universidad
    mañana sin que cambie lo que quedó escrito ayer.
    """
    fila = GameMessage(
        player_id=player.id,
        alias=player.alias,
        university=player.university,
        level=elo.level_of(player.theta),
        text=limpiar(texto),
        created_at=datetime.utcnow(),
    )
    db.add(fila)
    db.flush()
    return fila


@dataclass
class MessageView:
    id: int
    alias: str
    level: int
    university: str | None
    text: str
    player_id: int
    seconds_ago: int


def recent(
    db: Session,
    after_id: int = 0,
    limit: int = CHAT_LIMIT,
    before_id: int = 0,
) -> list[MessageView]:
    """Los últimos mensajes, del más nuevo al más viejo.

    Con `after_id` devuelve solo lo que el cliente todavía no vio. Ese cursor es
    lo que hace que el chat no cueste nada: viaja en el sondeo del feed de
    novedades que ya corría cada ocho segundos, y en régimen la respuesta es una
    lista vacía.

    Con `before_id`, lo de MÁS ATRÁS de esa línea: es lo que pide el panel cuando
    se llega arriba de todo scrolleando. Excluyente con `after_id` — son dos
    direcciones, no dos filtros.
    """
    now = datetime.utcnow()
    q = db.query(GameMessage).filter(GameMessage.hidden.is_(False))
    if before_id:
        q = q.filter(GameMessage.id < before_id)
    elif after_id:
        q = q.filter(GameMessage.id > after_id)
    rows = q.order_by(GameMessage.id.desc()).limit(max(1, min(limit, MAX_LIMIT))).all()
    return [
        MessageView(
            id=r.id,
            alias=r.alias,
            level=r.level,
            university=r.university,
            text=r.text,
            player_id=r.player_id,
            # Segundos y no un instante, por lo mismo que en events.py: los
            # datetime del proyecto son naive UTC y compararlos contra el reloj
            # del navegador es pedir un bug de zonas horarias.
            seconds_ago=max(0, int((now - r.created_at).total_seconds())),
        )
        for r in rows
    ]
