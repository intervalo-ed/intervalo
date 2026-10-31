// El par de `useGameIdentity` de la web (web/src/app/derivadas/game-telemetry.ts):
// la identidad del jugador como super propiedades, con el mismo prefijo `game_`
// y `null` cuando el dato falta.

import { useEffect } from "react"
import { posthog } from "./posthog"

export function useGameIdentity(
  player: { university?: string | null; career?: string | null; is_guest?: boolean } | null,
) {
  const hay = player !== null
  const uni = player?.university ?? null
  const career = player?.career ?? null
  const guest = player?.is_guest ?? null
  useEffect(() => {
    if (!hay) return
    void posthog?.register({ game_university: uni, game_career: career, game_is_guest: guest })
  }, [hay, uni, career, guest])
}
