// Cuándo el juego ofrece reclutar por su cuenta.
//
// Suelto y sin nada de React para que se pueda comprobar solo: son dos cuentas
// de módulo y un valor de localStorage, y equivocarse en el resto o en el
// cooldown no se ve jugando —hay que resolver diez derivadas para enterarse—
// sino semanas después, en el embudo. Ver web/scripts/check-reclutas-trigger.ts.

import {
  readUltimaInterrupcion,
  readUltimoPedidoAt,
  saveUltimoPedidoAt,
} from "./game-storage"
import { INSTALAR_SEPARACION } from "./instalacion-trigger"

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
// Antes salía en los aciertos impares en desarrollo (y el café en los pares),
// para no tener que resolver diez derivadas de verdad para ver la diapo. Se
// sacó: interrumpía probando cualquier otra cosa del juego. Para trabajar en
// reclutas/cafecito, bajar estos números a mano (sin commitearlo).
export const RECLUTAS_CADA = 20
// Nueve y no diez desde el 18/09, y se movió por dos choques que el diez creaba
// al adelantar los otros dos hitos:
//
//   - **El registro pasó a la 10.** Los dos en la misma derivada no son dos
//     pedidos: el registro sale primero, y al cerrarlo el ladder vuelve a entrar
//     y encuentra a este disparador todavía en pie. Dos pantallas seguidas sobre
//     la misma respuesta.
//   - **La primera oferta de cafecito pasó a la 14.** Este disparador escribe el
//     cooldown compartido, así que en la 10 le dejaba al café solo cuatro
//     derivadas de aire y la oferta no salía.
//
// Nueve y no menos porque la pantalla de instalar sale en la 5
// (`INSTALAR_PRIMERA`) y entre dos interrupciones tienen que quedar al menos
// `INSTALAR_SEPARACION`: 9 − 5 = 4, justo. Y nueve y no más porque después viene
// el café en la 14, que necesita sus cinco.
//
// Sigue llegando antes que el café, que es el orden que importa: se invita a un
// amigo antes de que se pida plata.
export const RECLUTAS_RESTO = 9
// Mismo número que CAFECITO_COOLDOWN y por el mismo motivo: los dos miden contra
// el último pedido de cualquier tipo, así que el más chico de los dos es el que
// manda y tenerlos distintos solo esconde cuál es.
export const RECLUTAS_COOLDOWN = 5

/** ¿Toca ofrecer reclutar después de esta respuesta?
 *
 * `totalCorrectas` son las ACUMULADAS del jugador, que las manda el servidor —
 * no las de esta pestaña. Contándolas en el cliente, cada recarga volvía el
 * contador a cero y el hito no llegaba nunca; es el mismo error que ya se había
 * arreglado en el café. */
export function tocaReclutar(totalCorrectas: number): boolean {
  if (totalCorrectas <= 0) return false
  if (totalCorrectas % RECLUTAS_CADA !== RECLUTAS_RESTO) return false
  // Las dos distancias, por lo mismo que en el café: el cooldown compartido, y
  // la pantalla de instalar —que no lo consume pero interrumpe— (game-storage.ts
  // :: readUltimaInterrupcion).
  return (
    totalCorrectas - readUltimoPedidoAt() >= RECLUTAS_COOLDOWN &&
    totalCorrectas - readUltimaInterrupcion() >= INSTALAR_SEPARACION
  )
}

/** Anota que se pidió algo, para que el café no salga pegado a esto. */
export function marcarReclutasMostrado(totalCorrectas: number) {
  saveUltimoPedidoAt(totalCorrectas)
}
