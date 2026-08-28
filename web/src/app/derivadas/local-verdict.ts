// Veredicto local: decidir "correcto" o "incorrecto" en el cliente, sin esperar
// al servidor.
//
// POR QUÉ. El color de la respuesta tardaba lo que tarda un viaje completo a
// Railway: unos 150 ms de red más el tiempo del endpoint. La matemática nunca
// fue el problema —validar cuesta menos de dos milisegundos— pero venía al final
// de una fila de consultas que no hacen falta para decir si está bien.
//
// QUÉ NO SE ROMPE. El servidor sigue siendo la autoridad: la XP, el Elo y el
// puesto los decide `/answer` como siempre. Esto solo adelanta el color. Si
// alguna vez difieren, gana la respuesta del servidor y la card se corrige sola.
// Por eso el veredicto local no necesita ser infalible, necesita ser PRUDENTE:
// ante cualquier duda devuelve `null` y se espera como hasta ahora.
//
// QUÉ NO SE FILTRA. No viaja ni un byte nuevo. El enunciado ya está en el DOM y
// el motor de cálculo ya se carga en esta página, así que todo esto es
// aritmética sobre datos que el cliente ya tenía. La derivada esperada se
// obtiene DERIVANDO EL ENUNCIADO numéricamente, no pidiéndosela a nadie: nunca
// existe la forma cerrada de la respuesta en memoria, solo diez valores.
//
// El espejo de esto en el servidor es backend/game/validator.py; las constantes
// de abajo son las suyas y tienen que seguir siéndolo.

import { normalizeAnswerLatex } from "./latex-normalize"
import { parseLatexToMathJson } from "./parse-answer"

// --- constantes espejadas de validator.py ----------------------------------

const GRILLA = [-2.7, -1.9, -1.3, -0.61, 0.37, 0.52, 1.23, 1.77, 2.31, 3.31]
const GRILLA_POSITIVA = [0.11, 0.37, 0.52, 1.23, 1.77, 2.31, 3.31, 4.7, 6.13, 8.9]
const MIN_COVALIDOS = 5

// La tolerancia del servidor es 1e-6 relativo. Acá se parte en dos y se deja un
// hueco en el medio a propósito.
//
// Adentro de ese hueco el veredicto local se calla (`null`) y se espera al
// servidor. Es donde viven las dos cosas que podrían hacernos mentir: el error
// de la derivación numérica y las diferencias de punto flotante entre este
// evaluador y el de Python. Equivocarse acá cuesta caro —un verde que se vuelve
// rojo medio segundo después es peor que medio segundo de espera— así que solo
// se contesta cuando la respuesta está lejos del borde.
const TOL_SEGURO_IGUAL = 1e-8
const TOL_SEGURO_DISTINTO = 1e-3

// --- evaluación numérica de MathJSON ---------------------------------------

// Mismo vocabulario que backend/game/mathjson.py: lo que el teclado del juego
// puede escribir. Cualquier cosa fuera de esta lista devuelve null, que es la
// forma de decir "no sé, preguntale al servidor".
const SIMBOLOS: Record<string, number> = {
  Pi: Math.PI,
  ExponentialE: Math.E,
  e: Math.E,
  Half: 0.5,
  Nothing: 0,
}

const PROFUNDIDAD_MAX = 32

function finito(valor: number): number | null {
  return Number.isFinite(valor) ? valor : null
}

/** El valor de un árbol MathJSON en un punto, o null si no se puede evaluar. */
export function evaluarMathJson(nodo: unknown, x: number, hondura = 0): number | null {
  if (hondura > PROFUNDIDAD_MAX) return null
  if (typeof nodo === "boolean") return null
  if (typeof nodo === "number") return finito(nodo)
  if (typeof nodo === "string") {
    if (nodo === "x") return x
    if (nodo in SIMBOLOS) return SIMBOLOS[nodo]
    const numero = Number(nodo)
    return nodo.trim() !== "" && Number.isFinite(numero) ? numero : null
  }
  if (nodo !== null && typeof nodo === "object" && !Array.isArray(nodo)) {
    const obj = nodo as Record<string, unknown>
    // Los enteros grandes de MathJSON llegan con sufijo ("123n", "1.5d").
    if ("num" in obj) {
      const crudo = String(obj.num).replace(/[dn]$/, "")
      const numero = Number(crudo)
      return Number.isFinite(numero) ? numero : null
    }
    if ("sym" in obj) return evaluarMathJson(obj.sym, x, hondura + 1)
    if ("fn" in obj) return evaluarMathJson(obj.fn, x, hondura + 1)
    return null
  }
  if (!Array.isArray(nodo) || nodo.length === 0) return null

  const [cabeza, ...args] = nodo
  if (typeof cabeza !== "string") return null

  const arg = (i: number) => evaluarMathJson(args[i], x, hondura + 1)
  const todos = (): number[] | null => {
    const salida: number[] = []
    for (const a of args) {
      const valor = evaluarMathJson(a, x, hondura + 1)
      if (valor === null) return null
      salida.push(valor)
    }
    return salida
  }
  // Para las de un solo argumento: evalúa y aplica, propagando el null.
  const unaria = (f: (v: number) => number): number | null => {
    const valor = arg(0)
    return valor === null ? null : finito(f(valor))
  }
  const binaria = (f: (a: number, b: number) => number): number | null => {
    if (args.length !== 2) return null
    const a = arg(0)
    const b = arg(1)
    return a === null || b === null ? null : finito(f(a, b))
  }

  switch (cabeza) {
    case "Add": {
      const valores = todos()
      return valores === null ? null : finito(valores.reduce((a, b) => a + b, 0))
    }
    case "Multiply":
    case "InvisibleOperator": {
      const valores = todos()
      return valores === null ? null : finito(valores.reduce((a, b) => a * b, 1))
    }
    case "Subtract":
      return binaria((a, b) => a - b)
    case "Negate":
      return unaria((v) => -v)
    case "Divide":
    case "Rational":
      return binaria((a, b) => a / b)
    case "Power":
      return binaria((a, b) => a ** b)
    case "Sqrt":
      return unaria(Math.sqrt)
    case "Root":
      return binaria((a, b) => a ** (1 / b))
    case "Square":
      return unaria((v) => v * v)
    case "Exp":
      return unaria(Math.exp)
    case "Ln":
      return unaria(Math.log)
    case "Log":
      if (args.length === 1) return unaria(Math.log10)
      return binaria((a, b) => Math.log(a) / Math.log(b))
    case "Lb":
      return unaria(Math.log2)
    case "Sin":
      return unaria(Math.sin)
    case "Cos":
      return unaria(Math.cos)
    case "Tan":
      return unaria(Math.tan)
    case "Arcsin":
      return unaria(Math.asin)
    case "Arccos":
      return unaria(Math.acos)
    case "Arctan":
      return unaria(Math.atan)
    case "Abs":
      return unaria(Math.abs)
    case "Delimiter":
    case "Sequence":
      return arg(0)
    default:
      return null
  }
}

