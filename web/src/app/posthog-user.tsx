"use client"

import { useEffect, useRef } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import posthog from "posthog-js"
import { FIRST_UTM_SOURCE } from "@/lib/analytics/attribution"

export function PostHogUser() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()
  const wasSignedIn = useRef(false)

  useEffect(() => {
    if (isSignedIn && userId) {
      wasSignedIn.current = true
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
    } else if (isSignedIn === false && wasSignedIn.current) {
      // Solo resetear en logout real. Clerk emite isSignedIn === false para
      // todo visitante anónimo apenas resuelve el auth state — resetear ahí
      // borraba first_utm_source (super property en localStorage) antes de
      // que la persona llegara a registrarse.
      wasSignedIn.current = false
      posthog.reset()
    }
  }, [isSignedIn, userId, user])

  return null
}
