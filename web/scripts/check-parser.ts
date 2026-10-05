// Chequeo diferencial del parser propio contra el motor de cálculo que
// reemplaza.
//
// Corre con: bun run check:parser
//
// QUÉ SE COMPARA, Y POR QUÉ NO LOS ÁRBOLES. Comparar el MathJSON de los dos
// lado a lado sería comparar la canonicalización de compute-engine, que
// reordena sumas, funde constantes y usa formas que a este parser no le hacen
// falta. Lo único que importa es lo que el juego hace con el árbol: evaluarlo
// en una grilla y compararlo contra la derivada esperada. Así que la exigencia
// es la correcta y no la fácil — **donde los dos contestan, los dos tienen que
// dar el mismo número**.
//
// Y LA OTRA MITAD, QUE ES LA QUE PROTEGE DE VERDAD: `null` es una respuesta
// legítima del parser nuevo. Significa «no me hago cargo», el veredicto local
// se calla y se espera al servidor, que es lo que pasaba antes de que el
// adelanto existiera. Por eso además del acuerdo se mide la COBERTURA: si este
// parser contestara que no a todo, el chequeo pasaría en verde y el cambio no
// habría comprado nada.
//
// El corpus son las 16.451 respuestas y los 3.165 enunciados DISTINTOS de
// producción, con cuántas veces apareció cada uno (67.111 intentos y 61.751
// ejercicios). Los tipeos raros —gente que le pegó a la tecla de al lado— están
// adentro a propósito: son justo los que rompen un parser.

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { ComputeEngine } from "@cortex-js/compute-engine"
import { latexAMathJson } from "../src/app/derivadas/latex-a-mathjson"
import { normalizeAnswerLatex } from "../src/app/derivadas/latex-normalize"
import { evaluarMathJson } from "../src/app/derivadas/local-verdict"

// La grilla de `local-verdict.ts` y su versión positiva juntas: si los dos
// árboles coinciden en estos catorce puntos, coinciden donde el juego mira.
const GRILLA = [
  -2.7, -1.9, -1.3, -0.61, 0.37, 0.52, 1.23, 1.77, 2.31, 3.31,
  0.11, 4.7, 6.13, 8.9,
]

// Umbral de acuerdo. No es la tolerancia del veredicto (1e-8 / 1e-3) sino la de
// «son el mismo número calculado por dos caminos»: el error relativo de una
// suma de flotantes reordenada.
const TOL = 1e-9

// Cuánto del peso del corpus tiene que poder contestar el parser nuevo para que
// el cambio valga la pena. Es un piso, no una meta: si algún día baja de acá es
// porque el juego empezó a emitir algo que este archivo no sabe leer, y eso hay
// que ver antes de que se note en la pantalla.
//
// Subió de 0,90 a 0,97 el 05/10. Con 0,90 el chequeo pasaba en verde mientras
// el parser rebotaba el 3% de los intentos que el motor viejo sí leía —la
// derivada de la raíz y la de la tangente entre ellos—, porque «no contestar»
// se pensó como «esperar al servidor» y el servidor no lee LaTeX: sin MathJSON
// del cliente contesta que no pudo leer. Hoy el parser cubre 97,5%.
const COBERTURA_MINIMA = 0.97

// **La única divergencia aceptada, y es un ARREGLO.** `\ln{A}^{n}` significa
// (ln A)ⁿ, que es lo que dice la plantilla que lo genera: para
// `\ln{\left(x \right)}^{4}` el servidor espera `4*log(x)**3/x`. compute-engine
// lo lee como ln(A^n) y por eso el veredicto local venía derivando otra función
// — la sección 3 lo fija contra la verdad del servidor.
const ARREGLO_POTENCIA_DE_FUNCION =
  /\\(?:ln|log|sin|cos|tan|arcsin|arccos|arctan)\s*\{(?:[^{}]|\{[^{}]*\})*\}\s*\^/

const ce = new ComputeEngine()

function valores(arbol: unknown): (number | null)[] {
  return GRILLA.map((x) => evaluarMathJson(arbol, x))
}

