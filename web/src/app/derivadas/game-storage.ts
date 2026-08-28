// Estado local del minijuego. Todo con try/catch: Safari en modo privado tira
// al escribir y nada de esto puede romper el juego.

const TOKEN_KEY = "intervalo:game:token"
const CAFECITO_LAST_KEY = "intervalo:game:cafecito-last"

// El token del invitado se lee además como STORE REACTIVO (`subscribeGameToken`
// + `getGameTokenSnapshot`, que consume `useGameToken` en UseGamePlayer.ts).
//
// No es una elegancia: `readGameToken()` suelta adentro de un componente es una
// lectura no reactiva, y el React Compiler la memoiza junto al resto de la
// expresión que la contiene. En el `enabled` de la query del jugador eso
// significaba que el gate se evaluaba UNA sola vez —cuando Clerk terminaba de
// cargar, con el invitado todavía sin crear y por lo tanto sin token— y quedaba
// clavado en `false` para el resto de la visita. La query nunca se activaba, las
// invalidaciones de cada respuesta no refrescaban nada, y los tres marcadores de
// la card (ejercicios, racha, elo) se quedaban en cero hasta recargar la página.
//
// Al recargar el token ya estaba guardado en ese único render, así que el bug
// solo se veía en la primera visita: exactamente el síntoma reportado.
//
// El caché de módulo es necesario para `useSyncExternalStore`, que exige que dos
// llamadas seguidas devuelvan el mismo valor mientras nada haya cambiado.
// `undefined` significa "todavía no leído"; `null` es "leído, no hay token".
let tokenCache: string | null | undefined
const tokenListeners = new Set<() => void>()

export function subscribeGameToken(onChange: () => void) {
  tokenListeners.add(onChange)
  return () => {
    tokenListeners.delete(onChange)
  }
}

export function getGameTokenSnapshot(): string | null {
  if (tokenCache === undefined) tokenCache = readGameToken()
  return tokenCache
}

/** En el servidor no hay localStorage y el snapshot tiene que ser estable. */
export function getGameTokenServerSnapshot(): string | null {
  return null
}

export function readGameToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveGameToken(token: string) {
  // El caché y el aviso van SIEMPRE, aunque el localStorage falle: en Safari
  // privado el token igual sirve para la sesión en curso, y lo que no puede
  // pasar es que quien lo esté esperando no se entere.
  const changed = tokenCache !== token
  tokenCache = token
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sin persistencia el juego sigue: se pierde el progreso al recargar.
  }
  if (changed) for (const listener of tokenListeners) listener()
}

// Cooldown del CTA de Cafecito: número de ejercicio resuelto en el que se
// mostró la última card, para no mostrar más de una cada N ejercicios.
export function readCafecitoLastShownAt(): number {
  if (typeof window === "undefined") return -Infinity
  try {
    const raw = window.localStorage.getItem(CAFECITO_LAST_KEY)
    return raw === null ? -Infinity : Number(raw)
  } catch {
    return -Infinity
  }
}

export function saveCafecitoLastShownAt(solvedCount: number) {
  try {
    window.localStorage.setItem(CAFECITO_LAST_KEY, String(solvedCount))
  } catch {}
}
