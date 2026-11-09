// El estado compartido entre el splash animado (components/splash-animado.tsx,
// que vive arriba de todo) y la portada (juego/intro-slide.tsx, que tiene el
// lugar donde el logo va a quedar). Son dos árboles que no se conocen: acá se
// avisan lo único que necesitan saber el uno del otro.
//
//   esperando → viajando → terminado
//
// `esperando`: el logo está quieto en el centro. `viajando`: salió hacia su
// lugar y la portada puede ir revelando su contenido. `terminado`: el logo
// aterrizó y el splash ya no existe.

import { useSyncExternalStore } from "react"

export type Fase = "esperando" | "viajando" | "terminado"

/** Dónde está el logo de la portada, en coordenadas de la ventana. */
export type Rect = { x: number; y: number; width: number; height: number }

type Estado = {
  fase: Fase
  /** El texto de la portada ya tiene su forma final (llegó lo del servidor, o
   *  venció la espera): recién ahí el lugar del logo es el definitivo. */
  contenidoListo: boolean
  destino: Rect | null
}

let estado: Estado = { fase: "esperando", contenidoListo: false, destino: null }
const oyentes = new Set<() => void>()

function cambiar(parcial: Partial<Estado>): void {
  estado = { ...estado, ...parcial }
  oyentes.forEach((o) => o())
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function leerSplash(): Estado {
  return estado
}

export function useSplash(): Estado {
  return useSyncExternalStore(suscribir, leerSplash)
}

export function anunciarContenidoListo(): void {
  if (!estado.contenidoListo) cambiar({ contenidoListo: true })
}

export function anunciarDestino(destino: Rect): void {
  cambiar({ destino })
}

export function iniciarViaje(): void {
  if (estado.fase === "esperando") cambiar({ fase: "viajando" })
}

export function terminarSplash(): void {
  if (estado.fase !== "terminado") cambiar({ fase: "terminado" })
}
