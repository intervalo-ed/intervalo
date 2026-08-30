"use client"

// La transición entre pantallas del juego: una caja se apaga y la que sigue se
// enciende en el mismo lugar. Es el mismo gesto con el que la card del ejercicio
// muestra su dorso (derivatives-table.tsx :: FlipCard), y usarlo para TODO lo que
// cambia —intro, carrera, universidad, registro, cafecito— es lo que hace que el
// juego se sienta un solo objeto que va mostrando caras, y no una pila de
// pantallas que se reemplazan.
//
// Antes de esto el gesto era un VOLTEO 3D: la caja giraba 180° sobre su eje
// vertical y del otro lado estaba la pantalla siguiente. Se comparó contra cuatro
// fundidos —uno más largo, uno con las dos caras corridas en el tiempo, uno con
// escala y este— y quedó este. Los otros están en el historial; acá abajo queda
// escrito por qué este.
//
// No se puede reusar FlipCard: ahí las dos caras existen desde el principio y la
// de atrás es siempre la misma. Acá la que entra no se conoce hasta que llega.
//
// `mode="sync"` es regla del proyecto: con `wait`, una pestaña en segundo plano
// congela los fotogramas, la salida no termina nunca y la entrada no ocurre. Las
// dos caras conviven, que es de lo que se trata un fundido.

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

type Curva = readonly [number, number, number, number]

// Arranca rápido y frena al llegar.
const DESACELERA: Curva = [0, 0, 0.2, 1]
// Arranca despacio y se va acelerando.
const ACELERA: Curva = [0.4, 0, 1, 1]

type Tramo = { duracion: number; ease: Curva }

/** El fundido del juego. Lo comparten este archivo y el FlipCard de
 *  derivatives-table.tsx, que es la otra mitad del mismo gesto.
 *
 *  Las dos caras están APILADAS, no mezcladas, así que lo que se ve en el medio
 *  de la transición no es la suma de las dos opacidades sino tres capas:
 *
 *    la que llega    α_ent
 *    la que se va    (1 − α_ent) · α_sal
 *    el fondo        (1 − α_ent) · (1 − α_sal)
 *
 *  De ahí sale lo que decide el carácter de un fundido: cuánto FONDO se cuela en
 *  el medio. El cruce que parece perfecto —las dos mitades iguales y sin
 *  retraso— no lo evita: deja pasar un 25%. Y correr el arranque de la que llega
 *  lo empeora: con 40 ms de retraso se iba al 54%, y quedaba un respiro del fondo
 *  entre una pantalla y la otra.
 *
 *  Este va al revés. Las dos arrancan juntas y con curvas OPUESTAS: la que llega
 *  sube rápido y la que se va se queda, así que la nueva le pasa por encima a la
 *  vieja en vez de esperarla y el fondo casi no aparece (5%). Lo que se lee es un
 *  relevo y no un hueco. */
export const FUNDIDO: { salida: Tramo; entrada: Tramo } = {
  salida: { duracion: 0.22, ease: ACELERA },
  entrada: { duracion: 0.22, ease: DESACELERA },
}

// Sin rama para `prefers-reduced-motion`. La tenía cuando el gesto era un giro en
// 3D, y esa rama era justamente un fundido corto. Ahora el gesto ES un fundido
// —solo opacidad, nada se mueve de lugar—, así que la excepción y la regla son la
// misma cosa: acortarlo para unos y no para otros sería una diferencia sin nada
// detrás.

export function SlideFlip({
  slide,
  className,
  children,
}: {
  // Cambiar este valor es lo que dispara la transición. Tiene que identificar a
  // la pantalla, no al contenido: si cambia por cualquier otra cosa (un
  // contador, un re-render), la caja cambia sin motivo.
  slide: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="sync" initial={false}>
        <Cara key={slide}>{children}</Cara>
      </AnimatePresence>
    </div>
  )
}

/** Una cara de la transición. Va aparte solo para que cada una lleve su propio
 *  estado de «me estoy animando», que es lo que decide si pide capa de
 *  compositor. */
function Cara({ children }: { children: React.ReactNode }) {
  // Arranca en true porque la animación de entrada empieza en el mismo momento
  // en que esto se monta.
  const [animando, setAnimando] = useState(true)
  return (
    <motion.div
      // Absoluta para que las dos caras se superpongan durante el cruce en
      // vez de empujarse. El contenedor es quien tiene que traer el tamaño.
      className="absolute inset-0 flex min-h-0 flex-col"
      // `willChange` para que el compositor le dé su capa a la cara ANTES de
      // empezar: sin esto el primer fotograma se va en promoverla, y se nota
      // como un tirón al arrancar.
      //
      // Pero SOLO mientras dura. Antes quedaba puesto para siempre, y lo que hay
      // adentro de estas caras no es poco: el campo de MathLive con su shadow DOM
      // y los veintiocho botones del teclado, más el ranking cuando el cambio es
      // el del panel entero. En una GPU integrada con memoria compartida, que es
      // la de la mayoría de los teléfonos y notebooks del público, sostener capas
      // de pantalla completa toda la sesión es de donde salen las recargas de
      // pestaña.
      style={{ willChange: animando ? "opacity" : undefined }}
      onAnimationStart={() => setAnimando(true)}
      onAnimationComplete={() => setAnimando(false)}
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1,
        transition: {
          duration: FUNDIDO.entrada.duracion,
          ease: FUNDIDO.entrada.ease,
        },
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: FUNDIDO.salida.duracion,
          ease: FUNDIDO.salida.ease,
        },
      }}
    >
      {children}
    </motion.div>
  )
}
