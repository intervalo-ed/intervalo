"use client"

import { GameApiProvider } from "@intervalo/dx-core/juego/game-api-context"
import { useClerkGameApi } from "@/app/derivadas/UseGameApi"

// Arriba de todo y no solo en /derivadas: el panel del café también se abre
// desde el perfil de Intervalo clásico (components/cafecito-sheet.tsx).
export function GameApiDeLaWeb({ children }: { children: React.ReactNode }) {
  const api = useClerkGameApi()
  return <GameApiProvider value={api}>{children}</GameApiProvider>
}
