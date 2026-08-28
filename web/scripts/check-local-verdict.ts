// Chequeo del veredicto local del minijuego de derivadas.
//
// Corre con: bun run check:verdict
//
// Compara el veredicto local contra lo que debería decir el servidor, sobre
// enunciados y respuestas tomados de las plantillas reales del juego.
// Los `prompt` van tal cual los emite latex_es() en el backend.

import { muestrasEsperadas, veredictoLocal } from "../src/app/derivadas/local-verdict"
import { parseAnswerToMathJson } from "../src/app/derivadas/parse-answer"

type Caso = { prompt: string; respuesta: string; esperado: boolean }

const casos: Caso[] = [
  // --- potencias y constantes ---
  { prompt: String.raw`x^{3}`, respuesta: "3x^2", esperado: true },
  { prompt: String.raw`x^{3}`, respuesta: "x^2", esperado: false },
  { prompt: String.raw`7`, respuesta: "0", esperado: true },
  { prompt: String.raw`7`, respuesta: "7", esperado: false },
  { prompt: String.raw`5 x`, respuesta: "5", esperado: true },
  { prompt: String.raw`4 x^{5}`, respuesta: "20x^4", esperado: true },
  { prompt: String.raw`4 x^{5}`, respuesta: "4x^4", esperado: false },
  { prompt: String.raw`x^{2}`, respuesta: "x+x", esperado: true },
  { prompt: String.raw`2 x^{2}`, respuesta: "4x", esperado: true },

  // --- sumas ---
  { prompt: String.raw`3 x^{2} + 5 x`, respuesta: "6x+5", esperado: true },
  { prompt: String.raw`3 x^{2} + 5 x`, respuesta: "6x", esperado: false },

  // --- trigonométricas (el server manda \operatorname{sen}) ---
  { prompt: String.raw`\operatorname{sen}{\left(x \right)}`, respuesta: String.raw`\cos(x)`, esperado: true },
  { prompt: String.raw`\operatorname{sen}{\left(x \right)}`, respuesta: String.raw`-\cos(x)`, esperado: false },
  { prompt: String.raw`\cos{\left(x \right)}`, respuesta: String.raw`-\operatorname{sen}(x)`, esperado: true },
  { prompt: String.raw`\cos{\left(x \right)}`, respuesta: String.raw`\operatorname{sen}(x)`, esperado: false },
  { prompt: String.raw`\tan{\left(x \right)}`, respuesta: String.raw`\frac{1}{\cos(x)^2}`, esperado: true },

  // --- exponencial y logaritmo ---
  { prompt: String.raw`e^{x}`, respuesta: "e^x", esperado: true },
  { prompt: String.raw`\ln{\left(x \right)}`, respuesta: String.raw`\frac{1}{x}`, esperado: true },
  { prompt: String.raw`\ln{\left(x \right)}`, respuesta: "x^{-1}", esperado: true },
  { prompt: String.raw`\ln{\left(x \right)}`, respuesta: String.raw`\frac{1}{x^2}`, esperado: false },
  { prompt: String.raw`2^{x}`, respuesta: String.raw`2^x\ln(2)`, esperado: true },

  // --- cocientes y raíces ---
  { prompt: String.raw`\frac{1}{x}`, respuesta: String.raw`-\frac{1}{x^2}`, esperado: true },
  { prompt: String.raw`\frac{1}{x}`, respuesta: String.raw`\frac{1}{x^2}`, esperado: false },
  { prompt: String.raw`\sqrt{x}`, respuesta: String.raw`\frac{1}{2\sqrt{x}}`, esperado: true },
  { prompt: String.raw`\frac{x}{x + 1}`, respuesta: String.raw`\frac{1}{(x+1)^2}`, esperado: true },

  // --- productos y regla de la cadena ---
  { prompt: String.raw`x \operatorname{sen}{\left(x \right)}`, respuesta: String.raw`\operatorname{sen}(x)+x\cos(x)`, esperado: true },
  { prompt: String.raw`x e^{x}`, respuesta: "e^x+xe^x", esperado: true },
  { prompt: String.raw`x e^{x}`, respuesta: "e^x(1+x)", esperado: true },
  { prompt: String.raw`x e^{x}`, respuesta: "e^x", esperado: false },
  { prompt: String.raw`e^{x^{2}}`, respuesta: "2xe^{x^2}", esperado: true },
  { prompt: String.raw`e^{3 x}`, respuesta: "3e^{3x}", esperado: true },
  { prompt: String.raw`e^{3 x}`, respuesta: "e^{3x}", esperado: false },
  { prompt: String.raw`\operatorname{sen}{\left(2 x \right)}`, respuesta: String.raw`2\cos(2x)`, esperado: true },
  { prompt: String.raw`\operatorname{sen}{\left(2 x \right)}`, respuesta: String.raw`\cos(2x)`, esperado: false },
  { prompt: String.raw`x \ln{\left(x \right)}`, respuesta: String.raw`\ln(x)+1`, esperado: true },
  { prompt: String.raw`x^{2} \cos{\left(x \right)}`, respuesta: String.raw`2x\cos(x)-x^2\operatorname{sen}(x)`, esperado: true },

  // --- el caso peligroso: equivocada pero MUY parecida ---
  { prompt: String.raw`x^{5}`, respuesta: "5x^{4}+0.001", esperado: false },
]

// Respuestas que el evaluador no soporta: el veredicto TIENE que callarse.
const debenCallarse = [
  { prompt: String.raw`x^{3}`, respuesta: String.raw`\int x \, dx` },
  { prompt: String.raw`x^{3}`, respuesta: String.raw`3y^2` },
]

let ok = 0, prudente = 0, mal = 0

for (const caso of casos) {
  const esperadas = await muestrasEsperadas(caso.prompt)
  const veredicto = veredictoLocal(esperadas, await parseAnswerToMathJson(caso.respuesta))
  if (veredicto === null) {
    prudente += 1
    console.log(`  ~ se calla   ${caso.prompt.padEnd(38)} → ${caso.respuesta}`)
  } else if (veredicto === caso.esperado) ok += 1
  else {
    mal += 1
    console.log(`  ✗ MAL        ${caso.prompt.padEnd(38)} → ${caso.respuesta}  (dijo ${veredicto})`)
  }
}

let mudasOk = 0
for (const caso of debenCallarse) {
  const esperadas = await muestrasEsperadas(caso.prompt)
  const veredicto = veredictoLocal(esperadas, await parseAnswerToMathJson(caso.respuesta))
  if (veredicto === null) mudasOk += 1
  else console.log(`  ✗ debió callarse: ${caso.prompt} → ${caso.respuesta} (dijo ${veredicto})`)
}

console.log(`\ndecididos bien: ${ok}/${casos.length}   se calló: ${prudente}   EQUIVOCADOS: ${mal}`)
console.log(`se calla ante lo que no entiende: ${mudasOk}/${debenCallarse.length}`)
if (mal > 0 || mudasOk < debenCallarse.length) process.exit(1)
