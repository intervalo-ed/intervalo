// LaTeX → MathJSON, para el vocabulario que este juego emite y ningún otro.
//
// POR QUÉ EXISTE. Esto reemplaza a `@cortex-js/compute-engine`, que pesa
// **2.581 kB descomprimidos** —el 46% de todo el JavaScript de /derivadas, y el
// archivo más grande de la página con diferencia— y del que se usaban dos
// llamadas, las dos para lo mismo: convertir LaTeX en MathJSON. Todo el resto
// del veredicto local (evaluar el árbol en diez puntos, comparar, decidir) ya
// estaba escrito a mano en `local-verdict.ts`.
//
// Y el LaTeX que hay que leer sale de gramáticas NUESTRAS: el enunciado lo
// genera `game/generator.py` desde plantillas propias, y la respuesta la
// escribe un teclado con un juego de teclas cerrado (`game/keyboard.py`).
// Medido sobre 60 días de producción, 64.943 respuestas usan **18 comandos
// LaTeX distintos** y 61.606 enunciados usan **9**. Un sistema de álgebra
// completo para leer un lenguaje de dieciocho palabras.
//
// LA REGLA QUE GOBIERNA TODO ESTO: **ante la duda, `null`**. Un null hace que
// el veredicto local se calle y se espere al servidor, que es exactamente lo
// que pasaba antes de que existiera el adelanto — o sea, el peor caso de este
// archivo es el comportamiento de hace tres semanas. Un veredicto EQUIVOCADO,
// en cambio, pinta de verde algo que medio segundo después se vuelve rojo. Por
// eso cualquier token, cualquier forma y cualquier ambigüedad que no esté
// explícitamente contemplada acá abortan el parseo entero.
//
// El contrato de la salida lo fija `local-verdict.ts :: evaluarMathJson`: esas
// son las cabezas que sabe evaluar, y emitir cualquier otra sería emitir algo
// que después da null igual. `check:parser` pasa las 16.535 respuestas y los
// 3.165 enunciados distintos de producción por este parser y por el motor
// viejo, y exige que donde los dos contestan, contesten LO MISMO.

export type MathJson = number | string | MathJson[]

// ── el léxico ───────────────────────────────────────────────────────────────

type Token =
  | { t: "num"; v: string }
  | { t: "cmd"; v: string }
  | { t: "ch"; v: string }

// Lo que se tira sin mirar: no cambia el valor de nada.
//
// `\left` y `\right` son delimitadores adornados y el que importa es el
// paréntesis que viene pegado, así que se saltean y el `(` o el `|` se lee
// solo. `\big` y familia, lo mismo. `\!` y sus hermanos son espaciado.
const IGNORADOS = new Set([
  "left", "right",
  "big", "bigl", "bigr", "Big", "Bigl", "Bigr",
  "bigg", "biggl", "biggr", "Bigg", "Biggl", "Biggr",
  "!", ",", ";", ":", " ", "quad", "qquad",
  "displaystyle", "textstyle", "limits",
])

// Envoltorios tipográficos: lo que importa es lo de adentro. MathLive serializa
// `e` como `\mathrm{e}` y el nombre de una función tecleada letra por letra
// como `\operatorname{\mathrm{sen}}` (ver latex-normalize.ts, que ya deshace
// ese caso antes de llegar acá).
const ENVOLTORIOS = new Set(["mathrm", "mathit", "text", "textrm", "mathsf"])

const CHARS = new Set(["+", "-", "*", "/", "^", "_", "(", ")", "{", "}", "[", "]", "|"])

/** Parte el LaTeX en tokens, o null si aparece algo que no es del vocabulario. */
function tokenizar(latex: string): Token[] | null {
  const salida: Token[] = []
  let i = 0
  while (i < latex.length) {
    const c = latex[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === "\\") {
      // Un comando es `\` + letras, o `\` + un solo carácter (`\!`, `\,`).
      const resto = latex.slice(i + 1)
      const letras = /^[a-zA-Z]+/.exec(resto)
      const nombre = letras !== null ? letras[0] : resto.slice(0, 1)
      if (nombre === "") return null
      i += 1 + nombre.length
      if (!IGNORADOS.has(nombre)) salida.push({ t: "cmd", v: nombre })
      continue
    }
    if (/[0-9]/.test(c)) {
      const m = /^[0-9]+(\.[0-9]+)?/.exec(latex.slice(i))
      if (m === null) return null
      salida.push({ t: "num", v: m[0] })
      i += m[0].length
      continue
    }
    if (c === "x" || c === "e") {
      salida.push({ t: "cmd", v: c === "x" ? "@x" : "@e" })
      i++
      continue
    }
    if (CHARS.has(c)) {
      salida.push({ t: "ch", v: c })
      i++
      continue
    }
    // Cualquier otra cosa —una letra suelta, una coma decimal, un carácter que
    // salió de una tecla equivocada— no se interpreta. La base tiene respuestas
    // con `¨`, `○` y `´` de gente que le pegó al botón de al lado.
    return null
  }
  return salida
}

