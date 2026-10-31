import { createContext, useContext } from "react"
import type { Rescate } from "@intervalo/dx-core/juego/game-storage"

// Lo que encontró `restaurarToken()` en este arranque. Lo pone el layout raíz,
// que no deja montar ninguna pantalla hasta tenerlo.
const RescateContext = createContext<Rescate | null>(null)

export const RescateProvider = RescateContext.Provider

export function useRescate(): Rescate | null {
  return useContext(RescateContext)
}
