"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useEnrollMutation } from "@/app/onboarding/UseEnrollMutation"
import { LAST_COURSE_KEY } from "@/app/dashboard-entry"
import { Button } from "@/components/ui/button"
import { ErrorState } from "@/components/error-state"
import { Spinner } from "@/components/ui/spinner"
import posthog from "posthog-js"
import { ApiError, isRetriable, unwrap } from "@/lib/api/client"
import { useApi } from "@/lib/api/useApi"
import { TimeoutError, withTimeout } from "@/lib/async/with-timeout"
import { resolvePostOnboardingRankingVariant } from "@/lib/experiments/UsePostOnboardingRanking"
import { clearOnboarding, readOnboarding } from "@/lib/onboarding/storage"
import { RecoverProfileForm } from "./recover-profile-form"

// Esta pantalla es el cuello de botella del alta: corre entre el round-trip de
// Google y el primer render de la app, encadenando llamadas a Clerk, al
// backend y a PostHog. Antes ninguna tenía tope de tiempo y el botón de
// reintentar sólo aparecía si algo *lanzaba*, así que una promesa colgada
// dejaba al usuario mirando un spinner eterno — sin fila en la base y sin
// forma de salir salvo recargar. Todo lo de acá existe para que eso no pase:
// cada paso tiene presupuesto, los reintentos son automáticos, y un watchdog
// garantiza que el spinner termine sí o sí.

type Step = "user_status" | "clerk_update" | "enroll" | "flags"

const STEP_BUDGET_MS: Record<Step, number> = {
  user_status: 8_000,
  clerk_update: 5_000,
  enroll: 12_000,
  flags: 4_000,
}
const MAX_AUTO_RETRIES = 2
/** Red de contención: si nada resolvió para acá, mostramos error igual. */
const WATCHDOG_MS = 25_000
/** A partir de acá avisamos que está tardando, para que no parezca colgado. */
const SLOW_HINT_MS = 5_000

const FRIENDLY = {
  timeout: "La conexión está lenta. Probá de nuevo.",
  server: "Nuestro servidor no está respondiendo. Probá de nuevo en un momento.",
  generic: "No pudimos terminar de crear tu cuenta. Probá de nuevo.",
  stuck: "Esto está tardando demasiado. Probá de nuevo.",
  noPayload: "Perdimos los datos de tu registro. Volvé a empezar, es rápido.",
}

/** Nunca mostramos el mensaje crudo: los `detail` de FastAPI son internos. */
function friendlyMessage(err: unknown): string {
  if (err instanceof TimeoutError) return FRIENDLY.timeout
  if (err instanceof ApiError) return err.status >= 500 ? FRIENDLY.server : FRIENDLY.generic
  return FRIENDLY.generic
}

function technicalMessage(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err)
}

