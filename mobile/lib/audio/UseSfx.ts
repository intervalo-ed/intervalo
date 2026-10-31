// Los sonidos del juego, con los mismos nombres y volúmenes que la web
// (web/src/lib/audio/useSfx.ts). Los del camino del ejercicio y el tick del
// conteo de XP; los de las sesiones todavía no.

import { useCallback, useMemo } from "react"
import { isSoundMuted } from "./sound-settings"
import { playSfx, playTick, precargarSfx, precargarTick, type Sonido } from "./sfx-engine"

const VOLUME = 0.1

const SONIDOS = {
  select: { fuente: require("@/assets/sounds/select_sound_knife.mp3"), volumen: VOLUME * 0.4 },
  continue: { fuente: require("@/assets/sounds/continue_sound.mp3"), volumen: VOLUME },
  correct: { fuente: require("@/assets/sounds/correct_sound.mp3"), volumen: VOLUME },
  wrong: { fuente: require("@/assets/sounds/session_wrong.mp3"), volumen: VOLUME * 0.8 },
} satisfies Record<string, Sonido>

// El tick del conteo de XP: cada paso lo dispara con una velocidad que sube, y
// con ella el tono. Mismo volumen que en la web.
const TICK = { fuente: require("@/assets/sounds/tick.mp3"), volumen: VOLUME * 0.75 } satisfies Sonido

export type SfxName = keyof typeof SONIDOS

/** Arma los reproductores. Se llama durante el splash, sin esperar a nada. */
export function precargarSonidosDelJuego(): void {
  precargarSfx(SONIDOS)
  precargarTick(TICK)
}

/** El tick del conteo, para inyectarlo en `useXpConteo` de dx-core. Estable
 *  entre renders; el silencio se consulta en cada disparo. */
export function useTick(): (rate: number) => void {
  return useCallback((rate: number) => {
    if (isSoundMuted()) return
    playTick({ rate })
  }, [])
}

export function useSfx(): Record<SfxName, () => void> {
  // El silencio se consulta en cada disparo, como en la web.
  return useMemo(() => {
    const out = {} as Record<SfxName, () => void>
    for (const nombre of Object.keys(SONIDOS) as SfxName[]) {
      out[nombre] = () => {
        if (isSoundMuted()) return
        playSfx(nombre)
      }
    }
    return out
  }, [])
}
