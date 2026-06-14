"use client"

import { SmartBarGate } from "@/components/smart-bar"
import { SplashGate } from "@/components/splash-gate"
import { isStandalone } from "@/lib/platform/detect"
import { useEffect } from "react"

export default function AppChrome({
  children,
  splash,
}: {
  children: React.ReactNode
  splash: boolean
}) {
  // En PWA instalada (standalone) elevamos los CTA fijos y la safe-area
  // vía la clase .pwa (ver --cta-pb en globals.css).
  useEffect(() => {
    if (isStandalone()) document.documentElement.classList.add("pwa")
  }, [])

  return (
    <div className="flex h-dvh flex-col">
      <SmartBarGate />
      <div className="min-h-0 flex-1">{children}</div>
      {splash && <SplashGate />}
    </div>
  )
}
