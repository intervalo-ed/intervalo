// Cuándo se dicen las tres reglas que la puerta no dice.
//
// La puerta pide una sola cosa —«resolvé la siguiente derivada»— y es la regla 1
// dicha en imperativo. Las otras tres (el Elo, los cafecitos, la tabla) tienen
// que llegar en algún momento, y en cuál es exactamente lo que `dx-puerta-2`
// mide:
//
//   - `control`   las tres juntas, en una diapo, después del primer ranking.
//                 Es lo que está shipeado hoy.
//   - `sin-peaje` de a una, y ninguna antes de la tercera correcta.
//
// **Por qué no es el tutorial que ya se sacó una vez.** Hasta el 13/09 las tres
// venían de a una en los aciertos 1, 2 y 5, y metidas ARRIBA DEL ENUNCIADO, en
// el marcador de la card. Se fueron por dos motivos, y el calendario de acá
// abajo no repite ninguno: aquellas eran un renglón que se leía como pie de
// página del ejercicio que tenía debajo —estas son la pantalla entera— y caían
// donde la persona todavía no había decidido quedarse. La atrición por derivada
// medida en la camada del 14/09 dice cuánto vale esa diferencia: 20,4% en la
// primera, entre 5,7% y 8,9% de la cuarta en adelante.
//
// El brazo NO entra acá. Lo deciden los dos layouts, y así estas funciones se
// pueden correr en bun, sin navegador y sin sortear a nadie. Suelto y sin React
// por el mismo motivo que reclutas-trigger.ts, instalacion-trigger.ts y
// opinion-trigger.ts: es una cuenta de módulo y un valor de localStorage, y
// equivocarse no se ve jugando sino después, en el embudo. Ver
// web/scripts/check-puerta.ts.

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
export const CAFECITOS = 2
export const TABLA = 3

/** Brazo `control`: después de cuántas correctas sale la diapo con las tres. */
export const REGLAS_TRAS = 1

/** Brazo `control`: qué dice esa diapo. Las tres, de un saque. */
export const REGLAS_DE_LA_DIAPO = [ELO, CAFECITOS, TABLA]

/** Brazo `sin-peaje`: una regla por vez, cada una donde tiene referente.
 *
 *  Ninguna cae antes de la tercera correcta, y eso no es prolijidad: la métrica
 *  primaria del experimento es llegar a tres, así que una regla que saliera
 *  antes estaría adentro de lo que se está midiendo y el brazo dejaría de
 *  aislar lo único que cambia.
 *
 *  Tampoco caen donde ya hay algo. El perfil se pide en la 3 y el registro en
 *  la 12 (hitos-del-juego.ts), y el cafecito cada 20 (cafecito-cta.tsx).
 *
 *  Por qué cada una donde está:
 *
 *    - **El Elo en la 5.** Con cinco resueltas la dificultad ya se movió: la
 *      frase describe algo que acaba de pasar en vez de anunciar algo que va a
 *      pasar.
 *    - **La tabla en la 8.** Es la única de las tres que es una herramienta, y
 *      llega cuando los ejercicios empezaron a costar. Antes es un dato; acá es
 *      una salida.
 *    - **Los cafecitos en la 15**, cinco antes de que la diapo del cafecito
 *      aparezca por primera vez. Llega como aviso y no como pedido, que es la
 *      única forma de que la diapo de la 20 no sea la primera noticia.
 */
export const CALENDARIO: { tras: number; regla: number }[] = [
  { tras: 5, regla: ELO },
  { tras: 8, regla: TABLA },
  { tras: 15, regla: CAFECITOS },
]

/** Correctas mínimas entre una regla y la siguiente.
 *
 *  Con el calendario de arriba nunca se activa —las distancias son 3 y 7— y
 *  existe para el caso que sí pasa: quien vuelve al juego con 30 correctas y
 *  ninguna regla dicha. Sin esto cobraría las tres en tres respuestas seguidas,
 *  que es exactamente la pila que este brazo existe para no tener. */
export const ESPACIO_MINIMO = 3

/** Cuántas de las tres ya se dijeron. Vive en localStorage y por eso vale para
 *  todo el aparato: esto no es un pedido que vuelve, es una explicación que se
 *  da una vez.
 *
 *  **Y traduce la caja vieja.** Hasta el 18/09 las tres salían juntas y se
 *  anotaban con un `vistas: 1` que quería decir «las tres». Leído con el idioma
 *  nuevo ese 1 dice «salió una», así que a quien volviera le saldrían de nuevo
 *  la tabla en la 8 y los cafecitos en la 15 — dos pantallas que ya vio, y
 *  justo en el brazo que existe para sacar pantallas del medio. La caja vieja no
 *  se escribe nunca más: solo se lee, y cualquier marca en ella significa las
 *  tres. */
export function reglasDichas(): number {
  const estado = readPedidoState(PEDIDO_REGLAS)
  if (estado.vistas > 0) return estado.vistas
  if (readPedidoState(PEDIDO_REGLAS_V1).vistas > 0) return REGLAS_DE_LA_DIAPO.length
  return 0
}

/** Brazo `control`: ¿toca la diapo de las tres?
 *
 *  `totalCorrectas` son las ACUMULADAS del jugador, que las manda el servidor:
 *  un contador de la pestaña vuelve a cero en cada recarga y en el teléfono eso
 *  pasa cada vez que se sale a otra app (ver hitos-del-juego.ts).
 *
 *  Si localStorage está bloqueado, `readPedidoState` devuelve «nunca se dijo» y
 *  las reglas vuelven a salir. No es un problema: sin localStorage tampoco hay
 *  `guest_token` guardado, así que cada carga de página es un jugador nuevo con
 *  cero correctas, y «una vez por carga» es exactamente «una vez por jugador». */
export function tocaReglas(totalCorrectas: number): boolean {
  if (totalCorrectas < REGLAS_TRAS) return false
  return reglasDichas() === 0
}

/** Brazo `control`: anota que salieron las tres. */
export function marcarReglasMostradas(totalCorrectas: number) {
  savePedidoState(PEDIDO_REGLAS, {
    vistas: REGLAS_DE_LA_DIAPO.length,
    ultima: totalCorrectas,
  })
}

/** Brazo `sin-peaje`: qué regla toca ahora, o `null` si ninguna.
 *
 *  `dichas` se pasa desde afuera y no se lee acá adentro porque el layout tiene
 *  una memoria que este módulo no puede tener: un ref de la pestaña, que cubre
 *  el caso de localStorage bloqueado. Sin él, y a diferencia del control, una
 *  regla no se repetiría «una vez por carga» sino en CADA correcta de la 5 en
 *  adelante — la partida sigue viva y el contador del servidor sigue subiendo.
 *  Ver `reglasDichasRef` en los dos layouts. */
export function proximaRegla(totalCorrectas: number, dichas: number): number | null {
  if (dichas >= CALENDARIO.length) return null
  const paso = CALENDARIO[dichas]
  if (totalCorrectas < paso.tras) return null
  if (totalCorrectas - readPedidoState(PEDIDO_REGLAS).ultima < ESPACIO_MINIMO) return null
  return paso.regla
}

/** Brazo `sin-peaje`: anota la que acaba de salir. `dichas` es cuántas había
 *  ANTES, o sea el índice de la que se está mostrando. */
export function marcarReglaDicha(dichas: number, totalCorrectas: number) {
  savePedidoState(PEDIDO_REGLAS, { vistas: dichas + 1, ultima: totalCorrectas })
}
