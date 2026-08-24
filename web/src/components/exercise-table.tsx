"use client"

import { motion, useReducedMotion } from "motion/react"
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"

import MathText from "@/components/math-text"

// El ancho se compara antes de pintar, así el pulso nace ya con el alcance
// correcto. En SSR no hay layout que medir y useLayoutEffect avisaría por
// consola, así que ahí cae a useEffect (se resuelve una vez, al cargar el
// módulo: no es un hook condicional).
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

// Tabla de datos embebida en el enunciado. La columna derivada se rellena con
// los valores precalculados de la opción confirmada, así el error se ve en vez
// de explicarse. Ver authoring-context.md, sección Tablas.
//
// El contenido viene del JSON de autoría y llega tipado como Record<string,
// unknown> (el schema generado no modela el objeto), así que se parsea a la
// defensiva igual que graph_view/graph_shade en math-graph.tsx: cualquier forma
// inesperada devuelve null y el ejercicio se renderiza sin tabla en vez de
// romper la sesión entera.

type Cell = string | null
type Column = { icon: string | null; label: string | null }
type RevealColumn = { header: string | null; cells: Cell[] }

type Reveal =
  | { mode: "column"; col: number; byOption: (RevealColumn | null)[] }
  | { mode: "cell"; at: [number, number]; byOption: Cell[] }

type ParsedTable = { columns: Column[]; rows: Cell[][]; reveal: Reveal | null }

const EMPTY = "—"

// La columna marcada usa el MISMO color que la opción que la produjo en
// OptionsArea, así el resultado del feedback y la tabla se leen como una sola
// respuesta y no como dos señales distintas. Los hex salen de session-runner:
// naranja al errar, verde al acertar de una, lima al acertar después de fallar.
export type TableTone = "wrong" | "correct" | "retry"

const TONES: Record<TableTone, { ring: string; tint: string; pulse: string }> = {
  wrong: { ring: "#E3690B", tint: "rgba(227, 105, 11, 0.12)", pulse: "rgba(227, 105, 11, 0.46)" },
  correct: { ring: "#22c55e", tint: "rgba(34, 197, 94, 0.10)", pulse: "rgba(34, 197, 94, 0.40)" },
  retry: { ring: "#D9F99D", tint: "rgba(217, 249, 157, 0.10)", pulse: "rgba(217, 249, 157, 0.36)" },
}

// Revelado: al confirmar late lo que cambió, y el contenido nuevo emerge
// mientras ese latido se desvanece. El pulso es el acuse de recibo del click,
// así que va primero; el número no entra por su cuenta, aparece dentro del
// pulso.
//
// Alcance del pulso, en este orden de prioridad:
//   1. si la columna cambió de ancho              -> columna entera
//   2. si la opción recalcula la columna entera   -> columna entera
//   3. si la opción recalcula una sola celda      -> solo esa celda
// La regla 1 pisa a la 3: cuando una celda se ensancha, lo que se movió en
// pantalla fue la columna, y el pulso tiene que cubrir eso.
//
// Nada de esto anima ancho ni alto: solo opacidad y color.
const PULSE = 0.45
const CONTENT_DELAY = 0.1 // el pico del pulso
const CONTENT_FADE = 0.25 // emerge mientras el pulso cae

function asCell(v: unknown): Cell {
  return typeof v === "string" ? v : null
}

function parseColumns(raw: unknown): Column[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out: Column[] = []
  for (const c of raw) {
    if (typeof c !== "object" || c === null) return null
    const { icon, label } = c as Record<string, unknown>
    out.push({ icon: asCell(icon), label: asCell(label) })
  }
  return out
}

function parseRows(raw: unknown, width: number): Cell[][] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out: Cell[][] = []
  for (const row of raw) {
    if (!Array.isArray(row) || row.length !== width) return null
    out.push(row.map(asCell))
  }
  return out
}

function parseReveal(raw: unknown, width: number, height: number): Reveal | null {
  if (typeof raw !== "object" || raw === null) return null
  const { mode, col, at, by_option: byOption } = raw as Record<string, unknown>
  if (!Array.isArray(byOption)) return null

  if (mode === "column") {
    const c = typeof col === "number" ? col : 1
    if (c < 0 || c >= width) return null
    const parsed = byOption.map((entry) => {
      if (typeof entry !== "object" || entry === null) return null
      const { header, cells } = entry as Record<string, unknown>
      if (!Array.isArray(cells) || cells.length !== height) return null
      return { header: asCell(header), cells: cells.map(asCell) }
    })
    return { mode: "column", col: c, byOption: parsed }
  }

  if (mode === "cell") {
    if (!Array.isArray(at) || at.length !== 2) return null
    const [r, c] = at
    if (typeof r !== "number" || typeof c !== "number") return null
    if (r < 0 || r >= height || c < 0 || c >= width) return null
    return { mode: "cell", at: [r, c], byOption: byOption.map(asCell) }
  }

  return null
}

