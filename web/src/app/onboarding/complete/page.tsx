"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useEnrollMutation } from "@/app/onboarding/UseEnrollMutation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useApi } from "@/lib/api/useApi"
import { clearOnboarding, readOnboarding } from "@/lib/onboarding/storage"
import { OnboardingInstallPrompt } from "./install-prompt"
import { RecoverProfileForm } from "./recover-profile-form"

export default function OnboardingCompletePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const api = useApi()
  const enroll = useEnrollMutation()
  const startedRef = useRef(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [showRecoverForm, setShowRecoverForm] = useState(false)

  const failure = enroll.error
  const errorMessage =
    statusError ??
    (failure
      ? failure instanceof Error
        ? failure.message
        : "No pudimos guardar tu progreso. Probá de nuevo."
      : null)

  // New user: enroll, mark onboarded, then show the install prompt.
  async function runOnboarding() {
    const data = readOnboarding()
    if (!data) {
      router.replace("/onboarding")
      return
    }
    await enroll.mutateAsync({
      university: data.university,
      career: data.career,
      name: data.name || user?.fullName || user?.firstName || null,
      course: data.course,
      motivation: data.motivation,
      introItemCorrect: data.introItemCorrect,
      introItemAttempts: data.introItemAttempts,
      introItemResponseTimeMs: data.introItemResponseTimeMs,
    })
    await user?.update({ unsafeMetadata: { onboarded: true } })
    // El dashboard resuelve el curso activo con last_course; sembramos el elegido
    // para que abra ahí de entrada (antes de que responda el back).
    window.localStorage.setItem("intervalo:last_course", data.course)
    clearOnboarding()
    // Mostramos la pantalla "¡Una cosa más!" (instalar la app); al tocar
    // Continuar se navega al dashboard, donde el usuario arranca su repaso.
    setShowInstallPrompt(true)
  }

  // The DB is authoritative for new-vs-returning. Returning users go straight
  // to the dashboard (and get their Clerk flag backfilled); only genuinely new
  // users run onboarding. Clerk's `onboarded` flag is just a fast path.
  //
  // Un tercer caso: gente con progreso real (unit_states) pero sin Enrollment
  // — cuentas que quedaron a medio hacer por el bug de "Ya tengo una cuenta"
  // arrastrado desde antes de ese fix. A esas no las hacemos repetir todo el
  // wizard (perderían el hilo de algo que ya vienen usando); les pedimos solo
  // carrera + universidad con RecoverProfileForm.
  async function run() {
    startedRef.current = true
    try {
      const { data: status, error } = await api.GET("/user/status")
      if (error) throw error
      if (status.enrolled) {
        if (user?.unsafeMetadata?.onboarded !== true) {
          await user?.update({ unsafeMetadata: { onboarded: true } })
        }
        router.replace("/")
        return
      }
      if (status.has_progress) {
        setShowRecoverForm(true)
        return
      }
      await runOnboarding()
    } catch (err) {
      // Surfaced via errorMessage; allow a retry.
      startedRef.current = false
      if (!enroll.error) {
        setStatusError(
          err instanceof Error
            ? err.message
            : "No pudimos verificar tu cuenta. Probá de nuevo.",
        )
      }
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
    // run() only setState()s in its catch, after an await — not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  if (showRecoverForm) {
    return <RecoverProfileForm onDone={() => router.replace("/")} />
  }

  if (showInstallPrompt) {
    return <OnboardingInstallPrompt />
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      {errorMessage ? (
        <>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Algo salió mal
            </h2>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </div>
          <Button
            size="lg"
            className="h-12 w-full max-w-xs rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
            onClick={() => {
              setStatusError(null)
              void run()
            }}
          >
            Reintentar
          </Button>
        </>
      ) : (
        <Spinner className="size-6 text-primary" />
      )}
    </main>
  )
}
