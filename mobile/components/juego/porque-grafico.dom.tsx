"use dom"

// El gráfico de f y f' del «¿Por qué?», con mafs adentro de un DOM component
// (un WebView propio). Es la misma cuenta que web/src/components/math-graph.tsx
// —ejes, grilla y ramas salen de dx-core (grafico/math-graph-calc.ts)— recortada
// a lo que el juego usa: dos curvas, sin Piecewise ni sombreado, y fijo (sin
// pan ni zoom: adentro de un ScrollView nativo el gesto es del scroll).
//
// Las f vienen como las imprime sympy y se leen con grafico/expresion.ts: la
// web usa mathjs, que acá no está y pesa medio mega.

import "mafs/core.css"
import { Coordinates, Line, Mafs, Plot, Point, Text, usePaneContext, useTransformContext } from "mafs"
import { useEffect, useMemo } from "react"
import type { DOMProps } from "expo/dom"
import { compilarExpresion } from "@intervalo/dx-core/grafico/expresion"
import {
  GRID_DENSITY,
  PI_GRID_DENSITY,
  axisTicks,
  computeBranches,
  computeLattice,
  formatPiTick,
  formatTick,
  isAngleTrig,
  niceStep,
  niceSubdivisions,
  piStep,
  piSubdivisions,
  toView,
  type RealFn,
} from "@intervalo/dx-core/grafico/math-graph-calc"
import { AXIS_COLOR, LINE_COLOR, SECOND_LINE_COLOR } from "@intervalo/dx-core/grafico/math-graph-colors"
import { useSteppedRange } from "@intervalo/dx-core/grafico/UseSteppedRange"

const TICK_PX = 1.5
const LABEL_GAP = 7

// Las variables de mafs que la web pisa en globals.css (`.math-graph .MafsView`).
const CSS = `
html, body { margin: 0; padding: 0; background: #ffffff; overflow: hidden; }
.MafsView {
  --mafs-bg: #ffffff;
  --mafs-fg: #6b7280;
  --mafs-origin-color: #9ca3af;
  --mafs-line-color: rgba(100, 116, 139, 0.22);
  --grid-line-subdivision-color: rgba(100, 116, 139, 0.1);
  font-family: -apple-system, system-ui, sans-serif;
}
.MafsView text { font-size: 8px; }
`

function Curvas({
  fn,
  fn2,
  widthPx,
  heightPx,
  piX,
}: {
  fn: RealFn
  fn2: RealFn | null
  widthPx: number
  heightPx: number
  piX: boolean
}) {
  const { xPaneRange, yPaneRange } = usePaneContext()
  const [xMin, xMax] = xPaneRange
  const [yMin, yMax] = yPaneRange
  const { viewTransform } = useTransformContext()
  const pxPerUnit = viewTransform[0]
  const pxPerUnitY = Math.abs(viewTransform[4])
  const xRange = widthPx / pxPerUnit
  const yRange = heightPx / pxPerUnitY

  // Aspecto libre (`graphFreeAspect` en la web): cada eje elige su paso.
  const density = piX ? PI_GRID_DENSITY : GRID_DENSITY
  const xStep = useSteppedRange(piX ? piStep(xRange) : niceStep(xRange), xRange, density)
  const xSubdivisions = piX ? piSubdivisions(xStep) : niceSubdivisions(xStep)
  const yStep = useSteppedRange(niceStep(yRange), yRange, GRID_DENSITY)
  const ySubdivisions = niceSubdivisions(yStep)

  const margin = (yMax - yMin) * 0.1
  const lo = yMin - margin
  const hi = yMax + margin

  const branches = useMemo(() => computeBranches(fn, [], xMin, xMax, lo, hi), [fn, xMin, xMax, lo, hi])
  const branches2 = useMemo(
    () => (fn2 ? computeBranches(fn2, [], xMin, xMax, lo, hi) : []),
    [fn2, xMin, xMax, lo, hi],
  )
  const gridEsEntera = !piX && xStep <= 1
  const lattice = useMemo(
    () => (gridEsEntera ? computeLattice(fn, xMin, xMax, yMin, yMax) : []),
    [fn, xMin, xMax, yMin, yMax, gridEsEntera],
  )
  const lattice2 = useMemo(
    () => (fn2 && gridEsEntera ? computeLattice(fn2, xMin, xMax, yMin, yMax) : []),
    [fn2, xMin, xMax, yMin, yMax, gridEsEntera],
  )

  return (
    <>
      <Coordinates.Cartesian
        xAxis={{ lines: xStep, labels: false, subdivisions: xSubdivisions }}
        yAxis={{ lines: yStep, labels: false, subdivisions: ySubdivisions }}
      />
      {axisTicks(xMin, xMax, xStep).map((v) => {
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
      {axisTicks(yMin, yMax, yStep).map((v) => {
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
      {fn2 &&
        branches2.map(([d0, d1], k) => (
          <Plot.OfX
            key={`2-${k}`}
            y={fn2}
            domain={[d0, d1]}
            color={SECOND_LINE_COLOR}
            weight={2}
            minSamplingDepth={12}
            maxSamplingDepth={20}
          />
        ))}
      {lattice.map(([x, y]) => (
        <Point key={`pt-${x}-${y}`} x={x} y={y} color={LINE_COLOR} svgCircleProps={{ r: 2 }} />
      ))}
      {lattice2.map(([x, y]) => (
        <Point key={`pt2-${x}-${y}`} x={x} y={y} color={SECOND_LINE_COLOR} svgCircleProps={{ r: 2 }} />
      ))}
    </>
  )
}

export default function PorQueGrafico({
  fn,
  fn2,
  view,
  ancho,
  alto,
  onListo,
}: {
  fn: string
  fn2: string
  view: number[]
  // El tamaño lo decide el lado nativo (un alto fijo por aspecto): con
  // `matchContents` el WebView se mide mal.
  ancho: number
  alto: number
  // Acción nativa: avisa cuando el gráfico ya está pintado (para sacar el
  // hueco de carga y para medir). `ok: false` si la f no se pudo leer.
  onListo?: (info: { ok: boolean; ms: number }) => Promise<void>
  dom?: DOMProps
}) {
  const f = useMemo(() => compilarExpresion(fn), [fn])
  const f2 = useMemo(() => compilarExpresion(fn2), [fn2])
  const piX = useMemo(() => isAngleTrig(fn), [fn])
  const [xmin, xmax, ymin, ymax] = toView(view)

  useEffect(() => {
    requestAnimationFrame(() => {
      void onListo?.({ ok: f !== null, ms: performance.now() })
    })
    // Una vez por gráfico: el aviso es "ya se ve", no "cambió algo".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, fn2])

  return (
    <>
      <style>{CSS}</style>
      {f ? (
        <Mafs
          width={ancho}
          height={alto}
          viewBox={{ x: [xmin, xmax], y: [ymin, ymax] }}
          pan={false}
          zoom={false}
          preserveAspectRatio={false}
        >
          <Curvas fn={f} fn2={f2} widthPx={ancho} heightPx={alto} piX={piX} />
        </Mafs>
      ) : (
        <div style={{ padding: 16, fontSize: 14, color: "#6b7280" }}>No se pudo graficar: {fn}</div>
      )}
    </>
  )
}
