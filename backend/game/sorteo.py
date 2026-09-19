"""Sorteo de brazos del lado del servidor, derivado del id y sin columna nueva.

**Por qué no se usa el sorteo de siempre.** `UseGameVariant.ts` sortea en el
navegador y `game_players.variant` guarda el resultado AL CREAR LA FILA. Para un
experimento de pantallas eso es exactamente lo que corresponde —anotarle un brazo
a alguien que ya vio el control sería contarlo como si hubiera visto la otra, y
así lo dice `router._anotar_variante`—. Acá no aplica, y además no funcionaría:

  * **No aplica.** El brazo no cambia ninguna pantalla: cambia un parámetro del
    motor que rige de la inscripción en adelante, y el resultado se mide hacia
    adelante. No hay nada "ya visto" que contaminar.
  * **No funcionaría.** `dx-elo-1` solo le cambia algo a quien pasó las 43
    respuestas de primer intento, y los 139 que están ahí existen todos desde
    hace semanas. Con el sorteo de creación, este experimento mediría a cero
    personas para siempre.

Así que el brazo se deriva del `player.id` con un hash determinístico y no se
persiste. No hace falta: la misma cuenta da el mismo brazo hoy, cuando el jugador
responda dentro de un mes y cuando el panel lea. El costo es el mismo que en el
front —cambiar el nombre del experimento re-sortea a todo el mundo— y el
beneficio es que no hay columna, ni migración, ni una línea de TypeScript.

**Lo que este sorteo NO puede hacer y el otro tampoco**: estratificar. Con 139
elegibles, un 50/50 al azar tiene un desvío de ±6 personas, así que un reparto de
64/75 es perfectamente normal y no es un bug. El panel muestra los dos n al lado
del resultado justamente para que se vea.
"""

from __future__ import annotations

import hashlib

from . import elo

# El experimento en curso del motor. Convive con el de `UseGameVariant.ts`: son
# poblaciones disjuntas por construcción (aquel mide las tres primeras correctas,
# este muerde recién en la respuesta 43) y el brazo de uno no dice nada del otro,
# porque los dos hashes llevan su propio nombre adentro.
EXPERIMENTO = "dx-elo-1"

# El índice ES el bucket, igual que en el front: agregar un brazo al final no
# remueve a nadie de los que ya estaban.
BRAZOS = ("control", "rapido")

# Qué piso le toca a cada brazo. El control es el motor de hoy, tal cual.
PISOS: dict[str, float] = {
    "control": elo.LR_MIN_CONTROL,
    "rapido": elo.LR_MIN_RAPIDO,
}

# Desde qué respuesta el brazo test empieza a diferenciarse del control. No es
# una constante: sale de los hiperparámetros del motor (ver `elo.n_donde_muerde`),
# así que si alguien mueve `_A_USER` o `_B_USER` este número lo sigue. El panel
# lo usa para decidir a quién inscribir, y si se desincronizaran el experimento
# estaría midiendo gente a la que no le pasó nada.
UMBRAL_N = elo.n_donde_muerde(elo.LR_MIN_RAPIDO) or 0


def _hash(texto: str) -> int:
    """blake2b y no el FNV-1a del front.

    Allá el hash tiene que ser sincrónico y correr en cualquier navegador sin
    `crypto.subtle`, y esa restricción obligó a escribirlo a mano —con el
    problema del bit de abajo que después hubo que arreglar con una pasada de
    avalancha—. Acá no hay ninguna restricción de esas: `hashlib` está en la
    biblioteca estándar y reparte bien sin que haya que demostrarlo.

    Importa porque el id es SECUENCIAL: sobre una entrada tan ordenada, un hash
    con estructura en los bits bajos no sortea, agrupa.
    """
    return int.from_bytes(
        hashlib.blake2b(texto.encode("utf-8"), digest_size=8).digest(), "big"
    )


def brazo_de(player_id: int, experimento: str = EXPERIMENTO,
             brazos: tuple[str, ...] = BRAZOS) -> str:
    """El brazo que le tocó a este jugador. Determinístico y sin estado."""
    return brazos[_hash(f"{experimento}:{player_id}") % len(brazos)]


def etiqueta_de(player_id: int) -> str:
    """`dx-elo-1:rapido`, con el mismo formato que `game_players.variant`.

    Es el formato de allá aunque no se guarde en ningún lado: el panel muestra
    los dos experimentos en la misma página y leer dos convenciones distintas
    para la misma cosa es una forma barata de confundirse.
    """
    return f"{EXPERIMENTO}:{brazo_de(player_id)}"


def piso_de(player_id: int) -> float:
    """El piso del paso de aprendizaje que le toca a este jugador.

    Se le pregunta en CADA respuesta y no una vez: el brazo es una función pura
    del id, así que no hay nada que cachear ni que pueda quedar viejo.
    """
    return PISOS[brazo_de(player_id)]
