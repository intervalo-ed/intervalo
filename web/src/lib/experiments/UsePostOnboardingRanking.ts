"use client"

import { useEffect, useState } from "react"
import posthog from "posthog-js"

// Experimento "el ranking motiva": el brazo test aterriza en /leaderboard al
// terminar el onboarding y vuelve ahí después de cada resumen de sesión; el
// control conserva el flujo actual (home / práctica). Un solo flag gobierna
// los dos desvíos: lo que se mide es la experiencia centrada en el ranking,
// no cada desvío por separado.
//
// El flag se evalúa siempre DESPUÉS del login (complete/ y el summary viven
// detrás de auth), así que el bucketing es estable sobre el user id de Clerk
// y no hace falta device bucketing: nunca se evalúa de anónimo.
export const POST_ONBOARDING_RANKING_FLAG = "post-onboarding-ranking"

// `unavailable` = los flags no resolvieron (adblock, red caída). Esa gente
// corre el flujo de control, pero se marca distinto para poder sacarla del
// análisis en vez de contaminar el brazo de control con gente que nunca fue
// sorteada. Mismo criterio que el experimento del orden del onboarding.
export type PostOnboardingRankingVariant = "control" | "test" | "unavailable"

// Atajo para probar las dos variantes en local con `?variant=test`. Fuera de
// desarrollo no existe, así que no hay forma de forzarse un brazo en
// producción y ensuciar los datos del experimento.
function forcedVariant(): PostOnboardingRankingVariant | null {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return null
  const forced = new URLSearchParams(window.location.search).get("variant")
  return forced === "control" || forced === "test" ? forced : null
}

// Versión promesa, para decidir dentro de un flujo async (el redirect al final
// de runOnboarding en complete/page.tsx): esperar acá no cuelga nada, porque
// para cuando el POST /user/enroll terminó los flags casi siempre ya están.
export function resolvePostOnboardingRankingVariant(): Promise<PostOnboardingRankingVariant> {
  const forced = forcedVariant()
  if (forced !== null) return Promise.resolve(forced)

  return new Promise((resolve) => {
    let settled = false
    function settle(v: PostOnboardingRankingVariant) {
      if (settled) return
      settled = true
      unsubscribe?.()
      clearTimeout(timeout)
      resolve(v)
    }

    // onFeatureFlags dispara al toque si ya estaban cargados.
    const unsubscribe = posthog.onFeatureFlags(() => {
      const value = posthog.getFeatureFlag(POST_ONBOARDING_RANKING_FLAG)
      settle(value === "test" ? "test" : value === "control" ? "control" : "unavailable")
    })
    const timeout = setTimeout(() => settle("unavailable"), 2500)
  })
}

// Versión hook, para decidir en render/handlers (goHome del summary). `null` =
// todavía resolviendo; quien decide en ese estado trata al usuario como
// control, que es el flujo seguro.
export function usePostOnboardingRankingVariant(): PostOnboardingRankingVariant | null {
  const [variant, setVariant] = useState<PostOnboardingRankingVariant | null>(
    forcedVariant,
  )

  useEffect(() => {
    if (variant !== null) return
    let cancelled = false
    void resolvePostOnboardingRankingVariant().then((v) => {
      if (!cancelled) setVariant(v)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return variant
}
