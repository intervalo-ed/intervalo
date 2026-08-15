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
// Sombreado con signo (analisis/brown/integrals/definite, "lectura-area-con-
// signos"): la parte de graph_shade que queda arriba del eje x usa LINE_COLOR,
// la que queda abajo usa este segundo color, para que el signo del área se
// distinga de un vistazo sin que el estudiante tenga que inferirlo del gráfico
// pelado. Ver authoring-context.md, sección Gráficos.
const SHADE_NEGATIVE_COLOR = "#dc4444"
const SHADE_OPACITY = 0.18
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

type PieceBound = { x: number; included: boolean }
type PieceDomain =
  | { kind: "point"; x: number }
  | { kind: "excludePoint"; x: number }
  | { kind: "left"; bound: PieceBound }
  | { kind: "right"; bound: PieceBound }
  | { kind: "range"; lo: PieceBound; hi: PieceBound }
  | null
type PieceMarker = { x: number; y: number; closed: boolean }

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

// Solo cubre comparaciones simples contra una constante (x < c, x >= c, ...) y su
// combinación en un rango acotado ((x >= a) & (x < b)) — las únicas formas que
// aparecen en el contenido real (Piecewise en backend/content). Cualquier otra
// forma devuelve null: esa pieza no genera corte forzado ni marcador, y queda
// sujeta solo al heurístico de salto por magnitud (asíntotas).
const SIMPLE_COND = /^x\s*(<=|>=|==|!=|<|>)\s*(-?\d+(?:\.\d+)?)$/

function parseSimpleCond(cond: string): { op: string; c: number } | null {
  const m = cond.trim().match(SIMPLE_COND)
  return m ? { op: m[1], c: Number(m[2]) } : null
}

function parseCondDomain(cond: string): PieceDomain {
  const trimmed = cond.trim()
  const simple = parseSimpleCond(trimmed)
  if (simple) {
    const { op, c } = simple
    switch (op) {
      case "==":
        return { kind: "point", x: c }
      case "!=":
        return { kind: "excludePoint", x: c }
      case "<":
        return { kind: "left", bound: { x: c, included: false } }
      case "<=":
        return { kind: "left", bound: { x: c, included: true } }
      case ">":
        return { kind: "right", bound: { x: c, included: false } }
      case ">=":
        return { kind: "right", bound: { x: c, included: true } }
      default:
        return null
    }
  }
  const compound = trimmed.match(/^\(([^()]*)\)\s*&\s*\(([^()]*)\)$/)
  if (!compound) return null
  const a = parseSimpleCond(compound[1])
  const b = parseSimpleCond(compound[2])
  if (!a || !b) return null
  const lower = a.op === ">" || a.op === ">=" ? a : b.op === ">" || b.op === ">=" ? b : null
  const upper = a.op === "<" || a.op === "<=" ? a : b.op === "<" || b.op === "<=" ? b : null
  if (!lower || !upper || lower === upper) return null
  return {
    kind: "range",
    lo: { x: lower.c, included: lower.op === ">=" },
    hi: { x: upper.c, included: upper.op === "<=" },
  }
}

// Extremos de cada pieza vía límite lateral numérico (fn(borde ± eps)) en vez de
// evaluar exactamente en el borde: cubre por igual piezas comunes, agujeros
// evitables tipo (x²-4)/(x-2) (límite finito aunque fn(2) dé NaN) y expr="None"
// (NaN vía el catch existente de toRealFn → sin marcador, gratis).
const MARKER_EPS = 1e-4

