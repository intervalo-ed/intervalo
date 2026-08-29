// Cuándo el juego ofrece reclutar por su cuenta.
//
// Suelto y sin nada de React para que se pueda comprobar solo: son dos cuentas
// de módulo y un valor de localStorage, y equivocarse en el resto o en el
// cooldown no se ve jugando —hay que resolver diez derivadas para enterarse—
// sino semanas después, en el embudo. Ver web/scripts/check-reclutas-trigger.ts.

import { readUltimoPedidoAt, saveUltimoPedidoAt } from "./game-storage"

// Cada cuántas resueltas se ofrece reclutar, y en qué resto de esa cuenta.
//
// Veinte y diez, o sea 10, 30, 50…, entrelazado con el cafecito, que sale en los
// múltiplos de veinte. No es casualidad ni elegancia: son las dos únicas cosas
// que el juego pide, y alternarlas es lo que evita que una tape a la otra.
//
// El primero llega a las DIEZ, antes que el primer café. Reclutar no le cuesta
// nada a nadie y es lo que hace crecer el juego, así que va primero; el café
// llega después, cuando ya hay partida jugada que justifique el pedido.
//
// Que se entrelacen no alcanza igual: el café también sale por récord y por
// escalada, que caen en cualquier número. La garantía de que no se pisen la da
// el cooldown compartido (ver readUltimoPedidoAt en game-storage.ts).
//
// EN DESARROLLO sale en los aciertos IMPARES y el café en los pares. Con los
// valores de producción, tocar un renglón de esta diapo cuesta diez derivadas
// bien resueltas. Impares y pares y no las dos en cada acierto: el ladder revisa
// el café primero —en producción gana él, porque puede venir de un récord, que
// es más raro y más urgente que llegar a un número— así que con las dos saliendo
// siempre, esta no aparecería nunca en desarrollo.
const EN_DESARROLLO = process.env.NODE_ENV === "development"
export const RECLUTAS_CADA = EN_DESARROLLO ? 2 : 20
export const RECLUTAS_RESTO = EN_DESARROLLO ? 1 : 10
export const RECLUTAS_COOLDOWN = EN_DESARROLLO ? 0 : 10

/** ¿Toca ofrecer reclutar después de esta respuesta?
 *
 * `totalCorrectas` son las ACUMULADAS del jugador, que las manda el servidor —
 * no las de esta pestaña. Contándolas en el cliente, cada recarga volvía el
 * contador a cero y el hito no llegaba nunca; es el mismo error que ya se había
 * arreglado en el café. */
export function tocaReclutar(totalCorrectas: number): boolean {
  if (totalCorrectas <= 0) return false
  if (totalCorrectas % RECLUTAS_CADA !== RECLUTAS_RESTO) return false
  return totalCorrectas - readUltimoPedidoAt() >= RECLUTAS_COOLDOWN
}

/** Anota que se pidió algo, para que el café no salga pegado a esto. */
export function marcarReclutasMostrado(totalCorrectas: number) {
  saveUltimoPedidoAt(totalCorrectas)
}
