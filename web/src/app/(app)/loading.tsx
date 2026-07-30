"use client"

import { usePathname } from "next/navigation"
import { Screen } from "@/components/ui/screen"
import { TabLoadingShell, type TabRoute } from "@/components/tab-loading-shell"

const TAB_ROUTES = new Set<string>(["/practice", "/leaderboard", "/profile"])

// Mismo shell/skeleton que el overlay de transición de tabs (ver
// tab-transition.ts) — este boundary solo debería llegar a pintarse en casos
// borde (navegación directa, refresh) porque el overlay client-side ya tapa
// el contenido antes de que Next dispare esta ruta.
export default function Loading() {
  const pathname = usePathname()

  // Entrar a una sesión no debería mostrar un skeleton de otra pestaña (venía
  // cayendo acá en el LeaderboardSkeleton): pantalla vacía, el runner se hace
  // cargo del resto con su propio fade-in.
  if (pathname?.startsWith("/session")) {
    return <Screen>{null}</Screen>
  }

  if (!TAB_ROUTES.has(pathname)) return <Screen>{null}</Screen>

  return <TabLoadingShell tab={pathname as TabRoute} />
}
