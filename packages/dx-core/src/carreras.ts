// Las carreras del onboarding: la grilla 2×2 y «Otra». Las comparten la web y la
// app, así que el valor que se guarda en la base y el nombre que se muestra
// salen de un solo lugar.

export const CAREERS = [
  { value: "E", label: "Ingeniería", emoji: "⚙️" },
  { value: "S", label: "Ciencia", emoji: "🔬" },
  { value: "T", label: "Tecnología", emoji: "🤖" },
  { value: "M", label: "Matemática", emoji: "📐" },
]

// Los valores en el orden en que se dibujan las cinco tarjetas: las cuatro de
// la grilla y "Otra". Quien les pone un atajo numérico —el minijuego, en
// escritorio— lee el orden de acá, para que el 3 sea siempre la tercera tarjeta.
export const CAREER_CHOICES = [...CAREERS.map((c) => c.value), "Otra"]

const CAREER_NAMES: Record<string, string> = Object.fromEntries(
  CAREERS.map((c) => [c.value, c.label]),
)

// El nombre de la carrera para la fila del perfil; sin carrera, la invitación.
export function careerLabel(career: string | null | undefined): string {
  return career ? (CAREER_NAMES[career] ?? career) : "Elegir"
}
