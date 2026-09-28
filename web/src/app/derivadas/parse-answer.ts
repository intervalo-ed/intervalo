// LaTeX del alumno → MathJSON, en el cliente.
//
// Hasta el 28/09 esto lo hacía `@cortex-js/compute-engine`: un sistema de
// álgebra completo, **2.581 kB descomprimidos**, el 46% de todo el JavaScript
// de /derivadas y el archivo más grande de la página con diferencia. Se usaba
// para dos llamadas, las dos para lo mismo, y sobre un lenguaje que emitimos
// nosotros: 18 comandos LaTeX distintos en 64.943 respuestas y 9 en 61.606
// enunciados, medido sobre 60 días de producción.
//
// Ahora lo hace `latex-a-mathjson.ts`, que lee exactamente ese vocabulario y
// devuelve null ante cualquier otra cosa. `check:parser` lo corre contra el
// motor viejo sobre el corpus entero.
//
// **Y ahora es sincrónico**, que no es solo una simplificación. Antes había una
// ventana real —la primera respuesta de la partida, mientras el motor de un
// mega todavía bajaba y se compilaba— en la que el veredicto local no podía
// contestar y había que esperar al servidor igual. En un teléfono de gama de
// entrada esa ventana es de segundos. Ya no existe.
//
// El server sigue siendo la autoridad: valida numéricamente contra SU derivada
// esperada, y si alguna vez difieren gana él (ver local-verdict.ts).

import { normalizeAnswerLatex } from "./latex-normalize"
import { latexAMathJson, type MathJson } from "./latex-a-mathjson"

/** LaTeX crudo → MathJSON, sin normalizar. Para texto que ya viene del server. */
export function parseLatexToMathJson(latex: string): MathJson | null {
  return latexAMathJson(latex)
}

export function parseAnswerToMathJson(latex: string): MathJson | null {
  // El server responde parse_ok=false y no consume intento.
  return latexAMathJson(normalizeAnswerLatex(latex))
}
