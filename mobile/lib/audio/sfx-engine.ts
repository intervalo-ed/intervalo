// El reproductor de SFX de la app: el par de web/src/lib/audio/sfx-engine.ts
// sobre expo-audio. Mismo trato que allá: monofonía por sonido (volver a tocarlo
// corta la voz anterior y arranca de cero), throttle de 40 ms y nada si la
// persona pidió menos movimiento. El tick del conteo es polifónico y sin
// throttle.
//
// Tres cosas que expo-audio hace en iOS y que, sin cuidado, se oyen como
// «a veces no suena» o «suena tarde»:
//
//   1. Suelta la sesión de audio ~100 ms después de que termina cada sonido, y
//      la reactiva en el siguiente `play()`: ese `play()` llega tarde o sin su
//      arranque. Se evita con `keepAudioSessionActive`.
//   2. `seekTo` es asíncrono. Hacer `seekTo(0)` y `play()` seguidos deja una
//      carrera: el `play()` sale desde donde quedó el reproductor (el final del
//      archivo) o el seek en vuelo le pisa el arranque. Acá el rebobinado nunca
//      está en el camino del disparo: cada voz se rebobina apenas termina (o la
//      cortan) y el disparo es solo `play()` sobre una voz que ya está en 0.
//   3. Un reproductor solo no puede sonar dos veces a la vez. Cada sonido tiene
//      un puñado de voces y cada disparo usa una libre.
//
// Cada voz es una máquina de tres estados con UN solo lugar donde cambian
// (`pasarA`): libre (quieta en 0) → sonando → rebobinando → libre. `generacion`
// sube en cada cambio, y todo lo asíncrono (el seek, el aviso de que terminó)
// se anota con la que tenía al salir: si cuando vuelve la voz ya es otra cosa,
// lo que traía es viejo y se descarta.
//
// Todo se arma UNA vez al arrancar (`precargarSfx`) y queda vivo: crear un
// reproductor en el momento del toque es lo que haría llegar tarde al primero.

import { AccessibilityInfo } from "react-native"
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio"

export type Sonido = { fuente: number; volumen: number }

type Estado = "libre" | "sonando" | "rebobinando"

type Voz = {
  reproductor: AudioPlayer
  estado: Estado
  generacion: number
  /** Cuándo cambió de estado por última vez (para elegir a quién robarle). */
  desde: number
  /** El último `rate` aplicado, para no reconfigurar el reproductor de gusto. */
  rate: number
  volumen: number
  /** Sacar el listener de estado del reproductor. */
  soltarListener: () => void
}

const THROTTLE_MS = 40
const VOCES_DEL_SFX = 3
// El tick dura 240 ms y cae cada vez más rápido (hasta 45 ms): a esa velocidad
// hay ~6 sonando a la vez, y las dos de más son margen para la demora de JS en
// avisar que una terminó.
const VOCES_DEL_TICK = 8
// Un «terminó» que llega apenas después de arrancar la voz no es de esta
// reproducción: es el eco del estado de la anterior.
const ECO_MS = 30
const CALENTAMIENTO_MAX_MS = 500

const grupos = new Map<string, Voz[]>()
const ultimaVoz = new Map<string, Voz>()
const ultimoDisparo = new Map<string, number>()
let vocesDelTick: Voz[] = []
let soltarMenosMovimiento: (() => void) | null = null

let menosMovimiento = false
let precargado = false

function pasarA({ voz, estado }: { voz: Voz; estado: Estado }): number {
  voz.estado = estado
  voz.desde = Date.now()
  voz.generacion += 1
  return voz.generacion
}

/** Corta la voz y la rebobina; al volver el seek queda libre, salvo que en el
 *  medio alguien la haya vuelto a usar. */
function rebobinar(voz: Voz): Promise<boolean> {
  try {
    voz.reproductor.pause()
  } catch {
    // ya terminó
  }
  const generacion = pasarA({ voz, estado: "rebobinando" })
  return voz.reproductor
    .seekTo(0)
    .catch(() => {})
    .then(() => {
      if (voz.generacion !== generacion) return false
      pasarA({ voz, estado: "libre" })
      return true
    })
}

function armarVoz({
  fuente,
  volumen,
  sinCorreccionDeTono,
  alEstado,
}: {
  fuente: number
  volumen: number
  sinCorreccionDeTono?: boolean
  alEstado?: (voz: Voz, playing: boolean) => void
}): Voz | null {
  try {
    const reproductor = createAudioPlayer(fuente, {
      // Que la sesión no se suelte entre sonido y sonido (ver arriba, punto 1).
      keepAudioSessionActive: true,
      // El estado solo se usa para saber cuándo terminó.
      updateInterval: 250,
    })
    reproductor.volume = volumen
    // Sin corrección: en el tick el tono tiene que subir con la velocidad, que
    // es todo el punto de que el conteo "suba".
    if (sinCorreccionDeTono) reproductor.shouldCorrectPitch = false
    const voz: Voz = {
      reproductor,
      estado: "libre",
      generacion: 0,
      desde: 0,
      rate: 1,
      volumen,
      soltarListener: () => {},
    }
    const suscripcion = reproductor.addListener("playbackStatusUpdate", (estado) => {
      alEstado?.(voz, estado.playing)
      // Solo una voz que está sonando puede «terminar», y no con el eco de la
      // reproducción anterior.
      if (
        estado.didJustFinish &&
        !estado.playing &&
        voz.estado === "sonando" &&
        Date.now() - voz.desde > ECO_MS
      ) {
        void rebobinar(voz)
      }
    })
    voz.soltarListener = () => suscripcion.remove()
    return voz
  } catch {
    return null
  }
}

