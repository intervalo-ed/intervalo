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
// Destino por defecto: /onboarding/complete, que consulta /user/status y manda
// al home si el usuario ya estaba inscripto, o corre el onboarding si es nuevo.
// El minijuego de derivadas registra sin pasar por el onboarding: manda
// `?next=/derivadas` y vuelve al juego. Solo se aceptan paths propios (empiezan
// con "/") para que el parámetro no sirva como open redirect.
export default function SSOCallbackPage() {
  const router = useRouter()

  // Si esta página corre adentro de la ventanita del login (el registro del
  // minijuego en escritorio, ver register-slides.tsx :: authenticateWithGoogle),
  // la sesión ya quedó lista del otro lado en cuanto Clerk llega hasta acá —
  // misma sesión de navegador, mismo cliente de Clerk— y lo único que falta es
  // que la ventanita se vaya. Navegarla a algún lado dejaría un `/derivadas`
  // (o el onboarding) abierto ahí adentro, duplicado del que ya sigue en la
  // pestaña principal.
  const enVentanaEmergente =
    typeof window !== "undefined" && !!window.opener && window.opener !== window

  // decorateUrl agrega el dev browser token; en desarrollo puede devolver una
  // URL absoluta a otro dominio, que el router de Next no sabe navegar.
  const navigate = (url: string) => {
    if (enVentanaEmergente) {
      window.close()
      return
    }
    if (url.startsWith("http")) {
      window.location.href = url
      return
    }
    router.replace(url)
  }

  const appDestination = () => {
    const next = new URLSearchParams(window.location.search).get("next")
    if (next && next.startsWith("/") && !next.startsWith("//")) return next
    return "/onboarding/complete"
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background">
      <HandleSSOCallback
        navigateToApp={({ decorateUrl }) => navigate(decorateUrl(appDestination()))}
        navigateToSignIn={() => navigate("/sign-in")}
        navigateToSignUp={() => navigate("/sign-in")}
      />
      <Spinner />
    </main>
  )
}
