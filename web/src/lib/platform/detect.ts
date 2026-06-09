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

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  const mql = window.matchMedia?.("(display-mode: standalone)").matches ?? false
  const iosStandalone =
    (window.navigator as { standalone?: boolean }).standalone === true
  return mql || iosStandalone
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
