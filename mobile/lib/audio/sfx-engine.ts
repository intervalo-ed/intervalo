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

// El tick del conteo de XP es el único sonido POLIFÓNICO, como en la web: cada
// paso cae cada vez más rápido (hasta 45 ms) y el tick dura 240 ms, así que con
// un solo reproductor cada paso cortaría la cola del anterior —o, peor, el
// `seekTo` todavía en vuelo— y el conteo tartamudearía. Va rotando entre unas
// voces: con seis, a la velocidad máxima, ninguna se reusa mientras suena.
// Sin throttle: la secuencia es deliberada y no hay doble toque que filtrar.
const VOCES_DEL_TICK = 6
const vocesDelTick: AudioPlayer[] = []
let proximaVoz = 0

/** Arma las voces del tick. Va después de `precargarSfx`, que fija el modo de
 *  audio y escucha la preferencia de menos movimiento. */
export function precargarTick({ fuente, volumen }: Sonido): void {
  if (vocesDelTick.length > 0) return
  for (let i = 0; i < VOCES_DEL_TICK; i++) {
    try {
      const voz = createAudioPlayer(fuente)
      voz.volume = volumen
      // Sin corrección: el tono tiene que subir con la velocidad, que es todo
      // el punto de que el conteo "suba".
      voz.shouldCorrectPitch = false
      vocesDelTick.push(voz)
    } catch {
      // Sin tick el conteo sigue igual, mudo.
    }
  }
}

export function playTick({ rate }: { rate: number }): void {
  if (menosMovimiento || vocesDelTick.length === 0) return
  const voz = vocesDelTick[proximaVoz % vocesDelTick.length]
  proximaVoz = (proximaVoz + 1) % vocesDelTick.length
  try {
    voz.setPlaybackRate(rate)
    void voz.seekTo(0).catch(() => {})
    voz.play()
  } catch {
    // Un tick que falla no puede cortar el conteo.
  }
}
