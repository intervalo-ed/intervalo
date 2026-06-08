"use client"

import { Coordinates, Line, Mafs, Plot, Text } from "mafs"
import "mafs/core.css"
import { compile, type EvalFunction } from "mathjs"
import { useEffect, useMemo, useRef, useState } from "react"

type RealFn = (x: number) => number
type BoolFn = (x: number) => boolean

const DEFAULT_VIEW: [number, number, number, number] = [-3, 3, -3, 3]

// Aspecto de la caja (ancho:alto). Más alto = menos estiramiento horizontal.
const BOX_W = 480
const BOX_H = 380
// Zoom in: contrae la vista hacia su centro (>1 acerca, <1 aleja).
const ZOOM = 1.15

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
  // Igual que el prototipo viejo (prototype-v1): se usa el graph_view tal cual,
  // sin zoom out ni recorte del eje x. La "deformación" horizontal surge sola del
  // aspecto fijo de la caja (480×280) que estira la vista para llenarla.
  const raw = toView(graphView)
  // Aplicamos un zoom in contrayendo la vista hacia su centro antes de redondear.
  const cx = (raw[0] + raw[1]) / 2
  const cy = (raw[2] + raw[3]) / 2
  const hx = (raw[1] - raw[0]) / 2 / ZOOM
  const hy = (raw[3] - raw[2]) / 2 / ZOOM
  const xmin = Math.round(cx - hx)
  const xmax = Math.round(cx + hx)
  const ymin = Math.round(cy - hy)
  const ymax = Math.round(cy + hy)

  // mafs 0.21 (Plot.OfX) NO corta la línea ante valores no finitos: omite el punto
  // y sigue uniendo con el siguiente, lo que dibuja la recta de la asíntota o un
  // puente plano cuando la curva sale y vuelve a entrar por abajo. Para evitarlo
  // partimos el dominio en tramos contiguos "en pantalla" y renderizamos un
  // Plot.OfX por tramo (cada uno es un <path> aparte → no se puentean entre sí).
  const margin = (ymax - ymin) * 0.04
  const lo = ymin - margin
  const hi = ymax + margin
  const branches = useMemo<[number, number][]>(() => {
    if (!fn) return []
    const N = 600
    const step = (xmax - xmin) / N
    const xs: number[] = []
    const visible: boolean[] = []
    for (let i = 0; i <= N; i++) {
      const x = xmin + i * step
      const y = fn(x)
      xs.push(x)
      visible.push(Number.isFinite(y) && y >= lo && y <= hi)
    }
    const runs: [number, number][] = []
    let start = -1
    for (let i = 0; i <= N; i++) {
      if (visible[i]) {
        if (start === -1) start = i
      } else if (start !== -1) {
        // Extendemos un sample a cada lado para que el tramo llegue al borde
        // (mafs recorta al viewport), sin cruzar el salto.
        runs.push([xs[Math.max(0, start - 1)], xs[i]])
        start = -1
      }
    }
    if (start !== -1) runs.push([xs[Math.max(0, start - 1)], xs[N]])
    return runs
  }, [fn, xmin, xmax, lo, hi])

  // Caja con el mismo aspecto que el viejo SVG (480×280): medimos el ancho y
  // derivamos la altura, así el estiramiento del eje x es idéntico en cualquier
  // pantalla.
  const wrapRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(210)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => setHeight(Math.round((el.clientWidth * BOX_H) / BOX_W))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Ticks (guiones) en cada entero de cada eje, y labels Y propios al borde izq.
  const xTicks: number[] = []
  for (let i = Math.ceil(xmin); i <= xmax; i++) if (i !== 0) xTicks.push(i)
  const yTicks: number[] = []
  for (let j = Math.ceil(ymin); j <= ymax; j++) if (j !== 0) yTicks.push(j)
  const xTickHalf = (ymax - ymin) * 0.009 // alto de los guiones del eje x (en y)
  const yTickHalf = (xmax - xmin) * 0.005 // ancho de los guiones del eje y (en x)

  if (!fn) {
    return (
      <div className="border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        No se pudo graficar: {graphFn}
      </div>
    )
  }

  return (
    <div
      ref={wrapRef}
      className="math-graph overflow-hidden rounded-md border bg-white"
    >
      <Mafs
        height={height}
        viewBox={{ x: [xmin, xmax], y: [ymin, ymax] }}
        preserveAspectRatio={false}
        pan={false}
        zoom={false}
      >
        <Coordinates.Cartesian yAxis={{ labels: false }} />
        {xTicks.map((i) => (
          <Line.Segment
            key={`xt-${i}`}
            point1={[i, -xTickHalf]}
            point2={[i, xTickHalf]}
            color="#9ca3af"
            weight={1}
          />
        ))}
        {yTicks.map((j) => (
          <Line.Segment
            key={`yt-${j}`}
            point1={[-yTickHalf, j]}
            point2={[yTickHalf, j]}
            color="#9ca3af"
            weight={1}
          />
        ))}
        {yTicks.map((j) => (
          <Text
            key={`yl-${j}`}
            x={0}
            y={j}
            attach="w"
            attachDistance={6}
            size={8}
            color="#6b7280"
          >
            {j}
          </Text>
        ))}
        {branches.map(([d0, d1], k) => (
          <Plot.OfX
            key={k}
            y={fn}
            domain={[d0, d1]}
            color="#4453E6"
            weight={2}
            minSamplingDepth={12}
            maxSamplingDepth={20}
          />
        ))}
      </Mafs>
    </div>
  )
}
