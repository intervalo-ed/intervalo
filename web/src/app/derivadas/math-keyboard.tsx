"use client"

// Teclado del juego. No es solo un input: es la heurística que dice qué hacer,
// así que mostrar todo el vocabulario matemático de golpe abruma en vez de
// ayudar. Son dos zonas:
//
//   · Un bloque FIJO que nunca cambia de forma — numérico a la derecha (con el
//     borrar-todo a la izquierda del 0 y el retroceso a su derecha), las cuatro
//     operaciones al centro, y paréntesis y flechas a la izquierda.
//   · Una fila DINÁMICA arriba con lo que ESTE ejercicio necesita más un par de
//     distractores de la misma familia. La calcula el backend a partir de la
//     derivada esperada (backend/game/keyboard.py) y viene en `keys`.
//
// La fila conserva su alto aunque venga vacía: si el teclado cambiara de tamaño
// entre ejercicios, todo lo de abajo saltaría.
//
// El color va por rol y no de adorno: la misma operación tiene siempre el mismo
// color, así la vista la encuentra sin leer.
//
// El teclado físico sigue funcionando en paralelo (lo maneja MathLive).

import { ArrowLeft, ArrowRight, Delete } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import type { MathInputHandle } from "./math-input"

type Key = {
  label: React.ReactNode
  insert?: string
  cmd?: string
  action?: "clear"
  // Color del glifo. El fondo es siempre el mismo: teñir la tecla entera
  // convertiría el teclado en un semáforo.
  tone?: keyof typeof TONES
}

const TONES = {
  plain: "text-foreground",
  add: "text-[#4ADE80]",
  sub: "text-[#F87171]",
  unknown: "text-[#C084FC]",
  mul: "text-[#60A5FA]",
  paren: "text-[#FBBF24]",
  nav: "text-[#94A3B8]",
  clear: "text-[#FBBF24]",
  erase: "text-[#F87171]",
  dynamic: "text-[#7DD3FC]",
} as const

const K = (label: React.ReactNode, insert: string): Key => ({ label, insert })

// Cajita punteada de los labels, como los placeholders de GeoGebra.
function Box() {
  return (
    <span
      aria-hidden
      className="inline-block h-[0.55em] w-[0.55em] rounded-[2px] border border-dotted border-current opacity-70"
    />
  )
}

// Izquierda: lo que estructura la expresión y lo que mueve el cursor.
const LEFT: Key[] = [
  { label: "(", insert: "(", tone: "paren" },
  { label: ")", insert: ")", tone: "paren" },
  { label: <ArrowLeft size={18} />, cmd: "moveToPreviousChar", tone: "nav" },
  { label: <ArrowRight size={18} />, cmd: "moveToNextChar", tone: "nav" },
]

// Centro: la incógnita y las cuatro operaciones.
const CENTER: Key[] = [
  { label: <i>x</i>, insert: "x", tone: "unknown" },
  { label: "+", insert: "+", tone: "add" },
  { label: "−", insert: "-", tone: "sub" },
  { label: "·", insert: "\\cdot", tone: "mul" },
]

const NUMPAD: Key[] = [
  K("7", "7"), K("8", "8"), K("9", "9"),
  K("4", "4"), K("5", "5"), K("6", "6"),
  K("1", "1"), K("2", "2"), K("3", "3"),
  { label: "C", action: "clear", tone: "clear" },
  K("0", "0"),
  { label: <Delete size={19} />, cmd: "deleteBackward", tone: "erase" },
]

// Vocabulario dinámico. Las claves son los ids que manda el backend; cualquier
// id desconocido se ignora, así agregar teclas en v2 no rompe clientes viejos.
const DYNAMIC: Record<string, Key> = {
  pow: {
    label: <span className="inline-flex items-baseline"><Box /><sup className="text-[0.6em]"><Box /></sup></span>,
    insert: "#@^{#?}",
  },
  sq: {
    label: <span className="inline-flex items-baseline"><Box /><sup className="text-[0.6em]">2</sup></span>,
    insert: "#@^{2}",
  },
  sqrt: { label: <span>√<Box /></span>, insert: "\\sqrt{#?}" },
  frac: { label: "÷", insert: "\\frac{#?}{#?}" },
  e: { label: <i>e</i>, insert: "e" },
  expx: {
    label: <span className="inline-flex items-baseline"><i>e</i><sup className="text-[0.6em]"><Box /></sup></span>,
    insert: "e^{#?}",
  },
  ln: { label: "ln", insert: "\\ln\\left(#?\\right)" },
  log: {
    label: <span>log<sub className="text-[0.6em]"><Box /></sub></span>,
    insert: "\\log_{#?}\\left(#?\\right)",
  },
  sen: { label: "sen", insert: "\\operatorname{sen}\\left(#?\\right)" },
  cos: { label: "cos", insert: "\\cos\\left(#?\\right)" },
  tg: { label: "tg", insert: "\\operatorname{tg}\\left(#?\\right)" },
}

