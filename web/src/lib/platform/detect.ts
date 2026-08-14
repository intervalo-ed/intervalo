"use client"

import { useEffect, useState } from "react"

export type Platform = "ios" | "android" | "desktop"

export function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop"
  const ua = navigator.userAgent
  // iPadOS 13+ se reporta como Mac con pantalla táctil.
  const isIpad = /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1
  if (/iPad|iPhone|iPod/.test(ua) || isIpad) return "ios"
  if (/Android/.test(ua)) return "android"
  return "desktop"
}

// Caso real (iyacobino, iPhone 11, 12/08): al cargar la PWA las dos señales
// dieron true (el pwa_install salió bien), pero un render de un minuto después
// leyó false y la pestaña de notificaciones pidió instalar la app... dentro de
// la app. Correr instalado no puede cambiar sin relanzar, así que la primera
// lectura del cliente (en instrumentation-client, al arrancar) se congela y
// las siguientes la reusan en vez de volver a preguntarle a WebKit.
let standaloneCached: boolean | null = null

function computeStandalone(): boolean {
  const mql = window.matchMedia?.("(display-mode: standalone)").matches ?? false
  const iosStandalone =
    (window.navigator as { standalone?: boolean }).standalone === true
  return mql || iosStandalone
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  if (standaloneCached === null) standaloneCached = computeStandalone()
  return standaloneCached
}

// Devuelve null hasta montar para evitar mismatch de hidratación SSR.
export function usePlatform(): Platform | null {
  const [platform, setPlatform] = useState<Platform | null>(null)
  useEffect(() => {
    // Detección post-montaje para evitar mismatch SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(getPlatform())
  }, [])
  return platform
}