// ── las funciones que el evaluador sabe evaluar ─────────────────────────────

// La lista NO es «las funciones de LaTeX» sino «las cabezas que
// `evaluarMathJson` conoce». `\cot`, `\sec` y `\csc` existen en LaTeX y no
// están acá a propósito: no hay cabeza que las represente, así que emitirlas
// sería emitir algo que el evaluador devuelve como null igual, pero más tarde y
// con menos claridad.
const FUNCIONES: Record<string, string> = {
  sin: "Sin",
  cos: "Cos",
  tan: "Tan",
  arcsin: "Arcsin",
  arccos: "Arccos",
  arctan: "Arctan",
  ln: "Ln",
  exp: "Exp",
}

const CONSTANTES: Record<string, string> = {
  "@x": "x",
  "@e": "ExponentialE",
  pi: "Pi",
  exponentialE: "ExponentialE",
}

// ── el análisis ─────────────────────────────────────────────────────────────

class Falla extends Error {}

class Analizador {
  private i = 0

  constructor(private readonly tk: Token[]) {}

  private mira(salto = 0): Token | undefined {
    return this.tk[this.i + salto]
  }

  private come(): Token {
    const t = this.tk[this.i]
    if (t === undefined) throw new Falla()
    this.i++
    return t
  }

  private esCh(v: string, salto = 0): boolean {
    const t = this.mira(salto)
    return t !== undefined && t.t === "ch" && t.v === v
  }

  private esCmd(v: string): boolean {
    const t = this.mira()
    return t !== undefined && t.t === "cmd" && t.v === v
  }

  private exigeCh(v: string): void {
    if (!this.esCh(v)) throw new Falla()
    this.i++
  }

  terminado(): boolean {
    return this.i >= this.tk.length
  }

  /** suma y resta, asociando a la izquierda */
  expr(): MathJson {
    let izq = this.termino()
    for (;;) {
      if (this.esCh("+")) {
        this.i++
        izq = ["Add", izq, this.termino()]
      } else if (this.esCh("-")) {
        this.i++
        izq = ["Subtract", izq, this.termino()]
      } else {
        return izq
      }
    }
  }

  /** producto, cociente y yuxtaposición */
  termino(): MathJson {
    let izq = this.unario()
    for (;;) {
      if (this.esCmd("cdot") || this.esCmd("times")) {
        this.i++
        izq = ["Multiply", izq, this.unario()]
      } else if (this.esCh("*")) {
        this.i++
        izq = ["Multiply", izq, this.unario()]
      } else if (this.esCh("/")) {
        this.i++
        izq = ["Divide", izq, this.unario()]
      } else if (this.arrancaAtomo()) {
        // Yuxtaposición: `2x`, `4x^3`, `x\left(x+1\right)`.
        izq = ["Multiply", izq, this.unario()]
      } else {
        return izq
      }
    }
  }

  /** signo adelante; más flojo que la potencia, así que `-x^2` es −(x²) */
  unario(): MathJson {
    if (this.esCh("-")) {
      this.i++
      return ["Negate", this.unario()]
    }
    if (this.esCh("+")) {
      this.i++
      return this.unario()
    }
    return this.potencia()
  }

  potencia(): MathJson {
    const base = this.atomo()
    if (this.esCh("^")) {
      this.i++
      // Asocia a la derecha, y el exponente puede traer su propio signo:
      // `x^{-1}` y `x^-1` son las dos formas que manda MathLive.
      return ["Power", base, this.exponente()]
    }
    return base
  }

  private exponente(): MathJson {
    if (this.esCh("-")) {
      this.i++
      return ["Negate", this.exponente()]
    }
    if (this.esCh("+")) {
      this.i++
      return this.exponente()
    }
    // **Un superíndice sin llaves toma UN SOLO carácter.** Es la regla de TeX y
    // no un detalle: `x^35` es (x³)·5, no x³⁵, y la base tiene 299 respuestas
    // de esa forma —`x^35e^{5x}`, `4(x^3+3)^33x^2`— que son gente escribiendo
    // la regla del producto sin paréntesis. El tokenizador junta los dígitos
    // porque en cualquier otro lado `123` es ciento veintitrés, así que acá hay
    // que devolver el resto.
    const t = this.mira()
    if (t !== undefined && t.t === "num" && t.v.length > 1) {
      this.tk[this.i] = { t: "num", v: t.v.slice(1) }
      return Number(t.v[0])
    }
    const base = this.atomo()
    if (this.esCh("^")) {
      this.i++
      return ["Power", base, this.exponente()]
    }
    return base
  }

