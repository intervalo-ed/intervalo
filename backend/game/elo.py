"""Elo online del minijuego — funciones puras, sin BD.

Adaptado del reporte del motor (docs/reports/2026-08-26-motor-de-sesiones.md §5/§8):
p̂ = σ((θ − β) · SCALE), actualización con learning rate decreciente tras cada
primer intento. Sin reentrenamiento ni jobs: aritmética en la misma transacción
que escribe la respuesta.
"""

from __future__ import annotations

import math

# Cuánto separa en probabilidad una unidad de θ. **Reajustado el 27/09/2026
# contra 23.444 respuestas del propio juego; antes era 0.818, heredado de la
# calibración por temperatura de Intervalo clásico.**
#
# El 0.818 venía de otro producto, con otros ítems y otra gente, y acá estaba
# mal por 37%. El costo de tenerlo estirado no es cosmético: p̂ = σ((θ−β)·SCALE),
# así que con la escala corta el motor predice más cerca de 0,5 de lo que
# corresponde, y para el caso normal —alguien al que el ejercicio le queda
# fácil— eso significa PROMETER MENOS ACIERTO DEL QUE VA A HABER. Medido sobre
# 53.842 primeras respuestas sin tabla: el motor prometía 83,86% y la gente
# entregaba 91,48%, un sesgo de +7,62 pp que aparecía en TODOS los tramos de la
# curva de calibración (+3 pp arriba, +23 pp abajo).
#
# Traducido a lo que la persona ve: la banda objetivo [0,70 , 0,80] son
# (θ−β) ∈ [1,04 , 1,70] en unidades del motor, y ese mismo rango con la escala
# real da p̂ ∈ [0,76 , 0,87]. **El motor apuntaba a 75% y servía 82%.**
#
# El número sale de un Rasch conjunto —habilidad por persona y dificultad por
# plantilla estimadas a la vez, de los datos crudos— y no de las creencias del
# propio motor, que es lo que lo haría circular. Tres ajustes independientes
# coincidieron: 1,1164 sobre la historia completa, 1,1247 y 1,1261 sobre la
# ventana reciente de cada jugador. Se toma el de la ventana reciente porque el
# Rasch da UNA habilidad por persona y sobre la historia entera promedia a cada
# uno con su propio pasado.
#
# Cambiar esto es un cambio de COORDENADAS: θ y β viven en esta escala, así que
# mover SCALE sin mover los dos deja al motor creyendo cualquier cosa. La
# migración es `scripts/diag/recalibrar_motor.py` y corre una sola vez.
SCALE = 1.1266

# Banda objetivo de probabilidad de acierto al primer intento.
TARGET_LOW = 0.70
TARGET_HIGH = 0.80
TARGET_MID = 0.75

# ε-exploración: con esta probabilidad se sirve la plantilla con menos
# observaciones dentro de la banda ampliada, para que las betas nuevas
# converjan rápido.
EPSILON = 0.15
# Banda ampliada para el paso de exploración.
EXPLORE_LOW = 0.65
EXPLORE_HIGH = 0.85

# Rampa inicial: mientras n_updates < RAMP_UPDATES se restringe tier <= n_updates,
# así el juego arranca en y=k, y=x aunque el θ inicial sea 0.
RAMP_UPDATES = 5

