"use client"

import posthog from "posthog-js"

// Asignación de brazos para los experimentos del minijuego.
//
// **Por qué no se parece al otro experimento del repo.**
// `UsePostOnboardingRanking.ts` pregunta por un feature flag de PostHog y eso
// alcanza porque se evalúa siempre DESPUÉS del login: el bucketing cae sobre el
// id de Clerk y es estable. dx es lo contrario — la mayoría de los jugadores son
// invitados y nunca se identifican— así que acá hacen falta dos cosas que aquel
// no necesita:
//
//   1. **Un id de dispositivo propio.** El `guest_token` no sirve: en una
//      primera visita todavía NO EXISTE. Lo crea el `POST /game/derivemos/player`
//      y se guarda después de que vuelve (ver UseGamePlayer.ts), o sea después
//      de que la intro ya se dibujó. Y la primera visita es justamente la
//      población que estos experimentos miden. Así que el id se genera acá,
//      antes que nada.
//   2. **Decisión sincrónica.** El brazo cambia la PRIMERA pantalla. Si se
//      resolviera con `await` —como el flag de PostHog, que puede tardar hasta
//      2,5 s o no contestar nunca con un bloqueador— se vería un parpadeo del
//      control antes de entrar al brazo test, que es peor que no experimentar.
//
// El costo de no usar PostHog es que allá los eventos no se segmentan solos por
// flag. Se compensa de dos formas: el brazo viaja como super propiedad (abajo) y
// además se persiste en `game_players.variant`, que es lo que permite leer el
// embudo hasta el final —el cafecito vive en `game_boosts`, no en un evento—.
//
// El beneficio es más grande que el costo: sin depender de PostHog, **no existe
// el estado `unavailable`**. En un producto donde seis de cada diez se van antes
// de la primera derivada, dejar sin sortear a quien tiene un bloqueador sería
// perder gente de forma correlacionada con el aparato, que es justo la variable
// que estamos mirando.

const DEVICE_KEY = "intervalo:game:device"

/** El experimento en curso. Cambiarlo re-sortea a todo el mundo: el id de
 *  dispositivo se mantiene, pero el hash lleva el nombre adentro, así que los
 *  brazos de dos experimentos distintos no quedan correlacionados.
 *
 *  `dx-puerta-1` terminó el 18/09 con 527 por brazo. Ganó `derivada-primero`
 *  —de 55,6% a 80,6% de gente a la que se le muestra una derivada, IC95
 *  [19,6 · 30,5]— y ES el flujo de hoy, así que dejó de ser un brazo: los dos
 *  brazos de acá abajo lo tienen puesto. Lo que ese experimento también dejó,
 *  y es de lo que este se ocupa, está en el catálogo de features. */
export const EXPERIMENTO = "dx-puerta-2"

/** Los brazos, en orden. El índice ES el bucket, así que agregar uno al final
 *  no remueve a nadie de los que ya estaban.
 *
 *  `sin-peaje` saca lo que `dx-puerta-1` dejó apilado justo después de la
 *  primera correcta —el @, y las tres reglas— y lo corre a después de la
 *  tercera. Ver reglas-trigger.ts. */
export const BRAZOS = ["control", "sin-peaje"] as const
export type Brazo = (typeof BRAZOS)[number]

/** Lo que se manda al backend y se guarda en `game_players.variant`. */
export function etiquetaDeBrazo(brazo: Brazo): string {
  return `${EXPERIMENTO}:${brazo}`
}

/** Un id estable por dispositivo, creado la primera vez que se lo pide.
 *
 *  Si el navegador no deja escribir (Safari privado, storage bloqueado) se
 *  devuelve uno efímero: esa persona queda sorteada igual y su sesión es
 *  coherente, solo que al recargar puede caer en el otro brazo. Es el mismo
 *  compromiso que ya tiene el token de invitado, y el sesgo que introduce es
 *  simétrico entre brazos. */
function idDeDispositivo(): string {
  if (typeof window === "undefined") return ""
  try {
    const guardado = window.localStorage.getItem(DEVICE_KEY)
    if (guardado) return guardado
    const nuevo = crypto.randomUUID()
    window.localStorage.setItem(DEVICE_KEY, nuevo)
    return nuevo
  } catch {
    return crypto.randomUUID()
  }
}

/** FNV-1a de 32 bits, con una pasada de avalancha al final.
 *
 *  No depende de `crypto.subtle` —que es async y acá hace falta una respuesta
 *  sincrónica— y da el mismo número en cualquier navegador.
 *
 *  **La avalancha no es adorno.** FNV-1a multiplica por un primo IMPAR en cada
 *  paso, y multiplicar por impar no cambia el bit de abajo; el XOR sí. O sea que
 *  el bit 0 del resultado es, exactamente, el XOR de los bits 0 de todos los
 *  bytes de entrada — y `% 2` usa justo ese bit. Con ids aleatorios el reparto
 *  igual da mitad y mitad, así que el sesgo no se ve en un histograma, pero la
 *  asignación queda colgada de una función trivial de la entrada: cambiar el
 *  nombre del experimento por uno con otra paridad da vuelta el brazo de TODO el
 *  mundo a la vez, en vez de re-sortear. Lo encontró
 *  `backend/scripts/check_game_variante.py`, comparando dos experimentos.
 *
 *  La pasada de abajo es el mixer `lowbias32`, que reparte las diferencias por
 *  los 32 bits antes de que nadie mire uno solo. */
function hash(texto: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  h ^= h >>> 16
  h = Math.imul(h, 0x7feb352d) >>> 0
  h ^= h >>> 15
  h = Math.imul(h, 0x846ca68b) >>> 0
  h ^= h >>> 16
  return h >>> 0
}

/** Atajo de desarrollo: `?brazo=sin-peaje`. En producción no existe, así
 *  que nadie puede forzarse un brazo y ensuciar los datos. */
function brazoForzado(): Brazo | null {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null
  const pedido = new URLSearchParams(window.location.search).get("brazo")
  return BRAZOS.includes(pedido as Brazo) ? (pedido as Brazo) : null
}

let cache: Brazo | null = null

/** El brazo de este dispositivo. Sincrónica y estable dentro de la pestaña.
 *
 *  Se puede llamar durante el render sin riesgo de hydration mismatch porque los
 *  dos layouts del juego montan solo del lado del cliente: `game-root.tsx` los
 *  carga con `dynamic({ ssr: false })` y no dibuja ninguno hasta que
 *  `usePlatform()` contesta. En el servidor devuelve el control, que además es
 *  el flujo seguro. */
export function brazoDelJuego(): Brazo {
  if (cache !== null) return cache
  if (typeof window === "undefined") return BRAZOS[0]
  const forzado = brazoForzado()
  const brazo = forzado ?? BRAZOS[hash(`${EXPERIMENTO}:${idDeDispositivo()}`) % BRAZOS.length]
  cache = brazo
  // Como super propiedad, para poder cortar en PostHog cualquier evento del
  // juego por brazo sin tener que pasarlo en los treinta `capture` que hay
  // repartidos. Mismo criterio que `useGameIdentity`.
  try {
    posthog.register({ [EXPERIMENTO]: brazo })
  } catch {
    // PostHog bloqueado. El experimento sigue: el brazo ya está decidido y se
    // persiste igual en la base por el POST del jugador.
  }
  return brazo
}

/** Solo para los tests: olvida el brazo cacheado de este módulo. */
export function _olvidarBrazo(): void {
  cache = null
}
