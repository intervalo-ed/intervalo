"use client"

import { useSound } from "@web-kits/audio/react"

const SOUND_PATHS = {
  pop: "/pop.mp3",
  correct: "/pop_correct.mp3",
  wrong: "/pop_wrong.mp3",
  start: "/pop_start.mp3",
  end: "/pop_terminar_repaso.mp3",
  xpCount: "/pop_conteo_experiencia.mp3",
} as const

export type SfxName = keyof typeof SOUND_PATHS

export function useSfx({ name }: { name: SfxName }) {
  return useSound(
    { source: { type: "sample", url: SOUND_PATHS[name] } },
    { volume: 0.2 },
  )
}
