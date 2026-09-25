"""¿Le están saliendo repetidas? — funciones puras, sin BD.

Gemelo de `opinion.py` y por el mismo motivo: de qué se está hablando tiene que
poder leerse sin levantar una sesión.

**Qué mide y por qué no alcanzaba con la de dificultad.** Las dos preguntas están
correlacionadas por construcción, y ahí está el problema que este módulo viene a
resolver: cuando el catálogo se queda sin tiers, el selector repite; cuando
repite, la derivada se siente fácil. Preguntando solo por dificultad, las dos
cosas llegan mezcladas en el mismo voto y no hay manera de saber cuál arrastra a
cuál. Lo que las separa no es una segunda opinión: es el dato objetivo al lado.
Por eso acá el voto viaja siempre con cuántas plantillas y cuántos enunciados
distintos vio esa persona, congelados (ver `models.GameRepetitionVote`).

**Este voto no ajusta nada.** No hay un equivalente de «el voto elige el signo,
la evidencia elige el tamaño»: la ventana de exclusión del selector
(`generator._RECENT_EXCLUDE`) es una constante global y no una preferencia por
persona. Volverla personal es un diseño propio, y conviene hacerlo con estos
números en la mano y no antes.

**La ventana cuenta TODO lo servido.** Es la diferencia con `opinion.py`, que
filtra los primeros intentos sin tabla abierta, y no es un descuido: allá se está
midiendo si el motor acertó la dificultad, así que un acierto al tercer intento o
copiado de la tabla contamina. Acá se está midiendo qué VIO la persona, y una
derivada salteada se vio igual — de hecho saltearla es la reacción más probable a
la cuarta vez de la misma.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

# Los tres votos. `justo` es literalmente la misma palabra que en la encuesta de
# dificultad y en el canal A del clásico, y eso es a propósito: los tres canales
# se cruzan sin una tabla de traducción en el medio. Pero significa otra cosa
# —acá es «ni variadas ni repetidas»—, así que agrupar por valor sin filtrar por
# canal mezcla tres preguntas distintas.
VARIADO = "variado"
JUSTO = "justo"
REPETITIVO = "repetitivo"
VOTOS: tuple[str, ...] = (VARIADO, JUSTO, REPETITIVO)

# Cuántos ejercicios para atrás mira el dato objetivo.
#
# Treinta, que es como tres sesiones: la mediana de una tanda es de 9 derivadas
# (panel de Jugabilidad, curva de profundidad). Ese es el tramo que alguien tiene
# en la cabeza cuando dice «se repiten», y por eso la ventana se mide en
# ejercicios y no en tiempo.
#
# Más corta no serviría: el reporte que originó el arreglo del 10/09 contaba «4
# veces la misma en 10 oportunidades», así que con 10 el contador se satura
# enseguida y deja de distinguir a quien ve 8 plantillas de quien ve 3. Más larga
# tampoco: a las 60 ya entran sesiones de otro día, cuando la persona estaba en
# otro θ y el selector le servía otra banda.
VENTANA = 30

# Debajo de esto no se guarda ningún contador: con menos ejercicios vistos, «vio
# 5 plantillas distintas» no dice si el juego es variado o si recién empezó.
#
# Diez y no `opinion.MIN_RESPUESTAS` (8) porque lo que hace falta acá es otra
# cosa: allá el mínimo protege un estimador, acá protege una fracción. Con 10
# vistos el peor caso —una sola plantilla— ya es visiblemente distinto del mejor.
# Igual la fila se guarda: el voto sin contadores sigue siendo el voto.
MIN_VISTOS = 10


@dataclass(frozen=True)
class Resumen:
    """Lo que se congela junto al voto.

    Se guardan los tres números y no la fracción ya calculada por lo mismo que
    `opinion.Ajuste` guarda los agregados de su ventana: la fracción se puede
    derivar después de mil maneras, y el denominador —cuántos ejercicios llegaron
    a entrar— es el que dice si el numerador significa algo.
    """

    ventana: int
    plantillas_distintas: int
    enunciados_distintos: int

    @property
    def suficiente(self) -> bool:
        """¿Alcanzan los vistos para que los contadores signifiquen algo?"""
        return self.ventana >= MIN_VISTOS


def resumen(vistos: Sequence[tuple[str, str]]) -> Resumen:
    """Los contadores de una tanda de ejercicios vistos.

    `vistos` son pares `(template_key, prompt_latex)` de los últimos ejercicios
    SERVIDOS a esa persona, en cualquier orden (los contadores no lo usan) y sin
    filtrar por estado: entran los salteados y los mirados con la tabla abierta,
    por lo que dice el docstring del módulo.

    Se recorta a `VENTANA` acá y no solo en la query, igual que `opinion.resumen`:
    la función tiene que dar el mismo número con una lista más larga, o el día que
    alguien la llame desde un script el resultado no va a ser comparable con el de
    producción.
    """
    tanda = list(vistos)[:VENTANA]
    return Resumen(
        ventana=len(tanda),
        plantillas_distintas=len({clave for clave, _ in tanda}),
        enunciados_distintos=len({enunciado for _, enunciado in tanda}),
    )
