// Emoji de bucket por tipo de carrera (los mismos del onboarding). Fuente única
// para el ranking y el perfil; se usa como fallback cuando el usuario no eligió
// un badge específico.
export const CAREER_EMOJI: Record<string, string> = {
  E: "⚙️",
  S: "🔬",
  T: "🤖",
  M: "📐",
  Otra: "✦",
}

// Usuario con corona hardcodeada: cuando muestra el emoji por defecto de su
// carrera (el primer icono del árbol), se reemplaza por 👑. Solo para él.
const CROWNED_USERNAME = "nvrancovich"

// Aplica la corona si corresponde; si no, devuelve el emoji ya resuelto.
export function badgeWithCrown({
  username,
  resolved,
  career,
}: {
  username?: string | null
  resolved?: string
  career?: string | null
}): string | undefined {
  if (
    username?.toLowerCase() === CROWNED_USERNAME &&
    career != null &&
    resolved === CAREER_EMOJI[career]
  ) {
    return "👑"
  }
  return resolved
}
