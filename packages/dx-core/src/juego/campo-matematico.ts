// La configuración del campo de la respuesta (el `<math-field>` de MathLive),
// compartida entre la web (web/src/app/derivadas/math-input.tsx) y la app
// nativa (mobile/components/juego/math-field.dom.tsx). Solo datos: quién crea
// el campo y cómo lo monta es de cada plataforma.

/** Los atajos que se suman a los de fábrica de MathLive.
 *
 *  "tan" es lo que ya entiende MathLive de fábrica; el atajo queda igual para
 *  que escribir "tg" siga funcionando, que es como lo escribe medio país aunque
 *  la tecla diga otra cosa. */
export const ATAJOS_EN_LINEA: Record<string, string> = {
  sen: "\\operatorname{sen}",
  tan: "\\tan",
  tg: "\\tan",
}

/** Piso del alto del CONTENIDO del campo, en em contra su propio tamaño de
 *  letra (`::part(content)`).
 *
 *  Existe porque la caja crecía sola: MathLive mide el alto de lo que hay
 *  escrito, y una `(` o un exponente son un par de píxeles más altos que una
 *  `x`, así que escribir movía la caja —y con ella el teclado de abajo— todo el
 *  tiempo. Una expresión de un renglón mide ~1,4 em y llega a ~1,7 con
 *  paréntesis y exponentes; una fracción anda por 2,4. A 1,9 em, lo de un
 *  renglón nunca la mueve y una fracción sí. */
export const CONTENIDO_MIN_EM = 1.9

/** El tamaño de letra del campo, en rem. */
export const CAMPO_FONT_REM = 1.35

/** Borde del campo según el feedback. El verde es el del resto del juego; el de
 *  errar es el `WRONG` de exercise-card.tsx, el naranja de las sesiones. */
export const BORDE_POR_TONO = {
  correct: "#22C55E",
  wrong: "#F97316",
} as const

export type TonoDelCampo = keyof typeof BORDE_POR_TONO | null

/** El cartel del campo vacío en el teléfono. "de abajo" sobra: la flecha ya
 *  dice dónde. */
export const HINT_MOBILE = "Usá el teclado 👇"