// Ancho de la fila dinámica, en columnas. Tiene que coincidir con MAX_KEYS de
// backend/game/keyboard.py.
const DYNAMIC_COLS = 7

// Alto mínimo de fila del bloque fijo: blanco cómodo para el pulgar.
const ROW_MIN = "2.5rem"

const KEY_CLASS =
  "flex select-none items-center justify-center rounded-md bg-background text-[1.15rem] leading-none transition-colors active:bg-accent"

export function MathKeyboard({
  input,
  keys = [],
  className,
}: {
  input: React.RefObject<MathInputHandle | null>
  keys?: string[]
  className?: string
}) {
  const sfx = useSfx()

  const press = (key: Key) => {
    sfx.select()
    if (key.action === "clear") {
      input.current?.clear()
      input.current?.focus()
      return
    }
    if (key.cmd) input.current?.command(key.cmd)
    else if (key.insert) input.current?.insert(key.insert)
  }

  const button = (
    key: Key,
    id: string,
    opts?: { className?: string; style?: React.CSSProperties },
  ) => (
    <button
      key={id}
      type="button"
      // El mousedown robaría el foco del mathfield y el insert iría a la nada:
      // se previene y el click hace el trabajo.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => press(key)}
      style={opts?.style}
      className={cn(KEY_CLASS, TONES[key.tone ?? "plain"], opts?.className)}
    >
      {key.label}
    </button>
  )

  const dynamic = keys.map((id) => DYNAMIC[id]).filter(Boolean)
  // Centradas dentro de la fila: así el tamaño de tecla no depende de cuántas
  // haya, que es lo que las haría cambiar de forma entre ejercicios.
  const firstCol = Math.floor((DYNAMIC_COLS - dynamic.length) / 2) + 1

  // `minmax(ROW_MIN, 1fr)` y no `1fr` pelado: en el teléfono el teclado va en
  // flujo natural (sin alto que repartir) y con 1fr las filas colapsarían a
  // cero; en escritorio hay alto de sobra y crecen.
  const tallRows = { gridTemplateRows: `repeat(2, minmax(calc(${ROW_MIN} * 2), 1fr))` }
  const numRows = { gridTemplateRows: `repeat(4, minmax(${ROW_MIN}, 1fr))` }

  return (
    <div className={cn("flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2", className)}>
      <div
        className="grid h-10 shrink-0 gap-1.5"
        style={{ gridTemplateColumns: `repeat(${DYNAMIC_COLS}, minmax(0, 1fr))` }}
      >
        {dynamic.map((key, i) =>
          button({ ...key, tone: "dynamic" }, `dyn-${keys[i]}`, {
            style: { gridColumnStart: firstCol + i },
          }),
        )}
      </div>
      <div className="flex min-h-0 flex-1 gap-1.5">
        {/* Los bloques laterales van a doble alto contra las cuatro filas del
            numérico: así los tres miden lo mismo y las teclas más usadas tienen
            el blanco más grande. */}
        <div className="grid flex-[2] grid-cols-2 gap-1.5" style={tallRows}>
          {LEFT.map((key, i) => button(key, `left-${i}`))}
        </div>
        <div className="grid flex-[2] grid-cols-2 gap-1.5" style={tallRows}>
          {CENTER.map((key, i) => button(key, `center-${i}`))}
        </div>
        <div className="grid flex-[3] grid-cols-3 gap-1.5" style={numRows}>
          {NUMPAD.map((key, i) => button(key, `num-${i}`, { className: "text-[1.25rem]" }))}
        </div>
      </div>
    </div>
  )
}
