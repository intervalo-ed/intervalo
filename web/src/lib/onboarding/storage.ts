import type { CourseId } from "@/lib/catalog"

const KEY = "intervalo:onboarding"

export type OnboardingData = {
  name: string
  career: string
  university: string
  // Curso elegido en el onboarding; define el curso default al registrarse.
  course: CourseId
  // Unidades que la persona declara conocer (claves del catálogo, propias de
  // cada curso). Dato declarativo: no altera el plan de estudio. Ausente en
  // datos viejos.
  knownUnits?: string[]
  // Resultado del ejercicio de prueba: true si acertó al primer intento.
  // Ausente en datos viejos → el backend lo trata como "sin dato".
  introItemCorrect?: boolean
  // Intentos hasta acertar y tiempo de respuesta del ejercicio de prueba.
  introItemAttempts?: number
  introItemResponseTimeMs?: number
}

export function saveOnboarding(data: OnboardingData) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(data))
}

export function readOnboarding(): OnboardingData | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingData>
    if (parsed.career && parsed.university) {
      return {
        name: parsed.name ?? "",
        career: parsed.career,
        university: parsed.university,
        // Datos viejos sin curso → analisis, por compatibilidad.
        course: parsed.course ?? "analisis",
        knownUnits: parsed.knownUnits,
        introItemCorrect: parsed.introItemCorrect,
        introItemAttempts: parsed.introItemAttempts,
        introItemResponseTimeMs: parsed.introItemResponseTimeMs,
      }
    }
    return null
  } catch {
    return null
  }
}

export function clearOnboarding() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(KEY)
}
