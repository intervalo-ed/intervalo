// Cuándo se dicen las reglas que la puerta no dice.
//
// La puerta pide una sola cosa —«resolvé la siguiente derivada»— y es la regla 1
// dicha en imperativo. De las otras quedan dos —el Elo y la tabla; la de los
// cafecitos se fue el 02/10— y llegan **juntas, en una diapo, después del
// ranking** (ver `reglasDeLaDiapo` y `reglasTras`, que dependen del brazo).
//
// **Repartirlas de a una fue el brazo `sin-peaje` de `dx-puerta-2`**, con un
// calendario que las ponía en la 5, la 12 y la 17 y ninguna antes de la tercera
// correcta. El experimento cerró el 27/09 por futilidad: +2,2 pp en llegar a
// tres, IC95 [−3,7 ; +8,1], y ningún futuro posible que cruzara el 0,05 — ni
// regalándole a los 156 que faltaban el efecto declarado entero. En forma sí
// hizo lo que prometía (+6,3 pp en llegar a la 3ª derivada) y la ventaja
// desaparecía entera en la 5ª, que es el mismo patrón que dejó `dx-puerta-1`:
// cada peaje que se mueve compra un paso y ni uno más. El calendario se fue con
// el brazo — está en el git y en el PDF del cierre.
//
// **Por qué la diapo no es el tutorial que ya se sacó una vez.** Hasta el 13/09
// las tres venían de a una en los aciertos 1, 2 y 5, y metidas ARRIBA DEL
// ENUNCIADO, en el marcador de la card. Se fueron por dos motivos que esta no
// repite: aquellas eran un renglón que se leía como pie de página del ejercicio
// que tenía debajo —esta es la pantalla entera— y caían donde la persona
// todavía no había decidido quedarse. La atrición por derivada medida en la
// camada del 14/09 dice cuánto vale esa diferencia: 20,4% en la primera, entre
// 5,7% y 8,9% de la cuarta en adelante.
//
// Suelto y sin React por el mismo motivo que reclutas-trigger.ts,
// instalacion-trigger.ts y opinion-trigger.ts: es una cuenta de módulo y un
// valor de localStorage, y equivocarse no se ve jugando sino después, en el
// embudo. Ver web/scripts/check-puerta.ts.

import {
  PEDIDO_REGLAS,
  PEDIDO_REGLAS_V1,
  readPedidoState,
  savePedidoState,
} from "./game-storage"

/** Las reglas que la puerta se guarda, por su índice en la lista de
 *  `IntroParagraphs`. La 0 es la que dice la puerta.
 *
 *  Vive acá y no en intro-panel.tsx para que el chequeo la pueda leer sin
 *  arrastrar React, posthog y la card del ejercicio a un script de bun. Es el
 *  mismo motivo por el que existe este módulo. */
export const ELO = 1
export const TABLA = 2

/** Después de cuántas correctas sale la diapo, y depende del brazo.
 *
 *  **Dos con la fila de ayudas.** Esa gente ya recibió una pantalla antes de
 *  jugar —la tabla y el salteo—, así que ponerle otra apenas acierta la primera
 *  es la segunda interrupción en tres pantallas. Corrida a la segunda, entre las
 *  dos explicaciones hay una derivada entera.
 *
 *  **Una sin la fila**, que es donde estaba: esa diapo es lo único que esos dos
 *  brazos reciben, y moverla sería cambiarles el producto para medir otra cosa.
 *
 *  Sigue sin pisar ningún hito: el primero del calendario es la 3
 *  (hitos-del-juego.ts). */
export const REGLAS_TRAS_CON_AYUDAS = 2
export const REGLAS_TRAS_SIN_AYUDAS = 1

export function reglasTras(conAyudas: boolean): number {
  return conAyudas ? REGLAS_TRAS_CON_AYUDAS : REGLAS_TRAS_SIN_AYUDAS
}

/** Cuántas reglas trae la diapo como máximo. Existe para traducir la caja
 *  vieja de localStorage, que guardaba una CANTIDAD y no una lista. */
export const REGLAS_MAX = 2

/** Qué dice esa diapo, y depende del brazo de `dx-rampa-1`.
 *
 *  Con la fila de ayudas la tabla ya se explicó ANTES de la primera derivada, en
 *  su propia pantalla y con el símbolo del botón que la abre
 *  (herramientas-slide.tsx), así que acá queda el Elo solo. Sin la fila esa
 *  pantalla no existe —explicaría un botón que no está— y la regla de la tabla
 *  se queda donde siempre estuvo.
 *
 *  Toma un booleano y no el brazo a propósito: este módulo lo lee un script de
 *  bun sin React, y el predicado vive en `pie-rampa.tsx :: conAyudasDe`, que sí
 *  arrastra React. Quien llama ya tiene el jugador en la mano. */
export function reglasDeLaDiapo(conAyudas: boolean): number[] {
  return conAyudas ? [ELO] : [ELO, TABLA]
}

/** Cuántas reglas ya se dijeron — con una sola diapo, ninguna o todas. Vive en
 *  localStorage y por eso vale para todo el aparato: esto no es un pedido que
 *  vuelve, es una explicación que se da una vez.
 *
 *  **Y traduce la caja vieja.** Hasta el 18/09 la marca era un `vistas: 1` que
 *  quería decir «las tres», porque salían juntas. Del 18 al 27 el brazo
 *  `sin-peaje` las contó de a una, así que ese 1 pasó a decir «salió una» y a
 *  quien volviera le saldrían de nuevo dos pantallas que ya había visto. La
 *  traducción queda puesta aunque el brazo se haya ido: en los navegadores de
 *  esa semana la caja vieja sigue existiendo, y borrarla de acá le devolvería la
 *  diapo a gente que ya la vio. La caja vieja no se escribe nunca más: solo se
 *  lee, y cualquier marca en ella significa las tres. */
export function reglasDichas(): number {
  const estado = readPedidoState(PEDIDO_REGLAS)
  if (estado.vistas > 0) return estado.vistas
  if (readPedidoState(PEDIDO_REGLAS_V1).vistas > 0) return REGLAS_MAX
  return 0
}

/** ¿Toca la diapo de las tres?
 *
 *  `totalCorrectas` son las ACUMULADAS del jugador, que las manda el servidor:
 *  un contador de la pestaña vuelve a cero en cada recarga y en el teléfono eso
 *  pasa cada vez que se sale a otra app (ver hitos-del-juego.ts).
 *
 *  Si localStorage está bloqueado, `readPedidoState` devuelve «nunca se dijo» y
 *  las reglas vuelven a salir. No es un problema: sin localStorage tampoco hay
 *  `guest_token` guardado, así que cada carga de página es un jugador nuevo con
 *  cero correctas, y «una vez por carga» es exactamente «una vez por jugador». */
export function tocaReglas(totalCorrectas: number, conAyudas: boolean): boolean {
  if (totalCorrectas < reglasTras(conAyudas)) return false
  return reglasDichas() === 0
}

/** Anota que la diapo salió.
 *
 *  Guarda el TOPE y no cuántas trajo esta vez: la marca significa «ya se
 *  explicó», y si guardara 1 porque el brazo con ayudas trae una sola, alguien
 *  que cambiara de brazo volvería a ver la pantalla. */
export function marcarReglasMostradas(totalCorrectas: number) {
  savePedidoState(PEDIDO_REGLAS, {
    vistas: REGLAS_MAX,
    ultima: totalCorrectas,
  })
}
