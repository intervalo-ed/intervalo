// Normalización del LaTeX del alumno antes de parsearlo con compute-engine.
// El server aplica sus propias guardas: esto es solo para que la notación en
// español (sen/tg) y los prefijos tipo "f'(x)=" no cuenten como error.

const PREFIX_RE =
  /^\s*(?:y'?|f'?\s*\(\s*x\s*\)|\\frac\{dy\}\{dx\}|dy\/dx)\s*=\s*/i

export function normalizeAnswerLatex(latex: string): string {
  let out = latex.trim()
  out = out.replace(PREFIX_RE, "")
  out = out.replaceAll("\\operatorname{sen}", "\\sin")
  out = out.replaceAll("\\operatorname{tg}", "\\tan")
  out = out.replaceAll("\\sen", "\\sin")
  out = out.replaceAll("\\tg", "\\tan")
  return out.trim()
}
