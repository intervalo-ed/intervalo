"use client"

import { useSound } from "@web-kits/audio/react"

const SOUND_PATHS = {
  pop: "/pop.mp3",
  select: "/select_sound.mp3",
  continue: "/continue_sound.mp3",
  correct: "/correct_sound.mp3",
  wrong: "/wrong_sound.mp3",
  iterate: "/iterate_sound.mp3",
  start: "/pop_start.mp3",
  end: "/pop_terminar_repaso.mp3",
  xpCount: "/pop_conteo_experiencia.mp3",
} as const

export type SfxName = keyof typeof SOUND_PATHS

const VOLUME = 0.2

// sustain: 1 prevents the library's default 0.5s fade-out on sample playback
const FLAT_ENVELOPE = { decay: 3, sustain: 1 }

export function useSfx(): Record<SfxName, () => void> {
  return {
    pop: useSound({ source: { type: "sample", url: SOUND_PATHS.pop }, envelope: FLAT_ENVELOPE }, { volume: VOLUME }),
    select: useSound({ source: { type: "sample", url: SOUND_PATHS.select }, envelope: FLAT_ENVELOPE }, { volume: VOLUME * 0.5 }),
    continue: useSound({ source: { type: "sample", url: SOUND_PATHS.continue }, envelope: FLAT_ENVELOPE }, { volume: VOLUME }),
    correct: useSound({ source: { type: "sample", url: SOUND_PATHS.correct }, envelope: FLAT_ENVELOPE }, { volume: VOLUME }),
    wrong: useSound({ source: { type: "sample", url: SOUND_PATHS.wrong }, envelope: FLAT_ENVELOPE }, { volume: VOLUME }),
    iterate: useSound({ source: { type: "sample", url: SOUND_PATHS.iterate }, envelope: FLAT_ENVELOPE }, { volume: VOLUME * 0.5 }),
    start: useSound({ source: { type: "sample", url: SOUND_PATHS.start }, envelope: FLAT_ENVELOPE }, { volume: VOLUME }),
    end: useSound({ source: { type: "sample", url: SOUND_PATHS.end }, envelope: FLAT_ENVELOPE }, { volume: VOLUME }),
    xpCount: useSound({ source: { type: "sample", url: SOUND_PATHS.xpCount }, envelope: FLAT_ENVELOPE }, { volume: VOLUME }),
  }
}
