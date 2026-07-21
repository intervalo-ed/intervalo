"use client"

import { BottomNav } from "@/components/bottom-nav"
import { SmartBarGate } from "@/components/smart-bar"
import { SplashGate } from "@/components/splash-gate"
import { NewsController } from "@/app/news-controller"
import { usePathname } from "next/navigation"

// Las 4 pantallas de la tab bar. Vive acá (layout raíz) en vez de en cada
// página para que quede montada una sola vez y nunca se desmonte al navegar
// entre ellas ni durante el fallback de loading.tsx (que solo reemplaza
// `children`, no AppChrome) — antes parpadeaba/desaparecía solo en "/".
const TAB_ROUTES = new Set(["/", "/practice", "/leaderboard", "/profile"])

export default function AppChrome({
  children,
  splash,
}: {
  children: React.ReactNode
  splash: boolean
}) {
  const pathname = usePathname()
  return (
    <div className="app-shell flex h-dvh flex-col">
      <SmartBarGate />
      {splash && <NewsController />}
      <div className="min-h-0 flex-1">{children}</div>
      {splash && TAB_ROUTES.has(pathname) && <BottomNav />}
      {splash && <SplashGate />}
    </div>
  )
}