function buildPieceMarkers(
  pieces: { expr: string; cond: string }[],
  realExprs: RealFn[],
): { boundaryXs: number[]; markers: PieceMarker[] } {
  const boundaryXs: number[] = []
  const raw: PieceMarker[] = []
  pieces.forEach((p, idx) => {
    const domain = parseCondDomain(p.cond)
    if (!domain) return
    const fn = realExprs[idx]
    if (domain.kind === "point") {
      boundaryXs.push(domain.x)
      const y = fn(domain.x)
      if (Number.isFinite(y)) raw.push({ x: domain.x, y, closed: true })
    } else if (domain.kind === "excludePoint") {
      boundaryXs.push(domain.x)
      const yLeft = fn(domain.x - MARKER_EPS)
      const yRight = fn(domain.x + MARKER_EPS)
      if (Number.isFinite(yLeft)) raw.push({ x: domain.x, y: yLeft, closed: false })
      if (Number.isFinite(yRight)) raw.push({ x: domain.x, y: yRight, closed: false })
    } else if (domain.kind === "left") {
      boundaryXs.push(domain.bound.x)
      const y = fn(domain.bound.x - MARKER_EPS)
      if (Number.isFinite(y)) raw.push({ x: domain.bound.x, y, closed: domain.bound.included })
    } else if (domain.kind === "right") {
      boundaryXs.push(domain.bound.x)
      const y = fn(domain.bound.x + MARKER_EPS)
      if (Number.isFinite(y)) raw.push({ x: domain.bound.x, y, closed: domain.bound.included })
    } else if (domain.kind === "range") {
      boundaryXs.push(domain.lo.x, domain.hi.x)
      const yLo = fn(domain.lo.x + MARKER_EPS)
      const yHi = fn(domain.hi.x - MARKER_EPS)
      if (Number.isFinite(yLo)) raw.push({ x: domain.lo.x, y: yLo, closed: domain.lo.included })
      if (Number.isFinite(yHi)) raw.push({ x: domain.hi.x, y: yHi, closed: domain.hi.included })
    }
  })
  // Los valores de y vienen de un límite ± MARKER_EPS, así que dos marcadores del
  // "mismo" punto matemático (ej. límite izq/der de un agujero evitable, o el
  // empalme de dos piezas realmente continuas) casi nunca coinciden en el bit
  // exacto — hace falta una tolerancia numérica, no comparar strings. Los saltos
  // pedagógicos reales son de varias unidades, muy por encima de MERGE_TOL.
  const MERGE_TOL = 1e-2
  const clusterByY = (items: PieceMarker[]): PieceMarker[] => {
    const clusters: { x: number; y: number; n: number }[] = []
    for (const m of items) {
      const c = clusters.find((cl) => Math.abs(cl.y - m.y) < MERGE_TOL)
      if (c) {
        c.y = (c.y * c.n + m.y) / (c.n + 1)
        c.n++
      } else {
        clusters.push({ x: m.x, y: m.y, n: 1 })
      }
    }
    return clusters.map((c) => ({ x: c.x, y: c.y, closed: items[0]?.closed ?? false }))
  }

  const byX = new Map<number, PieceMarker[]>()
  for (const m of raw) {
    const group = byX.get(m.x) ?? []
    group.push(m)
    byX.set(m.x, group)
  }
  const markers: PieceMarker[] = []
  for (const group of byX.values()) {
    const closed = clusterByY(group.filter((m) => m.closed))
    const open = clusterByY(group.filter((m) => !m.closed)).filter(
      (o) => !closed.some((c) => Math.abs(c.y - o.y) < MERGE_TOL),
    )
    markers.push(...closed, ...open)
  }
  return { boundaryXs: [...new Set(boundaryXs)], markers }
}

// Pure-angle trig (x es un ángulo en radianes) → eje x en múltiplos de π. Los
// trig "aplicados" (x = tiempo/meses: 311*sin(100*pi*x), 10*sin(pi/12*(x-6))+20)
// siempre llevan `pi` en la fórmula y deben quedar con grilla decimal.
function isAngleTrig(graphFn: string): boolean {
  return /\b(sin|cos|tan)\b/.test(graphFn) && !/\bpi\b/i.test(graphFn)
}

type GraphBuild = { fn: RealFn; boundaryXs: number[]; markers: PieceMarker[] }

