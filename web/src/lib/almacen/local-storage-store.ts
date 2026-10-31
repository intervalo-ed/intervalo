// El almacén del juego en el navegador: localStorage con todo en try/catch,
// porque Safari en modo privado tira al escribir y nada de esto puede romper el
// juego. En el servidor no hay localStorage: se lee vacío y no se escribe.

import type { KeyValueStore } from "@intervalo/dx-core/almacen/key-value-store"

export function crearAlmacenLocalStorage(): KeyValueStore {
  // Los cambios de ESTA pestaña; los de otras llegan por el evento `storage`,
  // que el navegador no dispara en la pestaña que escribió.
  const oyentes = new Map<string, Set<() => void>>()
  const avisar = (key: string) => {
    for (const oyente of oyentes.get(key) ?? []) oyente()
  }

  return {
    get(key) {
      if (typeof window === "undefined") return null
      try {
        return window.localStorage.getItem(key)
      } catch {
        return null
      }
    },
    set(key, value) {
      if (typeof window === "undefined") return
      try {
        window.localStorage.setItem(key, value)
      } catch {
        return
      }
      avisar(key)
    },
    delete(key) {
      if (typeof window === "undefined") return
      try {
        window.localStorage.removeItem(key)
      } catch {
        return
      }
      avisar(key)
    },
    subscribe(key, onChange) {
      if (typeof window === "undefined") return () => {}
      const deLaClave = oyentes.get(key) ?? new Set()
      deLaClave.add(onChange)
      oyentes.set(key, deLaClave)
      // `key === null` es un `localStorage.clear()` en otra pestaña.
      const enOtraPestana = (e: StorageEvent) => {
        if (e.key === key || e.key === null) onChange()
      }
      window.addEventListener("storage", enOtraPestana)
      return () => {
        deLaClave.delete(onChange)
        window.removeEventListener("storage", enOtraPestana)
      }
    },
  }
}
