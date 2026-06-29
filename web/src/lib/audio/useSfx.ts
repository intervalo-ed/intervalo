"use client"

import { useMemo } from "react"
import { isSoundMuted } from "./sound-settings"
import { playSfx, playTick } from "./sfx-engine"

const SOUND_PATHS = {
  pop: "/pop.mp3",
  select: "/select_sound_knife.mp3",
  continue: "/continue_sound.mp3",
  correct: "/correct_sound.mp3",
  wrong: "/session_wrong.mp3",
  iterate: "/iterate_sound.mp3",
  start: "/session_start.mp3",
  charge: "/session_charge.mp3",
  end: "/session_complete.mp3",
  xpCount: "/pop_conteo_experiencia.mp3",
} as const

export type SfxName = keyof typeof SOUND_PATHS

// Nivel efectivo que llega al master. Equivale al volumen audible previo: la
// librería multiplicaba opts.volume (0.2) por un gain de capa de 0.5.
const VOLUME = 0.1

const SOUND_VOLUME: Record<SfxName, number> = {
  pop: VOLUME,
  select: VOLUME * 0.5,
  continue: VOLUME,
  correct: VOLUME,
  wrong: VOLUME,
  iterate: VOLUME * 0.5,
  start: VOLUME * 0.7,
  charge: VOLUME * 1.2,
  end: VOLUME * 2.1,
  xpCount: VOLUME,
}

// Sonidos muteados temporalmente (hasta nuevo aviso): `iterate` (botones
// play/pausa del onboarding y seleccionadores del modo zen). Para reactivarlos,
// vaciar este set.
const MUTED_SFX = new Set<SfxName>(["iterate"])

// Tick suelto a un pitch dado (1 = original). Pensado para las secuencias de
// conteo del resumen (XP y ejercicios); cada paso del conteo dispara un tick.
// Todos los ticks comparten el mismo volumen.
const TICK_VOLUME = VOLUME * 0.75

export function useTick(url = "/tick.mp3"): (rate: number) => void {
  return useMemo(
    () => (rate: number) => {
      if (isSoundMuted()) return
      playTick(url, { rate, volume: TICK_VOLUME })
    },
    [url],
  )
}

export function useSfx(): Record<SfxName, () => void> {
  // Cada disparo consulta el mute en el momento, así un cambio en Ajustes surte
  // efecto sin re-montar los componentes que ya tienen el hook.
  return useMemo(() => {
    const out = {} as Record<SfxName, () => void>
    for (const name of Object.keys(SOUND_PATHS) as SfxName[]) {
      out[name] = () => {
        if (MUTED_SFX.has(name)) return
        if (isSoundMuted()) return
        playSfx(name, SOUND_PATHS[name], SOUND_VOLUME[name])
      }
    }
    return out
  }, [])
}
