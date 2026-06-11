"use client"

import katex from "katex"
import "katex/dist/katex.min.css"

type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "display"; value: string }
  | { type: "bold"; value: string }

// Splits on $$...$$ (display), then $...$ (inline), then **...** (bold), leaving the rest as text.
function parse(text: string): Segment[] {
  const out: Segment[] = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\*\*([\s\S]+?)\*\*/g
  let cursor = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) out.push({ type: "text", value: text.slice(cursor, m.index) })
    if (m[1] !== undefined) out.push({ type: "display", value: m[1] })
    else if (m[2] !== undefined) out.push({ type: "inline", value: m[2] })
    else if (m[3] !== undefined) out.push({ type: "bold", value: m[3] })
    cursor = m.index + m[0].length
  }
  if (cursor < text.length) out.push({ type: "text", value: text.slice(cursor) })

  // Strip the single \n immediately before/after display blocks so the my-3
  // margin alone controls vertical spacing (avoids asymmetry from line-height).
  for (let i = 0; i < out.length; i++) {
    if (out[i].type === "display") {
      if (i > 0 && out[i - 1].type === "text")
        out[i - 1] = { type: "text", value: (out[i - 1] as { type: "text"; value: string }).value.replace(/\n$/, "") }
      if (i < out.length - 1 && out[i + 1].type === "text")
        out[i + 1] = { type: "text", value: (out[i + 1] as { type: "text"; value: string }).value.replace(/^\n/, "") }
    }
  }

  return out
}

function render({ value, displayMode }: { value: string; displayMode: boolean }) {
  return katex.renderToString(value, { throwOnError: false, displayMode })
}

// LaTeX "alto" (fracciones, raíces, sumatorias, etc.): necesita unos px extra de
// alto de línea para no pegarse a la línea de arriba.
const TALL_LATEX = /\\(d|t)?frac|\\binom|\\sqrt|\\sum|\\int|\\lim|\\over/
function isTall(value: string): boolean {
  return TALL_LATEX.test(value)
}

export default function MathText({ text }: { text: string }) {
  const segments = parse(text)
  return (
    <span className="whitespace-pre-line">
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
              className="my-3 block [&_.katex-display]:my-0"
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
              s.type === "inline" && isTall(s.value)
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
