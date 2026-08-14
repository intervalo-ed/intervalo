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

// Las dos señales crudas, expuestas aparte para que la telemetría reporte
// exactamente lo que esta función mira (si acá se suma una señal, el evento la
// hereda solo).
export function readStandaloneSignals(): {
  mql: boolean
  iosStandalone: boolean
} {
  return {
    mql: window.matchMedia?.("(display-mode: standalone)").matches ?? false,
    iosStandalone:
      (window.navigator as { standalone?: boolean }).standalone === true,
  }
}

// Caso real (iyacobino, iPhone 11, 12/08): al cargar la PWA las dos señales
// dieron true (el pwa_install salió bien), pero un render de un minuto después
// leyó false y la pestaña de notificaciones pidió instalar la app... dentro de
// la app. WebKit puede flakear, pero solo en una dirección: un navegador común
// jamás reporta standalone=true, así que true es confiable y false puede ser
// mentira. El latch es monotónico: al primer true queda fijo; mientras sea
// false se vuelve a leer, así un false flakeado en el arranque no condena la
// sesión entera a modo navegador.
let standaloneCached = false

function computeStandalone(): boolean {
  const s = readStandaloneSignals()
  return s.mql || s.iosStandalone
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  if (!standaloneCached) standaloneCached = computeStandalone()
  return standaloneCached
}

// Contexto en el que pedir push exige instalar primero: navegador de un
// celular. En Android el navegador soporta push igual, pero el producto quiere
// la app instalada (recordatorios + hábito), así que ahí también se invita a
// instalar. Vive acá para que el pane y el summary usen el MISMO predicado.
export function needsInstallForPush({
  platform,
  standalone,
}: {
  platform: Platform | null
  standalone: boolean
}): boolean {
  return platform !== null && platform !== "desktop" && !standalone
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
