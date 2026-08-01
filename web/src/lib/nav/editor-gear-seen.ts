"use client"

import { useSyncExternalStore } from "react"

const STORAGE_KEY = "intervalo:editor-gear-seen"
const EVENT = "intervalo:editor-gear-seen-change"

function getSeen(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(STORAGE_KEY) === "1"
}

// Marca como vista la tuerca de editor de curso (repaso/práctica) la primera
// vez que el usuario la toca, para no volver a mostrar el puntito rojo.
export function markEditorGearSeen(): void {
  if (typeof window === "undefined") return
  if (getSeen()) return
  window.localStorage.setItem(STORAGE_KEY, "1")
  window.dispatchEvent(new Event(EVENT))
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENT, callback)
    window.removeEventListener("storage", callback)
  }
}

export function useEditorGearSeen(): boolean {
  return useSyncExternalStore(subscribe, getSeen, () => false)
}
