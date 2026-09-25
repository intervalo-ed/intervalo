// Cuándo el juego pregunta, y cuál de sus dos preguntas toca.
//
// Son las dos opiniones que el juego pide: cómo le viene resultando la dificultad
// (opinion-slide.tsx) y si le están saliendo repetidas (repetitividad-slide.tsx).
// Todo lo demás que el juego sabe lo mide: θ y β salen de los aciertos, y los
// aciertos no saben si alguien se está aburriendo.
//
// **Comparten UNA escalera de turnos y el ocupante alterna**, y eso no es
// economía de código. El número que importa para la fatiga es cuántas pantallas
// ve la persona, no cuántas ve de cada tipo; con dos escaleras independientes ese
// presupuesto pasa a ser dos números que hay que mirar juntos, y nadie los mira
// juntos. Con una, subir o bajar la frecuencia de las encuestas es cambiar una
// sola tabla.
//
// Suelto y sin nada de React por el mismo motivo que reclutas-trigger.ts y
// instalacion-trigger.ts: son dos cuentas de módulo y un valor de localStorage,
// y equivocarse en la cadencia no se ve jugando sino semanas después, cuando la
// pregunta le salió a diez personas en vez de a cien. Ver
// web/scripts/check-opinion-trigger.ts.
//
// El archivo sigue llamándose `opinion-trigger` y no `preguntas-trigger` a
// propósito: `check:opinion` está en el CI y tres checks hermanos lo citan por
// ruta, así que renombrarlo mueve el diff sin cambiar nada.

import {
  PEDIDO_OPINION,
  readOpinionSaltos,
  readPedidoState,
  readUltimaPantalla,
  saveOpinionSaltos,
  savePedidoState,
} from "./game-storage"

/** Cuál de las dos preguntas ocupa un turno. */
export type Pregunta = "dificultad" | "repetitividad"

// En qué derivada sale la primera vez.
//
// Diez es donde la persona ya tiene algo que opinar y el motor algo que mirar.
// Del lado del motor: la rampa inicial termina a las 5 respuestas y las tres
// primeras derivadas de cualquier jugador son fijas, así que recién a partir de
// ahí el registro habla de la persona y no de por dónde el juego la hizo entrar
// (ver game/opinion.py :: MIN_RESPUESTAS). Del lado del embudo: la curva de
// supervivencia dice que a la derivada 10 llega la mitad de una tanda y a la 20
// un cuarto, o sea que cada diez derivadas de espera cuesta la mitad de la
// audiencia.
//
// Es también donde se desbloquea el panel de estadísticas personales
// (stats-gate.ts :: UMBRAL_ESTADISTICAS), y esa coincidencia conviene: la
// pregunta le llega a alguien que ya pudo ver sus propios números.
//
// En la práctica el primer turno cae en la 28, corrido por `OPINION_SEPARACION`
// y por el resto del ladder (ver el mapa de hitos en context/features-catalog.md).
export const OPINION_PRIMERA = 10