function buildFn(graphFn: string): GraphBuild | null {
  const pieces = parsePiecewise(graphFn)
  if (pieces) {
    const compiled = pieces.map((p) => ({
      expr: compileFn(p.expr),
      cond: compileFn(p.cond),
    }))
    if (compiled.some((c) => !c.expr || !c.cond)) return null
    const realExprs = compiled.map((c) => toRealFn(c.expr!))
    const boolConds = compiled.map((c) => toBoolFn(c.cond!))
    const fn: RealFn = (x: number) => {
      for (let k = 0; k < boolConds.length; k++) {
        if (boolConds[k](x)) return realExprs[k](x)
      }
      return NaN
    }
    const { boundaryXs, markers } = buildPieceMarkers(pieces, realExprs)
    return { fn, boundaryXs, markers }
  }
  const code = compileFn(graphFn)
  return code ? { fn: toRealFn(code), boundaryXs: [], markers: [] } : null
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

function toShade(graphShade: unknown[] | null | undefined): [number, number] | null {
  if (
    Array.isArray(graphShade) &&
    graphShade.length === 2 &&
    graphShade.every((v) => typeof v === "number" && Number.isFinite(v))
  ) {
    const [a, b] = graphShade as [number, number]
    return a <= b ? [a, b] : [b, a]
  }
  return null
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

// Histéresis: solo se cambia de paso cuando el rango pasa claramente el umbral
// de transición (±5%), para que el ruido de FP no lo haga oscilar justo en el
// valor límite.
function useSteppedRange(naturalStep: number, range: number, density: number): number {
  const ref = useRef(naturalStep)
  if (naturalStep !== ref.current) {
    const goingUp = naturalStep > ref.current
    const threshold = goingUp ? density * ref.current * 1.05 : density * naturalStep * 0.95
    if (goingUp ? range > threshold : range < threshold) {
      ref.current = naturalStep
    }
  }
  return ref.current
}

// Runs inside <Mafs> — has access to the live viewport via usePaneContext.
// Grid, ticks, and the function plot all update dynamically as the user pans/zooms.
function GraphContent({
  fn,
  boundaryXs,
  markers,
  widthPx,
  heightPx,
  piX,
  freeAspect,
  shade,
}: {
  fn: RealFn
  boundaryXs: number[]
  markers: PieceMarker[]
  widthPx: number
  heightPx: number
  piX: boolean
  freeAspect: boolean
  shade: [number, number] | null
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
  const yRange = heightPx / pxPerUnitY

  // Con aspecto fijo (el default) ambos ejes tienen la MISMA escala en px por
  // unidad, así que la grilla tiene que ser cuadrada: un solo paso para los
  // dos. Dejar que cada eje eligiera el suyo a partir de su propio rango los
  // desfasaba apenas uno cruzaba un escalón de la escalera 1-2-5 y el otro no
  // — y los rangos SIEMPRE difieren, porque Mafs con preserveAspectRatio
  // "contain" estira el eje más corto hasta llenar la caja (480x420). Ej. real:
  // view [-1,6,-1,12] termina en xSpan 16 / ySpan 14, que con GRID_DENSITY=15
  // caen a cada lado del umbral (16/15 > 1 → paso 2; 14/15 < 1 → paso 1) y
  // dejaban celdas rectangulares de 2x1 con x etiquetado de 2 en 2 e y de 1 en 1.
  // Se toma el rango más chico para que el paso compartido sea el más fino de
  // los dos candidatos (ningún eje queda con la grilla más rala de lo que su
  // propio rango pediría; en px la separación es idéntica en ambos).
  //
  // Aspecto libre: las escalas son genuinamente distintas y cada eje elige el
  // suyo. Ídem eje x en π (sinusoides): es otra escala a propósito.
  const squareGrid = !freeAspect && !piX
  const xStepRange = squareGrid ? Math.min(xRange, yRange) : xRange
  const yStepRange = squareGrid ? Math.min(xRange, yRange) : yRange

  const density = piX ? PI_GRID_DENSITY : GRID_DENSITY
  const xStep = useSteppedRange(
    piX ? piStep(xStepRange) : niceStep(xStepRange),
    xStepRange,
    density,
  )
  const xSubdivisions = piX ? piSubdivisions(xStep) : niceSubdivisions(xStep)

  const yStep = useSteppedRange(niceStep(yStepRange), yStepRange, GRID_DENSITY)
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
    // Afina el borde de una rama: entre la última muestra que se ve y la
    // primera que no, busca por bisección el punto donde la curva sale de la
    // vista. Es lo que reemplaza al paso atrás de una muestra entera que había
    // antes: ese paso metía el dominio del OTRO lado de la asíntota (con
    // 1/(x²-4) en x∈[-7,7] la rama del medio arrancaba en x=-2.0067, donde
    // f=+37), y Mafs dibujaba la recta que la cruzaba de punta a punta.
    const outside = (x: number) => {
      const y = fn(x)
      return !(Number.isFinite(y) && y >= lo && y <= hi)
    }
    const refineEdge = (xIn: number, xOut: number) => {
      let b = xOut
      // Cuando el corte vino por salto, la asíntota quedó ENTRE dos muestras
      // que las dos se ven (con 1/(x²-4) las vecinas del polo dan +9.31 y
      // -3.19, ambas dentro de la vista). Bisecar directo contra `xOut` puede
      // cruzar el polo y devolver un borde del otro lado, o sea el puente de
      // nuevo: primero hay que avanzar desde `xIn` hasta encontrar por dónde
      // se va la curva, y recién ahí bisecar.
      if (!outside(b)) {
        let found = false
        for (let k = 1; k < 16; k++) {
          const m = xIn + ((xOut - xIn) * k) / 16
          if (outside(m)) {
            b = m
            found = true
            break
          }
        }
        if (!found) return xIn
      }
      let a = xIn
      for (let k = 0; k < 24; k++) {
        const m = (a + b) / 2
        if (outside(m)) b = m
        else a = m
      }
      // `b` queda apenas fuera de la vista y del mismo lado que `a`: la rama
      // llega justo al borde y Mafs la recorta ahí.
      return b
    }

    const idxRuns: [number, number][] = []
    let start = -1
    for (let i = 0; i <= N; i++) {
      const jumpFromPrev =
        i > 0 && visible[i - 1] && visible[i] && Math.abs(ys[i] - ys[i - 1]) > heightRange * 0.5
      if (visible[i] && !jumpFromPrev) {
        if (start === -1) start = i
      } else {
        if (start !== -1) idxRuns.push([start, i - 1])
        start = visible[i] ? i : -1
      }
    }
    if (start !== -1) idxRuns.push([start, N])

    const runs: [number, number][] = idxRuns.map(([a, b]) => [
      a === 0 ? xs[0] : refineEdge(xs[a], xs[a - 1]),
      b === N ? xs[N] : refineEdge(xs[b], xs[b + 1]),
    ])

    // Corte forzado en cada borde de pieza del piecewise, independiente del salto
    // de altura: el heurístico de arriba es un fallback para asíntotas, no la vía
    // principal para separar ramas de un Piecewise (ver math-graph.tsx AGENTS/plan).
    const cutXs = boundaryXs.filter((x) => x > xMin && x < xMax)
    if (cutXs.length === 0) return runs
    const cutEps = (xMax - xMin) * 1e-5
    return runs.flatMap(([s, e]) => {
      let segs: [number, number][] = [[s, e]]
      for (const cx of cutXs) {
        segs = segs.flatMap(([a, b]) =>
          cx > a && cx < b
            ? ([[a, cx - cutEps], [cx + cutEps, b]] as [number, number][])
            : ([[a, b]] as [number, number][]),
        )
      }
      return segs
    })
  }, [fn, xMin, xMax, lo, hi, boundaryXs])

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
      {shade && (
        <>
          {/* Parte positiva: entre 0 y f(x) donde f(x) >= 0. Fuera de
              [shade[0], shade[1]] ambos bordes colapsan a 0 y no se rellena
              nada (mismo truco de clamp que ya usaba el sombreado simple). */}
          <Plot.Inequality
            y={{
              "<=": (x: number) => (x >= shade[0] && x <= shade[1] ? Math.max(fn(x), 0) : 0),
              ">=": 0,
            }}
            fillColor={LINE_COLOR}
            fillOpacity={SHADE_OPACITY}
            upperOpacity={0}
            lowerOpacity={0}
          />
          {/* Parte negativa: entre f(x) y 0 donde f(x) < 0. Sin este segundo
              Inequality, mafs deja de rellenar apenas f(x) cruza el eje
              (upper < lower con solo el positivo de arriba) y el área bajo
              el eje queda sin ninguna marca visual. */}
          <Plot.Inequality
            y={{
              "<=": 0,
              ">=": (x: number) => (x >= shade[0] && x <= shade[1] ? Math.min(fn(x), 0) : 0),
            }}
            fillColor={SHADE_NEGATIVE_COLOR}
            fillOpacity={SHADE_OPACITY}
            upperOpacity={0}
            lowerOpacity={0}
          />
        </>
      )}
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
      {markers
        .filter((m) => m.x >= xMin && m.x <= xMax && m.y >= lo && m.y <= hi)
        .map((m) => (
          <Point
            key={`b-${m.x}-${m.y}-${m.closed}`}
            x={m.x}
            y={m.y}
            color={LINE_COLOR}
            svgCircleProps={
              m.closed
                ? { r: 3 }
                : { r: 3, style: { fill: "#ffffff", stroke: LINE_COLOR, strokeWidth: 1.2 } }
            }
          />
        ))}
    </>
  )
}

