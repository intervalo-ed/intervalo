"use client"

import { Coordinates, Line, Mafs, Plot, Point, Text, usePaneContext, useTransformContext } from "mafs"
import "mafs/core.css"
import { compile, type EvalFunction } from "mathjs"
import { Home, Info, Lock, LockOpen } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { markGraphInfoSeen, useGraphInfoUnseen } from "@/lib/nav/graph-info-seen"

type RealFn = (x: number) => number
type BoolFn = (x: number) => boolean

const DEFAULT_VIEW: [number, number, number, number] = [-4, 4, -4, 4]
const LINE_COLOR = "#4453E6"
const AXIS_COLOR = "#6b7280"
const TICK_PX = 1.5 // half-length of the small axis tick marks, in pixels
const LABEL_GAP = 7 // distance from axis to numeric label, same on both axes
const BOX_W = 480
const BOX_H = 420

function normalize(expr: string): string {
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

// Pure-angle trig (x es un ángulo en radianes) → eje x en múltiplos de π. Los
// trig "aplicados" (x = tiempo/meses: 311*sin(100*pi*x), 10*sin(pi/12*(x-6))+20)
// siempre llevan `pi` en la fórmula y deben quedar con grilla decimal.
function isAngleTrig(graphFn: string): boolean {
  return /\b(sin|cos|tan)\b/.test(graphFn) && !/\bpi\b/i.test(graphFn)
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

// Divisor controls grid density: higher = finer steps for the same range.
// 6 ≈ ~6 major intervals; 8 ≈ ~8, making the grid visibly denser by default.
const GRID_DENSITY = 15

function niceStep(range: number): number {
  if (range <= 0) return 1
  const rough = range / GRID_DENSITY
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)))
  const normalized = rough / magnitude
  if (normalized <= 1) return magnitude
  if (normalized <= 2) return 2 * magnitude
  if (normalized <= 5) return 5 * magnitude
  return 10 * magnitude
}

// Returns how many sub-divisions to draw inside each major grid interval.
// Chosen so the minor step is always the previous entry in the 1-2-5 sequence:
//   step=1→5divs(0.2), step=2→4(0.5), step=5→5(1), step=10→5(2), step=20→4(5)…
function niceSubdivisions(step: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(step)))
  const norm = Math.round(step / magnitude) // 1, 2, or 5
  if (norm === 2) return 4
  return 5
}

// Formats a tick value with just enough decimals for the current step, then
// trims FP noise (0.30000000004 → "0.3"). Used for both the label and the key.
function formatTick(value: number, step: number): string {
  const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0
  return Number(value.toFixed(decimals)).toString()
}

// Eje x en π: densidad un poco menor que la decimal para que el paso ETIQUETADO
// caiga en π/2 en las vistas típicas (±5, ±6.5, ±7) y en π en las más anchas (±10).
const PI_GRID_DENSITY = 8

// Paso mayor del eje x en una escalera de π: …, π/4, π/2, π, 2π, 4π, … (potencias
// de 2 por π). Se elige el peldaño que da ~PI_GRID_DENSITY intervalos en el rango.
function piStep(range: number): number {
  if (range <= 0) return Math.PI
  const inPi = range / PI_GRID_DENSITY / Math.PI // paso objetivo en unidades de π
  const exp = Math.max(-2, Math.round(Math.log2(inPi))) // piso en π/4
  return Math.pow(2, exp) * Math.PI
}

// Líneas menores en π: una subdivisión (la mitad). π/2 → menores en π/4.
function piSubdivisions(_step: number): number {
  return 2
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// Etiqueta un tick como múltiplo exacto de π. `step` es 2^e·π, así que value/π es
// una fracción racional: se reduce y se formatea (π/2, 3π/2, -π, 2π…).
function formatPiTick(value: number, step: number): string {
  const stepInPi = step / Math.PI // 0.25, 0.5, 1, 2, 4…
  const stepNum = stepInPi < 1 ? 1 : Math.round(stepInPi)
  const stepDen = stepInPi < 1 ? Math.round(1 / stepInPi) : 1
  const n = Math.round(value / step) // índice del tick (puede ser negativo)
  let num = n * stepNum
  let den = stepDen
  const g = gcd(Math.abs(num), den) || 1
  num /= g
  den /= g
  const sign = num < 0 ? "-" : ""
  const a = Math.abs(num)
  const coef = a === 1 ? "" : String(a)
  return den === 1 ? `${sign}${coef}π` : `${sign}${coef}π/${den}`
}

// Returns tick positions snapped to the step grid (keeping fractional values when
// zoomed in — Math.round would collapse e.g. 0.2 and 0.4 onto the same integer,
// producing duplicate React keys and wrong labels). Index n avoids FP drift.
function axisTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = []
  const startN = Math.floor(min / step)
  const endN = Math.ceil(max / step)
  for (let n = startN; n <= endN; n++) {
    if (n !== 0) ticks.push(n * step)
  }
  return ticks
}