export function parseTable(raw: unknown): ParsedTable | null {
  if (typeof raw !== "object" || raw === null) return null
  const { columns, rows, reveal } = raw as Record<string, unknown>
  const cols = parseColumns(columns)
  if (!cols) return null
  const parsedRows = parseRows(rows, cols.length)
  if (!parsedRows) return null
  return {
    columns: cols,
    rows: parsedRows,
    reveal: parseReveal(reveal, cols.length, parsedRows.length),
  }
}

// Aplica lo que revela la opción `revealIndex` sobre el estado inicial. Antes de
// confirmar, revealIndex es null y se ve la tabla tal como viene del JSON.
function applyReveal(
  table: ParsedTable,
  revealIndex: number | null,
): { headers: Cell[]; rows: Cell[][]; litColumn: number | null; litCell: [number, number] | null } {
  const headers = table.columns.map((c) => c.label)
  const rows = table.rows.map((r) => [...r])
  const { reveal } = table
  if (reveal === null || revealIndex === null) {
    return { headers, rows, litColumn: null, litCell: null }
  }

  if (reveal.mode === "column") {
    const entry = reveal.byOption[revealIndex]
    if (!entry) return { headers, rows, litColumn: null, litCell: null }
    headers[reveal.col] = entry.header
    entry.cells.forEach((cell, r) => {
      rows[r][reveal.col] = cell
    })
    return { headers, rows, litColumn: reveal.col, litCell: null }
  }

  const [r, c] = reveal.at
  rows[r][c] = reveal.byOption[revealIndex] ?? null
  return { headers, rows, litColumn: null, litCell: [r, c] }
}

// El marco de la columna/celda marcada se dibuja con box-shadow inset y no con
// `border`: un borde real ocuparía un píxel más y correría el ancho de la
// columna justo cuando el alumno confirma, que es el momento en que la tabla
// tiene que quedarse quieta.
function ringShadow(
  ring: string,
  { top, bottom }: { top: boolean; bottom: boolean },
): string {
  const parts = [`inset 1px 0 0 0 ${ring}`, `inset -1px 0 0 0 ${ring}`]
  if (top) parts.push(`inset 0 1px 0 0 ${ring}`)
  if (bottom) parts.push(`inset 0 -1px 0 0 ${ring}`)
  return parts.join(", ")
}

// Criterio de tamaño, y son dos reglas distintas:
//
// - **La altura NUNCA cambia.** Un `—` mide menos que un número renderizado por
//   KaTeX, así que al revelar la columna las filas crecían unos píxeles y las
//   opciones de abajo se corrían justo en el momento en que el alumno está
//   mirando el resultado. Cada celda fija su alto con un contenedor propio, así
//   la fila no puede crecer por su contenido.
// - **El ancho SÍ se adapta a la opción elegida.** Reservar de entrada el ancho
//   del candidato más largo delata que alguna opción es larga: una columna
//   ancha con un `—` adentro es información que el alumno no debería tener.
//   Cada columna arranca en lo mínimo y se ensancha recién cuando hay algo que
//   mostrar.
//
// Alturas fijas por tipo de celda. Un encabezado con fracción (`\dfrac{n!}{...}`)
// necesita más alto que uno de una palabra, y esa decisión se toma una sola vez
// mirando TODOS los encabezados posibles: dentro de un mismo ejercicio el alto
// es constante aunque el encabezado cambie al confirmar.
const ROW_H = "h-10"
const HEAD_H = "h-9"
const HEAD_H_TALL = "h-12"

// Mismo criterio que TALL_LATEX en math-text.tsx: LaTeX que crece en vertical.
const TALL_LATEX = /\\(d|t)?frac|\\binom|\\sqrt|\\sum|\\int|\\over/

function headerNeedsRoom(table: ParsedTable): boolean {
  const candidates = table.columns.map((c) => c.label ?? "")
  if (table.reveal?.mode === "column") {
    for (const entry of table.reveal.byOption) candidates.push(entry?.header ?? "")
  }
  return candidates.some((t) => TALL_LATEX.test(t))
}

