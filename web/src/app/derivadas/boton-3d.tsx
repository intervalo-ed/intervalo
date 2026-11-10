import { cn } from "@/lib/utils"

// El botón pulsable en 3D de la fila de abajo del ejercicio (Revisar, Tabla,
// Saltear, ¿Por qué?): una cara con un labio de otro tono debajo. Al apretar, la
// cara baja hasta tapar el labio, como una tecla que se hunde.
//
// El alto TOTAL sigue siendo el `--cta-h` de siempre: el labio sale de adentro
// (`pb-1`, 4 px) y la cara ocupa el resto, así que el pie no se corre.
//
// Se usa en dos piezas: este envoltorio con el color del labio, y adentro el
// `Button` con `CARA_3D` en el className.

export const LABIO_BLANCO = "#A8ADBF"
export const LABIO_ACIERTO = "#15803D"
export const LABIO_CONTORNO = "#2B2B45"

/** Para el className del `Button` de adentro. `rounded-[inherit]`: el radio lo
 *  manda el envoltorio, que es el que lo pisa cuando hace falta (`rounded-lg`). */
export const CARA_3D =
  "min-h-0 w-full flex-1 rounded-[inherit] transition-[background-color,color,opacity,transform] active:translate-y-1"

export function Boton3D({
  labio,
  className,
  style,
  children,
}: {
  labio: string
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div
      style={{ backgroundColor: labio, ...style }}
      className={cn("flex h-[var(--cta-h)] flex-col rounded-md pb-1 transition-colors", className)}
    >
      {children}
    </div>
  )
}