# Dificultad seed por tier. Con θ=0: T0 → p̂≈0.89, T5 → p̂≈0.24, T8 → p̂≈0.15.
#
# **Medidas, no elegidas, desde el 27/09/2026.** Salen del mismo Rasch conjunto
# que reajustó SCALE, promediando las plantillas de cada tier. Las anteriores
# eran una escalera pareja de 0,6 en 0,6 puesta a mano, y los datos dicen tres
# cosas que esa escalera no sabía:
#
#   · **los tiers se separan la mitad de lo supuesto** (+0,31 real contra +0,60);
#   · **T6 sale más fácil que T5**: la cadena con interior lineal (`sen(ax+b)`)
#     es más fácil que la regla del cociente, y eso es un hallazgo pedagógico
#     real, no ruido. La semilla lo dice ahora en vez de esconderlo;
#   · **T7 y T8 están empatados** (1,51 y 1,54): arriba de T6 la escalera está
#     plana, así que el catálogo no tiene tres escalones ahí, tiene uno.
#
# Que la secuencia ya NO sea monótona es a propósito. El tier dice de qué es la
# derivada; la semilla dice cuánto cuesta. Forzarlas a coincidir era justamente
# el error: `desvio_de_escala` no veía nada raro porque solo corrige la MEDIA, y
# las derivas de arriba (T8 se creía 1,08 más difícil de lo que es) se cancelaban
# con las de abajo (T1 se creía 0,90 más fácil).
#
# Los tres últimos son la regla de la cadena, y son exactamente los valores que
# este comentario venía reservando desde v1. Se cobraron porque el catálogo se
# había quedado sin techo: con `sen(x)/x` (β creída +0,80) como lo más duro,
# a partir de θ = 2,50 no había nada en banda, y las 35 personas que estaban ahí
# generaban el 55% de las derivadas servidas. Ahora el techo es θ ≤ 4,30, que
# cubre 673 de los 678 jugadores con historial.
#
# `check_game_techo.py` deja esa cuenta escrita en vez de que se redescubra
# dentro de tres meses leyendo un PDF.
BETA_SEED: dict[int, float] = {0: -1.88, 1: -0.70, 2: -0.55, 3: 0.03, 4: 0.38,
                               5: 1.05, 6: 0.63, 7: 1.51, 8: 1.54}

# Cuántos ESTUDIANTES DISTINTOS "vale" la semilla del tier. Ver `effective_beta`.
#
# Ocho es la respuesta a «cuánta gente distinta tiene que haber probado esto para
# que su promedio valga tanto como el criterio con el que pusimos la semilla».
# Con 2 personas la plantilla queda 80% semilla, que es lo correcto cuando dos
# personas son toda la evidencia; con 30 queda 79% aprendida.
BETA_PRIOR_PLAYERS = 8.0

# Tope de cuánta evidencia se le computa al ancla. Sin esto el peso de la semilla
# es `BETA_PRIOR_PLAYERS / (n_players + BETA_PRIOR_PLAYERS)`, o sea que **se
# diluye solo a medida que el juego crece**: con 23 personas la semilla pesa 26%,
# con 400 pesa 2%. Es el freno que se afloja justo cuando más hace falta, porque
# el sesgo que tiene que frenar —a lo difícil solo lo ve quien va bien— no
# desaparece con la escala, se acumula.
#
# Con el tope en 20, la semilla nunca pesa menos del 29% por más gente que pase.
# No es para desconfiar de los datos: es para que una plantilla no pueda terminar
# creyéndose más fácil que otra dos tiers abajo solo porque la vieron doscientas
# personas que el propio motor eligió. Medido en producción: sin tope, las 29
# plantillas terminaron entre 1 y 3,5 unidades por debajo de su semilla.
BETA_PRIOR_CAP = 20

# Castigo de θ al saltear un ejercicio. Plano a propósito: el lr de `update`
# decae con la experiencia, y con ese decaimiento un jugador veterano podría
# saltear sin que el juego le bajara nunca la dificultad — justo lo contrario de
# lo que promete el botón. La escala se lee contra BETA_SEED, que ahora separa
# tiers de a ~0.31 medido: cada salteo cuesta un tercio de tier, y tres seguidos
# bajan uno entero.
#
# **0.12 y no 0.15 desde la recalibración del 27/09.** No es una decisión nueva
# sobre cuánto tiene que costar saltear: es el mismo castigo expresado en la
# escala nueva. θ se comprimió por 0,798 al recalibrar (ver
# `scripts/diag/recalibrar_motor.py`), así que un número en unidades de θ que se
# quede quieto pasa a significar otra cosa. 0,15 × 0,798 = 0,12.
SKIP_THETA_PENALTY = 0.12