// Runs inside <Mafs> — has access to the live viewport via usePaneContext.
// Grid, ticks, and the function plot all update dynamically as the user pans/zooms.
function GraphContent({
  fn,
  widthPx,
  heightPx,
  piX,
}: {
  fn: RealFn
  widthPx: number
  heightPx: number
  piX: boolean
}) {
  const { xPaneRange, yPaneRange } = usePaneContext()
  const [xMin, xMax] = xPaneRange
  const [yMin, yMax] = yPaneRange

  // xPaneRange comes from quantized panes (it grows in discrete chunks while
  // panning), so it can't drive step selection — that's what made the grid jump
  // at specific pan positions. viewTransform[0] is px-per-math-unit on x, which
  // pan only translates (never rescales): it changes on zoom and on nothing else.
  const { viewTransform } = useTransformContext()
  const pxPerUnit = viewTransform[0]
  const pxPerUnitY = Math.abs(viewTransform[4])
  const xRange = widthPx / pxPerUnit
  const density = piX ? PI_GRID_DENSITY : GRID_DENSITY
  const naturalStep = piX ? piStep(xRange) : niceStep(xRange)

  // Hysteresis: only commit a new step when xRange is clearly past the transition
  // boundary (±5%), preventing oscillation from FP noise at exact boundary values.
  const stepRef = useRef(naturalStep)
  if (naturalStep !== stepRef.current) {
    const goingUp = naturalStep > stepRef.current
    const threshold = goingUp
      ? density * stepRef.current * 1.05
      : density * naturalStep * 0.95
    if (goingUp ? xRange > threshold : xRange < threshold) {
      stepRef.current = naturalStep
    }
  }
  const xStep = stepRef.current
  const xSubdivisions = piX ? piSubdivisions(xStep) : niceSubdivisions(xStep)

  // El eje y siempre es decimal (amplitud), con su propio paso según su rango.
  // En vistas cuadradas 1:1 coincide con el de x; en sinusoides (anchas) queda
  // con marcas decimales mientras x va en π. Misma histéresis que x (mismo
  // problema de panes cuantizados), usando el alto en px en vez del ancho.
  const yRange = heightPx / pxPerUnitY
  const naturalYStep = niceStep(yRange)
  const yStepRef = useRef(naturalYStep)
  if (naturalYStep !== yStepRef.current) {
    const goingUp = naturalYStep > yStepRef.current
    const threshold = goingUp
      ? GRID_DENSITY * yStepRef.current * 1.05
      : GRID_DENSITY * naturalYStep * 0.95
    if (goingUp ? yRange > threshold : yRange < threshold) {
      yStepRef.current = naturalYStep
    }
  }
  const yStep = yStepRef.current
  const ySubdivisions = niceSubdivisions(yStep)

  const margin = (yMax - yMin) * 0.1
  const lo = yMin - margin
  const hi = yMax + margin

  // Split the visible x-range into continuous branches to avoid bridging across
  // discontinuities (asymptotes, domain gaps). Recomputed on every viewport change.
  //
  // A per-point visibility test alone isn't enough: near a vertical asymptote the
  // function can jump from a large positive value to a large negative one (or vice
  // versa) between two adjacent coarse samples, and both samples can individually
  // land inside [lo, hi] (e.g. +3.9 then -3.9 inside a [-4, 4] view). Treating those
  // as the same run draws a straight line bridging the pole. So a run is also cut
  // when the jump between consecutive samples is large relative to the visible
  // height, even if both points are individually "visible".
  const branches = useMemo<[number, number][]>(() => {
    const N = 300
    const step = (xMax - xMin) / N
    const heightRange = hi - lo
    const xs: number[] = []
    const ys: number[] = []
    const visible: boolean[] = []
    for (let i = 0; i <= N; i++) {
      const x = xMin + i * step
      const y = fn(x)
      xs.push(x)
      ys.push(y)
      visible.push(Number.isFinite(y) && y >= lo && y <= hi)
    }
    const runs: [number, number][] = []
    let start = -1
    for (let i = 0; i <= N; i++) {
      const jumpFromPrev =
        i > 0 && visible[i - 1] && visible[i] && Math.abs(ys[i] - ys[i - 1]) > heightRange * 0.5
      if (visible[i] && !jumpFromPrev) {
        if (start === -1) start = i
      } else {
        if (start !== -1) runs.push([xs[Math.max(0, start - 1)], xs[i - 1]])
        start = visible[i] ? i : -1
      }
    }
    if (start !== -1) runs.push([xs[Math.max(0, start - 1)], xs[N]])
    return runs
  }, [fn, xMin, xMax, lo, hi])

  const xTicks = axisTicks(xMin, xMax, xStep)
  const yTicks = axisTicks(yMin, yMax, yStep)

  // Lattice points: integer x where f(x) is also an integer, marked as a dot in
  // the line color so the student can read exact points the line passes through.
  // Only while the integer grid is the actual grid (step <= 1); zoomed out they'd
  // crowd together and add no value.
  const lattice = useMemo<[number, number][]>(() => {
    if (piX || xStep > 1) return []
    const pts: [number, number][] = []
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const y = fn(x)
      if (!Number.isFinite(y)) continue
      const yr = Math.round(y)
      if (Math.abs(y - yr) < 1e-6 && yr >= yMin && yr <= yMax) {
        pts.push([x, yr])
      }
    }
    return pts
  }, [fn, xMin, xMax, yMin, yMax, piX, xStep])

  return (
    <>
      <Coordinates.Cartesian
        xAxis={{ lines: xStep, labels: false, subdivisions: xSubdivisions }}
        yAxis={{ lines: yStep, labels: false, subdivisions: ySubdivisions }}
      />
      {xTicks.map((v) => {
        const label = piX ? formatPiTick(v, xStep) : formatTick(v, xStep)
        const t = TICK_PX / pxPerUnitY
        return (
          <g key={`x-${label}`}>
            <Line.Segment point1={[v, -t]} point2={[v, t]} color={AXIS_COLOR} weight={1} />
            <Text
              x={v}
              y={0}
              size={8}
              color={AXIS_COLOR}
              svgTextProps={{ dominantBaseline: "hanging", dy: LABEL_GAP }}
            >
              {label}
            </Text>
          </g>
        )
      })}
      {yTicks.map((v) => {
        const label = formatTick(v, yStep)
        const t = TICK_PX / pxPerUnit
        return (
          <g key={`y-${label}`}>
            <Line.Segment point1={[-t, v]} point2={[t, v]} color={AXIS_COLOR} weight={1} />
            <Text x={0} y={v} attach="w" attachDistance={LABEL_GAP} size={8} color={AXIS_COLOR}>
              {label}
            </Text>
          </g>
        )
      })}
      {branches.map(([d0, d1], k) => (
        <Plot.OfX
          key={k}
          y={fn}
          domain={[d0, d1]}
          color={LINE_COLOR}
          weight={2}
          minSamplingDepth={12}
          maxSamplingDepth={20}
        />
      ))}
      {lattice.map(([x, y]) => (
        <Point key={`pt-${x}-${y}`} x={x} y={y} color={LINE_COLOR} svgCircleProps={{ r: 2 }} />
      ))}
    </>
  )
}