// El hueco hasta el turno siguiente, según cuántos turnos ya salieron. El último
// valor se repite para siempre.
//
// **Empieza en 10 y crece, y antes era 30 fijo con tope de tres apariciones.** El
// cambio sale de medir la encuesta de dificultad del 13/09 al 22/09: 437
// impresiones, 401 contestadas, **91,8% de respuesta** — más que la pregunta
// abierta del juego (83,8%) y a la altura de los canales del clásico. La pregunta
// no molesta, y la cadencia estaba puesta como si molestara.
//
// El tope de tres era el problema más grande. 437 impresiones sobre 235 personas
// implica que una porción grande ya lo había agotado, y son justo las que hay que
// escuchar: los que piden más variedad en la pregunta abierta tienen 76, 325,
// 356, 374 y 583 derivadas resueltas, o sea que estaban mudos desde hacía cientos
// de ejercicios — incluido el día que les cambió el catálogo abajo de los pies.
//
// Que CREZCA en vez de quedarse en 10 es la otra mitad. Una pregunta cada diez
// para siempre son 121 pantallas para quien lleva 1.227 derivadas, y eso ya no es
// una pregunta, es un peaje. Con esta tabla son 19: una cada 65. Hoy son 3.
//
//   turnos: 28, 38, 48, 68, 98, 148, 228, 308, 388, 468…
//
// **Un hueco de 10 era imposible hasta que el servidor aprendió a cortar la
// ventana.** El ajuste de θ mira hasta 20 respuestas hacia atrás, así que dos
// votos a 10 de distancia se calculaban sobre media tanda compartida y el segundo
// cobraba de nuevo una sorpresa que el primero ya había cobrado. Eso ya no pasa:
// la ventana arranca en el último voto que cobró
// (`game_difficulty_votes.corte_ejercicio_id`, `router._corte_cobrado`), así que
// la cadencia dejó de ser una restricción. Si esa columna se fuera, este 10 tiene
// que volver a ser mayor que 20.
export const OPINION_CADENCIAS = [10, 10, 20, 30, 50, 80] as const

// Cuántos turnos seguidos de dificultad antes de empezar a alternar.
//
// Tres, y el motivo es que a la 28-48 la repetición todavía no pasó: medida antes
// del arreglo del 10/09, la repetición de enunciado era del **2,4% en las
// primeras diez** contra el 50,1% entre la 26 y la 50 y el 77,5% del 51 en
// adelante. Preguntarle por repetición a alguien que no la vivió devuelve una
// opinión sobre nada.
//
// Los tres primeros turnos son además donde el ajuste de θ rinde más: el motor
// recién salió de la rampa y su creencia sobre esa persona es la más pobre que va
// a ser nunca.
export const PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO = 3

// Cuántos salteos seguidos hacen que el juego deje de preguntar.
//
// Es el freno que reemplaza al tope de tres apariciones, y es mejor freno: el
// tope contaba lo que el juego preguntaba y cortaba también a quien contestaba
// siempre. Esto cuenta lo que la persona ignora, así que corta solo donde
// molesta. Con 91,8% de respuesta son muy pocos, y son exactamente los que hay
// que dejar en paz.
//
// Tres es el mismo número que `feedback_survey.SKIP_STREAK_LEN` en el clásico, y
// que sean el mismo no es ahorro: son la misma decisión sobre la misma persona.
// Una respuesta reinicia la racha (`anotarRespuesta`), así que esto no es un tope
// de vidas disfrazado.
export const OPINION_SALTOS_PARA_CORTAR = 3

// Separación mínima respecto del último pedido del juego (café, reclutas o
// recordatorios).
//
// Es MENOS que el cooldown compartido de diez, y estas diapos tampoco lo
// consumen. Es la segunda excepción después de la de instalar, y se sostiene por
// el mismo motivo que aquella: **es de lo único que el juego ofrece que no le
// pide nada a la persona** — ni plata, ni mandarle un mensaje a nadie, ni una
// cuenta, ni un dato sobre nadie más. Es un toque, se sale sin contestar, y lo
// que devuelve es que el juego se le acomode.
//
// Sin la excepción la pregunta no existiría en la práctica: reclutas sale en la
// derivada 9 y el registro en la 10, así que con el cooldown puesto esta se
// caería a la 20, donde queda menos de la mitad de la gente.
//
// Si alguna vez estas diapos pasan a pedir algo, tienen que entrar al cooldown
// compartido como las otras.
export const OPINION_SEPARACION = 4

/** El hueco hasta el turno siguiente, habiendo salido ya `vistas` turnos.
 *
 *  `vistas` en 0 no tiene hueco que devolver —el primer turno lo pone
 *  `OPINION_PRIMERA`— así que se trata como 1 en vez de devolver algo raro: es
 *  una función de tabla y no puede tener un caso que explote. */