# Hiperparámetros del update. El grid del reporte daba a_u=0.8 b_u=0.15 a_x=1.2
# b_x=0.05, y esos valores dejaban el reparto al revés de lo que conviene.
#
# **Lo que importa no es el paso sino `a/b`**, que es cuánto puede moverse cada
# número EN TOTAL a lo largo de su vida: el paso decae como `a/(1+b·n)`, así que
# lo acumulado tiende a `(a/b)·ln(1+b·n)`. Con los valores viejos la plantilla
# tenía capacidad 1.2/0.05 = 24 y la persona 0.8/0.15 = 5,3. **La plantilla podía
# moverse 4,5 veces más que la persona**, y encima acumula observaciones mucho
# más rápido —una plantilla la ven todos, un jugador juega solo lo suyo—.
#
# El resultado, medido sobre 11.414 primeras respuestas: la sorpresa de cada
# acierto se la comía la plantilla. El motor concluía «esta derivada era fácil»
# en vez de «esta persona sabe», las 29 β se hundieron hasta 3,5 unidades por
# debajo de su semilla, y la mediana de θ quedó clavada en 0,07 con el 70% de la
# gente en cinturón blanco.
#
# Se invierte el reparto: capacidad de la persona 0.8/0.07 = 11,4 contra 0.8/0.10
# = 8 de la plantilla. La persona se lleva la sorpresa, que es lo correcto acá
# porque **los ejercicios los escribimos nosotros** y les pusimos el tier a mano;
# la incógnita es la gente, no el catálogo.
#
# Simulado contra la historia real: con estos valores la mediana de θ pasa de
# 0,07 a 0,39, el p90 de 0,89 a 2,03, los cinturones de [295,117,8,2] a
# [184,177,25,36], y el orden de dificultad entre tiers vuelve a ser monótono
# (con los valores viejos T3 terminaba más difícil que T5).
#
# **0.58 y no 0.8 desde el 28/09, y es una corrección, no una decisión nueva.**
# El paso se mide en unidades de θ, y la recalibración del 27/09 cambió la escala
# de θ sin que nadie tocara estos dos números — así que el motor pasó a aprender
# más rápido *en relación a la dificultad* sin que se hubiera decidido. Medido
# contra el ancho de la banda objetivo, que es la vara honesta:
#
#     _A_USER = 0,8   →  1,21 anchos de banda antes  ·  1,67 después
#     _A_USER = 0,58  →  1,21 anchos de banda, igual que siempre
#
# El factor es 0,7255, que es `SCALE_viejo / SCALE_nuevo` = 0,818 / 1,1266. Es
# el mismo criterio con el que se reescalaron `SKIP_THETA_PENALTY` y el tope del
# ajuste por voto; a estos dos se les había pasado.
#
# **`_B_USER` y `_B_TEMPLATE` NO se tocan**: multiplican a `n`, que es un conteo
# de respuestas y no cambió de unidades. Y como solo se escalan los numeradores,
# la capacidad relativa —`a/b`, cuánto puede moverse cada número en toda su
# vida— se encoge igual para los dos, así que el reparto de la sorpresa entre la
# persona y la plantilla queda exactamente donde estaba: 8,3 contra 5,8, la
# misma razón de 1,43 que tenía con 11,4 contra 8.
#
# Que el motor aprenda más rápido puede ser lo que convenga —el diagnóstico del
# 27/09 dice que el decaimiento es demasiado lento— pero esa es una decisión que
# se toma y se mide, no un efecto secundario de un cambio de coordenadas.
_A_USER = 0.58
_B_USER = 0.07
_A_TEMPLATE = 0.58
_B_TEMPLATE = 0.10

