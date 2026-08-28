"use client"

import { useEffect } from "react"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import { SmartBarGate } from "@/components/smart-bar"
import { SplashGate } from "@/components/splash-gate"
import { NewsController } from "@/app/news-controller"
import {
  resetSessionTransition,
  useSessionTransitionLeaving,
} from "@/lib/nav/session-transition"
import { clearTabTransition, usePendingTab } from "@/lib/nav/tab-transition"
import { TabLoadingShell, type TabRoute } from "@/components/tab-loading-shell"
import { usePathname } from "next/navigation"

// Las 4 pantallas de la tab bar. Vive acá (layout raíz) en vez de en cada
// página para que quede montada una sola vez y nunca se desmonte al navegar
// entre ellas ni durante el fallback de loading.tsx (que solo reemplaza
// `children`, no AppChrome) — antes parpadeaba/desaparecía solo en "/".
const TAB_ROUTES = new Set<string>(["/", "/practice", "/leaderboard", "/profile"])

// El minijuego de derivadas tiene su propio splash ("derivadas", con el logo
// que después vuela a su lugar) y lo muestra a todo el mundo, con sesión o sin
// ella. El del shell solo lo ven los logueados, así que sin esta exclusión un
// usuario de Intervalo vería dos splashes seguidos al abrir el juego.
const GAME_ROUTE_PREFIX = "/derivadas"

export default function AppChrome({
  children,
  splash,
}: {
  children: React.ReactNode
  splash: boolean
}) {
  const pathname = usePathname()
  const leaving = useSessionTransitionLeaving()
  const onTabRoute = TAB_ROUTES.has(pathname)
  const onGameRoute = pathname.startsWith(GAME_ROUTE_PREFIX)
  const pendingTab = usePendingTab()

  // Apaga la bandera de "yéndome a una sesión" apenas se aterriza de nuevo en
  // cualquiera de las 4 rutas de la tab bar (volviendo del resumen, o
  // simplemente navegando por la tab bar mientras tanto).
  useEffect(() => {
    if (onTabRoute) resetSessionTransition()
  }, [onTabRoute])

  // Apaga la transición de tab apenas el pathname real coincide con el
  // destino (la página ya montó y se hace cargo de su propio skeleton
  // in-page desde ahí). Chequeo defensivo por si el click quedó "pegado" al
  // volver a la misma tab por otro medio (back/forward).
  useEffect(() => {
    if (pendingTab !== null && pathname === pendingTab) clearTabTransition()
  }, [pathname, pendingTab])

  const showTabOverlay = pendingTab !== null && pendingTab !== pathname

  return (
    <div className="app-shell flex h-dvh flex-col">
      <SmartBarGate />
      {splash && <NewsController />}
      <div className="relative min-h-0 flex-1">
        {children}
        {/* Tapa el contenido de la tab actual con el skeleton de la tab de
            destino al instante del click, sin esperar al timing de
            Suspense/loading.tsx de Next (ver tab-transition.ts). */}
        {showTabOverlay && (
          <div className="absolute inset-0 z-10 bg-background">
            <TabLoadingShell tab={pendingTab as TabRoute} />
          </div>
        )}
      </div>
      {splash && onTabRoute && (
        <BottomNav
          className={cn(
            "transition-opacity duration-200",
            leaving && "pointer-events-none opacity-0",
          )}
        />
      )}
      {splash && !onGameRoute && <SplashGate />}
    </div>
  )
}