export default function MathGraph({
  graphFn,
  graphView,
}: {
  graphFn: string
  graphView?: unknown[] | null
}) {
  const fn = useMemo(() => buildFn(graphFn), [graphFn])
  const piX = useMemo(() => isAngleTrig(graphFn), [graphFn])
  const [resetKey, setResetKey] = useState(0)
  const [locked, setLocked] = useState(true)
  const infoUnseen = useGraphInfoUnseen()

  const [xmin, xmax, ymin, ymax] = toView(graphView)

  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(BOX_W)
  const [height, setHeight] = useState(210)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      setWidth(el.clientWidth)
      setHeight(Math.round((el.clientWidth * BOX_H) / BOX_W))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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
      className="math-graph relative overflow-hidden rounded-md border bg-white"
      // Evita que arrastrar/pellizcar el gráfico dispare el swipe de "siguiente
      // ejercicio" (drag="x" en el motion.div ancestro de session-runner.tsx).
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Mafs
        key={resetKey}
        height={height}
        viewBox={{ x: [xmin, xmax], y: [ymin, ymax] }}
        pan={!locked}
        zoom={locked ? false : { min: 0.3, max: 6 }}
      >
        <GraphContent fn={fn} widthPx={width} heightPx={height} piX={piX} />
      </Mafs>

      <div className="absolute top-2 right-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setLocked((v) => !v)}
          className="p-1 text-gray-400 transition-colors hover:text-gray-600"
          title={locked ? "Desbloquear (mover y hacer zoom)" : "Bloquear"}
        >
          {locked ? <Lock size={13} fill="white" /> : <LockOpen size={13} fill="white" />}
        </button>
        <button
          type="button"
          onClick={() => setResetKey((k) => k + 1)}
          className="p-1 text-gray-400 transition-colors hover:text-gray-600"
          title="Volver al inicio"
        >
          <Home size={13} fill="white" />
        </button>
        <Dialog>
          <DialogTrigger
            aria-label="Cómo mover el gráfico"
            onClick={markGraphInfoSeen}
            className="relative p-1 text-gray-400 outline-none transition-colors hover:text-gray-600"
          >
            <Info size={13} fill="white" />
            {infoUnseen && (
              <span
                aria-hidden
                className="absolute right-1 top-1 block rounded-full ring-1 ring-background"
                style={{ width: 3, height: 3, backgroundColor: "#EC4869" }}
              />
            )}
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader className="gap-0.5">
              <DialogTitle className="font-sans text-sm font-semibold text-foreground">
                Gráficos
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-foreground/80">
                Tocá el <Lock size={12} className="inline align-middle" /> para desbloquear el{" "}
                <strong className="font-semibold text-foreground">movimiento</strong> y el{" "}
                <strong className="font-semibold text-foreground">zoom</strong> del gráfico. Volvé
                a tocarlo para bloquearlo.
                <br />
                Tocá el <Home size={12} className="inline align-middle" /> para{" "}
                <strong className="font-semibold text-foreground">restablecer</strong> la vista
                original.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
