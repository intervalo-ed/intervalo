"use client"

import katex from "katex"
import "katex/dist/katex.min.css"

type Segment =
  | { type: "text"; value: string }
  | { type: "inline"; value: string }
  | { type: "display"; value: string }

// Splits on $$...$$ first (display), then $...$ (inline), leaving the rest as text.
function parse(text: string): Segment[] {
  const out: Segment[] = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let cursor = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) out.push({ type: "text", value: text.slice(cursor, m.index) })
    if (m[1] !== undefined) out.push({ type: "display", value: m[1] })
    else if (m[2] !== undefined) out.push({ type: "inline", value: m[2] })
    cursor = m.index + m[0].length
  }
  if (cursor < text.length) out.push({ type: "text", value: text.slice(cursor) })
  return out
}

function render({ value, displayMode }: { value: string; displayMode: boolean }) {
  return katex.renderToString(value, { throwOnError: false, displayMode })
}

export default function MathText({ text }: { text: string }) {
  const segments = parse(text)
  return (
    <span className="whitespace-pre-line">
      {segments.map((s, i) => {
        if (s.type === "text") return <span key={i}>{s.value}</span>
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{
              __html: render({ value: s.value, displayMode: s.type === "display" }),
            }}
          />
        )
      })}
    </span>
  )
}
