"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { PrivacidadContent, TerminosContent } from "@/components/legal-content"
import { useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"

// "¿Qué pasa con mis datos?" en el paso de registro abre este panel: una hoja
// con la política de privacidad que asoma hasta el primer párrafo, para leer
// sin salir del wizard (los links en pestaña nueva eran una vuelta mucho menos
// amigable); el resto se scrollea adentro. La referencia cruzada entre
// documentos intercambia el contenido del panel en lugar de navegar.
//
// Sobre el Dialog de base-ui por lo mismo que install-sheet: foco atrapado,
// Escape, bloqueo de scroll y portal ya resueltos. Se cierra tocando el
// backdrop, con Escape / el gesto de atrás, o arrastrando la manija hacia
// abajo — el gesto natural de una hoja.
export function LegalSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [doc, setDoc] = useState<"privacidad" | "terminos">("privacidad")
  const scrollRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef<number | null>(null)

  // El panel siempre abre en la política: es lo que promete el link que lo
  // abre. El reset va durante el render y no en un efecto, para que reabrirlo
  // no pinte ni un frame del último documento visitado.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setDoc("privacidad")
  }

  const switchDoc = (next: "privacidad" | "terminos") => {
    setDoc(next)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  // El arrastre vive solo en la manija: ahí no compite con el scroll del
  // contenido. Mueve el popup con transform inline; al soltar, o vuelve a su
  // lugar con una transición, o cierra — y la animación de salida arranca
  // desde donde quedó el dedo (los keyframes de tw-animate no definen `from`,
  // así que toman el transform vigente).
  const onDragStart = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
    if (popupRef.current) popupRef.current.style.transition = "none"
  }

  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || !popupRef.current) return
    const dy = Math.max(0, e.clientY - dragStartY.current)
    popupRef.current.style.transform = `translateY(${dy}px)`
  }

  const onDragEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null || !popupRef.current) return
    const dy = Math.max(0, e.clientY - dragStartY.current)
    dragStartY.current = null
    const popup = popupRef.current
    if (dy > popup.offsetHeight / 4) {
      onOpenChange(false)
    } else {
      popup.style.transition = "transform 200ms ease"
      popup.style.transform = "translateY(0)"
    }
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        {/* max(42dvh, 320px): corta justo después del primer párrafo de la
            política, con un poco de aire; el piso evita que en pantallas
            bajas quede cortado a mitad de texto. */}
        {/* initialFocus al popup: sin esto el Dialog enfoca el primer link del
            contenido y el navegador lo scrollea a la vista, abriendo el panel
            ya scrolleado en vez de en el título. */}
        <DialogPrimitive.Popup
          ref={popupRef}
          initialFocus={popupRef}
          className="fixed inset-x-0 bottom-0 z-50 flex h-[max(42dvh,320px)] flex-col overflow-hidden rounded-t-2xl border-t border-[#38385A] bg-[#131324] font-sans text-[#F6F8FC] outline-none duration-200 data-open:animate-in data-open:slide-in-from-bottom-[100%] data-closed:animate-out data-closed:slide-out-to-bottom-[100%]"
        >
          <DialogPrimitive.Title className="sr-only">
            {doc === "privacidad"
              ? "Política de privacidad"
              : "Términos y condiciones"}
          </DialogPrimitive.Title>

          <div
            className="flex shrink-0 cursor-grab touch-none select-none justify-center pb-4 pt-3 active:cursor-grabbing"
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
          >
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]"
          >
            {doc === "privacidad" ? (
              <PrivacidadContent
                compact
                onCrossLink={() => switchDoc("terminos")}
              />
            ) : (
              <TerminosContent
                compact
                onCrossLink={() => switchDoc("privacidad")}
              />
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
