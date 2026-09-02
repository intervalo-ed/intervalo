// Chequeo de la normalización del LaTeX del alumno.
//
// Corre con: bun run check:latex
//
// Existe por una respuesta perdida en producción. El 02/09, resolviendo la
// derivada de $\cos x$, un jugador escribió primero `sen(x)` con la tecla y
// después volvió con el cursor a ponerle el menos adelante. MathLive metió el
// signo ADENTRO del token, el campo serializó
// `\operatorname{-\mathrm{sen}}\left(x\right)`, y lo que llegó al parser fue el
// nombre de función `-sen`, que no existe. La respuesta estaba bien y contó como
// error.
//
// Es de las cosas que no se ven jugando: hay que reproducir la secuencia exacta
// de tecleo para que pase, y cuando pasa el síntoma es "no me lo tomó" sin nada
// más. Por eso se chequea acá.

import { normalizeAnswerLatex } from "../src/app/derivadas/latex-normalize"
import { parseAnswerToMathJson } from "../src/app/derivadas/parse-answer"
import { evaluarMathJson } from "../src/app/derivadas/local-verdict"

let fallos = 0
function check(condicion: boolean, etiqueta: string) {
  console.log(`  [${condicion ? "ok" : "FAIL"}] ${etiqueta}`)
  if (!condicion) fallos++
}

// Escrito con una constante para el backslash: en un literal, cada uno de estos
// LaTeX necesita el doble y se vuelven ilegibles justo donde importa leerlos.
const B = "\\"
const eq = (entrada: string, salida: string) => normalizeAnswerLatex(entrada) === salida

console.log("1. el signo atrapado adentro del operador sale afuera")
check(
  eq(`${B}operatorname{-${B}mathrm{sen}}${B}left(x${B}right)`, `-${B}sin${B}left(x${B}right)`),
  "el caso real: -sen(x) escrito al revés",
)
check(
  eq(`${B}operatorname{-${B}mathrm{tg}}(x)`, `-${B}tan(x)`),
  "tg, que además se traduce del español",
)
check(
  eq(`${B}operatorname{-${B}mathrm{ln}}(x)`, `-${B}ln(x)`),
  "y una que LaTeX ya tiene como macro",
)
check(
  eq(`${B}operatorname{--${B}mathrm{sen}}(x)`, `--${B}sin(x)`),
  "dos signos también: borrar uno cuesta más que escribirlo dos veces",
)
check(eq(`${B}operatorname{+${B}mathrm{cos}}(x)`, `+${B}cos(x)`), "y el más, no solo el menos")

console.log("2. lo que ya andaba sigue igual")
check(
  eq(`${B}operatorname{${B}mathrm{sen}}${B}left(x${B}right)`, `${B}sin${B}left(x${B}right)`),
  "sin signo, la traducción de siempre",
)
check(
  eq(`-${B}operatorname{${B}mathrm{sen}}(x)`, `-${B}sin(x)`),
  "el signo AFUERA del operador no se toca",
)
check(
  eq(`${B}operatorname{-${B}mathrm{zzz}}(x)`, `${B}operatorname{-zzz}(x)`),
  "un nombre desconocido se deja como estaba: sacarle el signo cambia un error por otro",
)

console.log("3. de punta a punta: la respuesta perdida ahora vale")
const real = `${B}operatorname{-${B}mathrm{sen}}${B}left(x${B}right)`
const nodo = await parseAnswerToMathJson(real)
check(nodo !== null, "parsea (antes daba parse_ok=false)")
const y = nodo === null ? null : evaluarMathJson(nodo, 0.7)
check(
  y !== null && Math.abs(y - -Math.sin(0.7)) < 1e-9,
  `y evalúa a -sen(0,7) = ${(-Math.sin(0.7)).toFixed(6)} (dio ${y === null ? "null" : y.toFixed(6)})`,
)

console.log()
if (fallos > 0) {
  console.log(`${fallos} chequeo(s) fallaron`)
  process.exit(1)
}
console.log("todos los chequeos pasaron")