export default function ExerciseTable({
  table: raw,
  revealIndex,
  tone = "correct",
}: {
  table: unknown
  revealIndex: number | null
  tone?: TableTone
}) {
  const reduceMotion = useReducedMotion()
  // Sonda de ancho: se cuelga de una celda de la columna que se revela. Se
  // guarda el ancho de cada render y, cuando llega el revelado, se compara
  // contra el del render anterior para saber si la columna se ensanchó.
  const probeRef = useRef<HTMLTableCellElement | null>(null)
  const prevWidthRef = useRef<number | null>(null)
  const [widthChanged, setWidthChanged] = useState(false)

  useIsomorphicLayoutEffect(() => {
    const width = probeRef.current?.getBoundingClientRect().width ?? null
    if (revealIndex === null) setWidthChanged(false)
    else if (prevWidthRef.current !== null && width !== null) {
      setWidthChanged(Math.abs(width - prevWidthRef.current) > 0.5)
    }
    prevWidthRef.current = width
  }, [revealIndex])

  const table = parseTable(raw)
  if (!table) return null

  const { ring, tint, pulse } = TONES[tone]

  const { headers, rows, litColumn, litCell } = applyReveal(table, revealIndex)
  const lastRow = rows.length - 1

  const isLit = (r: number, c: number) =>
    litColumn === c || (litCell !== null && litCell[0] === r && litCell[1] === c)

  // `r === -1` es la fila de encabezado.
  const cellStyle = (r: number, c: number) => {
    if (!isLit(r, c)) return undefined
    const shadow =
      litCell !== null
        ? `inset 0 0 0 1px ${ring}`
        : ringShadow(ring, { top: r === -1, bottom: r === lastRow })
    return { background: tint, boxShadow: shadow }
  }

  const divider = (r: number, c: number) =>
    [
      c < table.columns.length - 1 ? "border-r border-white/10" : "",
      r < lastRow ? "border-b border-white/10" : "",
    ].join(" ")

  const headHeight = headerNeedsRoom(table) ? HEAD_H_TALL : HEAD_H

  const pulseColumn =
    table.reveal === null
      ? null
      : table.reveal.mode === "column"
        ? table.reveal.col
        : table.reveal.at[1]

  const animating = revealIndex !== null && !reduceMotion
  // Regla 2 (la opción recalcula la columna) o regla 1 (la columna se ensanchó).
  const pulseWholeColumn = table.reveal?.mode === "column" || widthChanged

  const pulses = (r: number, c: number) => {
    if (!animating || c !== pulseColumn) return false
    if (pulseWholeColumn) return true
    return litCell !== null && litCell[0] === r && litCell[1] === c
  }

  // El alto vive en este contenedor y no en la celda: en una tabla, `height`
  // sobre un `td` es un mínimo y el contenido igual la estira. Un div con alto
  // fijo no se estira, así que la fila queda clavada.
  const box = (height: string, r: number, c: number, children: ReactNode) => (
    <div className={`relative flex ${height} items-center justify-end px-3.5`}>
      {/* El `key` es lo que hace que la animación vuelva a correr en cada
          confirmación. Sin él, el elemento ya está montado desde el primer
          intento y `initial`/`animate` no se disparan de nuevo: al errar por
          segunda vez el valor cambiaba, pero sin pulso ni fundido. */}
      {pulses(r, c) && (
        <motion.span
          key={`pulse-${revealIndex}`}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={{ backgroundColor: ["rgba(0,0,0,0)", pulse, "rgba(0,0,0,0)"] }}
          transition={{ duration: PULSE, times: [0, 0.22, 1], ease: "easeOut" }}
        />
      )}
      {animating && isLit(r, c) ? (
        <motion.span
          key={`content-${revealIndex}`}
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: CONTENT_FADE, delay: CONTENT_DELAY, ease: "easeOut" }}
        >
          {children}
        </motion.span>
      ) : (
        children
      )}
    </div>
  )

  return (
    <div className="mx-auto w-fit max-w-full overflow-hidden rounded-md border border-white/10 bg-white/5">
      <table className="w-auto border-separate border-spacing-0 text-right tabular-nums">
        <thead>
          <tr>
            {table.columns.map((col, c) => (
              <th
                key={c}
                scope="col"
                className={
                  "min-w-14 p-0 text-sm font-normal leading-none text-foreground/60 " +
                  divider(-1, c)
                }
                style={cellStyle(-1, c)}
              >
                {box(
                  headHeight,
                  -1,
                  c,
                  <>
                    {headers[c] ? <MathText text={headers[c]!} /> : EMPTY}
                    {/* La separación va por margen y no por un espacio de
                        texto: un espacio depende de la fuente y quedaba pegado
                        contra la palabra. */}
                    {col.icon && (
                      <span aria-hidden className="ml-2">
                        {col.icon}
                      </span>
                    )}
                  </>,
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td
                  key={c}
                  // La sonda va en la primera fila de la columna que se revela:
                  // en una tabla todas las celdas de una columna comparten
                  // ancho, así que alcanza con medir una.
                  ref={r === 0 && c === pulseColumn ? probeRef : undefined}
                  className={
                    "min-w-14 p-0 text-base leading-none " + divider(r, c)
                  }
                  style={cellStyle(r, c)}
                >
                  {box(
                    ROW_H,
                    r,
                    c,
                    cell ? (
                      <MathText text={cell} />
                    ) : (
                      <span className="text-foreground/30">{EMPTY}</span>
                    ),
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
