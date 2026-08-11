"use client"

import { X } from "lucide-react"
import { useSyncExternalStore } from "react"

// Un cartelito de ayuda que el usuario cierra con la X y no vuelve a ver.
// El estado va en localStorage bajo la clave que recibe cada instancia, así que
// cada hint se descarta por separado.
//
// El evento custom es necesario además del `storage` nativo: ese solo llega a
// las OTRAS pestañas, no a la que escribió, y sin él el cartel no desaparecería
// hasta recargar.
const EVENT = "intervalo:hint-dismissed-change"

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

export function dismissHint(storageKey: string): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(storageKey, "1")
  window.dispatchEvent(new Event(EVENT))
}

// En el server no hay localStorage: se asume "sin descartar" y el cartel entra
// en el HTML inicial. Al hidratar, quien ya lo cerró lo pierde enseguida.
export function useHintDismissed(storageKey: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(storageKey) === "1",
    () => false,
  )
}

export function DismissibleHint({
  storageKey,
  children,
}: {
  storageKey: string
  children: React.ReactNode
}) {
  const dismissed = useHintDismissed(storageKey)
  if (dismissed) return null
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-white/10 bg-white/[0.01] p-3">
      {/* Cada oración va en su propio `span.block` y el espacio entre ellas lo
          pone `space-y`: separa un poco más que el interlineado, sin abrir el
          renglón en blanco que dejaría un párrafo aparte. Spans y no divs
          porque acá adentro estamos en un <p>. */}
      <p className="space-y-2.5 text-sm text-foreground/60">{children}</p>
      <button
        type="button"
        aria-label="Cerrar"
        className="shrink-0 text-foreground/40 outline-none transition-colors hover:text-foreground/70"
        onClick={() => dismissHint(storageKey)}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
