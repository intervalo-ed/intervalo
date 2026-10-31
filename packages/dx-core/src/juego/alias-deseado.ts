// El @ que la persona escribió antes de irse a Google: sobrevive al viaje del
// OAuth (en la web, una recarga entera; en la app, la ventanita del sistema) y
// se aplica al volver, cuando el jugador ya es el de la cuenta.
//
// Misma clave que usaba la web en localStorage, así que quien tenía un deseo
// guardado antes de este cambio lo conserva.

import { almacen } from "../almacen/key-value-store"
import { unwrap } from "../api/client"
import type { GameApiClient } from "./game-api-context"
import type { GamePlayer } from "./game-keys"

export const DESIRED_ALIAS_KEY = "intervalo:game:desired-alias"

export function readDesiredAlias(): string | null {
  try {
    return almacen().store.get(DESIRED_ALIAS_KEY)
  } catch {
    return null
  }
}

export function clearDesiredAlias() {
  try {
    almacen().store.delete(DESIRED_ALIAS_KEY)
  } catch {}
}

/** Lo que la persona escribió como @ antes de irse a Google: se aplica al
 *  volver con `aplicarAliasDeseado`. */
export function saveDesiredAlias(alias: string) {
  try {
    const cleaned = alias.trim().toLowerCase().replace(/^@/, "")
    if (cleaned) almacen().store.set(DESIRED_ALIAS_KEY, cleaned)
  } catch {}
}

/** Al volver del OAuth —el bootstrap ya linkeó guest→user—, aplica el @ deseado.
 *
 *  Devuelve el jugador actualizado si lo cambió, `null` si no había nada que
 *  hacer o el PATCH falló. En cualquier caso el deseo se descarta: un 409 (@
 *  tomado) o un error de red dejan como definitivo el alias derivado del
 *  usuario de Google. */
export async function aplicarAliasDeseado({
  api,
  player,
}: {
  api: GameApiClient
  player: GamePlayer | null
}): Promise<GamePlayer | null> {
  if (!player || player.is_guest) return null
  const desired = readDesiredAlias()
  if (!desired || desired === player.alias) {
    clearDesiredAlias()
    return null
  }
  try {
    const updated = unwrap(
      await api.PATCH("/game/derivemos/me", { body: { alias: desired } }),
    )
    clearDesiredAlias()
    return updated
  } catch {
    clearDesiredAlias()
    return null
  }
}
