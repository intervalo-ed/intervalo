"use client"

import katex from "katex"
import "katex/dist/katex.min.css"
import {
  isTallLatex,
  normalizeAlignedRows,
  parseMathText,
} from "@intervalo/dx-core/latex/math-text"

// El HTML de KaTeX depende solo de (value, displayMode) y el contenido de los
// ejercicios es estático, así que cachear evita re-parsear el mismo LaTeX en
// cada render (tipear en un textarea, animaciones, etc.). Cota simple para que
// una sesión larga no acumule entradas para siempre: al llenarse, se descarta
// el cache entero (más barato que un LRU y suficiente acá).
const RENDER_CACHE = new Map<string, string>()
const RENDER_CACHE_MAX = 500

function render({ value, displayMode }: { value: string; displayMode: boolean }) {
  const key = `${value}|${displayMode}`
  const cached = RENDER_CACHE.get(key)
  if (cached !== undefined) return cached
  const html = katex.renderToString(normalizeAlignedRows(value), {
    throwOnError: false,
    displayMode,
  })
  if (RENDER_CACHE.size >= RENDER_CACHE_MAX) RENDER_CACHE.clear()
  RENDER_CACHE.set(key, html)
  return html
}

export default function MathText({ text }: { text: string }) {
  const segments = parseMathText(text)
  return (
    <span className="whitespace-pre-line [&_.katex]:text-[1.05em]">
      {segments.map((s, i) => {
        if (s.type === "text") return <span key={i}>{s.value}</span>
        if (s.type === "bold")
          return (
            <strong key={i}>
              <MathText text={s.value} />
            </strong>
          )
        if (s.type === "display") {
          return (
            <span
              key={i}
              // El display math de KaTeX no corta línea: una fórmula más ancha
              // que el contenedor se desborda y, dentro de un slide con overflow
              // oculto, se lleva puesto el recorte del texto de al lado.
              //
              // `w-0 min-w-full` y no `max-w-full`: con max-width los flex de
              // arriba igual se estiran hasta el ancho de la fórmula (min-width
              // auto) y el bloque crece en vez de scrollear. Con width 0 no
              // aporta ancho intrínseco —los ancestros no se enteran de que el
              // contenido es más ancho— y min-width lo hace ocupar todo lo
              // disponible.
              //
              // `overflow-y-hidden` EXPLÍCITO y no la ausencia de la propiedad:
              // la spec de CSS computa el eje que se deja en `visible` como
              // `auto` en cuanto el otro eje no lo es, así que un `overflow-x-auto`
              // solo terminaba dándole a este bloque un scroll VERTICAL propio
              // —con su flechita nativa arriba y abajo— apenas el renglón medía
              // un pixel de más. El único scroll que tiene que existir acá es el
              // del contenedor entero (ver porque-panel.tsx), no uno por fórmula.
              className="my-3 block w-0 min-w-full overflow-x-auto overflow-y-hidden [&_.katex-display]:my-0"
              dangerouslySetInnerHTML={{
                __html: render({ value: s.value, displayMode: true }),
              }}
            />
          )
        }
        return (
          <span
            key={i}
            className={
              s.type === "inline" && isTallLatex(s.value)
                ? "inline-block whitespace-nowrap py-[5px] align-middle"
                : "whitespace-nowrap"
            }
            dangerouslySetInnerHTML={{
              __html: render({ value: s.value, displayMode: false }),
            }}
          />
        )
      })}
    </span>
  )
}
