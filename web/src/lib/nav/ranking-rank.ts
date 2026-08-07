"use client"

// Última posición (rank) global conocida del usuario en el ranking, para
// poder detectar si avanzó lugares después de una sesión (ver
// session-summary.tsx). Se actualiza cada vez que se carga el ranking sin
// filtros de carrera/universidad (ver UseLeaderboard). No dispara eventos:
// a diferencia de ranking-news, esto no pinta nada por sí solo, solo guarda
// el dato para la próxima comparación.
const STORAGE_KEY = "intervalo:ranking-last-rank"

export function getLastKnownRank(): number | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function setLastKnownRank(rank: number): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, String(rank))
}
