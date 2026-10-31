// Los sonidos del juego, con los mismos nombres y volúmenes que la web
// (web/src/lib/audio/useSfx.ts). Solo los del camino del ejercicio: los de las
// sesiones y el conteo de XP llegan con el ranking.

import { useMemo } from "react"
import { isSoundMuted } from "./sound-settings"
import { playSfx, precargarSfx, type Sonido } from "./sfx-engine"

const VOLUME = 0.1

const SONIDOS = {
  select: { fuente: require("@/assets/sounds/select_sound_knife.mp3"), volumen: VOLUME * 0.4 },
  continue: { fuente: require("@/assets/sounds/continue_sound.mp3"), volumen: VOLUME },
  correct: { fuente: require("@/assets/sounds/correct_sound.mp3"), volumen: VOLUME },
  wrong: { fuente: require("@/assets/sounds/session_wrong.mp3"), volumen: VOLUME * 0.8 },
} satisfies Record<string, Sonido>

export type SfxName = keyof typeof SONIDOS

/** Arma los reproductores. Se llama durante el splash, sin esperar a nada. */
export function precargarSonidosDelJuego(): void {
  precargarSfx(SONIDOS)
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
