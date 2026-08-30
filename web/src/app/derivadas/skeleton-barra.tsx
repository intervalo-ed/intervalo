// La barra gris de los esqueletos de carga, y la regla de cómo se usan.
//
// LA REGLA: un esqueleto no se dibuja de nuevo, se calca. Cada uno vive PEGADO
// al componente que espeja —`ListSkeleton` al lado de `Row`, `FeedSkeleton` al
// lado de `EventRow`— y repite sus contenedores con las mismas clases, cambiando
// solo el contenido de las hojas por barras. Dibujarlo aparte "parecido" es la
// forma segura de que el día que la fila real cambie de padding, el esqueleto
// mienta y la lista salte al llegar los datos.
//
// EL ALTO ES LO QUE SE ESCAPA. Una barra de 14 px adentro de una fila cuya
// altura real la fija la caja de línea del texto (`text-sm` ⇒ 20 px) deja la
// fila 6 px más baja, y con seis filas eso es un salto de 36 px en el momento
// exacto en que entran los datos. Por eso las barras van adentro de un
// contenedor con el alto de esa caja de línea (`alto`), y no sueltas.

import { cn } from "@/lib/utils"

/** Una barra. `animate-pulse` lo pone el contenedor del esqueleto, una sola vez,
 *  para que todas latan juntas y no cada una por su cuenta. */
export function Barra({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return <span className={cn("block rounded bg-foreground/10", className)} style={style} />
}

/** El hueco de una hoja de texto: ocupa el alto de la caja de línea real y
 *  centra la barra adentro. `alto` es esa caja —`h-5` para `text-sm`, `h-[1.375em]`
 *  para un `text-xs leading-snug`—, no el alto de la barra. */
export function Hueco({
  alto,
  className,
  barra,
}: {
  alto: string
  className?: string
  barra: string
}) {
  return (
    <span className={cn("flex items-center", alto, className)}>
      <Barra className={barra} />
    </span>
  )
}
