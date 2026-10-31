// El reproductor de SFX de la app: el par de web/src/lib/audio/sfx-engine.ts
// sobre expo-audio. Mismo trato que allá: un reproductor por sonido, monofonía
// por sonido (volver a tocarlo corta la voz anterior y arranca de cero),
// throttle de 40 ms y nada si la persona pidió menos movimiento.
//
// Los reproductores se arman UNA vez al arrancar (`precargarSfx`) y quedan
// vivos: crear uno en el momento del toque es lo que haría que el primer
// sonido llegue tarde.

import { AccessibilityInfo } from "react-native"
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio"

export type Sonido = { fuente: number; volumen: number }

const reproductores = new Map<string, AudioPlayer>()
const ultimoDisparo = new Map<string, number>()
const THROTTLE_MS = 40

let menosMovimiento = false
let precargado = false

export function precargarSfx(sonidos: Record<string, Sonido>): void {
  if (precargado) return
  precargado = true
  // Efectos de interfaz: no cortan la música de otra app y respetan el
  // silencio del teléfono, como el audio web en iOS.
  void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(
    () => {},
  )
  void AccessibilityInfo.isReduceMotionEnabled()
    .then((v) => {
      menosMovimiento = v
    })
    .catch(() => {})
  AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => {
    menosMovimiento = v
  })
  for (const [nombre, { fuente, volumen }] of Object.entries(sonidos)) {
    try {
      const reproductor = createAudioPlayer(fuente)
      reproductor.volume = volumen
      reproductores.set(nombre, reproductor)
    } catch {
      // Sin ese sonido el juego sigue igual.
    }
  }
}

export function playSfx(nombre: string): void {
  if (menosMovimiento) return
  const ahora = Date.now()
  if (ahora - (ultimoDisparo.get(nombre) ?? 0) < THROTTLE_MS) return
  ultimoDisparo.set(nombre, ahora)
  const reproductor = reproductores.get(nombre)
  if (!reproductor) return
  try {
    void reproductor.seekTo(0).catch(() => {})
    reproductor.play()
  } catch {
    // Un sonido que falla no puede romper el toque que lo disparó.
  }
}
