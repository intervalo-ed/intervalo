"""La pregunta abierta del juego: cuál es, cuándo vale, y qué cuenta como salto.

Funciones puras y sin BD, como `opinion.py`. Lo que decide esto es de qué se
está hablando, y eso tiene que poder leerse sin levantar una sesión.

**Por qué existe una pregunta abierta.** Todo lo demás que el juego sabe lo sabe
porque lo midió: θ y β salen de los aciertos, el embudo sale de las derivadas
resueltas, y la encuesta de dificultad (`opinion.py`) tiene tres respuestas
posibles y las tres las elegimos nosotros. Ninguna de esas fuentes puede decir
algo que no se nos haya ocurrido preguntar. Esta sí.

**La clave y el enunciado van separados.** La clave (`VARITA`) es lo que se
guarda en `game_survey_answers.pregunta` y no cambia nunca; el enunciado se
puede retocar sin que eso quiera decir que la pregunta es otra. El día que la
pregunta SÍ sea otra, se suma una clave nueva y las dos tandas quedan separadas
sin una migración en el medio.
"""

from __future__ import annotations

# ── Las preguntas ────────────────────────────────────────────────────────────

# La varita mágica: el marco clásico de investigación de producto, y acá además
# el único que no suena a formulario de bugs en el medio de una partida.
#
# Los dos verbos son a propósito, aunque alarguen la línea. «Cambiarías» solo
# sesga hacia arreglar lo que ya está, y lo que más falta saber de un juego de
# tres semanas es qué NO está. La debilidad, dicha: una pregunta hipotética
# devuelve deseos de función y no problemas; la que devuelve el texto más
# accionable es la concreta en pasado («¿hubo algo que te dio ganas de cerrar la
# pestaña?»), pero eso se le estaría preguntando justo a quien no la cerró.
VARITA = "varita_v1"

PREGUNTAS: dict[str, str] = {
    VARITA: "Si tuvieras una varita mágica, ¿qué le cambiarías o le agregarías al juego?",
}

# Cuál se está haciendo hoy. Una sola a la vez: dos preguntas abiertas en la
# misma partida son un formulario.
ACTUAL = VARITA


# ── El texto ─────────────────────────────────────────────────────────────────

# Tope de largo. Quinientos entran un párrafo de verdad y frenan el pegado de
# algo que no es una respuesta. No es una validación que la persona pueda
# chocar: el campo del front corta antes, así que llegar acá al tope es una
# llamada hecha a mano.
MAX_LARGO = 500

# Debajo de esto, lo que escribieron es «no quiero contestar».
#
# **Y se clasifica al LEER, no al escribir.** La fila se guarda siempre con lo
# que la persona puso; esta constante solo decide cómo se lee después. Si mañana
# resulta que hay respuestas reales de tres caracteres («+XP»), se cambia el
# número y el histórico se relee entero — cosa que no pasaría si el salto se
# hubiera tirado a la basura en el POST.
LARGO_MINIMO = 3


def limpiar(texto: str) -> str:
    """Recorta espacios y corta al tope. Nada más.

    **Sin allowlist de caracteres**, y esa es la diferencia con `chat.limpiar`.
    Allá la lista blanca existe porque el texto se vuelve contenido público del
    juego para todos los demás, así que hay que dejar afuera enlaces, marcado y
    emojis. Esto no lo lee nadie más que el panel: filtrarlo sería tirar la única
    parte interesante de una respuesta que alguien se tomó el trabajo de
    escribir, incluidos los emojis con los que la gente dice la mitad de lo que
    dice.
    """
    return " ".join(texto.split())[:MAX_LARGO]


def es_salto(texto: str | None) -> bool:
    """¿Esto fue «no quiero contestar»?

    La diapo no tiene botón de saltar: la única salida es escribir algo, y el
    campo acepta cualquier cosa no vacía justamente para que salir salga barato.
    Un "." o un "-" es la forma que tiene alguien de decir que no, y es una
    respuesta legítima a la pregunta «¿querés contestar esto?».

    El día que esta función devuelva `True` para la mitad de las filas, el
    problema no es la gente: es la pregunta.
    """
    if texto is None:
        return False
    return len(texto.strip()) < LARGO_MINIMO
