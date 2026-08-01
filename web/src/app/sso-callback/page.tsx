"use client"

// `@clerk/nextjs` re-exporta casi todo `@clerk/react`, pero no HandleSSOCallback;
// hay que importarlo de ahí (misma versión que resuelve @clerk/nextjs, para que
// sea la misma copia del provider).
import { HandleSSOCallback } from "@clerk/react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

// Callback del flujo OAuth. `HandleSSOCallback` es el componente que Clerk
// recomienda para UI propia: resuelve solo el caso de la cuenta que todavía no
// existe (transfiere el sign-in a sign-up) y monta el captcha cuando hace falta.
// Por eso los botones de Google no necesitan saber si el usuario ya tenía
// cuenta: siempre caen acá.
//
// Destino único: /onboarding/complete, que consulta /user/status y manda al
// home si el usuario ya estaba inscripto, o corre el onboarding si es nuevo.
export default function SSOCallbackPage() {
  const router = useRouter()

  // decorateUrl agrega el dev browser token; en desarrollo puede devolver una
  // URL absoluta a otro dominio, que el router de Next no sabe navegar.
  const navigate = (url: string) => {
    if (url.startsWith("http")) {
      window.location.href = url
      return
    }
    router.replace(url)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background">
      <HandleSSOCallback
        navigateToApp={({ decorateUrl }) => navigate(decorateUrl("/onboarding/complete"))}
        navigateToSignIn={() => router.replace("/sign-in")}
        navigateToSignUp={() => router.replace("/sign-in")}
      />
      <Spinner />
    </main>
  )
}