// --- derivada numérica del enunciado ---------------------------------------

// Estarcido de cinco puntos, con el paso proporcional a la magnitud de x.
//
// El error tiene dos mitades que tiran para lados opuestos: la del método baja
// con h⁴ y la de redondeo sube con ε/h, así que el mejor paso está cerca de
// ε^(1/5) ≈ 6e-4. Barriendo la batería de casos, 1e-3 ya se queda corto en
// e^(x²) —cuyas derivadas altas son enormes cerca del extremo de la grilla— y de
// 6e-4 para abajo pasan todos. 3e-4 queda en el medio de esa zona plana, lejos
// de los dos bordes.
function derivadaEn(f: (x: number) => number | null, x: number): number | null {
  const h = 3e-4 * Math.max(1, Math.abs(x))
  const menos2 = f(x - 2 * h)
  const menos1 = f(x - h)
  const mas1 = f(x + h)
  const mas2 = f(x + 2 * h)
  if (menos2 === null || menos1 === null || mas1 === null || mas2 === null) return null
  return finito((menos2 - 8 * menos1 + 8 * mas1 - mas2) / (12 * h))
}

export type MuestrasEsperadas = { x: number; y: number }[]

/** La derivada del enunciado evaluada en la grilla, o null si no se pudo. */
export async function muestrasEsperadas(
  promptLatex: string,
): Promise<MuestrasEsperadas | null> {
  // El enunciado viene en notación española (`\operatorname{sen}`, `\ln`), la
  // misma que normaliza lo que escribe el alumno.
  const arbol = await parseLatexToMathJson(normalizeAnswerLatex(promptLatex))
  if (arbol === null) return null

  const f = (x: number) => evaluarMathJson(arbol, x)
  for (const grilla of [GRILLA, GRILLA_POSITIVA]) {
    const muestras: MuestrasEsperadas = []
    for (const x of grilla) {
      const y = derivadaEn(f, x)
      if (y !== null) muestras.push({ x, y })
    }
    if (muestras.length >= MIN_COVALIDOS) return muestras
  }
  return null
}

// --- el veredicto ----------------------------------------------------------

/** `true`/`false` si se puede decidir con confianza; `null` si hay que esperar
 *  al servidor. Espeja `numerically_equivalent` de validator.py. */
export function veredictoLocal(
  esperadas: MuestrasEsperadas | null,
  respuesta: unknown,
): boolean | null {
  if (esperadas === null || respuesta === null || respuesta === undefined) return null

  let covalidos = 0
  let peorDesvio = 0
  for (const { x, y } of esperadas) {
    const valor = evaluarMathJson(respuesta, x)
    if (valor === null) continue
    covalidos += 1
    const desvio = Math.abs(valor - y) / Math.max(1, Math.abs(valor), Math.abs(y))
    peorDesvio = Math.max(peorDesvio, desvio)
    // Una sola diferencia clara ya alcanza para descartar: no hace falta mirar
    // el resto de la grilla.
    if (desvio > TOL_SEGURO_DISTINTO) return false
  }
  // Con pocos puntos el servidor ni siquiera decide: devuelve "no pudimos
  // evaluar tu respuesta" y no consume intento. Eso no se puede imitar de acá.
  if (covalidos < MIN_COVALIDOS) return null
  // Coinciden en todos lados y con margen: es la misma función.
  return peorDesvio < TOL_SEGURO_IGUAL ? true : null
}