/** ¿Los dos evalúan igual donde los dos evalúan? */
function acuerdan(a: (number | null)[], b: (number | null)[]): boolean {
  let comparados = 0
  for (let i = 0; i < a.length; i++) {
    const va = a[i]
    const vb = b[i]
    if (va === null || vb === null) continue
    comparados++
    const escala = Math.max(1, Math.abs(va), Math.abs(vb))
    if (Math.abs(va - vb) / escala > TOL) return false
  }
  // Ni un punto en común: no hay acuerdo que demostrar, y contarlo como acuerdo
  // sería dejar pasar un árbol que no se puede evaluar en ningún lado.
  return comparados > 0
}

type Fila = { veces: number; latex: string }

function corpus(archivo: string): Fila[] {
  const texto = readFileSync(fileURLToPath(new URL(`fixtures/${archivo}`, import.meta.url)), "utf8")
  return texto
    .split("\n")
    .filter((l) => l.length > 0)
    .map((l) => {
      const corte = l.indexOf("\t")
      return { veces: Number(l.slice(0, corte)), latex: l.slice(corte + 1) }
    })
}

let fallos = 0

function check(condicion: boolean, etiqueta: string) {
  console.log(`  [${condicion ? "ok" : "FAIL"}] ${etiqueta}`)
  if (!condicion) fallos++
}

console.log("1 y 2. el corpus entero, contra el motor viejo")
console.log()

for (const [titulo, archivo] of [
  ["RESPUESTAS de la gente", "corpus-respuestas.tsv"],
  ["ENUNCIADOS servidos", "corpus-enunciados.tsv"],
] as const) {
  const filas = corpus(archivo)
  let peso = 0
  let mios = 0
  let miosPeso = 0
  let viejos = 0
  let acuerdos = 0
  const esperados: Fila[] = []
  const inesperados: Fila[] = []

  for (const fila of filas) {
    peso += fila.veces
    const normal = normalizeAnswerLatex(fila.latex)

    const mio = latexAMathJson(normal)
    let viejo: unknown = null
    try {
      viejo = ce.parse(normal).json
    } catch {
      viejo = null
    }

    const vm = mio === null ? null : valores(mio)
    const vv = viejo === null ? null : valores(viejo)
    const mioSirve = vm !== null && vm.some((v) => v !== null)
    const viejoSirve = vv !== null && vv.some((v) => v !== null)

    if (mioSirve) {
      mios++
      miosPeso += fila.veces
    }
    if (viejoSirve) viejos++
    if (mioSirve && viejoSirve) {
      if (acuerdan(vm, vv)) acuerdos++
      else if (ARREGLO_POTENCIA_DE_FUNCION.test(normal)) esperados.push(fila)
      else inesperados.push(fila)
    }
  }

  const cobertura = miosPeso / peso
  console.log(`${titulo} — ${filas.length} distintos, ${peso} apariciones`)
  console.log(`   el parser nuevo contesta   ${mios} (${((mios / filas.length) * 100).toFixed(1)}% de los distintos)`)
  console.log(`   ponderado por apariciones  ${(cobertura * 100).toFixed(1)}%`)
  console.log(`   el motor viejo contesta    ${viejos}`)
  console.log(`   coinciden                  ${acuerdos}`)
  console.log(`   divergen y es el arreglo   ${esperados.length}`)
  console.log(`   divergen SIN explicación   ${inesperados.length}`)

  check(inesperados.length === 0, "ni un desacuerdo sin explicación")
  for (const d of inesperados.slice(0, 25)) {
    console.log(`      (×${d.veces}) ${d.latex}`)
  }
  check(
    cobertura >= COBERTURA_MINIMA,
    `cubre al menos el ${COBERTURA_MINIMA * 100}% del peso (dio ${(cobertura * 100).toFixed(1)}%)`,
  )
  console.log()
}