  /** ¿lo que viene puede empezar un átomo? Decide la multiplicación implícita. */
  private arrancaAtomo(): boolean {
    const t = this.mira()
    if (t === undefined) return false
    if (t.t === "num") return true
    if (t.t === "ch") return t.v === "(" || t.v === "{" || t.v === "|"
    return (
      t.v in CONSTANTES ||
      t.v in FUNCIONES ||
      t.v === "frac" ||
      t.v === "dfrac" ||
      t.v === "tfrac" ||
      t.v === "cfrac" ||
      t.v === "sqrt" ||
      t.v === "log" ||
      ENVOLTORIOS.has(t.v)
    )
  }

  atomo(): MathJson {
    const t = this.come()

    if (t.t === "num") return Number(t.v)

    if (t.t === "ch") {
      if (t.v === "(") {
        const dentro = this.expr()
        this.exigeCh(")")
        return dentro
      }
      if (t.v === "{") {
        const dentro = this.expr()
        this.exigeCh("}")
        return dentro
      }
      if (t.v === "|") {
        const dentro = this.expr()
        this.exigeCh("|")
        return ["Abs", dentro]
      }
      throw new Falla()
    }

    if (t.v in CONSTANTES) return CONSTANTES[t.v]

    if (ENVOLTORIOS.has(t.v)) return this.grupo()

    if (t.v === "frac" || t.v === "dfrac" || t.v === "tfrac" || t.v === "cfrac") {
      return ["Divide", this.grupo(), this.grupo()]
    }

    if (t.v === "sqrt") {
      // `\sqrt[3]{x}` es la raíz enésima; el índice va entre corchetes.
      if (this.esCh("[")) {
        this.i++
        const indice = this.expr()
        this.exigeCh("]")
        return ["Root", this.grupo(), indice]
      }
      return ["Sqrt", this.grupo()]
    }

    if (t.v === "log") {
      // `\log_{2}(x)` lleva la base de subíndice; sin subíndice es base diez,
      // que es lo que `evaluarMathJson` hace con un solo argumento.
      if (this.esCh("_")) {
        this.i++
        const base = this.esCh("{") ? this.grupo() : this.atomo()
        return ["Log", this.argumento(), base]
      }
      return ["Log", this.argumento()]
    }

    if (t.v in FUNCIONES) return [FUNCIONES[t.v], this.argumento()]

    throw new Falla()
  }

  /** `{...}` obligatorio, que es como LaTeX marca los argumentos. */
  private grupo(): MathJson {
    this.exigeCh("{")
    const dentro = this.expr()
    this.exigeCh("}")
    return dentro
  }

  /** El argumento de una función, y la única regla realmente delicada de acá.
   *
   * `\sin\left(x\right)` no tiene vuelta. `\sin 2x` sí: puede leerse Sin(2x) o
   * Sin(2)·x, y las dos lecturas existen en la naturaleza. Así que el argumento
   * tiene que venir DELIMITADO —entre paréntesis o entre llaves— o ser un único
   * átomo que no pueda estar seguido de otro factor. En cuanto hay
   * yuxtaposición después de un átomo pelado, esto falla y el veredicto local se
   * calla: preferimos esperar al servidor antes que adivinar. */
  private argumento(): MathJson {
    if (this.esCh("(") || this.esCh("{")) return this.atomo()
    const solo = this.atomo()
    // A partir de acá, cualquier cosa que pueda seguir el producto vuelve
    // ambiguo hasta dónde llega el argumento, y ahí no se contesta.
    //
    // Medido sobre el corpus: `\ln x\cdot3x^2` lo lee compute-engine como
    // ln(x·3x²) y una persona lo escribe queriendo (ln x)·3x². Son cinco
    // apariciones en 67.111, no hay forma de saber cuál de las dos quiso, y
    // esperar al servidor cuesta 400 ms —equivocarse cuesta un rojo que después
    // se vuelve verde—.
    if (
      this.esCh("^") ||
      this.esCh("*") ||
      this.esCh("/") ||
      this.esCmd("cdot") ||
      this.esCmd("times") ||
      this.arrancaAtomo()
    ) {
      throw new Falla()
    }
    return solo
  }
}

/** LaTeX → MathJSON, o null si hay cualquier cosa fuera del vocabulario.
 *
 * El null no es un error: es «no me hago cargo», y quien llama ya sabe
 * esperarse al servidor. Ver la regla al principio del archivo. */
export function latexAMathJson(latex: string): MathJson | null {
  if (latex.trim() === "") return null
  const tk = tokenizar(latex)
  if (tk === null || tk.length === 0) return null
  const a = new Analizador(tk)
  try {
    const arbol = a.expr()
    // Sobró algo sin leer: la expresión no era lo que parecía y no se contesta.
    return a.terminado() ? arbol : null
  } catch {
    return null
  }
}
