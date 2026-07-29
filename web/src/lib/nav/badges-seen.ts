"use client"

import { useSyncExternalStore } from "react"

const STORAGE_KEY = "intervalo:badges-seen-depth"
const EVENT = "intervalo:badges-seen-depth-change"

function getSeenDepth(): number {
  if (typeof window === "undefined") return 0
  return Number(window.localStorage.getItem(STORAGE_KEY) ?? "0")
}

// Marca como visto el hito de badges hasta esta profundidad. Se llama al
// entrar a la pantalla de badges; si más adelante se cruza una profundidad
// mayor, el puntito de atención vuelve a aparecer.
export function markBadgesSeen(depth: number): void {
  if (typeof window === "undefined") return
  if (depth <= getSeenDepth()) return
  window.localStorage.setItem(STORAGE_KEY, String(depth))
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

export function useBadgesSeenDepth(): number {
  return useSyncExternalStore(subscribe, getSeenDepth, () => 0)
}
