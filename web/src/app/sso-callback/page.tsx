"use client"

import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { Spinner } from "@/components/ui/spinner"

// Callback custom del flujo OAuth. El onboarding siempre arranca como sign-in
// (`signIn.sso`), así que para un usuario nuevo el sign-in queda "transferable":
// hay que convertirlo en sign-up acá mismo. Si en cambio se usara el componente
// prearmado, Clerk rebota al Account Portal con "The External Account was not
// found." y obliga a reintentar Google. Manejamos el transfer en ambos sentidos
// para registrar/loguear en la primera selección de cuenta.
export default function SSOCallbackPage() {
  const clerk = useClerk()
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const router = useRouter()
  const hasRun = useRef(false)

  useEffect(() => {
    void (async () => {
      if (!clerk.loaded || hasRun.current || !signIn || !signUp) return
      hasRun.current = true

      const navTo = (path: string) => ({
        navigate: async ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
          router.push(decorateUrl(path))
        },
      })
      // Usuario nuevo → /onboarding/complete (persiste el onboarding guardado en
      // localStorage). Usuario existente → home.
      const goComplete = navTo("/onboarding/complete")
      const goHome = navTo("/")

      // Usuario existente: el sign-in con Google ya está completo.
      if (signIn.status === "complete") {
        await signIn.finalize(goHome)
        return
      }

      // Usuario nuevo: vino por sign-in pero no tiene cuenta → transferir a sign-up.
      if (signIn.isTransferable) {
        await signUp.create({ transfer: true })
        if (signUp.status === "complete") {
          await signUp.finalize(goComplete)
          return
        }
        router.push("/onboarding/complete")
        return
      }

      // Caso simétrico: se inició como sign-up pero la cuenta ya existía.
      if (signUp.isTransferable) {
        await signIn.create({ transfer: true })
        // create() muta el recurso; leemos el status ya actualizado (TS lo tiene
        // estrechado por el guard de arriba, de ahí el String()).
        if (String(signIn.status) === "complete") {
          await signIn.finalize(goHome)
          return
        }
        router.push("/sign-in")
        return
      }

      if (signUp.status === "complete") {
        await signUp.finalize(goComplete)
        return
      }

      // Estados que requieren pasos extra (2FA, password nuevo, etc.): al portal.
      router.push("/sign-in")
    })()
  }, [clerk, signIn, signUp, router])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background">
      <Spinner />
      <div id="clerk-captcha" />
    </main>
  )
}