# ── El piso del paso de aprendizaje ──────────────────────────────────────────
#
# `_A_USER / (1 + _B_USER·n)` decae SIN PISO, y eso no es un detalle de
# afinación: decide cuánto tarda el número en enterarse de que alguien mejoró.
# La brecha entre la habilidad real y la creída se cierra exponencialmente con
# constante `τ = 1/(SCALE·p(1−p)·lr) ≈ 1/(0,153·lr)` respuestas:
#
#     lr 0,348 (a las 20 respuestas)   → τ =  19 respuestas
#     lr 0,070 (a las 168)             → τ =  93
#     lr 0,016 (a las 1043)            → τ = 408
#
# **Medido en producción el 19/09, sobre los 7 días previos y leyendo el
# `theta_at_serve` de cada ejercicio servido**: el mismo ejercicio vale 4,92
# puntos de rating para alguien con menos de 25 respuestas y 0,71 para alguien
# con más de 400. Siete veces menos por el mismo trabajo. Y no es un rincón: esos
# 68 jugadores son el 3% de la gente y ponen el 65% de las derivadas servidas.
#
# El mismo decaimiento le rompió el precio al botón de saltear. `SKIP_THETA_
# PENALTY` es plano (0,15 θ) justamente porque el lr decae, pero medido en
# aciertos el botón cuesta 1,7 respuestas correctas para un novato y 37,5 para un
# veterano — y el uso sigue al precio casi perfecto: 10,9% de salteos abajo,
# 0,25% arriba. El botón que existe para que lo difícil no trabe a nadie está
# tarifado de forma prohibitiva justo para los que más juegan.
#
# Un piso es el K-factor floor del ajedrez y el piso de RD de Glicko, y los dos
# existen por la misma razón: un paso que decae a cero significa que el sistema
# dejó de creer que alguien puede cambiar, y la habilidad sí cambia.
#
# **El piso no hace NADA al principio, y eso es deliberado.** Muerde recién en la
# respuesta `n_donde_muerde(LR_MIN_RAPIDO)` = 43, o sea muchísimo después de las
# tres primeras correctas que mide `dx-puerta-2`, que está en la calle desde
# anoche. Los dos experimentos pueden correr a la vez sin tocarse. Bajar
# `_B_USER` —el otro camino para el mismo efecto— habría acelerado desde la
# respuesta 1 y contaminado el que ya está corriendo.
#
# Qué le cambia a cada grupo, con los lr medios medidos ese mismo día:
#
#     n ≈ 71   (53 personas)  lr 0,1340 → ×1,5
#     n ≈ 130  (40 personas)  lr 0,0792 → ×2,5
#     n ≈ 279  (13 personas)  lr 0,0390 → ×5,1
#     n ≈ 1006 (15 personas)  lr 0,0112 → ×17,9
LR_MIN_CONTROL = 0.0
LR_MIN_RAPIDO = 0.20

# Lo que el piso también compra, y conviene tenerlo escrito porque no es obvio:
# el ruido. θ alrededor de la habilidad real es un AR(1) con reversión
# `0,153·lr` por respuesta y ruido `0,433·lr`, así que su desvío estacionario es
# `0,783·√lr` — 20 puntos de rating con lr 0,016 y 70 con lr 0,20. Ese temblor ES
# el efecto buscado (que el número se mueva) y a la vez el riesgo: a quien esté
# parado justo en un corte de nivel se le va a prender y apagar el color.
_RUIDO_POR_LR = 0.783


def lr_de_usuario(n_updates: int, lr_min: float = LR_MIN_CONTROL) -> float:
    """El paso con el que esta respuesta va a mover θ."""
    return max(_A_USER / (1.0 + _B_USER * n_updates), lr_min)


def n_donde_muerde(lr_min: float) -> int | None:
    """Desde qué respuesta el piso cambia algo. `None` si no cambia nunca.

    Se calcula y no se tabula, por el mismo motivo que `tier_objetivo`: el 43 sale
    de `_A_USER` y `_B_USER`, y el día que alguno se mueva este número se mueve
    con él en vez de quedar mintiendo en un comentario. El panel lo usa para
    saber a quién inscribir, así que si se desincronizara, el experimento estaría
    midiendo a gente a la que no le pasó nada.
    """
    if lr_min >= _A_USER:
        return 0
    if lr_min <= 0.0:
        return None
    return math.ceil((_A_USER / lr_min - 1.0) / _B_USER)


def ruido_de_rating(lr: float) -> int:
    """Cuánto tiembla el rating de alguien ya calibrado, en puntos. Ver arriba."""
    return round(RATING_PER_THETA * _RUIDO_POR_LR * math.sqrt(max(lr, 0.0)))


