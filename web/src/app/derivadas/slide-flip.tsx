"use client"

// La transición entre pantallas del juego: la caja gira sobre su eje vertical y
// del otro lado aparece la que sigue. Es el mismo gesto con el que la card del
// ejercicio muestra la tabla (derivatives-table.tsx :: FlipCard), y usarlo para
// TODO lo que cambia —intro, ejercicio, carrera, universidad, registro— es lo
// que hace que el juego se sienta un solo objeto que va mostrando caras, y no
// una pila de pantallas que se reemplazan.
//
// No se puede reusar FlipCard: ahí las dos caras existen desde el principio y la
// de atrás es siempre la misma. Acá la que entra no se conoce hasta que llega,
// así que la vuelta se parte en dos medias vueltas encadenadas:
//
//   · la que se va gira de 0° a 90° y queda de canto (invisible);
//   · la que entra arranca en −90° y termina de frente.
//
// −90 no es un número elegido a ojo: es 90 (donde está el contenedor cuando la
// primera termina) menos los 180 que separan la cara de atrás de la de adelante.
// Por eso las dos medias vueltas se ven como UNA rotación continua de 180° en el
// mismo sentido, y no como una caja que va y vuelve.
//
// `mode="sync"` es regla del proyecto: con `wait`, una pestaña en segundo plano
// congela los fotogramas, la salida no termina nunca y la entrada no ocurre. Las
// dos caras conviven, y lo que evita que se pisen es el retraso de la entrada —
// cuando empieza, la anterior ya está de canto.

import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"

// Cada media vuelta: 190 ms, o sea 380 en total.
//
// Las dos mitades NO llevan la misma curva, y ahí estaba lo que hacía que el
// giro se sintiera trabado. Una vuelta de 180° es UN movimiento con una sola
// aceleración: arranca, pasa rápido por el canto y frena al llegar. Partido en
// dos animaciones con la misma curva suave, cada mitad frenaba al terminar y la
// siguiente volvía a arrancar de cero, así que justo en el canto —donde el ojo
// espera lo más rápido— había un tranco.
//
// La solución es partir una ease-in-out en sus dos mitades: la que se va acelera
// (ease-in) y la que entra desacelera (ease-out). Pegadas, dan exactamente la
// curva de un solo giro.
const HALF_S = 0.19
const EASE_SALIDA = [0.55, 0, 1, 0.45] as const
const EASE_ENTRADA = [0, 0.55, 0.45, 1] as const

// Con movimiento reducido no hay giro: un fundido corto, que es lo mínimo para
// que se entienda que cambió la pantalla.
const FADE_S = 0.15

export function SlideFlip({
  slide,
  className,
  children,
}: {
  // Cambiar este valor es lo que dispara la vuelta. Tiene que identificar a la
  // pantalla, no al contenido: si cambia por cualquier otra cosa (un contador,
  // un re-render), la caja gira sin motivo.
  slide: string
  className?: string
  children: React.ReactNode
}) {
  const reduceMotion = useReducedMotion()
  return (
    // El `perspective` va acá y no en la cara que rota: si van en el mismo
    // elemento, el navegador aplica la perspectiva antes de la rotación y el
    // giro se ve plano (misma razón que en FlipCard).
    <div className={cn("relative", className)} style={{ perspective: 1600 }}>
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={slide}
          // Absoluta para que las dos caras se superpongan durante el cruce en
          // vez de empujarse. El contenedor es quien tiene que traer el tamaño.
          className="absolute inset-0 flex min-h-0 flex-col"
          // `willChange` para que el compositor le dé su capa a la cara ANTES de
          // empezar a girar: sin esto el primer fotograma se va en promoverla, y
          // se nota como un tirón al arrancar.
          style={{ willChange: "transform" }}
          initial={reduceMotion ? { opacity: 0 } : { rotateY: -90 }}
          animate={
            reduceMotion
              ? { opacity: 1, transition: { duration: FADE_S } }
              : {
                  rotateY: 0,
                  transition: { duration: HALF_S, delay: HALF_S, ease: EASE_ENTRADA },
                }
          }
          exit={
            reduceMotion
              ? { opacity: 0, transition: { duration: FADE_S } }
              : { rotateY: 90, transition: { duration: HALF_S, ease: EASE_SALIDA } }
          }
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