export default function MathGraph({
  graphFn,
  graphView,
  graphShade,
  graphFreeAspect,
}: {
  graphFn: string
  graphView?: unknown[] | null
  graphShade?: unknown[] | null
  graphFreeAspect?: boolean | null
}) {
  const build = useMemo(() => buildFn(graphFn), [graphFn])
  const piX = useMemo(() => isAngleTrig(graphFn), [graphFn])
  const shade = useMemo(() => toShade(graphShade), [graphShade])
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

  // El motion.div ancestro (drag="x" en session-runner.tsx) engancha su propio
  // pointerdown nativo directo sobre ese nodo. React solo despacha su
  // onPointerDown sintético cuando el evento nativo YA llegó a la raíz de la
  // app — es decir, después de haber pasado por (y disparado) el listener del
  // motion.div. Un onPointerDownCapture tampoco sirve: al ser sintético de
  // React también se dispatchea desde la raíz, y frenarlo ahí corta el evento
  // antes de que baje a los elementos internos de Mafs (rompe el pan propio
  // del gráfico). La única forma de frenarlo justo antes del motion.div, sin
  // afectar a Mafs, es un listener nativo puesto a mano en este nodo — corre
  // en el orden real del DOM, después de los descendientes (Mafs) y antes de
  // los ancestros (motion.div).
  //
  // Solo se frena desbloqueado: ahí el gráfico tiene que quedarse con el touch
  // para su propio pan/zoom. Bloqueado, Mafs ya tiene pan/zoom deshabilitados
  // (no consume el touch), así que dejamos el evento seguir de largo hacia el
  // motion.div — scroll vertical nativo y swipe horizontal de ejercicio deben
  // comportarse igual que tocando cualquier otra parte de la tarjeta.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const stop = (e: PointerEvent) => {
      if (!locked) e.stopPropagation()
    }
    el.addEventListener("pointerdown", stop)
    return () => el.removeEventListener("pointerdown", stop)
  }, [locked])

  if (!build) {
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
    >
      <Mafs
        key={resetKey}
        height={height}
        viewBox={{ x: [xmin, xmax], y: [ymin, ymax] }}
        pan={!locked}
        zoom={locked ? false : { min: 0.3, max: 6 }}
        preserveAspectRatio={graphFreeAspect ? false : "contain"}
      >
        <GraphContent
          fn={build.fn}
          boundaryXs={build.boundaryXs}
          markers={build.markers}
          widthPx={width}
          heightPx={height}
          piX={piX}
          freeAspect={!!graphFreeAspect}
          shade={shade}
        />
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