def effective_beta(beta: float, tier: int, n_players: int) -> float:
    """La β que el motor CREE, que no es la que tiene guardada.

    **El problema.** `beta` no tiene ancla: se va a donde la empuje la evidencia.
    Y la evidencia de cada plantilla la genera quien la ve, que es justo a quien
    el motor eligió mandársela. Un motor adaptativo sirve lo difícil solo a los
    que van bien → lo difícil solo recibe evidencia de gente que va bien → lo
    difícil parece fácil. El círculo se alimenta solo y no es un bug de código
    sino del diseño.

    En el primer día de producción el 90% de las observaciones de los cocientes
    (T5) las generó UNA persona con θ = 2.07, así que sus β se desplomaron hasta
    quedar por debajo de las de `a^x` y `log_a(x)`. El motor terminó creyendo que
    un cociente era más fácil que una exponencial.

    **El arreglo.** Promedio ponderado entre lo aprendido y la semilla del tier,
    con el peso de lo aprendido creciendo con la evidencia — encogimiento, o
    Bayes empírico, que es lo mismo que ya hace la capa de ítem del motor de
    sesiones. Con 0 estudiantes devuelve la semilla; con BETA_PRIOR_PLAYERS es
    mitad y mitad; con muchos la semilla se lava sola.

    **La evidencia se cuenta en PERSONAS y no en respuestas**, y esa es la parte
    que hace el trabajo. Veinte respuestas de una sola persona no son veinte
    datos sobre la plantilla: son veinte datos sobre esa persona. El tamaño de
    muestra que importa es el de sorteos independientes, y cada estudiante es
    uno. Los números de producción muestran por qué: `t0_x` tenía 54
    observaciones de 45 personas —casi 1 a 1, todos la ven una vez— pero
    `t5_pow_over_linear` tenía 12 de **2**, y `t3_ax` 11 de **2**. Contando
    respuestas, esas dos parecían tan conocidas como el resto; contando gente,
    quedan donde corresponde, que es al lado de su semilla.

    **Dónde va y dónde NO.** Esto es corrección de LECTURA: se usa para elegir
    plantilla, para el p̂ que se guarda al servir y para mover θ. La β guardada
    en `game_template_stats` se sigue actualizando contra su propio p̂ crudo, y
    eso no es un descuido: si se la actualizara con el error calculado desde acá
    —que al estar más cerca de la semilla da un error más grande— la β cruda se
    dispararía todavía más rápido. Cada uno se corrige contra su propia
    creencia; el encogimiento decide cuánto se le cree a la de la plantilla.

    Poner BETA_PRIOR_PLAYERS en 0 desactiva todo esto sin tocar nada más.
    """
    if BETA_PRIOR_PLAYERS <= 0:
        return beta
    if n_players <= 0:
        return BETA_SEED.get(tier, 0.0)
    seed = BETA_SEED.get(tier, 0.0)
    # El tope: ver BETA_PRIOR_CAP. Más allá de ahí la evidencia extra ya no
    # compra más confianza, porque lo que limita no es cuánta gente pasó sino
    # que a quién pasa lo elige este mismo motor.
    n = min(n_players, BETA_PRIOR_CAP) if BETA_PRIOR_CAP else n_players
    return (n * beta + BETA_PRIOR_PLAYERS * seed) / (n + BETA_PRIOR_PLAYERS)


# Cuánto se deja correr la escala antes de volver a centrarla. La media de las β
# se mueve ~0,0007 por respuesta, así que con esta banda muerta el reajuste cae
# cada ~70 respuestas: suficiente para que el gasto sea despreciable y para que
# la escala nunca se vaya más de un 2% de un tier.
RECENTRADO_UMBRAL = 0.04

# Y cuánto es DEMASIADO para corregir solo. Un corrector automático hace ajustes
# chicos y continuos; un δ grande no significa "corregí fuerte", significa que
# pasó algo estructural —que la migración de re-anclaje nunca corrió, por
# ejemplo— y eso lo mira una persona, no un `if`.
#
# Sin este tope el primer deploy habría aplicado los +2,4 acumulados de una,
# corriendo las β sin correr los θ: el motor pasaría a creer que toda la gente es
# 2,4 unidades más débil de lo que es. Medido contra la historia real, el 56% de
# los jugadores caería a T0-T1 y tardaría un mes de tráfico en volver. Correr la
# escala de golpe es un cambio de COORDENADAS y hay que mover las dos puntas
# juntas; eso lo hace `scripts/diag/recentrar_escala.py`, a mano y con
# confirmación.
RECENTRADO_MAX = 0.40


