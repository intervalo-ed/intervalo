"use client"

import { useRef, useState } from "react"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { unwrap } from "@/lib/api/client"
import { normalizeUsername, validateUsername } from "@/lib/username"
import { useSfx } from "@/lib/audio/useSfx"
import { useGameApi } from "./UseGameApi"
import { gameKeys, type GamePlayer } from "./UseGamePlayer"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Primera vez en este dispositivo, antes de la primera derivada: el gancho de
// "elegí tu @" pero SIN pedir registro — la única edición gratis del alias
// (ver el carve-out de patch_me en backend/game/router.py). El Continuar
// NUNCA se bloquea: si el @ no cambió no se manda nada, y si cambió se manda
// y se ignora cualquier error (tomado, inválido, red) — se sigue jugando pase
// lo que pase.
export function UsernameSlide({
  player,
  onDone,
}: {
  player: GamePlayer
  onDone: () => void
}) {
  const api = useGameApi()
  const sfx = useSfx()
  const queryClient = useQueryClient()
  const [alias, setAlias] = useState(player.alias)
  const savingRef = useRef(false)
  const error = alias.length > 0 ? validateUsername(alias) : null

  const finish = async () => {
    if (savingRef.current) return
    savingRef.current = true
    sfx.continue()
    const changed = alias.length > 0 && !error && alias !== player.alias
    if (changed) {
      try {
        const updated = unwrap(await api.PATCH("/game/derivemos/me", { body: { alias } }))
        queryClient.setQueryData(gameKeys.me, updated)
        posthog.capture("game_username_slide_completed", { changed: true })
      } catch {
        posthog.capture("game_username_slide_completed", { changed: false })
      }
    } else {
      posthog.capture("game_username_slide_completed", { changed: false })
    }
    onDone()
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-bold">Elegí tu @</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Así te van a ver los demás en el ranking. Podés cambiarlo ahora, o
        seguir con este.
      </p>
      <div className="flex w-full max-w-xs items-center gap-1 rounded-md border border-[#7e80f7] bg-white/5 px-3">
        <span className="text-lg text-muted-foreground">@</span>
        <input
          type="text"
          value={alias}
          onChange={(e) => setAlias(normalizeUsername(e.target.value))}
          maxLength={15}
          className="h-[52px] w-full bg-transparent text-foreground outline-none"
        />
      </div>
      {error && <p className="text-sm text-orange-300">{error}</p>}
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button size="lg" className={ctaCls} onClick={() => void finish()}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
