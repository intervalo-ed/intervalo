// Estado local del minijuego. Todo con try/catch: Safari en modo privado tira
// al escribir y nada de esto puede romper el juego.

const TOKEN_KEY = "intervalo:game:token"
const CAFECITO_LAST_KEY = "intervalo:game:cafecito-last"

export function readGameToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveGameToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sin persistencia el juego sigue: se pierde el progreso al recargar.
  }
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
