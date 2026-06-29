"use client"

// Reproductor de SFX de UI sobre Web Audio a GANANCIA CONSTANTE.
//
// Evita el envelope de @web-kits/audio (que usa setTargetAtTime), causa del
// salto de volumen en WebKit/iOS: ahí setTargetAtTime salta la ganancia al
// default del GainNode (1.0) por un instante (bug conocido, Mozilla #1213313 /
// WebAudio #510). Acá la ganancia se fija con `.value` (sin automatización
// ascendente) y solo se hace un fade lineal corto al cortar la voz previa.
//
// Además garantiza monofonía GLOBAL por sonido: antes de arrancar una voz corta
// la anterior del mismo sonido, así dos copias idénticas no se solapan.

let ctx: AudioContext | null = null
let master: GainNode | null = null

function getContext(): AudioContext {
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioContext()
    master = null
  }
  if (ctx.state === "suspended") void ctx.resume()
  if (!master) {
    master = ctx.createGain()
    // Red de seguridad muy por encima del nivel de un sonido suelto (≈ -20 dBFS).
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -10
    limiter.knee.value = 0
    limiter.ratio.value = 12
    limiter.attack.value = 0.003
    limiter.release.value = 0.15
    master.connect(limiter)
    limiter.connect(ctx.destination)
  }
  return ctx
}

const bufferCache = new Map<string, Promise<AudioBuffer>>()

function loadBuffer(url: string): Promise<AudioBuffer> {
  let pending = bufferCache.get(url)
  if (!pending) {
    pending = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => getContext().decodeAudioData(data))
    bufferCache.set(url, pending)
  }
  return pending
}

type Voice = { source: AudioBufferSourceNode; gain: GainNode }

// Estado GLOBAL (a nivel de módulo) compartido por todos los componentes.
const activeVoices = new Map<string, Voice>()
const lastFiredAt = new Map<string, number>()

const THROTTLE_MS = 40
const STOP_FADE_S = 0.006

function stopVoice(voice: Voice): void {
  if (!ctx) return
  const now = ctx.currentTime
  try {
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now)
    voice.gain.gain.linearRampToValueAtTime(0, now + STOP_FADE_S)
    voice.source.stop(now + STOP_FADE_S + 0.01)
  } catch {
    // la voz ya terminó; ignorar
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

// Reproduce un tick suelto a un pitch dado (playbackRate). A diferencia de
// playSfx es POLIFÓNICO y sin throttle: está pensado para disparar una secuencia
// corta y deliberada de ticks (p. ej. el conteo de XP del resumen), donde cada
// tick puede solaparse apenas con la cola del anterior sin cortarse.
export function playTick(
  url: string,
  { rate = 1, volume }: { rate?: number; volume: number },
): void {
  if (typeof window === "undefined" || prefersReducedMotion()) return
  void loadBuffer(url).then((buffer) => {
    const audioCtx = getContext()
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = rate
    const gain = audioCtx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(master!)
    source.onended = () => {
      try {
        gain.disconnect()
      } catch {
        // ya desconectado
      }
    }
    source.start()
  })
}

export function playSfx(name: string, url: string, volume: number): void {
  if (typeof window === "undefined" || prefersReducedMotion()) return

  const now = performance.now()
  if (now - (lastFiredAt.get(name) ?? 0) < THROTTLE_MS) return
  lastFiredAt.set(name, now)

  const prev = activeVoices.get(name)
  if (prev) {
    stopVoice(prev)
    activeVoices.delete(name)
  }

  void loadBuffer(url).then((buffer) => {
    const audioCtx = getContext()
    const source = audioCtx.createBufferSource()
    source.buffer = buffer
    const gain = audioCtx.createGain()
    gain.gain.value = volume
    source.connect(gain)
    gain.connect(master!)

    const voice: Voice = { source, gain }
    source.onended = () => {
      try {
        gain.disconnect()
      } catch {
        // ya desconectado
      }
      if (activeVoices.get(name) === voice) activeVoices.delete(name)
    }
    activeVoices.set(name, voice)
    source.start()
  })
}
