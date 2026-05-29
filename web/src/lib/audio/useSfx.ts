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

const VOLUME = 0.2

export function useSfx(): Record<SfxName, () => void> {
  return {
    pop: useSound({ source: { type: "sample", url: SOUND_PATHS.pop } }, { volume: VOLUME }),
    correct: useSound({ source: { type: "sample", url: SOUND_PATHS.correct } }, { volume: VOLUME }),
    wrong: useSound({ source: { type: "sample", url: SOUND_PATHS.wrong } }, { volume: VOLUME }),
    start: useSound({ source: { type: "sample", url: SOUND_PATHS.start } }, { volume: VOLUME }),
    end: useSound({ source: { type: "sample", url: SOUND_PATHS.end } }, { volume: VOLUME }),
    xpCount: useSound({ source: { type: "sample", url: SOUND_PATHS.xpCount } }, { volume: VOLUME }),
  }
}
