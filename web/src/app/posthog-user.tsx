"use client"

import { useEffect, useRef } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import posthog from "posthog-js"
import {
  FIRST_PWA_USE_AT,
  FIRST_PWA_USE_STORAGE_KEY,
  FIRST_UTM_SOURCE,
} from "@/lib/analytics/attribution"

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

      // Mismo problema que la atribución, del otro lado: el evento pwa_install
      // sale una sola vez por dispositivo y si se pierde no hay reintento. Este
      // timestamp lo escribe instrumentation-client al detectar modo instalado, y
      // se copia al perfil acá para poder segmentar por "usó la app instalada"
      // sin depender del evento.
      let firstPwaUseAt: string | null = null
      try {
        firstPwaUseAt = localStorage.getItem(FIRST_PWA_USE_STORAGE_KEY)
      } catch {
        // localStorage puede tirar en modo privado.
      }

      const setOnce: Record<string, string> = {}
      if (firstUtmSource) setOnce[FIRST_UTM_SOURCE] = String(firstUtmSource)
      if (firstPwaUseAt) setOnce[FIRST_PWA_USE_AT] = firstPwaUseAt

      posthog.identify(
        userId,
        {
          email: user?.primaryEmailAddress?.emailAddress,
          name: user?.fullName ?? undefined,
        },
        Object.keys(setOnce).length > 0 ? setOnce : undefined,
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
