// Los textos de las tres encuestas de la escalera: la abierta (varita), la de
// dificultad y la de repetitividad. Sin React, para que la web y la app nativa
// digan exactamente lo mismo.

/** La clave de la pregunta, gemela de `backend/game/encuesta.py :: VARITA`.
 *
 * Viaja en el POST para que la respuesta quede atada a lo que la persona
 * realmente leyó: el enunciado se puede retocar sin que eso quiera decir que la
 * pregunta es otra, y el día que SÍ sea otra, las dos tandas quedan separadas. */
export const PREGUNTA_ENCUESTA = "varita_v1"

// El mismo tope que `encuesta.MAX_LARGO`. Cortar acá y no solo allá es lo que
// hace que el contador no mienta: si el campo dejara escribir 900 y el servidor
// guardara 500, la persona vería desaparecer el final de lo que escribió.
export const MAX_LARGO_ENCUESTA = 500

export type VotoDificultad = "muy_facil" | "justo" | "muy_dificil"

export const OPCIONES_OPINION: { voto: VotoDificultad; emoji: string; texto: string }[] = [
  { voto: "muy_facil", emoji: "😴", texto: "Muy fáciles" },
  { voto: "justo", emoji: "👌", texto: "Justas" },
  { voto: "muy_dificil", emoji: "🤯", texto: "Muy difíciles" },
]

// El renglón que aparece debajo apenas se elige una opción, y cambia si se
// cambia de opción. Es la respuesta del juego a lo que la persona acaba de
// decir: sin él, tocar una opción solo la pintaba y no se sabía si eso servía
// para algo.
//
// Hubo uno parecido que se fue —«Anotado.», «Te subimos la vara.»— y se fue por
// dos motivos que este esquiva. Salía DESPUÉS de mandar el voto, y hoy el voto
// no se manda hasta Continuar; este depende solo de lo elegido, así que no
// espera a nadie. Y el más frecuente era «Anotado.», que acusaba recibo sin
// decir nada; estos dicen qué va a pasar.
//
// En primera del plural, como el subtítulo («Ajustemos la dificultad»): la
// dificultad se decide entre los dos, y el renglón es la mitad del juego
// contestando.
//
// **Prometen más de lo que el servidor garantiza, y es una decisión de
// producto.** El voto decide el signo del ajuste y el registro de la persona
// decide el tamaño (backend/game/opinion.py): quien dice «muy fáciles» sin
// venir ganándole al motor no se mueve. «Aumentamos» es cierto para quien tiene
// el registro que lo respalda y es una intención para el resto.
export const RESPUESTA_OPINION: Record<VotoDificultad, string> = {
  muy_facil: "Aumentamos entonces.",
  justo: "La dejamos igual entonces.",
  muy_dificil: "Bajamos entonces.",
}

export type VotoRepetitividad = "variado" | "justo" | "repetitivo"

// El orden va de variado a repetitivo para que coincida con el de la otra diapo:
// arriba lo que sobra, abajo lo que falta. Con el orden invertido, las dos
// preguntas se leerían al revés una de la otra y el 1 significaría cosas
// opuestas en dos pantallas que salen alternadas.
export const OPCIONES_REPETITIVIDAD: { voto: VotoRepetitividad; emoji: string; texto: string }[] = [
  { voto: "variado", emoji: "🎲", texto: "Bien variadas" },
  { voto: "justo", emoji: "👌", texto: "Está bien así" },
  { voto: "repetitivo", emoji: "🔁", texto: "Muy repetidas" },
]
