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

// La corona 👑 es del primero del ranking general de Intervalo clásico. Quién es
// lo decide el backend (`crowned` en el ranking, los reclutas y /auth/me), así
// que acá no se compara ningún nombre. Gana sobre cualquier emoji vestido: es un
// título que se tiene mientras se esté arriba, no un adorno que se elige.
export function badgeWithCrown({
  crowned,
  resolved,
}: {
  crowned?: boolean | null
  resolved?: string
}): string | undefined {
  return crowned ? "👑" : resolved
}
