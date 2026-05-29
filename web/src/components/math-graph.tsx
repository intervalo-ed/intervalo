"use client"

import { Coordinates, Mafs, Plot } from "mafs"
import "mafs/core.css"
import { compile, type EvalFunction } from "mathjs"
import { useMemo } from "react"

type RealFn = (x: number) => number
type BoolFn = (x: number) => boolean

const DEFAULT_VIEW: [number, number, number, number] = [-3, 3, -3, 3]

function normalize(expr: string): string {
  // Python "**" → mathjs "^". Whitespace allowed between operands.
  return expr.replace(/\*\*/g, "^")
}

function compileFn(expr: string): EvalFunction | null {
  try {
    return compile(normalize(expr))
  } catch {
    return null
  }
}

function toRealFn(code: EvalFunction): RealFn {
  return (x: number) => {
    try {
      const r = code.evaluate({ x })
      if (typeof r === "number" && Number.isFinite(r)) return r
      return NaN
    } catch {
      return NaN
    }
  }
}

function toBoolFn(code: EvalFunction): BoolFn {
  return (x: number) => {
    try {
      return Boolean(code.evaluate({ x }))
    } catch {
      return false
    }
  }
}

function parsePiecewise(
  input: string,
): { expr: string; cond: string }[] | null {
  const m = input.match(/^\s*Piecewise\s*\(([\s\S]*)\)\s*$/)
  if (!m) return null
  const inner = m[1]
  const pairs: { expr: string; cond: string }[] = []
  let i = 0
  while (i < inner.length) {
    while (i < inner.length && /[\s,]/.test(inner[i])) i++
    if (i >= inner.length) break
    if (inner[i] !== "(") return null
    let depth = 1
    let j = i + 1
    while (j < inner.length && depth > 0) {
      if (inner[j] === "(") depth++
      else if (inner[j] === ")") depth--
      if (depth === 0) break
      j++
    }
    if (depth !== 0) return null
    const tuple = inner.slice(i + 1, j)
    let d = 0
    let splitAt = -1
    for (let k = 0; k < tuple.length; k++) {
      if (tuple[k] === "(") d++
      else if (tuple[k] === ")") d--
      else if (tuple[k] === "," && d === 0) {
        splitAt = k
        break
      }
    }
    if (splitAt < 0) return null
    pairs.push({
      expr: tuple.slice(0, splitAt).trim(),
      cond: tuple.slice(splitAt + 1).trim(),
    })
    i = j + 1
  }
  return pairs.length > 0 ? pairs : null
}

function buildFn(graphFn: string): RealFn | null {
  const pieces = parsePiecewise(graphFn)
  if (pieces) {
    const compiled = pieces.map((p) => ({
      expr: compileFn(p.expr),
      cond: compileFn(p.cond),
    }))
    if (compiled.some((c) => !c.expr || !c.cond)) return null
    const realExprs = compiled.map((c) => toRealFn(c.expr!))
    const boolConds = compiled.map((c) => toBoolFn(c.cond!))
    return (x: number) => {
      for (let k = 0; k < boolConds.length; k++) {
        if (boolConds[k](x)) return realExprs[k](x)
      }
      return NaN
    }
  }
  const code = compileFn(graphFn)
  return code ? toRealFn(code) : null
}

function toView(
  graphView: unknown[] | null | undefined,
): [number, number, number, number] {
  if (
    Array.isArray(graphView) &&
    graphView.length === 4 &&
    graphView.every((v) => typeof v === "number" && Number.isFinite(v))
  ) {
    return graphView as [number, number, number, number]
  }
  return DEFAULT_VIEW
}

export default function MathGraph({
  graphFn,
  graphView,
}: {
  graphFn: string
  graphView?: unknown[] | null
}) {
  const fn = useMemo(() => buildFn(graphFn), [graphFn])
  const [xmin, xmax, ymin, ymax] = toView(graphView)

  if (!fn) {
    return (
      <div className="border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        No se pudo graficar: {graphFn}
      </div>
    )
  }

  return (
    <div
      className="overflow-hidden border bg-muted text-card-foreground"
      style={
        {
          "--mafs-bg": "var(--color-muted)",
          "--mafs-fg": "var(--color-foreground)",
          "--mafs-origin-color":
            "color-mix(in oklch, var(--color-muted-foreground) 35%, transparent)",
          "--mafs-line-color":
            "color-mix(in oklch, var(--color-border) 15%, transparent)",
          "--grid-line-subdivision-color":
            "color-mix(in oklch, var(--color-border) 5%, transparent)",
        } as React.CSSProperties
      }
    >
      <Mafs
        height={260}
        viewBox={{ x: [xmin, xmax], y: [ymin, ymax] }}
        pan={false}
        zoom={false}
      >
        <Coordinates.Cartesian />
        <Plot.OfX y={fn} color="var(--color-primary)" weight={4} />
      </Mafs>
    </div>
  )
}
