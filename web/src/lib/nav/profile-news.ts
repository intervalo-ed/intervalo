"use client"

import { useSyncExternalStore } from "react"

// Marca de "novedad" del perfil: se prende al abrir la app / al terminar una
// sesión (podés tener un badge nuevo desbloqueable) y se apaga cuando entrás al
// perfil. En la tab bar se muestra sólo si además hay un badge disponible
// (useBadgesAvailable). Espeja el patrón de ranking-news.
const STORAGE_KEY = "intervalo:profile-news"
const EVENT = "intervalo:profile-news-change"

export function hasProfileNews(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(STORAGE_KEY) === "1"
}

export function setProfileNews(on: boolean): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0")
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

export function useProfileNews(): boolean {
  return useSyncExternalStore(subscribe, hasProfileNews, () => false)
}
