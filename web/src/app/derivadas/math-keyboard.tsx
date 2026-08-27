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
// Las teclas se dibujan con KaTeX, el mismo motor que compone el enunciado (ver
// components/math-text.tsx). No es un capricho tipográfico: con glifos de la
// fuente de interfaz, la `x` del teclado y la `x` de la fórmula son dos letras
// distintas, y el `·` y el `−` ni siquiera son los mismos caracteres que usa
// LaTeX. Escritas en KaTeX, la tecla y lo que aparece en el campo son la misma
// cosa, que es lo único que hace que el teclado se lea como matemática.
//
// El color va por rol y no de adorno: la misma operación tiene siempre el mismo
// color, así la vista la encuentra sin leer. La fila dinámica va en blanco —
// teñirla la separaba del resto sin que ese corte significara nada.
//
// El teclado físico sigue funcionando en paralelo (lo maneja MathLive).

import { useMemo } from "react"
import katex from "katex"
// Lo importa también math-text.tsx, y el bundler lo deduplica; va acá igual
// porque este módulo no debería depender de que otro haya cargado la hoja.
import "katex/dist/katex.min.css"
import { ArrowLeft, ArrowRight, Delete } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSfx } from "@/lib/audio/useSfx"
import type { MathInputHandle } from "./math-input"

type Key = {
  // LaTeX del glifo, o un nodo suelto para las teclas que no son matemática
  // (las flechas de navegación y el retroceso, que son acciones del editor).
  tex?: string
  node?: React.ReactNode
  insert?: string
  cmd?: string
  action?: "clear"
  // Color del glifo. El fondo es siempre el mismo: teñir la tecla entera
  // convertiría el teclado en un semáforo.
  tone?: keyof typeof TONES
  // Tamaño relativo del glifo. Los símbolos necesitan más cuerpo que los
  // dígitos para leerse igual de bien: en KaTeX un `+` ocupa mucho menos alto
  // que un `7`.
  size?: keyof typeof SIZES
}

// Color a media asta. Los tonos originales (#4ADE80, #F87171, #C084FC…) eran
// puros de paleta y al lado de un enunciado en KaTeX el teclado parecía de otra
// aplicación; bajarlos hasta el tinte casi blanco fue pasarse de largo y el rol
// de cada tecla dejaba de leerse. Esta franja —claridad ~68%, saturación ~55%—
// es la que conserva el color sin gritar.
const TONES = {
  plain: "text-foreground",
  add: "text-[#7ECE9F]",
  sub: "text-[#E08E85]",
  unknown: "text-[#B99CE2]",
  mul: "text-[#81AADA]",
  paren: "text-[#DCBA74]",
  // Las flechas no son matemática sino navegación: van con el tono que el tema
  // ya usa para todo lo secundario.
  nav: "text-muted-foreground",
  clear: "text-[#DCBA74]",
  erase: "text-[#E08E85]",
} as const

const SIZES = {
  sm: "text-[1.05rem]",
  md: "text-[1.25rem]",
  lg: "text-[1.5rem]",
  // Los dígitos, un punto más chicos en escritorio. En el teléfono se quedan
  // como estaban: ahí la tecla ya es chica y el número es lo único que la hace
  // legible de un vistazo.
  num: "text-[1.25rem] md:text-[1.1rem]",
} as const

// El HTML de KaTeX para un glifo depende solo del LaTeX, y el teclado repite
// las mismas teclas ejercicio tras ejercicio: se cachea a nivel módulo para no
// re-renderizar veinte fórmulas en cada cambio de ejercicio.
const GLYPH_CACHE = new Map<string, string>()

function glyph(tex: string): string {
  const cached = GLYPH_CACHE.get(tex)
  if (cached !== undefined) return cached
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: false })
  GLYPH_CACHE.set(tex, html)
  return html
}

// Hueco de los argumentos que faltan. `\square` es el mismo cuadrado hueco que
// usa la notación de libro para un lugar a completar.
const BOX = "\\square"

// Izquierda: lo que estructura la expresión y lo que mueve el cursor.
const LEFT: Key[] = [
  { tex: "(", insert: "(", tone: "paren", size: "lg" },
  { tex: ")", insert: ")", tone: "paren", size: "lg" },
  { node: <ArrowLeft size={19} />, cmd: "moveToPreviousChar", tone: "nav" },
  { node: <ArrowRight size={19} />, cmd: "moveToNextChar", tone: "nav" },
]

