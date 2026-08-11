"use client"

import { useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import posthog from "posthog-js"
import { FIRST_UTM_SOURCE } from "@/lib/analytics/attribution"

export function PostHogUser() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    if (isSignedIn && userId) {
      // La super property acompaña a los eventos, pero no queda en el perfil de
      // la persona: con `person_profiles: identified_only` los eventos anónimos
      // no crean perfil, así que el origen del aterrizaje se perdía al
      // registrarse. Se copia acá como $set_once para poder segmentar retención
      // y progreso por universidad.
      const firstUtmSource = posthog.get_property(FIRST_UTM_SOURCE)

      posthog.identify(
        userId,
        {
          email: user?.primaryEmailAddress?.emailAddress,
          name: user?.fullName ?? undefined,
        },
        firstUtmSource ? { [FIRST_UTM_SOURCE]: firstUtmSource } : undefined,
      )
    } else if (isSignedIn === false) {
      posthog.reset()
    }
  }, [isSignedIn, userId, user])

  return null
}
