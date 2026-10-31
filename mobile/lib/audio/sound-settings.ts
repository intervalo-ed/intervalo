// El silencio de los sonidos, con la misma clave y los mismos valores que la web
// (web/src/lib/audio/sound-settings.ts): "1" es silenciado. Vive en el almacén
// del juego (MMKV), que es el localStorage de la app.

import { useSyncExternalStore } from "react"
import { mmkvStore } from "@/lib/almacen/mmkv-store"

const STORAGE_KEY = "intervalo:sound-muted"

export function isSoundMuted(): boolean {
  return mmkvStore.get(STORAGE_KEY) === "1"
}

export function setSoundMuted(muted: boolean): void {
  mmkvStore.set(STORAGE_KEY, muted ? "1" : "0")
}

function subscribe(callback: () => void): () => void {
  return mmkvStore.subscribe(STORAGE_KEY, callback)
}

export function useSoundMuted(): boolean {
  return useSyncExternalStore(subscribe, isSoundMuted)
}
