"use client"

import { useEffect } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import posthog from "posthog-js"

export function PostHogUser() {
  const { isSignedIn, userId } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    if (isSignedIn && userId) {
      posthog.identify(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName ?? undefined,
      })
    } else if (isSignedIn === false) {
      posthog.reset()
    }
  }, [isSignedIn, userId, user])

  return null
}
