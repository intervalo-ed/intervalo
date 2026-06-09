// Validación de username espejada del backend (backend/usernames.py). Reglas
// estilo Instagram: minúsculas, `a-z 0-9 . _`, largo 3–15, sin punto al inicio/fin
// ni `..` consecutivos.

export const USERNAME_MIN = 3
export const USERNAME_MAX = 15

/** Normaliza la entrada en vivo: minúscula, solo `a-z0-9._`, recortado a 15. */
export function normalizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .slice(0, USERNAME_MAX)
}

/** Devuelve un mensaje de error, o null si el username es válido. */
export function validateUsername(value: string): string | null {
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `Debe tener entre ${USERNAME_MIN} y ${USERNAME_MAX} caracteres.`
  }
  if (!/^[a-z0-9._]+$/.test(value)) {
    return "Solo minúsculas, números, punto y guion bajo."
  }
  if (value.startsWith(".") || value.endsWith(".")) {
    return "No puede empezar ni terminar con punto."
  }
  if (value.includes("..")) {
    return "No puede tener dos puntos seguidos."
  }
  return null
}
