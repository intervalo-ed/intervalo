"use client"

// Dónde se dibuja el botón con el que se sale de una diapo de pedido.
//
// Fuera de la caja de color, en los dos aparatos, y siempre en el lugar donde
// vive el botón con el que se sigue en el resto del juego: en escritorio, el pie
// de la columna, donde están Revisar y Saltear; en el teléfono, abajo de todo,
// donde está el Continuar del ranking y el Volver de la tabla.
//
// Esa es la idea entera. Adentro de la caja queda lo que hay que LEER y el botón
// de color, que es lo que se ofrece; el botón con el que se sale no se movió de
// donde siempre estuvo. Con todo adentro, pedir algo se leía como cambiar de
// pantalla — y en escritorio además se llevaba puesto el historial de novedades,
// que se desmontaba y volvía a montarse en cada ida y vuelta.
//
// Y se dibuja con un PORTAL en vez de subir el botón al layout. La etiqueta y la
// cuenta regresiva dependen de estado que vive adentro de cada panel —el
// disparador, y en el café además si la persona ya volvió de donar, que decide
// entre «Volver», «Ahora no (7)» y «Continuar»—. Levantar eso serían media
// docena de piezas de estado mudadas de lugar y duplicadas en el flujo del
// teléfono, para mover un botón cuarenta píxeles.

import { useState } from "react"
import { createPortal } from "react-dom"

/** El botón de salida, puesto donde corresponda.
 *
 * `slot` es el nodo del pie que publica el layout de escritorio. Sin él —el
 * teléfono— el botón se dibuja donde está escrito, que es adentro de la diapo.
 *
 * Que el destino pueda ser `null` no es defensivo, es la pieza que resuelve el
 * volteo: el pie se desmonta en el mismo instante en que cambia el panel, pero la
 * diapo que se va sigue montada unos 380 ms más (así funciona `AnimatePresence`,
 * ver slide-flip.tsx). Sin esto, durante ese rato habría dos botones apilados en
 * el pie — el que vuelve y el que todavía no se fue. */
export function Salida({
  slot,
  children,
}: {
  slot?: HTMLElement | null
  children: React.ReactNode
}) {
  return slot ? createPortal(children, slot) : <>{children}</>
}

/** El hueco de abajo donde la diapo deja su botón de salir, en el teléfono.
 *
 * Acá no hay pie fijo como en escritorio, así que el hueco lo pone la propia
 * pantalla, y con la MISMA geometría que el resto: el cuerpo se queda con todo
 * el alto que sobra (`flex-1`) y el botón va último y sin encoger, así que
 * termina exactamente donde termina el Continuar del ranking y el Volver de la
 * tabla — a `--cta-pb` del piso, midiendo `--cta-h`.
 *
 * Que el botón caiga siempre en el mismo píxel es la mitad del asunto; la otra
 * es que el cuerpo se centre en lo que queda arriba, y no que quede colgando de
 * un botón que flota a media pantalla.
 *
 * Cada diapo monta el SUYO. Si compartieran uno, durante el pase de pantalla la
 * diapo que se va dibujaría su botón en el hueco de la que entra. */
export function ConSalidaAbajo({
  children,
}: {
  children: (slot: HTMLElement | null) => React.ReactNode
}) {
  const [slot, setSlot] = useState<HTMLDivElement | null>(null)
  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        {children(slot)}
      </div>
      <div ref={setSlot} className="mt-3 shrink-0" />
    </>
  )
}

/** Cómo se ve el botón según dónde termine.
 *
 * Adentro de la diapo es un botón más de la pila, con su aire arriba. En el pie
 * tiene que ser indistinguible de Saltear y de Empezar, que es lo que estaba en
 * ese lugar hace un segundo: mismo alto (`--cta-h`) y sin margen, porque el pie
 * ya lo posiciona. */
export function claseDeSalida(enElPie: boolean): string {
  const comun =
    "flex w-full items-center justify-center rounded-md border border-border text-base text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-45"
  return enElPie
    ? `${comun} h-[var(--cta-h)] bg-background px-5`
    : `${comun} mt-3 px-4 py-3`
}
