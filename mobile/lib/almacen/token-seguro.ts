// Respaldo del `guest_token` en el llavero (Keychain / Keystore). Es el
// equivalente nativo de la cookie de la web: MMKV vive en el sandbox de la app y
// se va con ella, el llavero de iOS sobrevive a desinstalar y reinstalar.

import * as SecureStore from "expo-secure-store"
import {
  adoptarTokenDeRescate,
  type Rescate,
} from "@intervalo/dx-core/juego/game-storage"

const CLAVE = "intervalo.game.token"

// Cuál token ya se mandó al llavero en este arranque. El alta lo guarda una vez
// y el rescate lo vuelve a guardar apenas lo adopta.
let enElLlavero: string | null = null

/** El `espejarToken` que recibe game-storage. Sin `await` y tragando el error a
 *  propósito: es un respaldo y que falle no puede frenar el arranque. */
export function espejarTokenEnLlavero(token: string | null) {
  if (token === null) {
    enElLlavero = null
    void SecureStore.deleteItemAsync(CLAVE).catch(() => {})
    return
  }
  if (enElLlavero === token) return
  enElLlavero = token
  void SecureStore.setItemAsync(CLAVE, token).catch(() => {
    enElLlavero = null
  })
}

/** Lee el respaldo y lo adopta si MMKV no tiene token. Tiene que terminar antes
 *  del alta, para que el POST /player salga con el token de siempre. */
export async function restaurarToken(): Promise<Rescate> {
  let delLlavero: string | null = null
  try {
    delLlavero = await SecureStore.getItemAsync(CLAVE)
  } catch {
    delLlavero = null
  }
  return adoptarTokenDeRescate(delLlavero)
}
