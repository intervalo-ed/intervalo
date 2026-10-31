// TeX → SVG con MathJax, en el mismo hilo de JS y sin WebView.
//
// Un solo documento de MathJax para toda la app, armado la primera vez que
// hace falta (o antes, con `precalentarMathJax` durante el splash) y con solo
// los paquetes de TeX que el contenido usa. Cada fórmula convertida queda en
// un cache: el contenido del juego se repite mucho (la tabla, las reglas del
// «¿Por qué?») y la conversión es lo único caro.
//
// Los módulos se cargan con `require` adentro de `iniciar` y no con `import`
// arriba: así evaluar MathJax (~14 ms en release) pasa cuando se lo pide y no
// al importar cualquier pantalla que dibuje una fórmula.
//
// El tamaño sale en "em de la fórmula": quien dibuja lo multiplica por el
// cuerpo de letra que quiera (ver latex.tsx :: ESCALA_MATE).

import type { mathjax as MathJaxNs } from "mathjax-full/js/mathjax.js"
import type { TeX as TeXClass } from "mathjax-full/js/input/tex.js"
import type { SVG as SVGClass } from "mathjax-full/js/output/svg.js"
import type { liteAdaptor as liteAdaptorFn } from "mathjax-full/js/adaptors/liteAdaptor.js"
import type { RegisterHTMLHandler as RegisterFn } from "mathjax-full/js/handlers/html.js"
import { parse, type JsxAST } from "react-native-svg"
import { normalizeAlignedRows } from "@intervalo/dx-core/latex/math-text"

export type FormulaSvg = {
  // Ya parseado para react-native-svg: `SvgXml` vuelve a parsear el texto en
  // cada montaje, y la tabla monta las mismas 32 fórmulas cada vez que se abre.
  ast: JsxAST
  // En em de la fórmula. `profundidad` es cuánto baja de la línea de base (≥ 0).
  ancho: number
  alto: number
  profundidad: number
}

export type ResultadoTex = { ok: true; svg: FormulaSvg } | { ok: false; error: string }

// Los mismos atajos que el contenido podría traer escritos a la española. El
// server y la web escriben `\operatorname{sen}` —KaTeX no conoce `\sen`—, pero
// MathLive (el campo de respuesta) devuelve `\sen` y una respuesta mostrada
// tal cual tiene que dibujarse igual.
const MACROS: Record<string, string> = {
  sen: "\\operatorname{sen}",
  tg: "\\operatorname{tg}",
  arcsen: "\\operatorname{arcsen}",
}

// La x-height de la fuente TeX de MathJax, en em: MathJax mide el SVG en `ex`
// de esa fuente, y acá se lo vuelve a pasar a em.
const X_HEIGHT = 0.442

const CACHE_MAX = 600

type Conversor = (tex: string, display: boolean) => ResultadoTex

let conversor: Conversor | null = null
let msDeArranque = -1

/* eslint-disable @typescript-eslint/no-require-imports */
function iniciar(): Conversor {
  const t0 = performance.now()
  const { mathjax } = require("mathjax-full/js/mathjax.js") as { mathjax: typeof MathJaxNs }
  const { TeX } = require("mathjax-full/js/input/tex.js") as { TeX: typeof TeXClass }
  const { SVG } = require("mathjax-full/js/output/svg.js") as { SVG: typeof SVGClass }
  const { liteAdaptor } = require("mathjax-full/js/adaptors/liteAdaptor.js") as {
    liteAdaptor: typeof liteAdaptorFn
  }
  const { RegisterHTMLHandler } = require("mathjax-full/js/handlers/html.js") as {
    RegisterHTMLHandler: typeof RegisterFn
  }
  require("mathjax-full/js/input/tex/base/BaseConfiguration.js")
  require("mathjax-full/js/input/tex/ams/AmsConfiguration.js")
  require("mathjax-full/js/input/tex/newcommand/NewcommandConfiguration.js")
  require("mathjax-full/js/input/tex/configmacros/ConfigMacrosConfiguration.js")

  const adaptor = liteAdaptor()
  RegisterHTMLHandler(adaptor)
  const doc = mathjax.document("", {
    InputJax: new TeX({
      packages: ["base", "ams", "newcommand", "configmacros"],
      macros: MACROS,
      // Por defecto un error de TeX se dibuja como un <merror> rojo adentro de
      // la fórmula. Acá se lo tira, para que el componente muestre el fuente
      // crudo y en dev quede el aviso.
      formatError: (_jax: unknown, err: Error) => {
        throw err
      },
    }),
    OutputJax: new SVG({ fontCache: "local" }),
  })

  const cache = new Map<string, ResultadoTex>()

  const convertir: Conversor = (tex, display) => {
    const clave = `${display ? "D" : "I"}${tex}`
    const hit = cache.get(clave)
    if (hit) {
      cache.delete(clave)
      cache.set(clave, hit)
      return hit
    }
    let resultado: ResultadoTex
    try {
      const nodo = doc.convert(normalizeAlignedRows(tex), { display, em: 16, ex: 16 * X_HEIGHT })
      resultado = { ok: true, svg: aFormula(adaptor.innerHTML(nodo)) }
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e)
      if (__DEV__) console.warn(`[latex] MathJax no pudo con «${tex}»: ${error}`)
      resultado = { ok: false, error }
    }
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string)
    cache.set(clave, resultado)
    return resultado
  }

  msDeArranque = performance.now() - t0
  return convertir
}
/* eslint-enable @typescript-eslint/no-require-imports */

const numero = (svg: string, re: RegExp) => parseFloat(re.exec(svg)?.[1] ?? "0")

// El <svg> que arma MathJax trae tamaño en `ex`, un `style` con el
// vertical-align y un `data-*` por nodo que react-native-svg tendría que
// parsear para nada. Se quedan el viewBox y los trazos.
function aFormula(svg: string): FormulaSvg {
  const anchoEx = numero(svg, /<svg[^>]*?\swidth="(-?[\d.]+)ex"/)
  const altoEx = numero(svg, /<svg[^>]*?\sheight="(-?[\d.]+)ex"/)
  const alineacionEx = numero(svg, /<svg[^>]*?vertical-align:\s*(-?[\d.]+)ex/)
  const xml = svg
    .replace(/\sdata-[\w-]+="[^"]*"/g, "")
    .replace(/(<svg[^>]*?)\sstyle="[^"]*"/, "$1")
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/, "$1")
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/, "$1")
  const ast = parse(xml)
  if (!ast) throw new Error("react-native-svg no pudo leer el SVG")
  return {
    ast,
    ancho: anchoEx * X_HEIGHT,
    alto: altoEx * X_HEIGHT,
    profundidad: Math.max(0, -alineacionEx * X_HEIGHT),
  }
}

export function texASvg({ tex, display }: { tex: string; display: boolean }): ResultadoTex {
  conversor ??= iniciar()
  return conversor(tex, display)
}

/** Arma MathJax y, si se le pasan, convierte esas fórmulas de antemano. Para
 *  llamar durante el splash: la primera fórmula de la partida deja de pagar
 *  el arranque. */
export function precalentarMathJax({
  formulas = [],
}: { formulas?: { tex: string; display: boolean }[] } = {}): void {
  conversor ??= iniciar()
  for (const f of formulas) conversor(f.tex, f.display)
}

/** Cuánto tardó en armarse MathJax, en ms (-1 si todavía no se armó). Para
 *  medir, no para decidir nada. */
export function msDeArranqueDeMathJax(): number {
  return msDeArranque
}
