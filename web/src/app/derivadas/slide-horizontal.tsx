"use client"

// El pase entre pantallas del TELÉFONO: una tira que se corre de costado.
//
// Es el único gesto de navegación que hay en mobile. Escritorio usa el volteo 3D
// (slide-flip.tsx) porque allá lo que cambia es una card que gira sobre su eje;
// acá el juego es una tira horizontal y una caja que gira en 3D en medio de eso
// se lee como otro idioma.
//
// Vive en su propio archivo y no adentro de mobile-flow porque lo usan dos: el
// flujo del juego y las pantallas de configuración. Con una copia en cada uno,
// la forma segura de que se desincronicen era tocar el ritmo de una sola.

import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

/** Para dónde se mueve la tira.
 *
 * Casi siempre "adelante": lo nuevo entra por la derecha y lo viejo se va por la
 * izquierda, como pasar de página. "atras" es el espejo, y existe porque volver
 * tiene que VERSE como volver — con el pase de avanzar, salir de una pantalla se
 * leía como "seguí" y aquello a lo que se regresa entraba como si fuera nuevo. */
export type Direccion = "adelante" | "atras"

export const slideVariants = {
  enter: (d: Direccion) => ({ x: d === "atras" ? "-100%" : "100%", opacity: 1 }),
  center: { x: "0%", opacity: 1 },
  exit: (d: Direccion) => ({ x: d === "atras" ? "100%" : "-100%", opacity: 1 }),
}

export const SLIDE_TRANSITION = { duration: 0.28, ease: "easeInOut" } as const

/** Cambia una caja por otra deslizando.
 *
 * `mode="sync"` es regla del proyecto: con "wait", una pestaña en segundo plano
 * congela los fotogramas, la salida no termina nunca y la entrada no ocurre. */
export function SlideHorizontal({
  llave,
  direccion = "adelante",
  className,
  children,
}: {
  llave: string
  direccion?: Direccion
  className?: string
  children: React.ReactNode
}) {
  return (
    // Grilla de una celda: las dos cajas se apilan en el mismo lugar mientras
    // dura el cruce, sin sacarlas del flujo con `absolute` —que le haría perder
    // el alto al contenedor justo cuando las dos conviven.
    <div className={cn("relative grid overflow-hidden", className)}>
      <AnimatePresence mode="sync" initial={false} custom={direccion}>
        <motion.div
          key={llave}
          custom={direccion}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SLIDE_TRANSITION}
          className="col-start-1 row-start-1 flex min-h-0 min-w-0 flex-col"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
