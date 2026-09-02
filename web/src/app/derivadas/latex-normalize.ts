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

export function normalizeAnswerLatex(latex: string): string {
  let out = latex.trim()
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
