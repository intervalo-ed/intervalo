// Funciones que LaTeX renderiza como palabra completa (ej. \cos x -> "cos x"),
// a diferencia de comandos como \times o \pi que renderizan como un solo símbolo.
const LATEX_NAMED_FUNCTIONS =
  /\\(sin|cos|tan|cot|sec|csc|ln|log|lim|exp|min|max|gcd|lcm|det|dim|ker|sinh|cosh|tanh|arcsin|arccos|arctan)\b/g

// Estima el ancho visual renderizado de una opción con LaTeX, en vez de contar
// caracteres de código fuente (que sobrestima el peso de comandos como \sqrt o
// \frac, cortos en pantalla pero largos en texto plano).
//
// \dfrac fuerza displaystyle (numerador/denominador a tamaño completo), más
// ancho por carácter que el textstyle comprimido de \frac inline: se pesa
// 1.4x (incluida una raíz anidada dentro, ej. 3√5/5) para que la grilla 2x2
// no subestime su ancho real.
export function latexVisualLength(option: string): number {
  let s = option.replace(/\$/g, "")
  s = s.replace(/\\operatorname\{([^{}]*)\}/g, (_, inner) => "x".repeat(inner.length))
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, (_, inner) => "x".repeat(inner.length + 1))
  s = s.replace(
    /\\(d)?frac\{([^{}]*)\}\{([^{}]*)\}/g,
    (_, isDisplay, num, den) =>
      "x".repeat(Math.ceil(Math.max(num.length, den.length) * (isDisplay ? 1.4 : 1))),
  )
  s = s.replace(LATEX_NAMED_FUNCTIONS, (_, name) => "x".repeat(name.length))
  s = s.replace(/\\[a-zA-Z]+/g, "x")
  s = s.replace(/(?<!\\)[{}]/g, "")
  return s.length
}

// Mismo criterio que usa el runner de sesión real para decidir si las opciones de
// una pregunta de opción múltiple entran en una grilla 2x2 en vez de una lista
// vertical: exactamente 4 opciones, todas cortas.
export function useGridLayout(options: string[]): boolean {
  const hasLatex = options.some((o) => o.includes("$"))
  const limit = hasLatex ? 12 : 25
  return (
    options.length === 4 &&
    options.every((o) => (hasLatex ? latexVisualLength(o) : o.length) <= limit)
  )
}
