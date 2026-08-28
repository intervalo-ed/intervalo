// Cliente tipado del minijuego: el createApiClient de siempre (Clerk si hay
// sesión) más dos headers propios — X-Game-Token del invitado y
// X-Game-Platform. El backend prioriza Clerk y, si además viaja el token de
// invitado, linkea solo al volver del OAuth.

import type { Client, Middleware } from "openapi-fetch"
import { createApiClient } from "@/lib/api/client"
import type { paths } from "@/lib/api/schema"
import { getPlatform } from "@/lib/platform/detect"
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
      // La plataforma la manda el CLIENTE y no la deduce el server del
      // User-Agent, aunque tenga el header a mano: el layout lo elige
      // `getPlatform()`, que además del UA mira `maxTouchPoints` porque un iPad
      // se reporta como Macintosh. Deducirla en el server daría "desktop" para
      // un iPad que en realidad está jugando el flujo de teléfono, y el panel
      // diría lo contrario de lo que pasó. El cliente es la autoridad porque es
      // el que decidió.
      request.headers.set("X-Game-Platform", getPlatform())
      return request
    },
  }
  client.use(gameTokenMiddleware)
  return client
}