def desvio_de_escala(betas: dict[str, float], tiers: dict[str, int]) -> float:
    """Cuánto se corrió la escala entera de dificultad respecto de las semillas.

    **El problema que resuelve.** `p̂ = σ((θ − β)·SCALE)` depende de la RESTA, así
    que sumarle la misma constante a todos los θ y todas las β no cambia ni una
    predicción: la escala tiene un grado de libertad suelto. Y suelto no se queda
    quieto — se va para donde lo empuje la asimetría de las tasas de aprendizaje.
    Medido en producción: las 29 β terminaron 2,4 unidades por debajo de sus
    semillas en promedio, con `sen(x)/x` (T5) creyéndose más fácil que la semilla
    de `kx` (T1). La escalera de dificultad quedó dada vuelta.

    **Lo que hace.** Devuelve el δ que hay que sumarle a TODAS las β para que su
    promedio vuelva al promedio de las semillas. Un solo número para todas: eso
    corrige exactamente el grado de libertad suelto y **no toca nada más**. El
    orden entre plantillas y las distancias entre ellas —que es lo que el motor
    aprendió de verdad y que los datos respaldan— quedan intactos.

    Es deliberado que NO se recentre tier por tier. Los datos dicen que los tiers
    se separan la mitad de lo que suponen las semillas (dentro de una misma banda
    de θ, T5 y T1 rinden casi igual: derivar es mecánico, y quien sabe la regla
    del cociente no sufre más con `sen(x)/x` que con `2x`). Forzar cada tier a su
    semilla sería pisar ese aprendizaje; correr la escala entera, no.
    """
    if not betas:
        return 0.0
    media = sum(betas.values()) / len(betas)
    objetivo = sum(BETA_SEED.get(tiers.get(k, 0), 0.0) for k in betas) / len(betas)
    return objetivo - media


def predict(theta: float, beta: float) -> float:
    """p̂ de acierto al primer intento para (jugador, plantilla)."""
    return 1.0 / (1.0 + math.exp(-(theta - beta) * SCALE))


def update(
    theta: float, n_user: int, beta: float, n_template: int, correct: bool,
    tier: int | None = None, n_players: int = 0,
    lr_min: float = LR_MIN_CONTROL,
) -> tuple[float, float]:
    """Devuelve (theta', beta') tras el resultado del PRIMER intento.

    `n_template` son respuestas y gobierna el paso de aprendizaje de β, que es
    cuánto se mueve. `n_players` son personas distintas y gobierna el ancla, que
    es cuánto se le cree. Son dos cosas distintas y por eso van separadas.

    Con `tier`, cada número se mueve contra SU propia creencia (ver
    `effective_beta`): θ contra la β encogida, que es lo que el motor cree de
    verdad, y β contra la cruda, que es su propio estadístico. Sin `tier` se
    comporta como antes — las dos contra la cruda.

    `lr_min` es el piso del paso, y va SOLO del lado del jugador. No es una
    omisión: `game_template_stats` es una sola tabla para los dos brazos de
    cualquier experimento, así que tocar el paso de β haría que el brazo test le
    moviera la dificultad al control. θ vive en la fila del jugador y por eso es
    lo único que se puede repartir.

    Que θ se mueva contra la β encogida no es un efecto colateral: es la mitad
    del arreglo. La sorpresa de un acierto tiene que ir a algún lado, y si el
    ancla impide que se la coma la plantilla, se la lleva la persona. Es el
    diagnóstico dado vuelta — el modelo venía concluyendo «esta derivada era
    fácil» cuando lo correcto era «esta persona sabe», y por eso la θ mediana
    llevaba 475 respuestas clavada en 0,1.
    """
    hit = 1.0 if correct else 0.0
    beta_creida = beta if tier is None else effective_beta(beta, tier, n_players)
    theta_next = theta + lr_de_usuario(n_user, lr_min) * (hit - predict(theta, beta_creida))
    beta_next = beta - _A_TEMPLATE / (1.0 + _B_TEMPLATE * n_template) * (hit - predict(theta, beta))
    return theta_next, beta_next


def difficulty_stars(p_hat: float) -> int:
    """1 (regalada) a 5 (durísima), para mostrar en el front."""
    return max(1, min(5, round(1 + 4 * (1 - p_hat))))


