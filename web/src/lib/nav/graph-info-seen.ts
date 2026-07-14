"use client"

import { useSyncExternalStore } from "react"

const STORAGE_KEY = "intervalo:graph-info-seen"
const EVENT = "intervalo:graph-info-seen-change"

function hasSeenGraphInfo(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(STORAGE_KEY) === "1"
}

export function markGraphInfoSeen(): void {
  if (typeof window === "undefined") return
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

// true mientras el usuario no tocó el (i) todavía (para mostrar el punto de novedad).
export function useGraphInfoUnseen(): boolean {
  return useSyncExternalStore(subscribe, () => !hasSeenGraphInfo(), () => false)
}
