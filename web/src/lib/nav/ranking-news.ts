"use client"

import { useSyncExternalStore } from "react"

// Marca de "novedad" del ranking: se prende al iniciar una sesión (cambia tu XP/
// posición) y se apaga cuando el usuario entra al ranking. Maneja el puntito de
// la tab bar. Espeja el patrón de sound-settings (localStorage + evento).
const STORAGE_KEY = "intervalo:ranking-news"
const EVENT = "intervalo:ranking-news-change"

export function hasRankingNews(): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(STORAGE_KEY) === "1"
}

export function setRankingNews(on: boolean): void {
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

export function useRankingNews(): boolean {
  return useSyncExternalStore(subscribe, hasRankingNews, () => false)
}
