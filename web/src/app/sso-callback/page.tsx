"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"
import { Spinner } from "@/components/ui/spinner"

export default function SSOCallbackPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background">
      <Spinner />
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/onboarding/complete"
        signUpForceRedirectUrl="/onboarding/complete"
      />
    </main>
  )
}
