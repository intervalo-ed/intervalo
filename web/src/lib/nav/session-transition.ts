"use client"

import { useSyncExternalStore } from "react"

// Bandera en memoria (no persiste, no cruza pestañas): se prende apenas se
// confirma que se va a navegar a una sesión (repasar/practicar), ANTES de que
// cambie el pathname — así AppChrome puede empezar a desvanecer la tab bar en
// el mismo instante que el resto de la pantalla, en vez de esperar a que la
// ruta ya haya cambiado a /session/... Se apaga sola al volver a aterrizar en
// cualquiera de las 4 rutas de la tab bar.
let leaving = false
const listeners = new Set<() => void>()

function emit(): void {
  listeners.forEach((l) => l())
}

export function startSessionTransition(): void {
  leaving = true
  emit()
}

export function resetSessionTransition(): void {
  if (!leaving) return
  leaving = false
  emit()
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function useSessionTransitionLeaving(): boolean {
  return useSyncExternalStore(subscribe, () => leaving, () => false)
}