# Cortes de θ para los 4 niveles del ranking. El juego no tiene cinturones, así
# que este es el equivalente: el color del nombre se gana resolviendo más
# difícil, no acumulando XP.
#
# Salen de BETA_SEED: una plantilla cae en la banda objetivo cuando
# θ ≈ β + logit(0.75)/SCALE = β + 1.34. O sea que θ=0.3 es "las sumas ya salen
# cómodas" (T2), θ=1.6 "los productos" (T4) y θ=2.2 "los cocientes" (T5). Un
# jugador nuevo arranca en θ=0 y por lo tanto en blanco, como corresponde.
# **El último corte se movió de 2,2 a 3,7 al entrar la regla de la cadena, y
# esta vez SÍ baja gente.** Hay que decirlo con todas las letras porque es lo
# contrario de lo que pasó la vez anterior: cuando los cortes volvieron a
# (0.3, 1.6, 2.2) subían 145 personas y no bajaba ninguna.
#
# El motivo es que el último cinturón dice «llegaste a lo más difícil que el
# juego tiene», y con los tiers 6-8 arriba eso dejó de ser cierto a θ=2,2: el
# marrón se había quedado a mitad de camino. `tier_objetivo` elige T8 recién
# cuando θ − 1,343 > 2,3, o sea θ > 3,643; 3,7 es el mínimo redondo que lo
# cumple, y cada décima de más es gente de más que baja.
#
# El costo, **contado en producción el 19/09 y no estimado**: de los 89
# marrones quedan 19, o sea que **70 personas pasan a violeta**. (La primera
# cuenta, hecha contra el histograma del reporte del 14/09, decía ~39 sobre 48;
# la población casi se duplicó entre una fecha y la otra.) La caída es
# silenciosa —`events.py` solo publica `level_after > level_before`, así que el
# feed no anuncia bajadas— pero el color del nombre cambia a la vista de todos.
#
# Del otro lado de la balanza, medido el mismo día: los que no recibían NADA en
# banda pasaron de 66 a 2 sobre 1.058 jugadores con historial. Setenta
# cinturones por sesenta y cuatro personas que vuelven a tener juego.
#
# Los otros dos cortes NO se tocan: θ=0,3 sigue siendo «las sumas ya salen
# cómodas» (T2) y θ=1,6 «los productos» (T4). Con el tercero en 3,7 los tres
# niveles desbloquean T2 / T4 / T8, que es lo que `check_game_events_copy.py`
# verifica sin que haya que aflojarle nada.
# **Recalculados el 27/09/2026 con las semillas medidas.** La regla no cambió
# —nivel 1 donde T2 entra en banda, nivel 2 donde entra T4, nivel 3 donde entra
# T8— pero las semillas y el offset sí, así que los cortes se mueven con ellas:
# (0.3, 1.6, 3.7) → (0.45, 1.35, 2.52), con un redondeo que los deja a 6 puntos
# de rating o menos del valor exacto.
#
# **El tercero NO se redondea a 2,50 y el motivo vale la línea:** T7 y T8 quedaron
# empatados (1,51 y 1,54), así que con el corte en 2,50 `tier_objetivo` devuelve
# 7 y el feed anunciaría el nivel máximo nombrando el anteúltimo escalón. 2,52 cae
# del lado de T8 y la frase vuelve a ser cierta. Es exactamente el tipo de cosa
# que `check_game_events_copy.py` existe para no dejar pasar.
#
# **Nadie baja de color con la migración y 815 suben**, contado sobre los 1.670
# jugadores con al menos una respuesta. El reparto pasa de [735, 727, 170, 38] a
# [284, 902, 358, 126]. Que el último nivel se triplique es la parte a mirar: no
# es inflación, es que el motor venía subestimando a todo el mundo por 7,6 pp y
# con eso corregido hay 126 personas para las que T8 es, de verdad, su banda.
# Sigue significando lo mismo —«llegaste a lo más difícil que el juego tiene»—
# solo que ahora es cierto para más gente.
_LEVEL_CUTS = (0.45, 1.35, 2.52)


def level_of(theta: float) -> int:
    """Nivel 0-3 del jugador; el front lo pinta con los colores de cinturón."""
    for index, cut in enumerate(_LEVEL_CUTS):
        if theta < cut:
            return index
    return len(_LEVEL_CUTS)


