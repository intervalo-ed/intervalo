// Normalización del LaTeX del alumno antes de parsearlo con compute-engine.
// El server aplica sus propias guardas: esto es solo para que la notación en
// español (sen/tg) y los prefijos tipo "f'(x)=" no cuenten como error.

const PREFIX_RE =
  /^\s*(?:y'?|f'?\s*\(\s*x\s*\)|\\frac\{dy\}\{dx\}|dy\/dx)\s*=\s*/i

// Cualquier \operatorname{...}, con un nivel de llaves anidadas adentro.
const OPERATORNAME_RE = /\\operatorname\*?\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g

// Nombres en español que compute-engine no conoce.
const SPANISH_FUNCTIONS: Record<string, string> = {
  sen: "\\sin",
  tg: "\\tan",
  cosec: "\\csc",
  cotg: "\\cot",
  ctg: "\\cot",
  arcsen: "\\arcsin",
  arctg: "\\arctan",
}

// Funciones que LaTeX ya tiene como macro. Si llegan envueltas en
// \operatorname (pasa al tipearlas letra por letra) hay que devolverlas a su
// forma nativa, o compute-engine las lee como una función inventada.
const NATIVE_FUNCTIONS = new Set([
  "sin", "cos", "tan", "cot", "sec", "csc",
  "arcsin", "arccos", "arctan",
  "sinh", "cosh", "tanh",
  "ln", "log", "exp", "min", "max",
])

// MathLive no devuelve el LaTeX tal cual se insertó: al serializar el campo,
// `\operatorname{sen}` vuelve como `\operatorname{\mathrm{sen}}`. Comparar
// contra el literal dejaba afuera justamente eso, así que toda respuesta con
// sen o tg —la derivada de cos, sin ir más lejos— no parseaba.
function unwrapOperatorName(inner: string): string {
  return inner
    .replace(/\\(?:mathrm|mathit|text|operatorname)\s*/g, "")
    .replace(/[{}\s]/g, "")
    .toLowerCase()
}

// El signo que quedó ATRAPADO adentro del nombre de la función.
//
// Caso real (nicolin, 02/09, derivada de cos x): la respuesta era $-\sen x$, se
// escribió primero `sen(x)` con la tecla y después se volvió con el cursor a
// poner el menos adelante. MathLive lo metió DENTRO del token, así que el campo
// serializó `\operatorname{-\mathrm{sen}}\left(x\right)`. Acá abajo eso se
// desenvolvía como el nombre `-sen`, que no está en ninguna de las dos tablas, y
// salía como `\operatorname{-sen}`: compute-engine lo lee como una función
// inventada y la respuesta —que estaba BIEN— no parseaba.
//
// Se saca el signo afuera del operador, que es donde la persona lo quiso poner.
// Varios seguidos también (`--sen`), porque escribir dos menos es más fácil que
// borrar uno.
const SIGNO_ADELANTE_RE = /^([+-]+)(.+)$/

/** Lo que el campo deja escrito y no es parte de la respuesta.
 *
 * MathLive serializa lo que hay en pantalla, y en pantalla quedan restos de
 * escribir con el dedo: el casillero de un exponente que se abrió y no se
 * llenó, un espacio que entró con la barra, el menos tipográfico de un teclado
 * que autocorrige. Nada de eso cambia qué expresión escribió la persona, y el
 * parser —que devuelve null ante cualquier cosa fuera de su vocabulario— la
 * rebotaba entera como ilegible.
 *
 * **Null acá no es «esperá al servidor»: es un rebote.** El servidor valida el
 * MathJSON que le manda el cliente; sin MathJSON contesta `parse_ok: false` y
 * la persona ve «¿Seguro?» sobre una respuesta que estaba bien. Medido sobre
 * el corpus de producción, estas formas más las de `latex-a-mathjson.ts` eran
 * el 3% de todos los intentos, y adentro están `\frac12x^{-\frac12}` (la
 * derivada de la raíz, 78 veces) y `\frac{1}{\cos^2(x)}` (la de la tangente).
 */
function sinRestosDelCampo(latex: string): string {
  let out = latex
  // El menos y el punto medio tipográficos, y el por.
  out = out.replace(/[\u2212\u2013]/g, "-").replace(/[\u00b7\u22c5]/g, "\\cdot ").replace(/\u00d7/g, "\\times ")
  // Casilleros sin llenar. Un exponente o subíndice que quedó vacío se va con
  // su `^`; un casillero suelto, solo.
  out = out.replace(/\\placeholder\s*(?:\[[^\]]*\])?\s*\{[^{}]*\}/g, "")
  let antes = ""
  while (antes !== out) {
    antes = out
    out = out.replace(/[\^_]\s*\{\s*\}/g, "")
    // Un envoltorio tipográfico que quedó sin nada adentro, y un grupo vacío
    // suelto. No los de `\frac{}{x}` ni `\sqrt{}`: ahí falta un argumento de
    // verdad y eso sí es ilegible.
    out = out.replace(/\\(?:mathrm|mathit|text|textrm|mathsf)\s*\{\s*\}/g, "")
    out = out.replace(/(?<![\\a-zA-Z}\^_\s])\s*\{\s*\}/g, "")
  }
  // `\frac12`: TeX toma un carácter por argumento cuando no hay llaves. El
  // tokenizador junta los dígitos, así que se le ponen acá.
  out = out.replace(/(\\[dtc]?frac)\s*(\d)\s*(\d)/g, "$1{$2}{$3}")
  out = out.replace(/(\\[dtc]?frac)\s*(\d)\s*\{/g, "$1{$2}{")
  out = out.replace(/(\\[dtc]?frac\s*\{(?:[^{}]|\{[^{}]*\})*\})\s*([\dx])/g, "$1{$2}")
  // Lo mismo con la raíz: `\sqrt2` es √2.
  out = out.replace(/\\sqrt\s*([\dx])/g, "\\sqrt{$1}")
  // El punto como signo de multiplicar (`3x^2.e^{x}`), que es como se escribe
  // en el secundario. Solo cuando no es una coma decimal: entre dos dígitos se
  // deja como está.
  out = out.replace(/(?<!\d)\.|\.(?!\d)/g, "\\cdot ")
  // La tilde es un espacio en LaTeX, y una barra suelta al final es un `\ ` al
  // que el `trim()` le comió el espacio.
  out = out.replace(/~/g, " ").replace(/(?:\\\s*)+$/, "")
  return out
}

export function normalizeAnswerLatex(latex: string): string {
  let out = sinRestosDelCampo(latex).trim()
  out = out.replace(PREFIX_RE, "")
  out = out.replace(OPERATORNAME_RE, (_match, inner: string) => {
    const crudo = unwrapOperatorName(inner)
    const conSigno = SIGNO_ADELANTE_RE.exec(crudo)
    const signo = conSigno ? conSigno[1] : ""
    const name = conSigno ? conSigno[2] : crudo
    if (SPANISH_FUNCTIONS[name]) return signo + SPANISH_FUNCTIONS[name]
    if (NATIVE_FUNCTIONS.has(name)) return `${signo}\\${name}`
    // Sin nombre conocido, se deja como estaba: sacarle el signo a algo que
    // igual no vamos a poder interpretar solo cambia un error por otro.
    return `\\operatorname{${crudo}}`
  })
  // Formas sueltas, por si alguien las escribe con el teclado físico.
  out = out.replace(/\\sen\b/g, "\\sin")
  out = out.replace(/\\tg\b/g, "\\tan")
  return out.trim()
}
