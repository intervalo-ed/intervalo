"use client"

import { useSyncExternalStore } from "react"

const STORAGE_KEY = "intervalo:sound-muted"
const EVENT = "intervalo:sound-muted-change"

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(STORAGE_KEY) === "1"
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0")
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

// Hook reactivo para la UI: se actualiza ante cambios en esta o en otra pestaña.
export function useSoundMuted(): boolean {
  return useSyncExternalStore(subscribe, isSoundMuted, () => false)
}
