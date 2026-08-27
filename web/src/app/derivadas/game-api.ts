// Cliente tipado del minijuego: el createApiClient de siempre (Clerk si hay
// sesión) más el header X-Game-Token del guest. El backend prioriza Clerk y,
// si además viaja el token de guest, linkea solo al volver del OAuth.

import type { Client, Middleware } from "openapi-fetch"
import { createApiClient } from "@/lib/api/client"
import type { paths } from "@/lib/api/schema"
import { readGameToken } from "./game-storage"

export function createGameApiClient(
  getToken?: () => string | null | Promise<string | null>,
): Client<paths> {
  const client = createApiClient(getToken)
  const gameTokenMiddleware: Middleware = {
    async onRequest({ request }) {
      // Se lee por request y no al construir: el token aparece recién después
      // del primer POST /player.
      const token = readGameToken()
      if (token) request.headers.set("X-Game-Token", token)
      return request
    },
  }
  client.use(gameTokenMiddleware)
  return client
}
