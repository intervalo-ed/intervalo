"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { useStartSession } from "@/app/UseStartSession"
import { useEnrollMutation } from "@/app/onboarding/UseEnrollMutation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { clearOnboarding, readOnboarding } from "@/lib/onboarding/storage"

export default function OnboardingCompletePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const enroll = useEnrollMutation()
  const startSession = useStartSession()
  const startedRef = useRef(false)

  const failure = enroll.error ?? startSession.error
  const errorMessage = failure
    ? failure instanceof Error
      ? failure.message
      : "No pudimos guardar tu progreso. Probá de nuevo."
    : null

  async function run() {
    const data = readOnboarding()
    if (!data) {
      router.replace("/onboarding")
      return
    }
    startedRef.current = true
    try {
      await enroll.mutateAsync({
        university: data.university,
        career: data.career,
        name: user?.fullName ?? user?.firstName ?? null,
      })
      await user?.update({ unsafeMetadata: { onboarded: true } })
      const session = await startSession.mutateAsync({
        userName: user?.fullName ?? user?.firstName ?? "",
      })
      clearOnboarding()
      router.push(`/session/${session.session_id}`)
    } catch {
      // Surfaced via enroll.error / startSession.error; allow a retry.
      startedRef.current = false
    }
  }

  useEffect(() => {
    if (!isLoaded || startedRef.current) return
    if (!isSignedIn) {
      router.replace("/onboarding")
      return
    }
    if (user?.unsafeMetadata?.onboarded === true) {
      router.replace("/")
      return
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      {errorMessage ? (
        <>
          <p className="text-sm text-red-400">{errorMessage}</p>
          <Button onClick={() => void run()}>Reintentar</Button>
        </>
      ) : (
        <Spinner className="size-6 text-primary" />
      )}
    </main>
  )
}