console.log("3. la divergencia, contra la verdad del SERVIDOR")
// No alcanza con aceptar que los dos lean distinto: hay que decir cuál de los
// dos tiene razón, y eso lo decide `game_exercises.expected_derivative`. Para
// `\ln{\left(x \right)}^{4}` (plantilla t8_pow_ln) el servidor espera
// `4*log(x)**3/x`, o sea que la función es (ln x)⁴ y no ln(x⁴).
//
// Medido en producción el 28/09: 677 ejercicios de esa plantilla servidos a 43
// personas desde el 20/09, con 640 respuestas correctas. Cada una de esas 640
// vio un veredicto local ROJO —`veredictoLocal` devuelve false, no null, en
// cuanto un punto se desvía más de 1e-3— que el servidor corrigió a verde medio
// segundo después.
for (const [latex, f] of [
  ["\\ln{\\left(x \\right)}^{4}", (x: number) => Math.log(x) ** 4],
  ["\\ln{\\left(x \\right)}^{2}", (x: number) => Math.log(x) ** 2],
  ["5 \\ln{\\left(x \\right)}^{2}", (x: number) => 5 * Math.log(x) ** 2],
] as const) {
  const mio = latexAMathJson(normalizeAnswerLatex(latex))
  const ok =
    mio !== null &&
    [1.23, 2.31, 4.7].every((x) => {
      const v = evaluarMathJson(mio, x)
      return v !== null && Math.abs(v - f(x)) < 1e-9
    })
  check(ok, `«${latex}» se lee como la potencia de la función, que es lo que el servidor espera`)
}

// ── 4. Lo que reportaron ────────────────────────────────────────────────────
//
// Dos respuestas CORRECTAS que el juego rebotó como ilegibles el 01/10, y las
// formas vecinas que salieron de medir el corpus. Cada una con la función que
// la persona quiso escribir.
console.log()
console.log("4. respuestas correctas que se rebotaban como ilegibles")
const R = String.raw
const sen = Math.sin
const cos = Math.cos
for (const [latex, f, que] of [
  [R`4\operatorname{sen}^3\left(x\right)\cdot\cos\left(x\right)`, (x: number) => 4 * sen(x) ** 3 * cos(x), "la potencia pegada al nombre de la función"],
  [R`\frac{1}{\cos^2\left(x\right)}`, (x: number) => 1 / cos(x) ** 2, "la derivada de la tangente"],
  [R`\frac{9x\cos\left(9x\right)^{}-\operatorname{sen}\left(9x\right)}{x^2}`, (x: number) => (9 * x * cos(9 * x) - sen(9 * x)) / x ** 2, "un exponente que se abrió y quedó vacío"],
  [R`\frac{9x\cos\left(9x\right)-\operatorname{sen}\left(9x\right)}{x^2}\ `, (x: number) => (9 * x * cos(9 * x) - sen(9 * x)) / x ** 2, "un espacio al final"],
  [R`\frac12x^{-\frac12}`, (x: number) => 0.5 * x ** -0.5, "la fracción sin llaves, que es la derivada de la raíz"],
  [R`3e^{\placeholder{}}`, () => 3 * Math.E, "un casillero sin llenar"],
  [R`\frac{1}{\sqrt2}`, () => 1 / Math.SQRT2, "la raíz sin llaves"],
  [R`3x^2.e^{x}+x^3.e^{x}`, (x: number) => 3 * x ** 2 * Math.exp(x) + x ** 3 * Math.exp(x), "el punto como signo de multiplicar"],
  [`2x${"−"}3`, (x: number) => 2 * x - 3, "el menos tipográfico"],
] as const) {
  const mio = latexAMathJson(normalizeAnswerLatex(latex))
  const ok =
    mio !== null &&
    [0.37, 1.23, 2.31].every((x) => {
      const v = evaluarMathJson(mio, x)
      return v !== null && Math.abs(v - f(x)) < 1e-9
    })
  check(ok, `«${latex}»: ${que}`)
}
// Y lo que NO se adivina.
check(latexAMathJson(normalizeAnswerLatex(R`\sin^{-1}\left(x\right)`)) === null,
  "«sen⁻¹(x)» no se contesta: arcoseno para unos, recíproco para otros")
check(latexAMathJson(normalizeAnswerLatex(R`\frac{}{x}`)) === null,
  "una fracción sin numerador sigue siendo ilegible")
check(latexAMathJson(normalizeAnswerLatex("2.5x")) !== null &&
  evaluarMathJson(latexAMathJson(normalizeAnswerLatex("2.5x")), 2) === 5,
  "y el punto entre dos dígitos sigue siendo decimal")

console.log()
if (fallos > 0) {
  console.log(`FALLARON ${fallos}`)
  process.exit(1)
}
console.log("todo ok")
