// Las fuentes de MathLive como assets de Metro.
//
// MathLive carga sus fuentes con `FontFace` desde `fontsDirectory`, que resuelve
// contra la URL del script. Adentro de un DOM component esa URL no lleva a
// ningún lado (lo mismo que le pasa a cualquier `url(fonts/…)` relativo), así
// que `fontsDirectory` va en `null` y
// las `@font-face` se declaran acá con `require()`: Metro las sirve en dev y las
// copia al export embebido. Son las mismas veinte que MathLive pide, con los
// mismos nombres de familia, así que su CSS las encuentra sin enterarse.
/* eslint-disable @typescript-eslint/no-require-imports */
const FUENTES: [familia: string, estilo: string, peso: string, modulo: unknown][] = [
  ["KaTeX_Main", "normal", "400", require("mathlive/fonts/KaTeX_Main-Regular.woff2")],
  ["KaTeX_Main", "italic", "700", require("mathlive/fonts/KaTeX_Main-BoldItalic.woff2")],
  ["KaTeX_Main", "normal", "700", require("mathlive/fonts/KaTeX_Main-Bold.woff2")],
  ["KaTeX_Main", "italic", "400", require("mathlive/fonts/KaTeX_Main-Italic.woff2")],
  ["KaTeX_Math", "italic", "400", require("mathlive/fonts/KaTeX_Math-Italic.woff2")],
  ["KaTeX_Math", "italic", "700", require("mathlive/fonts/KaTeX_Math-BoldItalic.woff2")],
  ["KaTeX_AMS", "normal", "400", require("mathlive/fonts/KaTeX_AMS-Regular.woff2")],
  ["KaTeX_Caligraphic", "normal", "400", require("mathlive/fonts/KaTeX_Caligraphic-Regular.woff2")],
  ["KaTeX_Caligraphic", "normal", "700", require("mathlive/fonts/KaTeX_Caligraphic-Bold.woff2")],
  ["KaTeX_Fraktur", "normal", "400", require("mathlive/fonts/KaTeX_Fraktur-Regular.woff2")],
  ["KaTeX_Fraktur", "normal", "700", require("mathlive/fonts/KaTeX_Fraktur-Bold.woff2")],
  ["KaTeX_SansSerif", "normal", "400", require("mathlive/fonts/KaTeX_SansSerif-Regular.woff2")],
  ["KaTeX_SansSerif", "normal", "700", require("mathlive/fonts/KaTeX_SansSerif-Bold.woff2")],
  ["KaTeX_SansSerif", "italic", "400", require("mathlive/fonts/KaTeX_SansSerif-Italic.woff2")],
  ["KaTeX_Script", "normal", "400", require("mathlive/fonts/KaTeX_Script-Regular.woff2")],
  ["KaTeX_Typewriter", "normal", "400", require("mathlive/fonts/KaTeX_Typewriter-Regular.woff2")],
  ["KaTeX_Size1", "normal", "400", require("mathlive/fonts/KaTeX_Size1-Regular.woff2")],
  ["KaTeX_Size2", "normal", "400", require("mathlive/fonts/KaTeX_Size2-Regular.woff2")],
  ["KaTeX_Size3", "normal", "400", require("mathlive/fonts/KaTeX_Size3-Regular.woff2")],
  ["KaTeX_Size4", "normal", "400", require("mathlive/fonts/KaTeX_Size4-Regular.woff2")],
]

function uriDe(modulo: unknown): string {
  if (typeof modulo === "string") return modulo
  const m = modulo as { uri?: string; default?: string }
  return m.uri ?? m.default ?? ""
}

export function mathliveFontFaceCss(): string {
  return FUENTES.map(
    ([familia, estilo, peso, modulo]) =>
      `@font-face{font-display:block;font-family:${familia};font-style:${estilo};font-weight:${peso};src:url(${uriDe(modulo)}) format("woff2")}`,
  ).join("\n")
}
