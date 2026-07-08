"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { setRankingNews } from "@/lib/nav/ranking-news"
import { setProfileNews } from "@/lib/nav/profile-news"

// Controlador central de los puntitos de novedad de la tab bar (ranking y perfil).
//
// Vive en el chrome del root (AppChrome), no en (app)/layout: el home es
// app/page.tsx, FUERA del grupo (app), así que un controlador dentro de (app) no
// montaría en el inicio y sembraría "una navegación tarde". Acá se monta una vez y
// persiste entre navegaciones (home ↔ ranking ↔ perfil).
//
// - Al abrir la app prende la novedad SÓLO de las secciones que no estás viendo.
//   "Abrir" incluye el arranque en frío (mount) y volver a primer plano
//   (visibilitychange): en una PWA el resume no re-monta React, así que sin esto un
//   background/foreground no generaría novedad y el dot no reaparecería.
// - Al navegar a una sección, apaga su novedad (ya la viste).
export function NewsController() {
  const pathname = usePathname()
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  useEffect(() => {
    const seed = () => {
      const p = pathRef.current
      if (p !== "/leaderboard") setRankingNews(true)
      if (p !== "/profile") setProfileNews(true)
    }
    seed()
    const onVisible = () => {
      if (document.visibilityState === "visible") seed()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  useEffect(() => {
    if (pathname === "/leaderboard") setRankingNews(false)
    if (pathname === "/profile") setProfileNews(false)
  }, [pathname])

  return null
}
