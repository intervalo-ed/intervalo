"use client"

// El logo del minijuego, en un solo componente que sirve para los tres lugares
// donde aparece: el splash (grande, escribiéndose), el header de escritorio y
// la portada del teléfono.
//
// Es un componente propio y no el `Wordmark` de Intervalo por una razón
// concreta: el logo del splash VIAJA hasta su lugar definitivo escalándose (ver
// game-splash.tsx), y para que al aterrizar no se note ningún cambio, el que
// vuela y el que queda tienen que tener exactamente las mismas proporciones.
// El Wordmark de la app no las tiene — a tamaño chico su subrayado es
// proporcionalmente más grueso (una corrección óptica deliberada), así que
// escalar uno hacia el otro despegaba la palabra del subrayado.
//
// De ahí que la separación y el grosor del subrayado vayan en `em`: se miden
// contra el tamaño de letra, que se declara en el contenedor. Así dos logos de
// tamaños distintos son el mismo dibujo a distinta escala.

import { motion } from "motion/react"
import { BELT_LEGEND_BAR_COLORS } from "@/lib/catalog"

export const DERIVADAS_WORD = "derivadas"

const BELT_COLORS = BELT_LEGEND_BAR_COLORS
const GAP_EM = 0.16
const BAR_EM = 0.12

export function DerivadasLogo({
  fontSize,
  typedCount,
  barCount,
  animateEntry = false,
}: {
  // Tamaño de letra en unidades CSS ("2.75rem", "1.25rem"). Va en el
  // contenedor, que es contra lo que se resuelven los `em` de adentro.
  fontSize: string
  // Letras visibles; sin valor, la palabra completa.
  typedCount?: number
  // Tramos visibles del subrayado; sin valor, todos.
  barCount?: number
  // Entrada animada de cada letra (solo la usa el splash).
  animateEntry?: boolean
}) {
  const shownChars = typedCount ?? DERIVADAS_WORD.length
  const shownBars = barCount ?? BELT_COLORS.length
  const letters = DERIVADAS_WORD.slice(0, shownChars)

  return (
    <div
      className="inline-flex flex-col items-center leading-none"
      style={{ fontSize, gap: `${GAP_EM}em` }}
    >
      <span className="font-heading font-semibold text-[#F6F8FC]">
        {/* El espacio duro sostiene la altura de la caja antes de la primera
            letra: sin él el bloque salta cuando arranca el typewriter. */}
        {letters.length === 0 ? " " : null}
        {animateEntry
          ? letters.split("").map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ opacity: 0, y: "0.3em", scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {ch}
              </motion.span>
            ))
          : letters}
      </span>
      <div
        className="flex w-full overflow-hidden rounded-[2px]"
        style={{ height: `${BAR_EM}em` }}
      >
        {BELT_COLORS.map((color, i) => (
          <motion.span
            key={i}
            className="flex-1 origin-left"
            style={{ background: color }}
            initial={false}
            animate={
              i < shownBars
                ? { opacity: 1, scaleX: 1 }
                : { opacity: 0, scaleX: 0 }
            }
            transition={{ duration: animateEntry ? 0.22 : 0, ease: "easeOut" }}
          />
        ))}
      </div>
    </div>
  )
}
