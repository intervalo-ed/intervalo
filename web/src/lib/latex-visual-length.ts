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
// Entornos de matriz: el ancho en pantalla lo fija la fila más ancha, no la
// cantidad total de caracteres del código. Una matriz de 2x2 con dígitos
// sueltos ocupa unos 5 caracteres de ancho, aunque su fuente mida más de 30.
const MATRIX_ENVIRONMENTS = /\\begin\{([bBpvV]?matrix|smallmatrix)\}([\s\S]*?)\\end\{\1\}/g

// Ancho renderizado de una matriz: la fila con más columnas manda, cada
// columna pesa lo que su entrada más larga, más un espacio de separación
// entre columnas y los dos delimitadores.
function matrixVisualWidth(body: string): number {
  const rows = body.split(/\\\\/).map((row) => row.split("&").map((cell) => cell.trim()))
  const columns = Math.max(...rows.map((row) => row.length))
  let width = 0
  for (let col = 0; col < columns; col++) {
    width += Math.max(...rows.map((row) => (row[col] ?? "").length))
  }
  return width + (columns - 1) + 2
}

export function latexVisualLength(option: string): number {
  let s = option.replace(/\$/g, "")
  s = s.replace(MATRIX_ENVIRONMENTS, (_, __, body) => "x".repeat(matrixVisualWidth(body)))
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
