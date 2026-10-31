import { useMemo } from "react"
import { Platform } from "react-native"
import { useAuth } from "@clerk/expo"
import { createGameApiClient, type GamePlatform } from "@intervalo/dx-core/juego/game-api"
import { env } from "@/lib/env"

// La app solo corre en iOS y Android; cualquier otra cosa se reporta como lo que
// el backend entiende por «no es un teléfono».
const plataforma: GamePlatform =
  Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "desktop"

// El cliente del juego de la app, el par de `useClerkGameApi` de la web. Se lee
// con `useGameApi()` de dx-core, que lo toma del `GameApiProvider` del layout.
export function useGameApiNativo() {
  const { getToken } = useAuth()
  return useMemo(
    () =>
      createGameApiClient({
        baseUrl: env.apiUrl,
        getToken,
        getPlatform: () => plataforma,
      }),
    [getToken],
  )
}
