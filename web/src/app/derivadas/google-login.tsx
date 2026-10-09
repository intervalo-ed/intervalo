"use client"

// Entrar con Google, en un solo lugar.
//
// Lo usan dos pantallas que piden lo mismo con intenciones distintas: la diapo
// de registro (hito: «guardá tu progreso») y «Elegí tu @» (primera vez en este
// aparato: «si ya jugaste en otro, acá recuperás tu progreso»). La coreografía
// con Clerk es idéntica en las dos —create + sso, ventanita en escritorio,
// redirect en el teléfono— y antes vivía adentro de register-slides.tsx.

import { useRef, useState } from "react"
import { useSignIn } from "@clerk/nextjs"

export const DESIRED_ALIAS_KEY = "intervalo:game:desired-alias"

export function readDesiredAlias(): string | null {
  try {
    return window.localStorage.getItem(DESIRED_ALIAS_KEY)
  } catch {
    return null
  }
}

export function clearDesiredAlias() {
  try {
    window.localStorage.removeItem(DESIRED_ALIAS_KEY)
  } catch {}
}

/** Lo que la persona escribió como @ antes de irse a Google: se aplica al
 *  volver (ver `useApplyDesiredAlias` en register-slides.tsx). */
export function saveDesiredAlias(alias: string) {
  try {
    const cleaned = alias.trim().toLowerCase().replace(/^@/, "")
    if (cleaned) window.localStorage.setItem(DESIRED_ALIAS_KEY, cleaned)
  } catch {}
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.97 10.97 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

// Cuánto mide la ventana del login: ni tan chica que Google recorte su propio
// diseño, ni tan grande que parezca la pestaña principal escondiéndose atrás.
const VENTANA_ANCHO = 480
const VENTANA_ALTO = 640

/** Abre la ventanita del login, centrada sobre esta. `null` si el navegador la
 *  bloqueó — ahí quien llama sigue con el redirect de toda la vida.
 *
 *  Tiene que llamarse SIN ningún `await` antes, en el mismo gesto del click:
 *  los navegadores solo dejan abrir una ventana nueva sin bloquearla dentro
 *  del stack síncrono de un gesto del usuario. */
export function abrirVentanaDeGoogle(): Window | null {
  const left = window.screenX + Math.max(0, (window.outerWidth - VENTANA_ANCHO) / 2)
  const top = window.screenY + Math.max(0, (window.outerHeight - VENTANA_ALTO) / 2)
  return window.open(
    "",
    "intervalo-google",
    `width=${VENTANA_ANCHO},height=${VENTANA_ALTO},left=${left},top=${top}`,
  )
}

export const ERROR_GOOGLE = "No pudimos conectar con Google. Probá de nuevo."

/** El login con Google del juego.
 *
 * Misma coreografía que el wizard (create + sso), con el retorno apuntando al
 * juego: /sso-callback?next=/derivadas y de ahí de vuelta acá. Al volver, el
 * bootstrap (`POST /player` con sesión de Clerk) devuelve el jugador de la
 * cuenta —o engancha al invitado de este aparato si la cuenta no tenía uno—.
 *
 * Con `popup` (solo escritorio), la única diferencia es ESA ventana: `sso()`
 * acepta una y navega A ELLA en vez de a esta pestaña, así que `/sso-callback`
 * corre adentro de la ventanita —ahí se cierra sola (ver sso-callback/page.tsx)—
 * y esta pestaña nunca se mueve de `/derivadas`. Si el navegador bloqueó la
 * ventana, sigue el redirect de toda la vida.
 *
 * `antesDeIr` corre después de abrir la ventana y antes del primer `await`: es
 * donde cada pantalla guarda lo que quiere que sobreviva al viaje (el @
 * deseado, un evento de telemetría). */
export function useGoogleLogin({
  popup = false,
  antesDeIr,
}: {
  popup?: boolean
  antesDeIr?: () => void
} = {}) {
  const { signIn } = useSignIn()
  const [pendiente, setPendiente] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const antesDeIrRef = useRef(antesDeIr)
  antesDeIrRef.current = antesDeIr

  function fallar(e: { code: string }) {
    // Sesión ya activa: no hay OAuth que correr; recargar alcanza para que el
    // bootstrap linkee al guest con la cuenta.
    if (e.code === "session_exists") {
      window.location.assign("/derivadas")
      return
    }
    console.error("Google SSO error", e)
    setPendiente(false)
    setError(ERROR_GOOGLE)
  }

  async function iniciar() {
    if (!signIn || pendiente) return
    setPendiente(true)
    setError(null)

    // Antes que nada y sin ningún `await` en el medio: `window.open` solo
    // escapa al bloqueador de ventanas emergentes dentro del gesto síncrono
    // del click.
    const ventana = popup ? abrirVentanaDeGoogle() : null
    antesDeIrRef.current?.()

    const origin = window.location.origin
    const callbackUrl = `${origin}/sso-callback?next=/derivadas`
    const completeUrl = `${origin}/derivadas`

    const created = await signIn.create({
      strategy: "oauth_google",
      redirectUrl: callbackUrl,
      actionCompleteRedirectUrl: completeUrl,
    })
    if (created.error) return fallar(created.error)

    const { error: ssoError } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: completeUrl,
      redirectCallbackUrl: callbackUrl,
      ...(ventana ? { popup: ventana } : {}),
    })
    if (ssoError) return fallar(ssoError)

    if (ventana) {
      // Lo que haya pasado adentro de la ventanita ya corrió: si el login
      // terminó, esto activa la sesión en ESTA pestaña (`finalize`, la señal
      // que usan `useUser`/`useAuth` para enterarse). Si quedó a mitad —la
      // persona cerró la ventana antes de terminar—, no hay nada que activar
      // y el recargado de abajo vuelve a dejar todo como un invitado más.
      if (signIn.status === "complete") {
        await signIn.finalize().catch(() => {})
      }
      window.location.assign("/derivadas")
      return
    }

    if (!signIn.firstFactorVerification.externalVerificationRedirectURL) {
      fallar({ code: "no_external_verification_redirect" })
    }
  }

  return {
    iniciar,
    pendiente,
    error,
    limpiarError: () => setError(null),
    // Clerk todavía cargando: el botón espera.
    listo: !!signIn,
    // Para quien además muestra errores propios (guardar el @) en la misma
    // línea de texto.
    setError,
  }
}
