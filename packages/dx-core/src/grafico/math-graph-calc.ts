// La cuenta del gráfico de funciones (ejes, grilla, ramas continuas), sin
// mafs ni DOM. La usan web/src/components/math-graph.tsx y el gráfico del
// «¿Por qué?» de la app (mobile/components/juego/porque-grafico.dom.tsx), que
// dibujan cada uno con su mafs.

export type RealFn = (x: number) => number

const DEFAULT_VIEW: [number, number, number, number] = [-4, 4, -4, 4]

// Pure-angle trig (x es un ángulo en radianes) → eje x en múltiplos de π. Los
// trig "aplicados" (x = tiempo/meses: 311*sin(100*pi*x), 10*sin(pi/12*(x-6))+20)
// siempre llevan `pi` en la fórmula y deben quedar con grilla decimal.
export function isAngleTrig(graphFn: string): boolean {
  return /\b(sin|cos|tan)\b/.test(graphFn) && !/\bpi\b/i.test(graphFn)
}

export function toView(
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
export const GRID_DENSITY = 15

export function niceStep(range: number): number {
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
export function niceSubdivisions(step: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(step)))
  const norm = Math.round(step / magnitude) // 1, 2, or 5
  if (norm === 2) return 4
  return 5
}

// Formats a tick value with just enough decimals for the current step, then
// trims FP noise (0.30000000004 → "0.3"). Used for both the label and the key.
export function formatTick(value: number, step: number): string {
  const decimals = step < 1 ? Math.ceil(-Math.log10(step)) : 0
  return Number(value.toFixed(decimals)).toString()
}

// Eje x en π: densidad un poco menor que la decimal para que el paso ETIQUETADO
// caiga en π/2 en las vistas típicas (±5, ±6.5, ±7) y en π en las más anchas (±10).
export const PI_GRID_DENSITY = 8

// Paso mayor del eje x en una escalera de π: …, π/4, π/2, π, 2π, 4π, … (potencias
// de 2 por π). Se elige el peldaño que da ~PI_GRID_DENSITY intervalos en el rango.
export function piStep(range: number): number {
  if (range <= 0) return Math.PI
  const inPi = range / PI_GRID_DENSITY / Math.PI // paso objetivo en unidades de π
  const exp = Math.max(-2, Math.round(Math.log2(inPi))) // piso en π/4
  return Math.pow(2, exp) * Math.PI
}

// Líneas menores en π: una subdivisión (la mitad). π/2 → menores en π/4.
export function piSubdivisions(_step: number): number {
  return 2
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

// Etiqueta un tick como múltiplo exacto de π. `step` es 2^e·π, así que value/π es
// una fracción racional: se reduce y se formatea (π/2, 3π/2, -π, 2π…).
export function formatPiTick(value: number, step: number): string {
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
export function axisTicks(min: number, max: number, step: number): number[] {
  const ticks: number[] = []
  const startN = Math.floor(min / step)
  const endN = Math.ceil(max / step)
  for (let n = startN; n <= endN; n++) {
    if (n !== 0) ticks.push(n * step)
  }
  return ticks
}

// Split the visible x-range into continuous branches to avoid bridging across
// discontinuities (asymptotes, domain gaps).
//
// A per-point visibility test alone isn't enough: near a vertical asymptote the
// function can jump from a large positive value to a large negative one (or vice
// versa) between two adjacent coarse samples, and both samples can individually
// land inside [lo, hi] (e.g. +3.9 then -3.9 inside a [-4, 4] view). Treating those
// as the same run draws a straight line bridging the pole. So a run is also cut
// when the jump between consecutive samples is large relative to the visible
// height, even if both points are individually "visible".
//
// Función pura y no un hook: la usan dos curvas (f y, en /derivadas, f'), cada
// una con su propio `fn`/`boundaryXs` pero la MISMA vista — sacarla de
// `GraphContent` evita duplicar las ~90 líneas de detección de asíntotas.
export function computeBranches(
  fn: RealFn,
  boundaryXs: number[],
  xMin: number,
  xMax: number,
  lo: number,
  hi: number,
): [number, number][] {
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
}

// Integer x where fn(x) is also an integer, marked as a dot in the line color
// so the student can read exact points the curve passes through. Sacada de
// `GraphContent` por la misma razón que `computeBranches`: la usan las dos
// curvas (f y, en /derivadas, f'), cada una con su propio `fn` pero la MISMA
// grilla entera.
export function computeLattice(
  fn: RealFn,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): [number, number][] {
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
}
