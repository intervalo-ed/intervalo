// Chequeo del partidor de texto con fórmulas (src/latex/math-text.ts).
//
// Corre con: bun run check:math-text
//
// Lo usan la web (KaTeX) y la app (MathJax). Si el partidor se equivoca, la
// fórmula sale como texto crudo con sus `$` —o al revés, una plata en prosa
// se vuelve fórmula— en las dos a la vez. Corre también en Hermes, que es
// donde se usa el lookbehind de la regex de verdad: si algún día deja de
// soportarlo, la app no levanta y esto no lo va a ver; el demo sí.

import { isTallLatex, normalizeAlignedRows, parseMathText } from "../src/latex/math-text"

let fallos = 0
function check(ok: boolean, label: string) {
  console.log(`  [${ok ? "ok" : "FAIL"}] ${label}`)
  if (!ok) fallos++
}

const resumen = (text: string) =>
  parseMathText(text)
    .map((s) => `${s.type}:${s.value}`)
    .join(" | ")

check(
  resumen("Si $f(x) = x^2$, entonces **crece**.") ===
    "text:Si  | inline:f(x) = x^2 | text:, entonces  | bold:crece | text:.",
  "inline, negrita y texto en orden",
)
check(
  resumen("Por lo tanto:\n$$f'(x) = 2x$$\nListo.") ===
    "text:Por lo tanto: | display:f'(x) = 2x | text:Listo.",
  "display, y se come UN salto pegado de cada lado",
)
check(
  resumen("Arriba\n\n$$a$$\n\nAbajo") === "text:Arriba\n | display:a | text:\nAbajo",
  "con línea en blanco, queda un salto de cada lado",
)
check(
  resumen("Cuesta \\$400 y después \\$200.") === "text:Cuesta $400 y después $200.",
  "la plata escapada no abre fórmula",
)
check(resumen("uno\\ndos") === "text:uno\ndos", "el \\n literal del contenido vuelve salto")
check(resumen("$\\neq$") === "inline:\\neq", "adentro de la fórmula no se toca el \\n")
check(resumen("$a\nb$") === "text:$a\nb$", "un inline no cruza renglones")
check(resumen("") === "", "vacío")

check(
  normalizeAlignedRows("\\begin{aligned} u &= x \\\\ v &= 2 \\end{aligned}").split("\\vphantom").length === 3,
  "aligned: un puntal por renglón",
)
check(isTallLatex("\\frac{1}{2}") && !isTallLatex("x^2"), "alto: fracción sí, potencia no")

console.log(fallos === 0 ? "\ntodos los chequeos pasaron" : `\n${fallos} chequeos fallaron`)
process.exit(fallos === 0 ? 0 : 1)
