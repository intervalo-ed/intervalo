"use client"

// Dónde se dibuja el botón con el que se sale de una diapo de pedido.
//
// En el teléfono va adentro de la diapo, debajo del botón de color: cada diapo
// es una pantalla entera y ahí abajo no hay nada más.
//
// En escritorio va en el PIE de la columna, en el mismo lugar donde están
// Revisar y Saltear mientras se juega. Esa es la diferencia que hace que pedir
// algo se lea como una pausa adentro del juego y no como cambiar de pantalla: la
// caja del ejercicio se da vuelta y muestra el pedido, pero el botón de seguir
// no se movió de donde estaba y el historial de al lado no parpadeó.
//
// Y se dibuja con un PORTAL en vez de subir el botón al layout. La etiqueta y la
// cuenta regresiva dependen de estado que vive adentro de cada panel —el
// disparador, y en el café además si la persona ya volvió de donar, que decide
// entre «Volver», «Ahora no (7)» y «Continuar»—. Levantar eso serían media
// docena de piezas de estado mudadas de lugar y duplicadas en el flujo del
// teléfono, para mover un botón cuarenta píxeles.

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
