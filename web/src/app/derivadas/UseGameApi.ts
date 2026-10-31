"use client"

import { useMemo } from "react"
import { useAuth } from "@clerk/nextjs"
import { createGameApiClient } from "@intervalo/dx-core/juego/game-api"
import { BASE_URL } from "@/lib/api/client"
import { getPlatform } from "@/lib/platform/detect"

// Arma el cliente del juego de la web. Se lee con `useGameApi()` de dx-core, que
// lo toma del `GameApiProvider` que monta `GameApiDeLaWeb` en app/providers.tsx.
export function useClerkGameApi() {
  const { getToken } = useAuth()
  return useMemo(
    () => createGameApiClient({ baseUrl: BASE_URL, getToken, getPlatform }),
    [getToken],
  )
}