// Centro: la incógnita y las cuatro operaciones.
const CENTER: Key[] = [
  { tex: "x", insert: "x", tone: "unknown", size: "lg" },
  { tex: "+", insert: "+", tone: "add", size: "lg" },
  { tex: "-", insert: "-", tone: "sub", size: "lg" },
  { tex: "\\cdot", insert: "\\cdot", tone: "mul", size: "lg" },
]

const NUM = (d: string): Key => ({ tex: d, insert: d, size: "num" })

const CLEAR_KEY: Key = { tex: "\\mathrm{C}", action: "clear", tone: "clear" }

const NUMPAD: Key[] = [
  NUM("7"), NUM("8"), NUM("9"),
  NUM("4"), NUM("5"), NUM("6"),
  NUM("1"), NUM("2"), NUM("3"),
  { ...CLEAR_KEY, size: "num" },
  NUM("0"),
  { node: <Delete size={19} />, cmd: "deleteBackward", tone: "erase" },
]

// Vocabulario dinámico. Las claves son los ids que manda el backend; cualquier
// id desconocido se ignora, así agregar teclas en v2 no rompe clientes viejos.
const DYNAMIC: Record<string, Key> = {
  pow: { tex: `${BOX}^{${BOX}}`, insert: "#@^{#?}" },
  sq: { tex: `${BOX}^{2}`, insert: "#@^{2}" },
  sqrt: { tex: `\\sqrt{${BOX}}`, insert: "\\sqrt{#?}" },
  frac: { tex: `\\frac{${BOX}}{${BOX}}`, insert: "\\frac{#?}{#?}" },
  e: { tex: "e", insert: "e" },
  expx: { tex: `e^{${BOX}}`, insert: "e^{#?}" },
  ln: { tex: "\\ln", insert: "\\ln\\left(#?\\right)" },
  log: { tex: `\\log_{${BOX}}`, insert: "\\log_{#?}\\left(#?\\right)" },
  sen: { tex: "\\operatorname{sen}", insert: "\\operatorname{sen}\\left(#?\\right)" },
  cos: { tex: "\\cos", insert: "\\cos\\left(#?\\right)" },
  tg: { tex: "\\operatorname{tg}", insert: "\\operatorname{tg}\\left(#?\\right)" },
}

// Ancho de la fila dinámica, en columnas. Tiene que coincidir con MAX_KEYS de
// backend/game/keyboard.py.
const DYNAMIC_COLS = 7

// Alto de fila del bloque fijo, en una variable CSS porque cambia por tamaño de
// pantalla. En escritorio baja a 2.05rem: con teclas de doble alto a la
// izquierda y al centro, el bloque medía cuatro filas de blanco de más. En el
// teléfono se queda en 2.5rem — ahí no sobra alto, pero la tecla se toca con el
// pulgar y achicarla la vuelve imposible de acertar.
const ROW_MIN = "var(--kb-row)"
const ROW_VARS = "[--kb-row:2.5rem] md:[--kb-row:2.05rem]"

// La fila dinámica, en cambio, engorda: es la que cambia entre ejercicios y la
// que tiene los glifos más altos (fracciones, raíces, potencias).
const DYNAMIC_ROW = "2.75rem"

// Alto de la regleta que reemplaza al bloque fijo cuando no hay numérico. Igual
// que la fila dinámica: son dos tiras hermanas, no un pad.
const STRIP_ROW = "2.75rem"

// La regleta de escritorio: lo que queda del bloque fijo sin los dígitos. `C`
// sobrevive al numérico porque borrar todo de un saque no tiene equivalente en
// el teclado físico; el retroceso sí (la tecla Backspace), así que no está.
const STRIP: Key[] = [...CENTER, ...LEFT, CLEAR_KEY]

const KEY_CLASS =
  "flex select-none items-center justify-center rounded-md bg-background leading-none transition-colors active:bg-accent"

// KaTeX mete su propio tamaño (`.katex { font-size: 1.21em }`) y un poco de
// aire vertical pensado para texto corrido; acá el glifo tiene que ocupar la
// tecla y nada más.
const GLYPH_CLASS = "[&_.katex]:text-[1em] [&_.katex]:leading-none"

