// Cuándo salen las reglas que la puerta mínima se guardó.
//
// Solo existe para el brazo `derivada-primero` del experimento de la puerta
// (lib/experiments/UseGameVariant.ts). El control las dice todas antes de jugar
// y no pasa nunca por acá.
//
// Suelto y sin React por el mismo motivo que reclutas-trigger.ts,
// instalacion-trigger.ts y opinion-trigger.ts: es una cuenta de módulo y un
// valor de localStorage, y equivocarse no se ve jugando sino después, en el
// embudo. Ver web/scripts/check-puerta.ts.
//
// El brazo NO entra acá. Lo decide quien llama (`puertaMinima` en los dos
// layouts), y así esta función se puede correr en bun, sin navegador y sin
// sortear a nadie.

import { PEDIDO_REGLAS, readPedidoState, savePedidoState } from "./game-storage"

/** Después de cuántas correctas.
 *
 *  Una. Las tres reglas hablan del Elo, del ranking y de la tabla, y con cero
 *  derivadas resueltas ninguna de las tres tiene referente: son la misma lista
 *  que el control muestra antes de jugar, o sea exactamente el peaje que este
 *  brazo existe para sacar. Con una resuelta, en cambio, el Elo ya se movió y
 *  el puesto ya se vio — la explicación llega a describir algo que acaba de
 *  pasar en la pantalla. */
export const REGLAS_TRAS = 1

/** Desde qué regla arranca la diapo, contando desde cero: la 2.
 *
 *  Vive acá y no en reglas-slide.tsx para que el chequeo la pueda leer sin
 *  arrastrar React, posthog y la card del ejercicio a un script de bun. Es el
 *  mismo motivo por el que existe este módulo. */
export const REGLAS_DESDE = 1

/** ¿Toca explicarlas?
 *
 *  `totalCorrectas` son las ACUMULADAS del jugador, que las manda el servidor:
 *  un contador de la pestaña vuelve a cero en cada recarga y en el teléfono eso
 *  pasa cada vez que se sale a otra app (ver hitos-del-juego.ts).
 *
 *  Una sola vez por dispositivo, y por eso mira `vistas` y no la última
 *  aparición: esto no es un pedido que vuelve, es una explicación que se da.
 *
 *  Si localStorage está bloqueado, `readPedidoState` devuelve «nunca se mostró»
 *  y las reglas vuelven a salir. No es un problema: sin localStorage tampoco
 *  hay `guest_token` guardado, así que cada carga de página es un jugador nuevo
 *  con cero correctas, y «una vez por carga» es exactamente «una vez por
 *  jugador». */
export function tocaReglas(totalCorrectas: number): boolean {
  if (totalCorrectas < REGLAS_TRAS) return false
  return readPedidoState(PEDIDO_REGLAS).vistas === 0
}

/** Anota que salieron. `ultima` se guarda aunque nadie la lea: la caja es la
 *  compartida con los pedidos que se repiten, y dejarla en -Infinity haría que
 *  una fila guardada acá se leyera distinto que las otras si algún día esto
 *  pasara a repetirse. */
export function marcarReglasMostradas(totalCorrectas: number) {
  savePedidoState(PEDIDO_REGLAS, { vistas: 1, ultima: totalCorrectas })
}
