// Cuándo el juego hace su única pregunta abierta.
//
// Suelto y sin nada de React por el mismo motivo que sus tres gemelos
// (reclutas, instalación, opinión): son dos cuentas de módulo y un valor de
// localStorage, y equivocarse en la cadencia no se ve jugando sino semanas
// después. Ver web/scripts/check-encuesta-trigger.ts.

import {
  PEDIDO_ENCUESTA,
  readPedidoState,
  readUltimaPantalla,
  readUltimoPedidoAt,
  savePedidoState,
} from "./game-storage"

// En qué derivada sale. Una sola vez en la vida, y no hay segunda.
//
// **Dieciocho y no veinte, que era el número pedido, porque veinte no está
// libre.** El casillero se eligió simulando el ladder entero con las constantes
// reales (scratchpad, 18/09). Lo que salió:
//
// · La 20 es donde sale la oferta de cafecito (`CAFECITO_EVERY`), y su
//   disparador de hito es `% 20 === 0`. Ganarle el turno no la corre a la 24: la
//   corre a la 40, porque entre medio no hay múltiplo.
// · Correr el cafecito a la 14 para liberar la 20 obliga a correr reclutas —que
//   sale en la 10 y escribe el cooldown compartido— y con reclutas movido la
//   grilla de pedidos se desfasa: en 60 derivadas pasa de salir 3 veces a salir
//   1. Media K por dos derivadas de encuesta.
// · La 18 está vacía, deja el calendario entero intacto, y **llega a más gente
//   que la 20**: 277 jugadores contra 258, medido en producción el 18/09.
export const ENCUESTA_EN = 18

// Separación mínima respecto del último pedido del juego (café, reclutas o
// recordatorios). La misma que instalar y opinión, y menos que el cooldown
// compartido de diez.
//
// Con diez no existiría: reclutas sale en la 10, así que la pregunta se caería a
// la 20 y ahí está el café. Con cuatro cae en la 18, que es donde se la quiere.
export const ENCUESTA_SEPARACION = 4

/** ¿Toca preguntar después de esta respuesta?
 *
 * `totalCorrectas` son las ACUMULADAS del jugador, que las manda el servidor.
 * Contándolas en el cliente, cada recarga volvía el contador a cero y el hito no
 * llegaba nunca; ver el comentario largo en hitos-del-juego.ts. */
export function tocaEncuesta(totalCorrectas: number): boolean {
  if (totalCorrectas < ENCUESTA_EN) return false
  if (readPedidoState(PEDIDO_ENCUESTA).vistas > 0) return false
  // Contra `readUltimaInterrupcion` y no contra el cooldown compartido a secas:
  // el registro, el pedido de instalar y la encuesta de dificultad tampoco lo
  // consumen, así que sin esto esta pregunta podía caer sobre la misma respuesta
  // que cualquiera de las tres. La de dificultad, de hecho, también cae en la
  // 18: ésta va antes en el ladder y se la queda, y aquella se corre sola.
  return (
    totalCorrectas - readUltimoPedidoAt() >= ENCUESTA_SEPARACION &&
    totalCorrectas !== readUltimaPantalla()
  )
}

/** Anota que se mostró.
 *
 * **No toca el cooldown compartido**, y esa es una decisión medida y no una
 * omisión. La regla escrita en opinion-trigger.ts dice que una diapo que pide
 * algo tiene que entrar al cooldown, y escribir un texto es pedir algo. Pero
 * simulando el ladder con la encuesta en la 18 consumiéndolo, el cafecito de la
 * 20 queda tapado y se cae hasta la 40: en 60 derivadas se pierde una oferta de
 * las tres. Una pregunta que se hace UNA vez en la vida no puede costar eso.
 *
 * Lo que sí hace es respetarlo (ver `ENCUESTA_SEPARACION`), que es la mitad que
 * protege a la persona de dos pantallas seguidas.
 *
 * Se marca al MOSTRARLA y no al contestarla, igual que la de dificultad: si solo
 * contara la respuesta, a quien la cierra se le volvería a aparecer en la
 * siguiente derivada y para siempre. */
export function marcarEncuestaMostrada(totalCorrectas: number) {
  savePedidoState(PEDIDO_ENCUESTA, { vistas: 1, ultima: totalCorrectas })
}
