// El almacén del juego en el teléfono: una sola instancia de MMKV, sincrónica
// como la pide dx-core. Todo en try/catch igual que el de la web: que falle el
// disco no puede romper el juego.

import { createMMKV } from "react-native-mmkv"
import type { KeyValueStore } from "@intervalo/dx-core/almacen/key-value-store"

export const mmkv = createMMKV({ id: "dx" })

export const mmkvStore: KeyValueStore = {
  get(key) {
    try {
      return mmkv.getString(key) ?? null
    } catch {
      return null
    }
  },
  set(key, value) {
    try {
      mmkv.set(key, value)
    } catch {
      // Sin persistencia el juego sigue: se pierde el progreso al cerrar.
    }
  },
  delete(key) {
    try {
      mmkv.remove(key)
    } catch {
      // Ídem.
    }
  },
  subscribe(key, onChange) {
    try {
      const listener = mmkv.addOnValueChangedListener((cambiada) => {
        if (cambiada === key) onChange()
      })
      return () => listener.remove()
    } catch {
      return () => {}
    }
  },
}
