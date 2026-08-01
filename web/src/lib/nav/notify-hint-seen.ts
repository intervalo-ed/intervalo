"use client"

import { useSyncExternalStore } from "react"

const STORAGE_KEY = "intervalo:notify-hint-seen"
const EVENT = "intervalo:notify-hint-seen-change"

function hasSeenNotifyHint(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(STORAGE_KEY) === "1"
}

export function markNotifyHintSeen(): void {
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

// true mientras el usuario no vio todavía la pestaña de notificaciones del summary.
export function useNotifyHintUnseen(): boolean {
  return useSyncExternalStore(subscribe, () => !hasSeenNotifyHint(), () => false)
}
