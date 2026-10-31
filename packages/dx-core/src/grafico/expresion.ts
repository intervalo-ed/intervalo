// Una f(x) escrita como la imprime sympy (`str(expr)`, ver
// backend/game/explain.py :: _to_mathjs), pasada a función de JS.
//
// La web la compila con mathjs, que pesa ~500 KB y en la app no está. El
// «¿Por qué?» del juego solo manda expresiones ya instanciadas con números
// concretos —sumas, productos, cocientes, potencias y un puñado de funciones—,
// y para eso alcanza este parser de descenso recursivo.
//
// Gramática (precedencias de sympy/mathjs):
//   suma     := producto (("+" | "-") producto)*
//   producto := unario (("*" | "/") unario)*
//   unario   := ("-" | "+") unario | potencia
//   potencia := atomo (("**" | "^") unario)?        ← asocia a derecha: -x**2 = -(x**2)
//   atomo    := número | x | constante | nombre "(" suma ("," suma)* ")" | "(" suma ")"

import type { RealFn } from "./math-graph-calc"

type Nodo = (x: number) => number

const FUNCIONES: Record<string, (...a: number[]) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  sec: (v) => 1 / Math.cos(v),
  csc: (v) => 1 / Math.sin(v),
  cot: (v) => 1 / Math.tan(v),
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  // log(x) natural, log(x, b) en base b: lo mismo que entienden sympy y mathjs.
  log: (v, b) => (b === undefined ? Math.log(v) : Math.log(v) / Math.log(b)),
  ln: Math.log,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  Abs: Math.abs,
}

const CONSTANTES: Record<string, number> = { E: Math.E, e: Math.E, pi: Math.PI, PI: Math.PI }

type Token =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string }

function tokenizar(src: string): Token[] | null {
  const out: Token[] = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (c === " " || c === "\t" || c === "\n") {
      i++
      continue
    }
    const num = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(i))
    if (num) {
      out.push({ t: "num", v: Number(num[0]) })
      i += num[0].length
      continue
    }
    const id = /^[A-Za-z_]\w*/.exec(src.slice(i))
    if (id) {
      out.push({ t: "id", v: id[0] })
      i += id[0].length
      continue
    }
    if (src.startsWith("**", i)) {
      out.push({ t: "op", v: "**" })
      i += 2
      continue
    }
    if ("+-*/^(),".includes(c)) {
      out.push({ t: "op", v: c })
      i++
      continue
    }
    return null
  }
  return out
}

class ErrorDeExpresion extends Error {}

function parsear(tokens: Token[]): Nodo {
  let pos = 0
  const ver = () => tokens[pos]
  const esOp = (v: string) => {
    const tk = tokens[pos]
    return tk !== undefined && tk.t === "op" && tk.v === v
  }
  const esperar = (v: string) => {
    if (!esOp(v)) throw new ErrorDeExpresion(`se esperaba «${v}»`)
    pos++
  }

  function suma(): Nodo {
    let izq = producto()
    while (esOp("+") || esOp("-")) {
      const op = (tokens[pos++] as { v: string }).v
      const a = izq
      const b = producto()
      izq = op === "+" ? (x) => a(x) + b(x) : (x) => a(x) - b(x)
    }
    return izq
  }

  function producto(): Nodo {
    let izq = unario()
    while (esOp("*") || esOp("/")) {
      const op = (tokens[pos++] as { v: string }).v
      const a = izq
      const b = unario()
      izq = op === "*" ? (x) => a(x) * b(x) : (x) => a(x) / b(x)
    }
    return izq
  }

  function unario(): Nodo {
    if (esOp("-")) {
      pos++
      const a = unario()
      return (x) => -a(x)
    }
    if (esOp("+")) {
      pos++
      return unario()
    }
    return potencia()
  }

  function potencia(): Nodo {
    const base = atomo()
    if (esOp("**") || esOp("^")) {
      pos++
      const exp = unario()
      // Base negativa con exponente fraccionario (`x**(1/3)`, x < 0) da NaN:
      // mathjs la da compleja y la web la descarta igual, como no real.
      return (x) => Math.pow(base(x), exp(x))
    }
    return base
  }

  function atomo(): Nodo {
    const tk = ver()
    if (tk === undefined) throw new ErrorDeExpresion("terminó antes de tiempo")
    if (tk.t === "num") {
      pos++
      const v = tk.v
      return () => v
    }
    if (tk.t === "id") {
      pos++
      if (esOp("(")) {
        const fn = FUNCIONES[tk.v]
        if (!fn) throw new ErrorDeExpresion(`función desconocida «${tk.v}»`)
        pos++
        const args = [suma()]
        while (esOp(",")) {
          pos++
          args.push(suma())
        }
        esperar(")")
        if (args.length === 1) {
          const [a] = args
          return (x) => fn(a(x))
        }
        return (x) => fn(...args.map((a) => a(x)))
      }
      if (tk.v === "x") return (x) => x
      const c = CONSTANTES[tk.v]
      if (c !== undefined) return () => c
      throw new ErrorDeExpresion(`nombre desconocido «${tk.v}»`)
    }
    if (tk.v === "(") {
      pos++
      const a = suma()
      esperar(")")
      return a
    }
    throw new ErrorDeExpresion(`token inesperado «${tk.v}»`)
  }

  const raiz = suma()
  if (pos !== tokens.length) throw new ErrorDeExpresion("sobra texto al final")
  return raiz
}

/** La f(x) como función real, o `null` si el texto no se puede leer. Fuera
 *  del dominio devuelve NaN, igual que el `toRealFn` de la web. */
export function compilarExpresion(src: string): RealFn | null {
  const tokens = tokenizar(src)
  if (!tokens || tokens.length === 0) return null
  let nodo: Nodo
  try {
    nodo = parsear(tokens)
  } catch (e) {
    if (e instanceof ErrorDeExpresion) return null
    throw e
  }
  return (x: number) => {
    const y = nodo(x)
    return Number.isFinite(y) ? y : NaN
  }
}
