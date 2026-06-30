"use client"

import { useEffect } from "react"
import { setRankingNews } from "@/lib/nav/ranking-news"

// Prende el puntito de novedad del ranking una vez por instancia de la app
// (al abrirla / cargarla). El layout no se re-monta al navegar entre tabs, así
// que este efecto corre una sola vez por carga. Se apaga al entrar al ranking.
export function RankingNewsOnEntry() {
  useEffect(() => {
    setRankingNews(true)
  }, [])
  return null
}
