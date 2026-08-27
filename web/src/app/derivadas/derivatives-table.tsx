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

import { motion } from "motion/react"
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

// Alto fijo de renglón. Sin él, un renglón con fracción (1/2√x) mide más que
// uno con un 0 pelado, y las dos tablitas de funciones —que van una al lado de
// la otra— terminarían con los renglones corridos entre sí.
const ROW_H = "2.9rem"

// Una tablita: dos columnas, función y derivada. Nada de meter dos pares por
// renglón en la misma grilla — así se veía antes y sin separación entre pares
// las cuatro columnas se leían como una sola tabla ancha en la que no se
// entendía qué derivada correspondía a qué función.
function Tabla({ filas, titulo }: { filas: Fila[]; titulo: string }) {
  const celda = "flex items-center justify-center px-2 text-center leading-none"
  return (
    // `shrink-0` no es cosmético: como ítem flex del scroller, la tabla se
    // dejaba comprimir y, con `overflow-hidden`, se recortaba sus propias filas
    // en silencio — el scroller ni se enteraba de que había contenido de más, y
    // los últimos renglones simplemente no existían.
    <div className="shrink-0 overflow-hidden rounded-md border border-white/10">
      <div className="grid grid-cols-2 bg-white/[0.07] text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="border-r border-white/10 py-1">{titulo}</div>
        <div className="py-1">derivada</div>
      </div>
      {filas.map((fila) => (
        <div key={fila.f} className="grid grid-cols-2 border-t border-white/10">
          <div
            className={cn(celda, "border-r border-white/10 text-foreground/80")}
            style={{ minHeight: ROW_H }}
          >
            <MathText text={`$${fila.f}$`} />
          </div>
          <div className={celda} style={{ minHeight: ROW_H }}>
            <MathText text={`$${fila.d}$`} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Tres cajas separadas y no una grilla de cuatro columnas: las funciones en dos
// tablitas lado a lado —partidas por mitades, así leyendo la izquierda entera y
// después la derecha el orden se mantiene— y las reglas abajo, a lo ancho, con
// un renglón cada una. Las reglas son las fórmulas más largas de la tabla y
// apretadas en media card no se leían.
const MITAD = Math.ceil(FILAS.length / 2)

export function DerivativesTable() {
  return (
    // Scrollea adentro: en una ventana baja la tabla no tiene que empujar la
    // card ni salirse por abajo.
    <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto text-[0.9rem]">
      <div className="grid shrink-0 grid-cols-2 gap-2">
        <Tabla filas={FILAS.slice(0, MITAD)} titulo="función" />
        <Tabla filas={FILAS.slice(MITAD)} titulo="función" />
      </div>
      <Tabla filas={REGLAS} titulo="regla" />
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

// El volteo. Las dos caras viven superpuestas dentro de un contenedor que gira
// en 3D: la de atrás nace ya girada 180°, así que al girar el contenedor queda
// derecha y la de adelante se va.
//
// `backfaceVisibility: hidden` en las dos es lo que evita ver la cara de atrás
// espejada durante el giro. Y el `perspective` va en un contenedor APARTE del
// que rota: si van juntos, el navegador aplica la perspectiva antes de la
// rotación y el giro se ve plano.
//
// Se probó reemplazarlo por una persiana (translateY, sin 3D) y se volvió acá a
// propósito: el volteo es el gesto que se quiere. Si alguna vez se ve plano o
// espejado, la causa casi seguro es un ancestro nuevo con overflow, filter u
// opacity —cualquiera de los tres aplana el contexto 3D—; el arreglo es sacar
// esa propiedad del camino, no cambiar la animación.
const FLIP_S = 0.5

export function FlipCard({
  flipped,
  front,
  back,
  className,
}: {
  flipped: boolean
  front: React.ReactNode
  back: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("relative", className)} style={{ perspective: 1600 }}>
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: FLIP_S, ease: [0.32, 0.72, 0.24, 1] }}
      >
        {/* `inert` en la cara que no se ve: si no, se puede tabular hasta el
            campo de respuesta que está del otro lado de la card. */}
        <div
          className="flex h-full w-full flex-col"
          style={{ backfaceVisibility: "hidden" }}
          inert={flipped}
        >
          {front}
        </div>
        <div
          className="absolute inset-0 flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          inert={!flipped}
        >
          {back}
        </div>
      </motion.div>
    </div>
  )
}
