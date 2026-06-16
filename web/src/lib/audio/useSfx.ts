"use client"

import { useSound } from "@web-kits/audio/react"
import { useMemo } from "react"
import { isSoundMuted } from "./sound-settings"

const SOUND_PATHS = {
  pop: "/pop.mp3",
  select: "/select_sound_knife.mp3",
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

// Sonidos muteados temporalmente (hasta nuevo aviso): feedback negativo (`wrong`,
// en onboarding y sesiones) y `iterate` (botones play/pausa del onboarding y
// seleccionadores del modo zen). Para reactivarlos, vaciar este set.
const MUTED_SFX = new Set<SfxName>(["wrong", "iterate"])

// sustain: 1 prevents the library's default 0.5s fade-out on sample playback
const FLAT_ENVELOPE = { decay: 3, sustain: 1 }

// Ventana mínima entre dos disparos del MISMO sonido. Corta el "machine-gun" al
// tocar muchos botones seguidos, principal causa del salto de volumen por
// solapamiento de muestras idénticas en fase.
const RETRIGGER_MS = 55

// Release corto (anti-click) al cortar la voz previa: la deja en silencio en
// ~5 ms, antes de que la nueva entre, así dos copias nunca se solapan en fase.
const STOP_RELEASE_S = 0.005

type Voice = ReturnType<ReturnType<typeof useSound>>

// Estado GLOBAL (a nivel de módulo, no por componente). Antes eran `useRef`, así
// que cada componente tenía su propio registro: dos componentes —o un doble
// evento pointer+click— disparaban la MISMA muestra a la vez y se sumaban en
// fase. Compartiéndolo, la monofonía y el throttle valen entre todos.
const activeVoices: Partial<Record<SfxName, Voice>> = {}
const lastFiredAt: Partial<Record<SfxName, number>> = {}

export function useSfx(): Record<SfxName, () => void> {
  const raw: Record<SfxName, () => Voice> = {
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

  // Cada disparo consulta la preferencia en el momento, así un cambio en Ajustes
  // surte efecto sin re-montar los componentes que ya tienen el hook.
  return useMemo(() => {
    const wrapped = {} as Record<SfxName, () => void>
    for (const name of Object.keys(raw) as SfxName[]) {
      wrapped[name] = () => {
        if (MUTED_SFX.has(name)) return
        if (isSoundMuted()) return

        const now =
          typeof performance !== "undefined" ? performance.now() : Date.now()
        if (now - (lastFiredAt[name] ?? 0) < RETRIGGER_MS) return
        lastFiredAt[name] = now

        // Monofónico: cortamos en seco la instancia previa del mismo sonido para
        // que dos copias idénticas no se sumen en fase (volumen alto / clipping).
        const prev = activeVoices[name]
        if (prev) {
          try {
            prev.stop(STOP_RELEASE_S)
          } catch {
            // la voz ya terminó; ignorar
          }
        }
        activeVoices[name] = raw[name]()
      }
    }
    return wrapped
    // raw[name] son callbacks estables de useSound (useCallback con deps []).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
