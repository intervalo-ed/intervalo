"use client"

import { useSyncExternalStore } from "react"
import type { TabRoute } from "@/components/tab-loading-shell"

// Bandera en memoria (no persiste): se prende en el mismo click que dispara
// la navegación de la tab bar, ANTES de que Next resuelva la ruta destino —
// así AppChrome puede tapar el contenido actual con el skeleton de la tab de
// destino al instante, en vez de depender del timing de Suspense/loading.tsx
// de Next (que puede dejar ver un hueco en blanco entre que se va la tab
// actual y aparece el fallback). Se apaga sola apenas el pathname real
// coincide con la tab de destino (la página ya montó y se hace cargo de su
// propio isLoading/skeleton in-page).
let pendingTab: TabRoute | null = null
const listeners = new Set<() => void>()

function emit(): void {
  listeners.forEach((l) => l())
}

export function startTabTransition(tab: TabRoute): void {
  pendingTab = tab
  emit()
}

export function clearTabTransition(): void {
  if (pendingTab === null) return
  pendingTab = null
  emit()
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function usePendingTab(): TabRoute | null {
  return useSyncExternalStore(subscribe, () => pendingTab, () => null)
}
