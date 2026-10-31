// Dónde guarda el juego su estado local (game-storage.ts, ranking-frecuencia.ts).
//
// Todo sincrónico, porque así lo leen los disparadores y `useSyncExternalStore`.
// Ninguna implementación puede tirar: Safari en modo privado tira al escribir y
// nada de esto puede romper el juego.

export type KeyValueStore = {
  get(key: string): string | null
  set(key: string, value: string): void
  delete(key: string): void
  subscribe(key: string, onChange: () => void): () => void
}

export type Almacen = {
  store: KeyValueStore
  /** Respaldo opcional del token de invitado fuera del almacén (la cookie en la
   *  web). `null` es «se borró la identidad». */
  espejarToken?: (token: string | null) => void
  /** Verdadero donde no hay almacén de verdad y nada se puede adoptar (el
   *  render del servidor en la web). */
  esServidor?: boolean
}

let instalado: Almacen | null = null

export function instalarAlmacen({ store, espejarToken, esServidor }: Almacen) {
  instalado = { store, espejarToken, esServidor }
}

export function almacen(): Almacen {
  if (instalado === null) {
    throw new Error(
      "@intervalo/dx-core: falta instalarAlmacen() antes de leer el estado del juego",
    )
  }
  return instalado
}

export function crearAlmacenEnMemoria({
  datos = new Map<string, string>(),
}: { datos?: Map<string, string> } = {}): KeyValueStore {
  const oyentes = new Map<string, Set<() => void>>()
  const avisar = (key: string) => {
    for (const oyente of oyentes.get(key) ?? []) oyente()
  }
  return {
    get: (key) => datos.get(key) ?? null,
    set: (key, value) => {
      datos.set(key, value)
      avisar(key)
    },
    delete: (key) => {
      datos.delete(key)
      avisar(key)
    },
    subscribe: (key, onChange) => {
      const set = oyentes.get(key) ?? new Set()
      set.add(onChange)
      oyentes.set(key, set)
      return () => {
        set.delete(onChange)
      }
    },
  }
}
