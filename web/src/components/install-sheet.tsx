"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstallHintPane } from "@/components/install-hint-pane"
import type { Platform } from "@/lib/platform/detect"

// Los pasos para instalar, a pantalla completa, con la misma pieza que usa la
// slide del resumen de sesión (install-hint-pane.tsx). Antes esto era un diálogo
// chico con los pasos y nada más; la slide además dice para qué sirve instalar y
// que no se descarga nada, que es justo lo que se pregunta alguien que toca
// "Abrir" en la smart bar sin saber qué va a pasar.
//
// Va sobre el Dialog de base-ui y no sobre un overlay propio para no reimplementar
// foco atrapado, Escape, bloqueo de scroll y portal.
export function InstallSheet({
  platform,
  open,
  onOpenChange,
}: {
  platform: Platform
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Opaco y no translúcido: abajo queda la pantalla de la app y los pasos
            se leen sobre fondo limpio, como una pantalla más y no como un modal. */}
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-background duration-150 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex flex-col outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-bottom-4 data-closed:animate-out data-closed:fade-out-0">
          {/* El título existe para lectores de pantalla: en pantalla el encabezado
              es el texto del propio pane. */}
          <DialogPrimitive.Title className="sr-only">
            Instalar Intervalo
          </DialogPrimitive.Title>

          <div className="flex shrink-0 justify-end px-3 pt-[calc(0.75rem_+_env(safe-area-inset-top))]">
            <DialogPrimitive.Close
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <XIcon />
              <span className="sr-only">Cerrar</span>
            </DialogPrimitive.Close>
          </div>

          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto px-5">
            <InstallHintPane platformOverride={platform} />
          </div>

          {/* Mismas variables que el CTA del summary y del onboarding: el botón
              cae exactamente donde el usuario ya lo espera. */}
          <div className="shrink-0 px-5 pt-[var(--cta-pt)] pb-[var(--cta-pb)]">
            <DialogPrimitive.Close
              render={
                <Button
                  size="lg"
                  className="mx-auto flex h-[var(--cta-h)] w-full max-w-2xl rounded-md"
                />
              }
            >
              Listo
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
