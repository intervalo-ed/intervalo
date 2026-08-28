// LaTeX del alumno → MathJSON con @cortex-js/compute-engine, en el cliente.
// El server valida numéricamente contra SU derivada esperada, así que un
// MathJSON malicioso solo puede perjudicar a quien lo manda. Import dinámico y
// singleton: el motor pesa ~1MB y solo hace falta acá.

import { normalizeAnswerLatex } from "./latex-normalize"

type ComputeEngineLike = {
  parse: (latex: string) => { json: unknown }
}

let cePromise: Promise<ComputeEngineLike> | null = null

function engine(): Promise<ComputeEngineLike> {
  cePromise ??= import("@cortex-js/compute-engine").then(
    (m) => new m.ComputeEngine() as unknown as ComputeEngineLike,
  )
  return cePromise
}

// Precalentar el motor mientras la persona lee el primer enunciado.
//
// Con un parseo de mentira, no solo construyendo el motor: el diccionario de
// LaTeX y la biblioteca estándar se arman perezosamente en el PRIMER parseo, así
// que sin esto ese costo lo pagaba la primera respuesta de la partida, sincrónico
// y con la persona esperando.
export function warmupComputeEngine() {
  void engine().then((ce) => {
    try {
      ce.parse("x^2")
    } catch {
      // Precalentar es una mejora, no un requisito.
    }
  })
}

/** LaTeX crudo → MathJSON, sin normalizar. Para texto que ya viene del server. */
export async function parseLatexToMathJson(latex: string): Promise<unknown> {
  try {
    const ce = await engine()
    return ce.parse(latex).json
  } catch {
    return null
  }
}

export async function parseAnswerToMathJson(latex: string): Promise<unknown> {
  // El server responde parse_ok=false y no consume intento.
  return parseLatexToMathJson(normalizeAnswerLatex(latex))
}
