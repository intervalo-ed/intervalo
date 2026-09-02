// Los hitos del embudo: en qué derivada se le pregunta algo a la persona en vez
// de darle la siguiente.
//
// Primero enganchar; carrera/universidad cuando ya está metido; el registro
// —con el gancho del @ propio— al final.
//
// Los números viven acá y no en cada layout porque son UNA decisión de producto
// sobre UN embudo, no dos. Estaban con nombre en el teléfono y como literales
// sueltos en escritorio, que es la forma seguida de que dentro de un mes cada
// plataforma pregunte en una derivada distinta y el embudo deje de ser
// comparable entre las dos.

/** Cuántas correctas antes de preguntar carrera y universidad. */
export const HITO_PERFIL = 3

/** Cuántas correctas antes de ofrecerle registrarse a un invitado. */
export const HITO_REGISTRO = 12

// Los dos hitos se cuentan con las correctas ACUMULADAS del jugador —las que
// manda el servidor— y no con un contador de la pestaña.
//
// Este archivo existía justamente para que el embudo fuera comparable entre
// plataformas, y el contador de pestaña lo rompía en la dimensión que faltaba:
// el tiempo. Arrancaba en cero en cada carga de página, así que en una sesión
// real —iOS descarta la pestaña apenas se sale a otra app— la cuenta volvía a
// empezar varias veces y llegar a doce pedía doce aciertos SIN salir del juego.
// El disparador del cafecito ya se había mudado al contador del servidor por
// este mismo motivo; estos dos se habían quedado atrás. Medido en una sesión de
// prueba: el servidor tenía 20 correctas y la pestaña decía 8.
//
// Con el contador del servidor aparece el problema espejo: la condición ya está
// cumplida, así que recargar volvería a ofrecer el registro en la primera
// respuesta, y otra vez en la siguiente recarga. Por eso la oferta se anota
// (localStorage) y se espacia otras `HITO_REGISTRO` correctas: se ofrece de
// nuevo a quien siguió jugando un buen rato, no a quien acaba de decir que no.
//
// La pregunta de carrera y universidad NO necesita nada de esto: su condición
// se apaga sola en cuanto hay universidad, y volver a preguntarle en una visita
// nueva a quien la salteó es el comportamiento buscado (ver el comentario de
// `faltaPreguntarUniversidad` en los dos layouts).

import { marcarRegistroOfrecido, readRegistroOfrecidoAt } from "./game-storage"

export function tocaRegistro(totalCorrectas: number): boolean {
  return (
    totalCorrectas >= HITO_REGISTRO &&
    totalCorrectas - readRegistroOfrecidoAt() >= HITO_REGISTRO
  )
}

export function marcarRegistroMostrado(totalCorrectas: number) {
  marcarRegistroOfrecido(totalCorrectas)
}