export function cadenciaDeOpinion(vistas: number): number {
  const i = Math.min(Math.max(vistas, 1) - 1, OPINION_CADENCIAS.length - 1)
  return OPINION_CADENCIAS[i]
}

/** De quién es el turno número `vistas` (0-based: el primero es el 0).
 *
 *  Los primeros `PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO` son de dificultad y desde
 *  ahí alternan arrancando por repetitividad. Deriva de `vistas` y no de un
 *  campo guardado a propósito: un contador que ya existe no se puede
 *  desincronizar consigo mismo, y quien hoy tiene tres vistas de la encuesta
 *  vieja entra por el turno 3, que es el primero de repetitividad. */
export function preguntaDelTurno(vistas: number): Pregunta {
  if (vistas < PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO) return "dificultad"
  return (vistas - PREGUNTAS_DE_DIFICULTAD_AL_PRINCIPIO) % 2 === 0
    ? "repetitividad"
    : "dificultad"
}

/** ¿Toca preguntar algo después de esta respuesta, y qué?
 *
 * `totalCorrectas` son las ACUMULADAS del jugador, que las manda el servidor.
 * Contándolas en el cliente, cada recarga volvía el contador a cero y el hito no
 * llegaba nunca; ver el comentario largo en hitos-del-juego.ts.
 *
 * El servidor NO confía en esto. Para la de dificultad repite su propio gate
 * sobre las respuestas que de verdad movieron el Elo y además corta la ventana en
 * el último ajuste que cobró, así que votar de más no acredita de más. Acá se
 * decide cuándo se muestra; allá, cuánto vale. */
export function tocaPreguntar(totalCorrectas: number): Pregunta | null {
  if (totalCorrectas < OPINION_PRIMERA) return null
  if (readOpinionSaltos() >= OPINION_SALTOS_PARA_CORTAR) return null
  const { vistas, ultima } = readPedidoState(PEDIDO_OPINION)
  if (vistas > 0 && totalCorrectas - ultima < cadenciaDeOpinion(vistas)) return null
  // Contra `readUltimaPantalla` y no contra el cooldown compartido a secas: el
  // registro y el pedido de instalar tampoco lo consumen, y estas pantallas son
  // las que menos derecho tienen a caer pegadas a otra —van últimas del ladder
  // justamente porque no convierten a nadie—. Sin esto la encuesta salía en la
  // 13, entre la regla de los cafecitos de la 12 y el primer cafecito de la 14:
  // tres pantallas en tres derivadas seguidas, que es lo que el mapa de hitos
  // existe para no tener. Con esto el primer turno sale en la 28.
  if (totalCorrectas - readUltimaPantalla() < OPINION_SEPARACION) return null
  return preguntaDelTurno(vistas)
}

/** Anota que salió un turno. No toca el cooldown compartido: ver
 *  OPINION_SEPARACION.
 *
 *  Se marca al MOSTRARLA y no al contestarla, igual que antes: si solo contara la
 *  respuesta, a quien la cierra se le volvería a aparecer en la derivada
 *  siguiente y para siempre. Saltear es una respuesta — y desde que existe la
 *  racha de salteos, es una que el juego escucha (`anotarRespuesta`). */
export function marcarPreguntaMostrada(totalCorrectas: number) {
  const { vistas } = readPedidoState(PEDIDO_OPINION)
  savePedidoState(PEDIDO_OPINION, { vistas: vistas + 1, ultima: totalCorrectas })
}

/** Anota si el turno que se está cerrando se contestó o se salteó.
 *
 *  Lo llama el flow al salir de la diapo, con lo que la diapo le dijo. Una
 *  respuesta borra la racha entera y no le resta uno: lo que la racha mide es
 *  «esta persona no quiere contestar», y una respuesta es la refutación completa
 *  de eso, no una atenuación. */
export function anotarRespuesta(contesto: boolean) {
  saveOpinionSaltos(contesto ? 0 : readOpinionSaltos() + 1)
}