export function MathKeyboard({
  input,
  keys = [],
  numpad = true,
  className,
}: {
  input: React.RefObject<MathInputHandle | null>
  keys?: string[]
  // El numérico solo hace falta donde no hay teclado físico. En escritorio los
  // dígitos se tipean, y un pad de doce teclas para eso era la mitad del alto
  // del panel ocupada por lo más fácil de escribir. Lo que queda es lo que la
  // botonera aporta de verdad: lo que uno no sabe cómo escribir.
  numpad?: boolean
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
      className={cn(
        KEY_CLASS,
        SIZES[key.size ?? "md"],
        TONES[key.tone ?? "plain"],
        opts?.className,
      )}
    >
      {key.tex !== undefined ? (
        <span
          className={GLYPH_CLASS}
          dangerouslySetInnerHTML={{ __html: glyph(key.tex) }}
        />
      ) : (
        key.node
      )}
    </button>
  )

  const dynamic = useMemo(
    () =>
      keys
        // El id viaja junto a la tecla: un id desconocido se descarta, y si el
        // índice se leyera después contra `keys` la columna y la React key
        // quedarían corridas a partir de ahí.
        .map((id) => ({ id, key: DYNAMIC[id] }))
        .filter((entry) => entry.key !== undefined)
        // Los glifos compuestos (fracciones, raíces, potencias) se pasan de
        // alto contra la fila si van al mismo cuerpo que un dígito.
        .map((entry) => ({ id: entry.id, key: { ...entry.key, size: "sm" as const } })),
    [keys],
  )
  // Centradas dentro de la fila: así el tamaño de tecla no depende de cuántas
  // haya, que es lo que las haría cambiar de forma entre ejercicios.
  const firstCol = Math.floor((DYNAMIC_COLS - dynamic.length) / 2) + 1

  // `minmax(ROW_MIN, 1fr)` y no `1fr` pelado: en el teléfono el teclado va en
  // flujo natural (sin alto que repartir) y con 1fr las filas colapsarían a
  // cero; en escritorio hay alto de sobra y crecen.
  const tallRows = { gridTemplateRows: `repeat(2, minmax(calc(${ROW_MIN} * 2), 1fr))` }
  const numRows = { gridTemplateRows: `repeat(4, minmax(${ROW_MIN}, 1fr))` }

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2",
        ROW_VARS,
        className,
      )}
    >
      <div
        className="grid shrink-0 gap-1.5"
        style={{
          height: DYNAMIC_ROW,
          gridTemplateColumns: `repeat(${DYNAMIC_COLS}, minmax(0, 1fr))`,
        }}
      >
        {dynamic.map((entry, i) =>
          button(entry.key, `dyn-${entry.id}`, {
            style: { gridColumnStart: firstCol + i },
          }),
        )}
      </div>
      {numpad ? (
        <div className="flex min-h-0 flex-1 gap-1.5">
          {/* Los bloques laterales van a doble alto contra las cuatro filas del
              numérico: así los tres miden lo mismo y las teclas más usadas
              tienen el blanco más grande. */}
          <div className="grid flex-[2] grid-cols-2 gap-1.5" style={tallRows}>
            {LEFT.map((key, i) => button(key, `left-${i}`))}
          </div>
          <div className="grid flex-[2] grid-cols-2 gap-1.5" style={tallRows}>
            {CENTER.map((key, i) => button(key, `center-${i}`))}
          </div>
          <div className="grid flex-[3] grid-cols-3 gap-1.5" style={numRows}>
            {NUMPAD.map((key, i) => button(key, `num-${i}`))}
          </div>
        </div>
      ) : (
        // Sin numérico queda una regleta de una sola fila, no un pad. El orden
        // es por frecuencia: primero la incógnita y las operaciones, después los
        // paréntesis, y al final mover el cursor y borrar todo.
        <div
          className="grid shrink-0 gap-1.5"
          style={{
            height: STRIP_ROW,
            gridTemplateColumns: `repeat(${STRIP.length}, minmax(0, 1fr))`,
          }}
        >
          {STRIP.map((key, i) => button(key, `strip-${i}`))}
        </div>
      )}
    </div>
  )
}