export default function OnboardingCompletePage() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser()
  const api = useApi()
  const enroll = useEnrollMutation()

  // `runningRef` = hay un intento en vuelo. `doneRef` = estado terminal
  // (redirect emitido o formulario de recuperación en pantalla). Antes esto
  // era un solo ref que sólo se limpiaba en el catch: si un await colgaba
  // quedaba en true para siempre y ni remontando se podía reintentar.
  const runningRef = useRef(false)
  const doneRef = useRef(false)
  const stepRef = useRef<Step | null>(null)
  const attemptRef = useRef(0)
  const startedAtRef = useRef(0)

  const [statusError, setStatusError] = useState<string | null>(null)
  const [showRecoverForm, setShowRecoverForm] = useState(false)
  const [slow, setSlow] = useState(false)

  // Un paso con presupuesto propio, medido y reportado.
  async function step<T>(name: Step, work: () => Promise<T>): Promise<T> {
    stepRef.current = name
    const t0 = Date.now()
    try {
      const value = await withTimeout(work(), { ms: STEP_BUDGET_MS[name], label: name })
      posthog.capture("onboarding_complete_step", {
        step: name,
        outcome: "ok",
        duration_ms: Date.now() - t0,
        attempt: attemptRef.current,
      })
      return value
    } catch (err) {
      posthog.capture("onboarding_complete_step", {
        step: name,
        outcome: err instanceof TimeoutError ? "timeout" : "error",
        duration_ms: Date.now() - t0,
        attempt: attemptRef.current,
        error_message: technicalMessage(err),
      })
      throw err
    }
  }

  // Igual, pero el fallo no es fatal: seguimos de largo.
  async function softStep<T>(name: Step, work: () => Promise<T>): Promise<T | null> {
    try {
      return await step(name, work)
    } catch {
      return null
    }
  }

  async function runOnboarding() {
    const data = readOnboarding()
    if (!data) {
      router.replace("/onboarding")
      doneRef.current = true
      return
    }

    await step("enroll", () =>
      enroll.mutateAsync({
        university: data.university,
        career: data.career,
        name: data.name || user?.fullName || user?.firstName || null,
        course: data.course,
        motivation: data.motivation,
        introItemCorrect: data.introItemCorrect,
        introItemAttempts: data.introItemAttempts,
        introItemResponseTimeMs: data.introItemResponseTimeMs,
      }),
    )

    // El flag `onboarded` de Clerk es sólo un fast path — la DB es la
    // autoridad (ver el comentario de run()). Que una llamada lenta a Clerk
    // bloquee el redirect no se justifica, así que va como softStep.
    await softStep("clerk_update", async () => {
      await user?.update({ unsafeMetadata: { onboarded: true } })
    })

    // El dashboard resuelve el curso activo con last_course; sembramos el elegido
    // para que abra ahí de entrada (antes de que responda el back).
    window.localStorage.setItem(LAST_COURSE_KEY, data.course)

    // Experimento post-onboarding-ranking: el brazo test aterriza en el
    // ranking (donde con 0 XP se ve último — el gancho es "empezá a subir");
    // control va directo al dashboard a hacer la primera sesión, como siempre.
    const variant = (await softStep("flags", resolvePostOnboardingRankingVariant)) ?? "unavailable"
    const destination = variant === "test" ? "/leaderboard" : "/"

    // Es el único evento de "onboarding completado" que existe — el
    // denominador del embudo. send_instantly porque el redirect va enseguida.
    posthog.capture(
      "onboarding_complete",
      {
        variant,
        destination,
        duration_ms: Date.now() - startedAtRef.current,
        attempt: attemptRef.current,
      },
      { send_instantly: true },
    )

    // Recién acá: mientras quede algo por hacer, el payload tiene que seguir
    // en localStorage. Antes se limpiaba antes de estos awaits, así que un
    // fallo en el medio dejaba al usuario sin datos ni con qué reintentar.
    clearOnboarding()
    doneRef.current = true
    router.replace(destination)
  }

  // The DB is authoritative for new-vs-returning. Returning users go straight
  // to the dashboard (and get their Clerk flag backfilled); only genuinely new
  // users run onboarding. Clerk's `onboarded` flag is just a fast path.
  //
  // Un tercer caso: gente con progreso real (unit_states) pero sin Enrollment
  // — cuentas que quedaron a medio hacer por el bug de "Ya tengo una cuenta"
  // arrastrado desde antes de ese fix. A esas no las hacemos repetir todo el
  // onboarding (perderían el hilo de algo que ya vienen usando); les pedimos
  // solo carrera + universidad con RecoverProfileForm.
  async function runAttempt() {
    const status = await step("user_status", async () => unwrap(await api.GET("/user/status")))

    if (status.enrolled) {
      await softStep("clerk_update", async () => {
        if (user?.unsafeMetadata?.onboarded !== true) {
          await user?.update({ unsafeMetadata: { onboarded: true } })
        }
      })
      doneRef.current = true
      router.replace("/")
      return
    }
    if (status.has_progress) {
      doneRef.current = true
      setShowRecoverForm(true)
      return
    }
    await runOnboarding()
  }

  async function runWithRetries() {
    if (runningRef.current || doneRef.current) return
    runningRef.current = true
    if (startedAtRef.current === 0) startedAtRef.current = Date.now()

    try {
      for (let attempt = 0; attempt <= MAX_AUTO_RETRIES; attempt++) {
        attemptRef.current = attempt
        try {
          await runAttempt()
          return
        } catch (err) {
          // Un 4xx no se arregla insistiendo: sólo le quema medio minuto a
          // quien ya está esperando.
          if (!isRetriable(err) || attempt === MAX_AUTO_RETRIES) {
            posthog.captureException(err)
            setStatusError(friendlyMessage(err))
            return
          }
          posthog.capture("onboarding_complete_retry", {
            trigger: "auto",
            attempt,
            last_step: stepRef.current,
            reason: technicalMessage(err),
          })
          await new Promise((r) => setTimeout(r, 500 * 2 ** attempt))
        }
      }
    } finally {
      // En el finally y no en el catch: si algo escapa sin lanzar, el ref
      // tiene que quedar libre igual o el reintento manual no dispara nada.
      runningRef.current = false
    }
  }

  useEffect(() => {
    if (!isLoaded || runningRef.current || doneRef.current) return
    if (!isSignedIn) {
      router.replace("/onboarding")
      return
    }
    void runWithRetries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  // Watchdog y aviso de lentitud. El watchdog NO navega a ningún lado: mandar
  // a "/" a alguien sin enrollment reabre el loop "/" ⇄ /onboarding/complete.
  useEffect(() => {
    const slowTimer = setTimeout(() => setSlow(true), SLOW_HINT_MS)
    const watchdog = setTimeout(() => {
      if (doneRef.current) return
      posthog.capture(
        "onboarding_complete_stuck",
        {
          last_step: stepRef.current,
          elapsed_ms: Date.now() - (startedAtRef.current || Date.now()),
          attempt: attemptRef.current,
        },
        { send_instantly: true },
      )
      runningRef.current = false
      setStatusError(FRIENDLY.stuck)
    }, WATCHDOG_MS)

    return () => {
      clearTimeout(slowTimer)
      clearTimeout(watchdog)
    }
  }, [])

  if (showRecoverForm) {
    return <RecoverProfileForm onDone={() => router.replace("/")} />
  }

  const failure = enroll.error
  const errorMessage = statusError ?? (failure ? friendlyMessage(failure) : null)

  if (errorMessage) {
    // Sin payload no hay nada que reintentar: la única salida real es rehacer
    // el onboarding, que son treinta segundos.
    const canRetry = readOnboarding() !== null
    return (
      <ErrorState
        message={canRetry ? errorMessage : FRIENDLY.noPayload}
        retryLabel={canRetry ? "Reintentar" : "Volver a empezar"}
        onRetry={() => {
          if (!canRetry) {
            router.replace("/onboarding")
            return
          }
          posthog.capture("onboarding_complete_retry", {
            trigger: "manual",
            attempt: attemptRef.current,
            last_step: stepRef.current,
          })
          setStatusError(null)
          // Sin esto el error viejo de la mutation queda pegado y la pantalla
          // sigue mostrando el fallo aunque el reintento ande.
          enroll.reset()
          attemptRef.current = 0
          runningRef.current = false
          void runWithRetries()
        }}
        secondary={
          canRetry ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => router.replace("/onboarding")}
            >
              Volver a empezar
            </Button>
          ) : undefined
        }
      />
    )
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <Spinner className="size-6 text-primary" />
      {slow ? (
        <p className="text-sm text-muted-foreground">Esto está tardando más de lo normal…</p>
      ) : null}
    </main>
  )
}
