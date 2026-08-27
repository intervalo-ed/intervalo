"use client"

// La tabla de derivadas: el dorso de la card del ejercicio. Se da vuelta con el
// botón del header o manteniendo Ctrl (ver desktop-layout.tsx).
//
// Las filas son las funciones que el juego SIRVE, no una tabla genérica de
// libro: cada plantilla de backend/game/templates.py tiene su renglón acá y
// nada más. Las de la foto que el juego nunca pide —|x|, la raíz n-ésima— no
// están: en una tabla que se mira contrarreloj, un renglón que no va a hacer
// falta es una fila más para descartar con la vista.
//
// Las dos reglas de abajo no son decoración: los tiers 4 y 5 son productos y
// cocientes, y sin ellas la tabla no sirve justo donde más se la necesita.

import { Fragment } from "react"
import { motion, useReducedMotion } from "motion/react"
import { Table2 as TableIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import MathText from "@/components/math-text"
import { KeyCap } from "./exercise-card"

type Fila = { f: string; d: string }

const FILAS: Fila[] = [
  { f: "a", d: "0" },
  { f: "x", d: "1" },
  { f: "x^n", d: "n\\,x^{n-1}" },
  { f: "\\frac{1}{x}", d: "-\\frac{1}{x^{2}}" },
  { f: "\\sqrt{x}", d: "\\frac{1}{2\\sqrt{x}}" },
  { f: "e^{x}", d: "e^{x}" },
  { f: "a^{x}", d: "a^{x}\\ln a" },
  { f: "\\ln x", d: "\\frac{1}{x}" },
  { f: "\\log_a x", d: "\\frac{1}{x\\ln a}" },
  { f: "\\operatorname{sen} x", d: "\\cos x" },
  { f: "\\cos x", d: "-\\operatorname{sen} x" },
  { f: "\\operatorname{tg} x", d: "\\frac{1}{\\cos^{2} x}" },
]

const REGLAS: Fila[] = [
  { f: "u \\cdot v", d: "u'v + uv'" },
  { f: "\\frac{u}{v}", d: "\\frac{u'v - uv'}{v^{2}}" },
]

// `columnas` es cuántos pares función/derivada entran por renglón. Con dos, la
// tabla de funciones mide la mitad de alto y usa el ancho de la card, que si no
// queda desperdiciado: en una columna sola las doce filas no entraban ni
// volteando el teclado, y las últimas se perdían.
//
// El reparto es por mitades y no alternado: leyendo la columna izquierda de
// arriba abajo y después la derecha, el orden de la tabla se mantiene.
function Tabla({
  filas,
  titulo,
  columnas = 1,
}: {
  filas: Fila[]
  titulo: string
  columnas?: number
}) {
  const porColumna = Math.ceil(filas.length / columnas)
  const renglones = Array.from({ length: porColumna }, (_, i) =>
    Array.from({ length: columnas }, (_, c) => filas[c * porColumna + i]),
  )
  const grid = { gridTemplateColumns: `repeat(${columnas * 2}, minmax(0, 1fr))` }

  return (
    // `shrink-0` no es cosmético: como ítem flex del scroller, la tabla se
    // dejaba comprimir y, con `overflow-hidden`, se recortaba sus propias filas
    // en silencio — el scroller ni se enteraba de que había contenido de más, y
    // los últimos renglones simplemente no existían.
    <div className="shrink-0 overflow-hidden rounded-md border border-white/10">
      <div
        className="grid bg-white/[0.07] text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground"
        style={grid}
      >
        {Array.from({ length: columnas }, (_, c) => (
          <Fragment key={c}>
            <div className="border-r border-white/10 py-1">{titulo}</div>
            <div className={c < columnas - 1 ? "border-r border-white/10 py-1" : "py-1"}>
              derivada
            </div>
          </Fragment>
        ))}
      </div>
      {renglones.map((renglon, i) => (
        <div
          key={i}
          className="grid border-t border-white/10 text-center leading-none"
          style={grid}
        >
          {renglon.map((fila, c) => (
            // `leading-none` y el `py` a mano: el interlineado por defecto de
            // KaTeX está pensado para texto corrido y acá infla cada renglón.
            // Con el alto bajo control, este padding es lo que decide cuánto
            // respira la tabla.
            <Fragment key={c}>
              <div className="border-r border-white/10 px-2 py-[11px] text-foreground/80">
                {fila && <MathText text={`$${fila.f}$`} />}
              </div>
              <div
                className={cn(
                  "px-2 py-[11px]",
                  c < columnas - 1 && "border-r border-white/10",
                )}
              >
                {fila && <MathText text={`$${fila.d}$`} />}
              </div>
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  )
}

export function DerivativesTable() {
  return (
    // Scrollea adentro: en una ventana baja la tabla no tiene que empujar la
    // card ni salirse por abajo.
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto text-[0.9rem]">
      <Tabla filas={FILAS} titulo="función" columnas={2} />
      <Tabla filas={REGLAS} titulo="regla" columnas={2} />
    </div>
  )
}

// El botón de la cabecera. Con rótulo y no solo ícono —a diferencia de
// compartir— porque es el único de esa esquina que hace algo dentro del juego y
// que además cuesta: conviene que se entienda antes de tocarlo. El chip de la
// tecla es el mismo que el de Enter en el botón grande.
export function TableButton({
  open,
  onToggle,
  className,
}: {
  open: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={open ? "Volver al ejercicio" : "Ver la tabla de derivadas"}
      aria-pressed={open}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
        open
          ? "border-foreground/40 bg-accent text-foreground"
          : "border-border text-muted-foreground hover:bg-accent",
        className,
      )}
    >
      <TableIcon size={15} />
      Tabla
      <KeyCap>ctrl</KeyCap>
    </button>
  )
}

// La tabla baja desde el borde de arriba y tapa el ejercicio, como una persiana
// o una hoja de consulta que se despliega; al cerrarse sube y se va.
//
// Antes esto era un volteo 3D y se cambió por robustez, no por gusto:
// `preserve-3d` es de lo más frágil que hay en CSS —cualquier ancestro con
// overflow, filter u opacity aplana el contexto y el giro se ve plano o
// espejado— y esta card justamente tiene `overflow-hidden`. Acá lo único que se
// anima es un `translateY`, que es 2D, lo compone la GPU y no depende de ningún
// contexto de apilamiento.
//
// El recorte no lo pone este componente: lo hace el `overflow-hidden` que la
// card ya tenía, que es lo que esconde la tabla mientras está arriba.
const SLIDE_S = 0.42

export function PeekSheet({
  open,
  under,
  sheet,
  className,
}: {
  open: boolean
  // Lo que queda debajo (el ejercicio) y lo que baja encima (la tabla).
  under: React.ReactNode
  sheet: React.ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      {/* El ejercicio se queda quieto abajo: la persiana lo tapa, no lo empuja.
          `inert` mientras está tapado, si no se puede tabular hasta el campo de
          respuesta que quedó debajo de la tabla. */}
      <div className="flex h-full w-full flex-col" inert={open}>
        {under}
      </div>
      <motion.div
        className="absolute inset-0 flex flex-col"
        // `initial={false}`: al montar tiene que ESTAR arriba, no bajar sola.
        initial={false}
        animate={{ y: open ? "0%" : "-100%" }}
        transition={
          reduceMotion ? { duration: 0 } : { duration: SLIDE_S, ease: [0.32, 0.72, 0.24, 1] }
        }
        inert={!open}
      >
        {sheet}
      </motion.div>
    </div>
  )
}
