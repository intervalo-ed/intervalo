const KEY = "intervalo:onboarding"

export type OnboardingData = {
  name: string
  career: string
  university: string
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
      return { name: parsed.name ?? "", career: parsed.career, university: parsed.university }
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
