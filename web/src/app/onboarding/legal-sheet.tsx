"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { PrivacidadContent, TerminosContent } from "@/components/legal-content"
import { useRef, useState } from "react"

// "¿Qué pasa con mis datos?" en el paso de registro abre este panel: una hoja
// de 3/4 de pantalla con la política de privacidad, para leerla sin salir del
// wizard (los links en pestaña nueva eran una vuelta mucho menos amigable).
// La referencia cruzada entre documentos intercambia el contenido del panel
// en lugar de navegar; el panel se queda donde está.
//
// Sobre el Dialog de base-ui por lo mismo que install-sheet: foco atrapado,
// Escape, bloqueo de scroll y portal ya resueltos. El cuarto de pantalla
// visible arriba es el backdrop, así que tocarlo también cierra.
export function LegalSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [doc, setDoc] = useState<"privacidad" | "terminos">("privacidad")
  const scrollRef = useRef<HTMLDivElement>(null)

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

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/60 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-x-0 bottom-0 z-50 flex h-[75dvh] flex-col overflow-hidden rounded-t-2xl border-t border-[#38385A] bg-[#131324] font-sans text-[#F6F8FC] outline-none duration-200 data-open:animate-in data-open:slide-in-from-bottom-[100%] data-closed:animate-out data-closed:slide-out-to-bottom-[100%]">
          <DialogPrimitive.Title className="sr-only">
            {doc === "privacidad"
              ? "Política de privacidad"
              : "Términos y condiciones"}
          </DialogPrimitive.Title>

          {/* La manija de hoja: señal visual de que esto se cierra hacia
              abajo (tocando el backdrop o con Escape / el gesto de atrás). */}
          <div className="flex shrink-0 justify-center pb-2 pt-3">
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
