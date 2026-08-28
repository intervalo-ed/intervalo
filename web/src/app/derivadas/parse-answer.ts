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
export function warmupComputeEngine() {
  void engine()
}

export async function parseAnswerToMathJson(latex: string): Promise<unknown> {
  try {
    const ce = await engine()
    return ce.parse(normalizeAnswerLatex(latex)).json
  } catch {
    // El server responde parse_ok=false y no consume intento.
    return null
  }
}