function soltarVoz(voz: Voz): void {
  voz.soltarListener()
  try {
    voz.reproductor.remove()
  } catch {
    // ya liberado
  }
}

/** Una voz libre; si no queda ninguna, le roba una: primero a las que ya se
 *  están rebobinando (están cortadas), después a la que lleva más sonando. */
function tomarVoz(voces: Voz[]): Voz | null {
  let libre: Voz | null = null
  let robable: Voz | null = null
  for (const voz of voces) {
    if (voz.estado === "libre") {
      if (libre === null || voz.desde < libre.desde) libre = voz
    } else if (
      robable === null ||
      (voz.estado === "rebobinando" && robable.estado === "sonando") ||
      (voz.estado === robable.estado && voz.desde < robable.desde)
    ) {
      robable = voz
    }
  }
  return libre ?? robable
}

function disparar({ voz, rate }: { voz: Voz; rate?: number }): void {
  const arrancar = () => {
    try {
      if (rate !== undefined && rate !== voz.rate) {
        voz.reproductor.setPlaybackRate(rate)
        voz.rate = rate
      }
      pasarA({ voz, estado: "sonando" })
      voz.reproductor.play()
    } catch {
      // Un sonido que falla no puede romper el toque que lo disparó.
      pasarA({ voz, estado: "libre" })
    }
  }
  if (voz.estado === "libre") {
    arrancar()
    return
  }
  // Voz robada: se la corta y se espera su rebobinado. Si en el medio otro
  // disparo la volvió a robar, el rebobinado dice que ya no es suya.
  void rebobinar(voz).then((sigueLibre) => {
    if (sigueLibre) arrancar()
  })
}

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
  const suscripcion = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => {
    menosMovimiento = v
  })
  soltarMenosMovimiento = () => suscripcion.remove()
  for (const [nombre, { fuente, volumen }] of Object.entries(sonidos)) {
    const voces: Voz[] = []
    for (let i = 0; i < VOCES_DEL_SFX; i++) {
      const voz = armarVoz({ fuente, volumen })
      if (voz) voces.push(voz)
    }
    // Sin ese sonido el juego sigue igual.
    if (voces.length > 0) grupos.set(nombre, voces)
  }
}

export function playSfx(nombre: string): void {
  if (menosMovimiento) return
  const ahora = Date.now()
  if (ahora - (ultimoDisparo.get(nombre) ?? 0) < THROTTLE_MS) return
  ultimoDisparo.set(nombre, ahora)
  const voces = grupos.get(nombre)
  if (!voces) return

  // Monofonía por sonido: la copia anterior se corta antes de arrancar la nueva.
  const previa = ultimaVoz.get(nombre)
  if (previa?.estado === "sonando") void rebobinar(previa)

  const voz = tomarVoz(voces)
  if (!voz) return
  ultimaVoz.set(nombre, voz)
  disparar({ voz })
}

/** Arma las voces del tick. Va después de `precargarSfx`, que fija el modo de
 *  audio y escucha la preferencia de menos movimiento. */
export function precargarTick({ fuente, volumen }: Sonido): void {
  if (vocesDelTick.length > 0) return
  for (let i = 0; i < VOCES_DEL_TICK; i++) {
    const voz = armarVoz({
      fuente,
      volumen,
      sinCorreccionDeTono: true,
      alEstado: alEstadoDelCalentamiento,
    })
    if (voz) vocesDelTick.push(voz)
  }
  calentar()
}

// El primer sonido de la sesión paga el arranque del hardware de audio. Se lo
// hacemos pagar a un tick mudo: arranca recién cuando el reproductor avisa que
// está sonando (antes podría no haber cargado) y ahí se lo corta.
let calentando: { voz: Voz; terminar: () => void } | null = null

function alEstadoDelCalentamiento(voz: Voz, playing: boolean): void {
  if (playing && calentando?.voz === voz) calentando.terminar()
}

function calentar(): void {
  const voz = vocesDelTick[0]
  if (!voz) return
  const generacion = pasarA({ voz, estado: "sonando" })
  const reloj = setTimeout(() => calentando?.terminar(), CALENTAMIENTO_MAX_MS)
  calentando = {
    voz,
    terminar: () => {
      clearTimeout(reloj)
      calentando = null
      // Si el tick real ya la usó, no es nuestra.
      if (voz.generacion !== generacion) return
      voz.reproductor.volume = voz.volumen
      void rebobinar(voz)
    },
  }
  try {
    voz.reproductor.volume = 0
    voz.reproductor.play()
  } catch {
    calentando.terminar()
  }
}

// El tick del conteo de XP es el único sonido POLIFÓNICO, como en la web.
export function playTick({ rate }: { rate: number }): void {
  if (menosMovimiento) return
  const voz = tomarVoz(vocesDelTick)
  if (!voz) return
  disparar({ voz, rate })
}

/** Suelta todos los reproductores y listeners. Lo llama el layout raíz al
 *  desmontarse, así un reinicio en caliente no deja voces fantasma con la
 *  sesión de audio retenida. */
export function liberarSfx(): void {
  calentando?.terminar()
  for (const voces of grupos.values()) voces.forEach(soltarVoz)
  vocesDelTick.forEach(soltarVoz)
  soltarMenosMovimiento?.()
  grupos.clear()
  ultimaVoz.clear()
  ultimoDisparo.clear()
  vocesDelTick = []
  soltarMenosMovimiento = null
  precargado = false
}
