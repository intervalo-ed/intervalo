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
import { cn } from "@/lib/utils"
import MathText from "@/components/math-text"

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

function Tabla({ filas, titulo }: { filas: Fila[]; titulo: string }) {
  return (
    <div className="overflow-hidden rounded-md border border-white/10">
      <div className="grid grid-cols-2 bg-white/[0.07] text-center text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
        <div className="border-r border-white/10 py-1">{titulo}</div>
        <div className="py-1">derivada</div>
      </div>
      {filas.map((fila) => (
        <div
          key={fila.f}
          className="grid grid-cols-2 border-t border-white/10 text-center leading-none"
        >
          {/* `py` chico y `leading-none`: con doce renglones, el aire por
              defecto de KaTeX estira la tabla hasta no entrar en la card. */}
          <div className="border-r border-white/10 px-2 py-[7px] text-foreground/80">
            <MathText text={`$${fila.f}$`} />
          </div>
          <div className="px-2 py-[7px]">
            <MathText text={`$${fila.d}$`} />
          </div>
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
      <Tabla filas={FILAS} titulo="función" />
      <Tabla filas={REGLAS} titulo="regla" />
    </div>
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
