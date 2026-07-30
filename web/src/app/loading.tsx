"use client"

import { usePathname } from "next/navigation"
import { Screen } from "@/components/ui/screen"
import { TabLoadingShell } from "@/components/tab-loading-shell"

// Mismo shell/skeleton que el overlay de transición de tabs (ver
// tab-transition.ts) — este boundary solo debería llegar a pintarse en casos
// borde (navegación directa, refresh) porque el overlay client-side ya tapa
// el contenido antes de que Next dispare esta ruta. Solo tiene sentido para
// "/" — chequeamos el pathname por las dudas de que este boundary raíz
// llegue a intervenir en la navegación hacia otra ruta (p. ej. /session/...).
export default function Loading() {
  const pathname = usePathname()
  if (pathname !== "/") return <Screen>{null}</Screen>

  return <TabLoadingShell tab="/" />
}
