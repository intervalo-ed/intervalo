// Cuándo el juego le pregunta a la persona cómo le viene resultando.
//
// Es la única opinión que el juego pide. Todo lo demás que sabe lo mide: θ y β
// salen de los aciertos, y los aciertos no saben si alguien se está aburriendo.
//
// Suelto y sin nada de React por el mismo motivo que reclutas-trigger.ts y
// instalacion-trigger.ts: son dos cuentas de módulo y un valor de localStorage,
// y equivocarse en la cadencia no se ve jugando sino semanas después, cuando la
// pregunta le salió a diez personas en vez de a cien. Ver
// web/scripts/check-opinion-trigger.ts.

import {
  PEDIDO_OPINION,
  readPedidoState,
  readUltimaInterrupcion,
  readUltimoPedidoAt,
  savePedidoState,
} from "./game-storage"

// En qué derivada sale la primera vez, y cada cuántas vuelve.
//
// Diez es donde la persona ya tiene algo que opinar y el motor algo que mirar.
// Del lado del motor: la rampa inicial termina a las 5 respuestas y las tres
// primeras derivadas de cualquier jugador son fijas, así que recién a partir de
// ahí el registro habla de la persona y no de por dónde el juego la hizo entrar
// (ver game/opinion.py :: MIN_RESPUESTAS). Del lado del embudo: la curva de
// supervivencia de la cohorte más grande dice que a la derivada 10 llega el 19%
// y a la 15 el 10%, o sea que cada cinco derivadas de espera cuesta la mitad de
// la audiencia.
//
// Es también donde se desbloquea el panel de estadísticas personales
// (stats-gate.ts :: UMBRAL_ESTADISTICAS), y esa coincidencia conviene: la
// pregunta le llega a alguien que ya pudo ver sus propios números.
export const OPINION_PRIMERA = 10

// Cada treinta, y como mucho tres veces en la vida.
//
// Treinta y no veinte porque la ventana con la que se calcula el ajuste mira 20
// respuestas hacia atrás (game/opinion.py :: VENTANA): con una cadencia más
// corta, dos votos seguidos se calcularían sobre las mismas derivadas y el
// segundo volvería a cobrar una sorpresa que el primero ya cobró.
//
// El tope de tres es la mitad del asunto. Sin él, a quien contesta se le vuelve
// a preguntar para siempre, y una encuesta que no termina nunca deja de leerse
// como una pregunta y pasa a leerse como un peaje.
export const OPINION_CADA = 30
export const OPINION_MAX = 3

// Separación mínima respecto del último pedido del juego (café, reclutas o
// recordatorios).
//
// Es MENOS que el cooldown compartido de diez, y esta diapo tampoco lo consume.
// Es la segunda excepción después de la de instalar, y se sostiene por el mismo
// motivo que aquella: **es de lo único que el juego ofrece que no le pide nada a
// la persona** — ni plata, ni mandarle un mensaje a nadie, ni una cuenta, ni un
// dato sobre nadie más. Es un toque, se sale sin contestar, y lo que devuelve es
// que el juego se le acomode.
//
// Sin la excepción la pregunta no existiría en la práctica: reclutas sale
// justamente en la derivada 10, así que con el cooldown puesto esta se caería a
// la 20, donde queda menos de la mitad de la gente.
//
// Si alguna vez esta diapo pasa a pedir algo, tiene que entrar al cooldown
// compartido como las otras.
export const OPINION_SEPARACION = 4

/** ¿Toca preguntar después de esta respuesta?
 *
 * `totalCorrectas` son las ACUMULADAS del jugador, que las manda el servidor.
 * Contándolas en el cliente, cada recarga volvía el contador a cero y el hito no
 * llegaba nunca; ver el comentario largo en hitos-del-juego.ts.
 *
 * El servidor NO confía en esto: repite su propio gate sobre las respuestas que
 * de verdad movieron el Elo, y si no alcanzan guarda el voto sin ajustar nada.
 * Acá se decide cuándo se muestra; allá, cuánto vale. */
export function tocaOpinion(totalCorrectas: number): boolean {
  if (totalCorrectas < OPINION_PRIMERA) return false
  const { vistas, ultima } = readPedidoState(PEDIDO_OPINION)
  if (vistas >= OPINION_MAX) return false
  if (vistas > 0 && totalCorrectas - ultima < OPINION_CADA) return false
  // Contra `readUltimaInterrupcion` y no contra el cooldown compartido a secas:
  // el registro y el pedido de instalar tampoco lo consumen, y esta pantalla es
  // la que menos derecho tiene a caer pegada a otra —va última del ladder
  // justamente porque no convierte a nadie—. Sin esto la encuesta salía en la
  // 13, entre la regla de los cafecitos de la 12 y el primer cafecito de la 14:
  // tres pantallas en tres derivadas seguidas, que es lo que el mapa de hitos
  // existe para no tener. Con esto sale en la 18.
  return totalCorrectas - readUltimaInterrupcion() >= OPINION_SEPARACION
}

/** Anota que se mostró. No toca el cooldown compartido: ver OPINION_SEPARACION.
 *
 * Se marca al MOSTRARLA y no al contestarla, a propósito: si solo contara la
 * respuesta, a quien la saltea se le volvería a aparecer en la siguiente
 * derivada y para siempre. Saltear es una respuesta. */
export function marcarOpinionMostrada(totalCorrectas: number) {
  const { vistas } = readPedidoState(PEDIDO_OPINION)
  savePedidoState(PEDIDO_OPINION, { vistas: vistas + 1, ultima: totalCorrectas })
}
