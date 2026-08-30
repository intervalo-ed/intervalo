"use client"

// `Cara`: una de dos superficies que se reemplazan sin mover la caja que las
// contiene. La usan FlipCard (derivatives-table.tsx, el dorso del ranking) y
// AnswerField (exercise-card.tsx, el campo que se convierte en el botón del
// «¿Por qué?») — vive acá, aparte de las dos, porque metida en cualquiera de
// esos dos archivos la otra tendría que importarla de ahí, y ya se importan
// cosas entre sí (KeyCap sale de exercise-card.tsx) — un tercer lugar neutral
// evita el círculo.

import { motion } from "motion/react"
import { FUNDIDO } from "./slide-flip"

// Cuánto se achica la cara que se apaga y desde dónde crece la que se
// enciende, cuando `scale` está pedido. 97%: lo bastante para que se note un
// «aparece»/«se retira» y no un simple cambio de opacidad, lo bastante poco
// para no leerse como un rebote.
const ESCALA_APAGADO = 0.97

/** Una cara de una caja de dos superficies.
 *
 * La de adelante va en el flujo (`h-full w-full`, o lo que el llamador le dé)
 * y la de atrás encima (`absolute inset-0`): es la de adelante la que le da
 * alto a la caja, así que el contenedor nunca se mueve — no hay dos nodos
 * entrando y saliendo del flujo, hay uno fijo y otro que copia lo que mida
 * ese. A diferencia de un cruce con `AnimatePresence` que monta y desmonta, que
 * sí puede saltar si las dos cosas no miden exactamente lo mismo.
 *
 * Cada una usa el tramo que le toca —`entrada` si se está encendiendo, `salida`
 * si se está apagando—, que es el mismo fundido del resto del juego.
 *
 * `scale`: además del fundido, encima/apaga con una escala chica (ver
 * `ESCALA_APAGADO`). Es opt-in y por defecto apagado —FlipCard (el dorso del
 * ranking) sigue siendo solo fundido, «se prende y se apaga, nunca se agranda
 * ni achica»— porque achicar una cara que además tiene ancho fijo (`w-full`)
 * no dice lo mismo en las dos: acá (AnswerField) es un botón «apareciendo», ahí
 * sería una tabla entera respirando, que no es lo que esa transición cuenta.
 *
 * `pointerEvents` no es un detalle de más. Con un volteo 3D, la cara apagada no
 * recibía clics porque el navegador directamente no dibuja las caras de atrás;
 * con opacidad cero SÍ los recibiría. El `inert` cubre lo mismo para el
 * teclado/tabulado; el puntero hay que apagarlo aparte.
 *
 * `initial={false}` es SIEMPRE correcto acá, pero solo si el llamador cumple
 * esto: las DOS caras tienen que estar montadas desde el primer render del
 * padre, aunque una empiece invisible (`visible={false}`) — nunca agregar una
 * cara al árbol recién cuando ya debería estar visible. Si se monta ya
 * visible, React 18 la trata como "siempre estuvo así" y no hay nada que
 * animar: no aparece ningún fotograma intermedio, aparece de golpe. Costó
 * encontrarlo (instrumentado en el navegador: la cara del ¿Por qué? en
 * AnswerField nunca disparaba `onAnimationStart`) porque en Strict Mode el
 * síntoma es sutil — el montaje condicional "parece" andar bien la primera
 * vez que se lo mira con los devtools puestos. */
export function Cara({
  visible,
  className,
  scale = false,
  children,
}: {
  visible: boolean
  className: string
  scale?: boolean
  children: React.ReactNode
}) {
  const tramo = visible ? FUNDIDO.entrada : FUNDIDO.salida
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        ...(scale && { scale: visible ? 1 : ESCALA_APAGADO }),
      }}
      transition={{ duration: tramo.duracion, ease: tramo.ease }}
      style={{ pointerEvents: visible ? undefined : "none" }}
      inert={!visible}
    >
      {children}
    </motion.div>
  )
}
