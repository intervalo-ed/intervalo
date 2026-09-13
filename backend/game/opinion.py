"""La opinión de la gente sobre la dificultad — funciones puras, sin BD.

El motor decide la dificultad con lo único que mide: `p̂ = σ((θ − β)·SCALE)`, y θ
se mueve solo con los primeros intentos. A la persona nunca se le preguntó nada.
Acá se le pregunta, y la respuesta hace dos cosas distintas que conviene no
mezclar: **se guarda como dato** —para poder leer el motor contra la opinión, que
es lo que hace el panel— y **ajusta el θ de quien votó**, dentro de un tope.

**Qué es este ajuste y qué no es.** No inventa una creencia. El paso de θ decae
con la experiencia (`elo._A_USER / (1 + elo._B_USER · n)`): a las 100 respuestas
vale 0,025 por acierto, así que a un veterano subvaluado el motor tarda decenas
de respuestas en encontrarlo. Lo que se aplica acá es **la corrección que el
motor iba a hacer igual, de una sola vez**, calculada sobre el registro de esa
misma persona. Medido en producción el 2026-09-13 sobre 15.106 primeras
respuestas sin tabla: el motor promete 0,87 y la gente entrega 0,92, que en
unidades de θ son 0,66 — un tier entero de subvaluación.

**El voto decide el signo, la evidencia decide el tamaño.** Esa separación es lo
que hace que esto no se pueda abusar: quien dice «muy fácil» sin estar
ganándole al motor no se mueve ni un punto. El color del nombre en el ranking se
sigue ganando resolviendo; el ajuste solo lo acredita antes.

**Lo que este ajuste NO puede arreglar.** La β creída más alta del catálogo es
0,654 (`t5_sin_over_x`), o sea que a partir de θ ≈ 2,35 —esa β más
`logit(TARGET_HIGH)/SCALE`— la banda objetivo ya no existe: al de θ=3,0 lo más
difícil del juego le da p̂=0,87. A esa gente subirle θ le mueve la creencia y el
color, pero no el ejercicio, porque el selector ya le está dando lo más duro que
hay. El arreglo son los tiers 6-8 con regla de la cadena que `elo.BETA_SEED` ya
tiene reservados, y es otro trabajo.

Por suerte casi no se pisan: simulado sobre el historial real, **3 de 220
disparos** caen arriba del techo. La encuesta pregunta temprano —a las 10
resueltas, después cada 30— y a esa altura todavía nadie llegó ahí.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, Sequence

from . import elo

# Los tres votos. Son **literalmente** los mismos valores que el canal A de la
# micro-encuesta de Intervalo clásico (`models.ExerciseFeedback.value`), y eso no
# es casualidad ni ahorro: son dos productos preguntando lo mismo, y el día que
# alguien quiera cruzarlos no tendría que haber una tabla de traducción en el
# medio. Allá hay además una calibración ya medida contra la que comparar —quien
# vota «muy fácil» venía acertando el 77%, quien vota «justo» el 61%— y esa
# comparación se pierde si acá las etiquetas se llaman de otra manera.
MUY_FACIL = "muy_facil"
JUSTO = "justo"
MUY_DIFICIL = "muy_dificil"
VOTOS: tuple[str, ...] = (MUY_FACIL, JUSTO, MUY_DIFICIL)

# Cuántas respuestas mira el ajuste hacia atrás.
#
# Veinte es el tamaño con el que el estimador deja de ser ruido: el error típico
# de θ sobre n respuestas en banda es `1/√(SCALE²·Σp̂(1−p̂))`, que da ±0,90 con 10
# respuestas, ±0,63 con 20 y ±0,45 con 40. Con menos de veinte el error del
# estimador es más grande que el TOPE, o sea que el tope no estaría acotando una
# corrección sino tapando un sorteo.
#
# Y el techo lo pone la cadencia: la ventana tiene que ser MÁS CHICA que cada
# cuánto vuelve la pregunta (30 resueltas), o dos votos seguidos se calcularían
# sobre las mismas respuestas y el segundo cobraría de nuevo una sorpresa que el
# primero ya cobró. Simulado, entre 10, 20 y 40 el resultado casi no cambia; 20
# es el único de los tres que además respeta eso.
VENTANA = 20

# Con menos respuestas que estas no se ajusta nada: se guarda el voto y listo.
#
# Ocho es donde la rampa inicial ya quedó atrás (`elo.RAMP_UPDATES = 5`) y los
# tres ejercicios fijos del arranque (`generator.ONBOARDING`) también. Antes de
# ahí el registro no habla de la persona: habla de por dónde la hizo entrar el
# juego.
MIN_RESPUESTAS = 8

# Cuánta información "vale" el θ que la persona ya tiene. Es el encogimiento, y
# es la misma idea que `elo.effective_beta` aplica del otro lado del modelo: allá
# el ancla de β se mide en PERSONAS, acá el ancla de θ se mide en INFORMACIÓN,
# que es la unidad en la que se cuentan las respuestas cuando lo que se estima es
# una habilidad.
#
# El número sale de simular la fórmula sobre el historial real
# (`scripts/diag/simular_opinion_dx.py`), 220 disparos sobre 140 jugadores, y el
# criterio es que **el TOPE tenga que ser una baranda y no el lugar donde se
# vive**: si la mayoría de los ajustes termina pegada al tope, el número que se
# aplica ya no sale del registro de la persona sino de la constante.
#
#   I₀ = 2,0 → mueve el 61% de los disparos, |Δθ| mediana 0,48, topea el 33%
#   I₀ = 3,0 → mueve el 59%,                 mediana 0,38, topea el 17%
#   I₀ = 4,0 → mueve el 58%,                 mediana 0,31, topea el  3%
#
# Con 3,0 la mediana corrige algo más de la mitad de la brecha medida (0,66) de
# una sola vez, y el resto queda para el voto siguiente o para el propio motor.
# Un corrector hace ajustes chicos y seguidos; es el mismo criterio que ya está
# escrito en `elo.RECENTRADO_MAX`.
I0_PRIOR = 3.0

# Banda muerta: por debajo de esto no se ajusta nada.
#
# Es `elo.SKIP_THETA_PENALTY` y no un número nuevo a propósito: el juego ya tiene
# una unidad para «un empujón plano de θ», vale un cuarto de tier, y es la que se
# usa cuando alguien saltea. Que subir por haber dicho «muy fácil» y bajar por
# haber salteado se midan con la misma vara es lo correcto — son la misma escala.
#
# **Va acá y no como piso de la salida**, y la diferencia no es cosmética. Un
# piso —«si el voto y la evidencia coinciden, mover al menos esto»— convierte
# cualquier sorpresa positiva en un cuarto de tier, por chica que sea. Y hay una
# sorpresa chiquísima siempre: quien acierta 17 de 20 con p̂=0,85 tiene una
# sorpresa que vale exactamente cero, pero la suma en punto flotante la deja en
# +4·10⁻¹⁶, con lo cual el piso le regalaba 0,15 de θ por un error de redondeo.
# Como banda muerta el número hace lo contrario: filtra el ruido en vez de
# amplificarlo. Es la misma forma que `elo.RECENTRADO_UMBRAL`.
AJUSTE_MINIMO = elo.SKIP_THETA_PENALTY

# El ajuste más grande que se aplica. Un tier de `elo.BETA_SEED` (que se separan de a ~0,6), que es
# además el ancho en θ de la banda objetivo: ir de p̂=0,70 a p̂=0,80 sobre la misma
# plantilla son 0,66 unidades. O sea que un voto puede correr a alguien de punta
# a punta de su propia banda, y nunca más que eso.
#
# Coincide con la brecha medida en producción (0,66), y no por casualidad: es el
# orden de magnitud del error que esto viene a corregir. Un tope más grande no
# corregiría más rápido, corregiría de más.
TOPE = 0.60


@dataclass(frozen=True)
class Ajuste:
    """Lo que sale de mirar una tanda, con todo lo que hay que guardar.

    Se devuelven también los agregados de la ventana —y no solo el delta— porque
    la fila que se persiste tiene que congelarlos: β se mueve con cada respuesta
    y `scripts/diag/backfill_elo.py` reescribe θ de todo el historial, así que
    recalcular esto la semana que viene daría otro número. Un voto es lo que se
    dijo en un momento, no una vista de quien lo dijo hoy.
    """

    delta: float
    ventana: int
    aciertos: int
    p_hat_medio: float | None
    sorpresa: float
    informacion: float


def _sin_datos() -> Ajuste:
    return Ajuste(delta=0.0, ventana=0, aciertos=0, p_hat_medio=None,
                  sorpresa=0.0, informacion=0.0)


def resumen(respuestas: Sequence[tuple[float, bool]]) -> Ajuste:
    """Los agregados de una tanda, sin voto todavía. `delta` sale en 0.

    `respuestas` son pares `(p̂, acertó)` de PRIMEROS intentos y SIN tabla
    abierta, de la más nueva a la más vieja. Las dos restricciones son las mismas
    que ya documenta `metrics.game_queries.calibracion` y por el mismo motivo: un
    acierto al tercer intento no es lo que p̂ predice, y uno copiado de la tabla
    tampoco. Mezclarlos infla la sorpresa y el ajuste sale de más.
    """
    tanda = list(respuestas)[:VENTANA]
    if not tanda:
        return _sin_datos()
    # La sorpresa que el motor todavía no absorbió: la suma de los residuos.
    sorpresa = sum((1.0 if ok else 0.0) - p for p, ok in tanda)
    # Y cuánto pesa esa suma, que es la información de Fisher de estas
    # respuestas. Una con p̂=0,95 casi no informa —acertarla era lo esperable— y
    # una con p̂=0,5 informa todo lo que una respuesta puede informar. Dividir por
    # esto es lo que hace que veinte derivadas regaladas no valgan lo mismo que
    # veinte peleadas.
    informacion = elo.SCALE * sum(p * (1.0 - p) for p, _ in tanda)
    return Ajuste(
        delta=0.0,
        ventana=len(tanda),
        aciertos=sum(1 for _, ok in tanda if ok),
        p_hat_medio=sum(p for p, _ in tanda) / len(tanda),
        sorpresa=sorpresa,
        informacion=informacion,
    )


def ajuste_de_theta(voto: str, respuestas: Iterable[tuple[float, bool]]) -> Ajuste:
    """Cuánto mover el θ de quien votó esto, después de esta tanda.

    Un paso de Newton sobre la verosimilitud del modelo con β fija, encogido
    hacia cero por `I0_PRIOR`:

        Δθ = Σ(acertó − p̂) / (SCALE·Σp̂(1−p̂) + I₀)

    y después el voto, que hace exactamente dos cosas: **elige el signo** y
    **abre o no la puerta**. Si la evidencia no va para el mismo lado que el
    voto, el ajuste es cero y el voto igual se guarda. Esa es toda la defensa
    contra el abuso, y alcanza: nadie puede reclamar un color que su propio
    registro no respalda.

    `justo` nunca mueve nada. No es que no diga nada —es el dato más valioso del
    panel, porque es el que dice a qué tasa de acierto la gente se siente
    cómoda— pero no hay nada que corregir cuando alguien avisa que está bien.
    """
    base = resumen(list(respuestas))
    if voto == JUSTO or base.ventana < MIN_RESPUESTAS:
        return base

    signo = 1.0 if voto == MUY_FACIL else -1.0
    # La evidencia tiene que ir para el mismo lado que el voto. Con el signo
    # cruzado —«me resultan muy fáciles» de alguien que va 12 de 20— no se mueve
    # nada: la persona puede estar diciendo la verdad sobre cómo se siente, pero
    # no sobre cómo le está yendo, y θ mide lo segundo.
    if signo * base.sorpresa <= 0:
        return base

    # Y tiene que ir para ese lado lo suficiente. Un ajuste más chico que la
    # banda muerta no se aplica: es del tamaño del ruido de muestreo, y el motor
    # ya se mueve solo en esa escala con cada respuesta. Mover θ por eso sería
    # cobrarle a la persona un voto a cambio de nada.
    bruto = abs(base.sorpresa) / (base.informacion + I0_PRIOR)
    if bruto < AJUSTE_MINIMO:
        return base

    return Ajuste(
        delta=signo * min(bruto, TOPE),
        ventana=base.ventana,
        aciertos=base.aciertos,
        p_hat_medio=base.p_hat_medio,
        sorpresa=base.sorpresa,
        informacion=base.informacion,
    )