# Cuántos niveles hay. Es `len(_LEVEL_CUTS)`, o sea el nivel más alto que
# `level_of` puede devolver, y se expone porque el feed necesita saber cuándo
# alguien llegó al último escalón y no a uno más.
NIVEL_MAX = len(_LEVEL_CUTS)


def theta_de_nivel(level: int) -> float:
    """El θ exacto en el que se ENTRA al nivel `level`.

    La inversa de `level_of` en su único punto interesante: el borde. El nivel 0
    no tiene borde de entrada —se arranca ahí— y devuelve 0,0.
    """
    if level <= 0:
        return 0.0
    return _LEVEL_CUTS[min(level, NIVEL_MAX) - 1]


# Cuánto por encima de β cae la banda objetivo: θ = β + logit(TARGET_MID)/SCALE.
# Es la relación que ya estaba escrita en el comentario de `_LEVEL_CUTS` —«una
# plantilla cae en la banda objetivo cuando θ ≈ β + 1.34»— pero como número y no
# como prosa, para que quien la use no tenga que copiar el 1,34 a mano.
_OFFSET_DE_BANDA = math.log(TARGET_MID / (1.0 - TARGET_MID)) / SCALE


def tier_objetivo(theta: float) -> int:
    """Qué tier le queda en la banda objetivo a alguien con este θ.

    O sea: qué dificultad le está sirviendo el juego. Se calcula y no se tabula
    a propósito — el feed anuncia "llegó a los cocientes" cuando alguien sube de
    nivel, y esa frase es CIERTA solo mientras los cortes de nivel y las semillas
    de tier digan lo que hoy dicen. Derivándola de las dos, el día que alguna se
    mueva la frase se mueve con ella en vez de quedar mintiendo.
    """
    objetivo = theta - _OFFSET_DE_BANDA
    return min(BETA_SEED, key=lambda tier: abs(BETA_SEED[tier] - objetivo))


# El θ en la escala de ajedrez, para poder mostrarlo. Es un cambio de UNIDADES y
# nada más: el orden entre jugadores y las distancias relativas son las mismas.
# Se hace porque θ = 0.83 no le dice nada a nadie, y 1166 sí — todo el mundo sabe
# leer que 1400 es mejor que 1200 aunque no sepa qué mide.
#
# 200 puntos por unidad de θ es lo que hace que el número se mueva de forma
# legible: los tiers de BETA_SEED están separados ~0.6, así que subir un tier son
# ~120 puntos, y un acierto del primer intento en la banda objetivo son ~40.
# 821, elegido para que la MEDIANA del rating quede donde estaba (973) después
# de recalcular el historial con las reglas nuevas. Anclar la mediana no
# significa que nadie se mueva —el punto del backfill es justamente que la gente
# quede donde su registro dice— sino que el centro de la distribución no se
# desploma: los que ganan ganan y los que pierden pierden, alrededor del mismo
# eje. Medido: 126 suben, 143 bajan una mediana de 72 puntos, y el que más sube
# gana 335.
#
# Pasó por 652 unas horas, cuando el re-anclaje de escala corrió los θ sin
# recalcularlos; ese número ya no aplica.
# **821/200 → 646/251 el 27/09**, y el cambio existe justamente para que el
# rating NO se mueva. Al recalibrar, θ se comprimió por 0,798; si los puntos por
# unidad de θ se hubieran quedado en 200, el rating de todo el mundo se habría
# encogido hacia la mediana y el marcador habría dejado de discriminar de un día
# para el otro. Dividiendo por el mismo 0,798 (200/0,798 = 251) y corriendo la
# base para absorber el término independiente, **el rating de cada jugador queda
# igual a menos de 2 puntos, y 1.213 de 1.670 no se mueven ni uno**.
#
# O sea: la migración cambia lo que el motor CREE y lo que va a servir, y no
# toca el número que la persona ve. Es la mitad del argumento para poder
# correrla sin avisar.
RATING_BASE = 646
RATING_PER_THETA = 251
# Piso, como el de la FIDE. θ puede caer bien abajo si alguien erra todo, y un
# marcador que llega a cero (o a un negativo) se lee como un juego roto, no como
# un mal día.
RATING_FLOOR = 400


def rating_of(theta: float) -> int:
    return max(RATING_FLOOR, round(RATING_BASE + RATING_PER_THETA * theta))
