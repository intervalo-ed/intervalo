"""Elo online del minijuego — funciones puras, sin BD.

Adaptado del reporte del motor (docs/reports/2026-08-26-motor-de-sesiones.md §5/§8):
p̂ = σ((θ − β) · SCALE), actualización con learning rate decreciente tras cada
primer intento. Sin reentrenamiento ni jobs: aritmética en la misma transacción
que escribe la respuesta.
"""

from __future__ import annotations

import math

# Calibración por temperatura medida en producción de Intervalo (a = 0.818).
SCALE = 0.818

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

# Dificultad seed por tier (v1 sin cadena). Con θ=0: T0 → p̂≈0.86, T5 → p̂≈0.32.
# Al sumar cadena en v2, reservar {6: 1.4, 7: 2.0, 8: 2.6}.
BETA_SEED: dict[int, float] = {0: -2.2, 1: -1.6, 2: -1.0, 3: -0.4, 4: 0.3, 5: 0.9}

# Cuántos ESTUDIANTES DISTINTOS "vale" la semilla del tier. Ver `effective_beta`.
#
# Ocho es la respuesta a «cuánta gente distinta tiene que haber probado esto para
# que su promedio valga tanto como el criterio con el que pusimos la semilla».
# Con 2 personas la plantilla queda 80% semilla, que es lo correcto cuando dos
# personas son toda la evidencia; con 30 queda 79% aprendida.
BETA_PRIOR_PLAYERS = 8.0

# Castigo de θ al saltear un ejercicio. Plano a propósito: el lr de `update`
# decae con la experiencia, y con ese decaimiento un jugador veterano podría
# saltear sin que el juego le bajara nunca la dificultad — justo lo contrario de
# lo que promete el botón. La escala se lee contra BETA_SEED, que separa tiers de
# a ~0.6: cada salteo cuesta un cuarto de tier, cuatro seguidos bajan uno entero.
SKIP_THETA_PENALTY = 0.15

# Hiperparámetros del update (grid del reporte: a_u=0.8 b_u=0.15 a_x=1.2 b_x=0.05).
_A_USER = 0.8
_B_USER = 0.15
_A_TEMPLATE = 1.2
_B_TEMPLATE = 0.05


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
    return (n_players * beta + BETA_PRIOR_PLAYERS * seed) / (n_players + BETA_PRIOR_PLAYERS)


def predict(theta: float, beta: float) -> float:
    """p̂ de acierto al primer intento para (jugador, plantilla)."""
    return 1.0 / (1.0 + math.exp(-(theta - beta) * SCALE))


def update(
    theta: float, n_user: int, beta: float, n_template: int, correct: bool,
    tier: int | None = None, n_players: int = 0,
) -> tuple[float, float]:
    """Devuelve (theta', beta') tras el resultado del PRIMER intento.

    `n_template` son respuestas y gobierna el paso de aprendizaje de β, que es
    cuánto se mueve. `n_players` son personas distintas y gobierna el ancla, que
    es cuánto se le cree. Son dos cosas distintas y por eso van separadas.

    Con `tier`, cada número se mueve contra SU propia creencia (ver
    `effective_beta`): θ contra la β encogida, que es lo que el motor cree de
    verdad, y β contra la cruda, que es su propio estadístico. Sin `tier` se
    comporta como antes — las dos contra la cruda.

    Que θ se mueva contra la β encogida no es un efecto colateral: es la mitad
    del arreglo. La sorpresa de un acierto tiene que ir a algún lado, y si el
    ancla impide que se la coma la plantilla, se la lleva la persona. Es el
    diagnóstico dado vuelta — el modelo venía concluyendo «esta derivada era
    fácil» cuando lo correcto era «esta persona sabe», y por eso la θ mediana
    llevaba 475 respuestas clavada en 0,1.
    """
    hit = 1.0 if correct else 0.0
    beta_creida = beta if tier is None else effective_beta(beta, tier, n_players)
    theta_next = theta + _A_USER / (1.0 + _B_USER * n_user) * (hit - predict(theta, beta_creida))
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
_LEVEL_CUTS = (0.3, 1.6, 2.2)


def level_of(theta: float) -> int:
    """Nivel 0-3 del jugador; el front lo pinta con los colores de cinturón."""
    for index, cut in enumerate(_LEVEL_CUTS):
        if theta < cut:
            return index
    return len(_LEVEL_CUTS)


# El θ en la escala de ajedrez, para poder mostrarlo. Es un cambio de UNIDADES y
# nada más: el orden entre jugadores y las distancias relativas son las mismas.
# Se hace porque θ = 0.83 no le dice nada a nadie, y 1166 sí — todo el mundo sabe
# leer que 1400 es mejor que 1200 aunque no sepa qué mide.
#
# 200 puntos por unidad de θ es lo que hace que el número se mueva de forma
# legible: los tiers de BETA_SEED están separados ~0.6, así que subir un tier son
# ~120 puntos, y un acierto del primer intento en la banda objetivo son ~40.
RATING_BASE = 1000
RATING_PER_THETA = 200
# Piso, como el de la FIDE. θ puede caer bien abajo si alguien erra todo, y un
# marcador que llega a cero (o a un negativo) se lee como un juego roto, no como
# un mal día.
RATING_FLOOR = 400


def rating_of(theta: float) -> int:
    return max(RATING_FLOOR, round(RATING_BASE + RATING_PER_THETA * theta))
