// La vibración de la app. Cada momento tiene su propio patrón en vez de un clic
// genérico: `expo-haptics` solo ofrece presets (Light, Medium, Heavy, Soft,
// Rigid, selection, notification), así que los patrones se arman con secuencias
// de pulsos separados en el tiempo.
//
// Tres reglas:
//   1. Se puede apagar desde ajustes ("Vibración"). Mismo almacén que el sonido.
//   2. Un limitador global (`MIN_ENTRE_PULSOS`): si dos cosas disparan a la vez
//      (varios contadores, un fling) se funden en un solo pulso en vez de zumbar.
//   3. Es solo en el dispositivo: el simulador no vibra. Con `DEPURAR` cada
//      patrón escribe su nombre en la consola de Metro.

import { useSyncExternalStore } from "react"
import * as Haptics from "expo-haptics"
import { mmkvStore } from "@/lib/almacen/mmkv-store"

const STORAGE_KEY = "intervalo:haptics-off"
const DEPURAR = false
const MIN_ENTRE_PULSOS = 28

export function isHapticsOff(): boolean {
  return mmkvStore.get(STORAGE_KEY) === "1"
}

export function setHapticsOff(off: boolean): void {
  mmkvStore.set(STORAGE_KEY, off ? "1" : "0")
}

export function useHapticsOff(): boolean {
  return useSyncExternalStore((cb) => mmkvStore.subscribe(STORAGE_KEY, cb), isHapticsOff)
}

const { ImpactFeedbackStyle: Impacto, NotificationFeedbackType: Aviso } = Haptics

let ultimo = 0

/** Un pulso, sujeto al apagado y al limitador. `fuerza` ignora el limitador
 *  (los pulsos de un patrón armado a propósito). */
function pulso(tipo: () => Promise<void>, fuerza = false): void {
  if (isHapticsOff()) return
  const ahora = Date.now()
  if (!fuerza && ahora - ultimo < MIN_ENTRE_PULSOS) return
  ultimo = ahora
  void tipo().catch(() => {})
}

const suave = () => Haptics.impactAsync(Impacto.Soft)
const leve = () => Haptics.impactAsync(Impacto.Light)
const medio = () => Haptics.impactAsync(Impacto.Medium)
const fuerte = () => Haptics.impactAsync(Impacto.Heavy)
const seco = () => Haptics.impactAsync(Impacto.Rigid)

/** Pulsos con pausas: `[retrasoMs, pulso]`, el retraso contado desde el inicio. */
function secuencia(nombre: string, pasos: [number, () => Promise<void>][]): void {
  if (isHapticsOff()) return
  if (DEPURAR) console.log(`[vibración] ${nombre}`)
  for (const [ms, tipo] of pasos) {
    if (ms === 0) pulso(tipo, true)
    else setTimeout(() => pulso(tipo, true), ms)
  }
}

export const vib = {
  /** Tecla del teclado matemático. */
  tecla: () => pulso(leve),
  /** Un botón en 3D: baja blando, sube seco, como una tecla mecánica. */
  botonBaja: () => pulso(suave),
  botonSube: () => pulso(seco),
  /** Abrir un desplegable, elegir en él. */
  abrir: () => pulso(leve),
  elegir: () => pulso(() => Haptics.selectionAsync()),

  /** Un dígito del contador que se traba. `progreso` va de 0 a 1: los primeros
   *  son casi un roce y los últimos pesan más, como la ruleta frenando. */
  digito: (progreso: number) => pulso(progreso < 0.4 ? suave : progreso < 0.8 ? leve : medio),
  /** El último dígito: el "clac" que cierra el conteo. */
  contadorTrabado: () => secuencia("contador trabado", [[0, seco], [55, suave]]),

  /** Una muesca del scroll del ranking (cada 10 puestos). */
  muesca: () => pulso(() => Haptics.selectionAsync()),
  /** Cruzar el puesto 1000, 100 o 10. */
  hito: () => secuencia("hito de puesto", [[0, medio], [45, suave]]),
  /** Llegar al tope (puesto 1) o al fondo de una lista. */
  tope: () => secuencia("tope", [[0, fuerte], [70, suave]]),
  /** Tu propia fila cruza el centro de la lista. */
  propia: () => pulso(leve),
  /** Roce al llegar al final de la tabla. */
  roce: () => pulso(suave),

  /** Acierto: un golpe y un acento. Al primer intento y sin pista, un tercero. */
  acierto: (perfecto: boolean) =>
    secuencia(perfecto ? "acierto perfecto" : "acierto", perfecto
      ? [[0, leve], [70, medio], [150, fuerte]]
      : [[0, leve], [85, medio]]),
  /** Error: dos golpes secos, el segundo más flojo. */
  error: () => secuencia("error", [[0, seco], [110, leve]]),
  /** El combo sube: un latido de dos pulsos que crece con la racha. */
  combo: (n: number) =>
    secuencia(`combo ${n}`, [
      [0, n >= 10 ? fuerte : medio],
      [110, n >= 5 ? medio : suave],
      ...(n >= 5 ? ([[220, suave]] as [number, () => Promise<void>][]) : []),
    ]),
  /** Se pierde la racha: un golpe que se apaga en dos ecos. */
  comboPerdido: () => secuencia("combo perdido", [[0, fuerte], [130, suave], [250, suave]]),
  /** Subís de puesto: rampa de leve a fuerte. */
  subePuesto: () => secuencia("sube de puesto", [[0, leve], [75, medio], [150, fuerte]]),

  /** Los avisos del sistema, para lo que no tiene patrón propio. */
  exito: () => pulso(() => Haptics.notificationAsync(Aviso.Success), true),
}
