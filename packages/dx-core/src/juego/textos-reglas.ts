// Lo único que el juego explica de sí mismo: la puerta y las reglas. Una sola
// copia para la web (intro-panel.tsx, reglas-slide.tsx) y la app nativa
// (intro-slide.tsx, reglas-slide.tsx): no puede decir una cosa en un lado y
// otra en el otro.
//
// Cada regla presenta una de las cosas que el juego tiene y las nombra con el
// MISMO emoji con el que después aparecen en el marcador: 🧩 los ejercicios, ♟
// el Elo. La tabla no tiene contador, pero sigue la misma forma: una palabra en
// énfasis y su emoji. El `︎` del peón fuerza presentación de TEXTO: sin él se
// dibuja como emoji, una imagen oscura de color fijo que sobre este fondo se
// apaga.

/** El saludo, y lo único que se explica antes de la primera derivada.
 *
 *  La instrucción es la regla 1 de `REGLAS` dicha en imperativo: aquella
 *  explica qué es un ejercicio, esta pide que se resuelva. Por eso la diapo de
 *  las reglas no la incluye — ya se dio acá
 *  (reglas-trigger.ts :: REGLAS_DE_LA_DIAPO). */
export const BIENVENIDA_MINIMA = "¡Bienvenido!"

/** Qué es esto, para quien llega por primera vez.
 *
 *  Es la primera oración del preview de WhatsApp (web layout.tsx ::
 *  DESCRIPCION), igual palabra por palabra. Se escribe de nuevo y no se importa
 *  de allá: son dos textos con dos trabajos distintos —uno vende el link, el
 *  otro recibe a quien ya entró— y atarlos obligaría a que el día que uno
 *  cambie el otro lo siga sin motivo. */
export const QUE_ES =
  "Memorizá todas las derivadas y llegá mejor preparado a tus parciales con este minijuego."
export const INSTRUCCION_MINIMA = "Resolvé la siguiente derivada para comenzar."

/** Lo que reemplaza a la instrucción cuando la persona ya jugó hoy. */
export const SEGUIMOS = "¿Seguimos?"

/** Un tramo de un párrafo. `enfasis` es la palabra que nombra la cosa: va
 *  resaltada (negrita), no en mayúscula — "Elo" sí la lleva, pero porque es
 *  un apellido (Árpád Élő). */
export type Tramo = { texto: string; enfasis?: boolean }

/** Las reglas, como datos. Quien las muestra elige ÍNDICES y no tiene lista
 *  propia: el día que se agregue una regla acá, está disponible en todos lados.
 *
 *  Hubo una sobre los cafecitos y se fue el 02/10: es la única que no hace
 *  falta para jugar. La de la tabla **no dice lo que cuesta**, y antes lo
 *  decía: mirarla sigue bajando la XP, pero anunciarlo de entrada convertía la
 *  única salida que el juego ofrece en una multa. */
export const REGLAS: readonly (readonly Tramo[])[] = [
  [
    { texto: "Cada " },
    { texto: "ejercicio", enfasis: true },
    { texto: " 🧩 es una función que tenés que derivar." },
  ],
  [
    { texto: "Tu puntaje " },
    { texto: "Elo", enfasis: true },
    { texto: " ♟︎ define la dificultad y se ajusta con tus aciertos y errores." },
  ],
  [
    { texto: "Si te trabás podés mirar la " },
    { texto: "tabla", enfasis: true },
    { texto: " 📖." },
  ],
]
