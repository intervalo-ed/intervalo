"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

/** El contenido, ya montado en un portal.
 *
 * El portal no es un detalle: las listas del juego scrollean adentro de una caja
 * con `overflow`, y un globo posicionado dentro de esa caja lo recorta el propio
 * scroller. Colgado del body, el posicionador de Base UI lo ubica contra el
 * disparador y lo da vuelta solo cuando no entra abajo. */
function PopoverContent({
  className,
  sideOffset = 8,
  align = "center",
  side = "top",
  ...props
}: PopoverPrimitive.Popup.Props & {
  sideOffset?: number
  align?: PopoverPrimitive.Positioner.Props["align"]
  side?: PopoverPrimitive.Positioner.Props["side"]
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner sideOffset={sideOffset} align={align} side={side}>
        <PopoverPrimitive.Popup
          className={cn(
            "z-50 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-xl outline-none",
            "origin-[var(--transform-origin)] transition-[transform,opacity] duration-150",
            "data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
            "data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverContent, PopoverTrigger }
