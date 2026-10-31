// Entrar con Google, el par nativo de `useGoogleLogin` de
// web/src/app/derivadas/google-login.tsx.
//
// En la web el viaje es una recarga: al volver, el bootstrap corre de cero. Acá
// la página nunca se va —Clerk abre la ventanita del sistema y la cierra al
// volver—, así que lo que en la web hace la recarga lo hace `useGamePlayer` al
// ver que `isSignedIn` cambió: el segundo POST /player linkea guest→user y
// después se aplica el @ deseado.

import { useEffect, useState } from "react"
import { Platform } from "react-native"
import { isClerkAPIResponseError, useAuth, useSSO } from "@clerk/expo"
import { makeRedirectUri } from "expo-auth-session"
import * as WebBrowser from "expo-web-browser"
import { saveDesiredAlias } from "@intervalo/dx-core/juego/alias-deseado"

// Solo hace algo en la web; Clerk lo pide igual en su flujo de Expo.
WebBrowser.maybeCompleteAuthSession()

export const ERROR_GOOGLE = "No pudimos conectar con Google. Probá de nuevo."

// Tiene que estar en la lista de redirects permitidos de Clerk (Native
// applications → Allowlist for mobile SSO redirect), o el retorno llega sin
// `rotating_token_nonce` y la sesión no se crea.
const REDIRECT_URL = makeRedirectUri({ scheme: "derivadas", path: "sso-callback" })

/** En Android, abrir la pestaña del navegador en frío tarda: se calienta
 *  mientras la pantalla que tiene el botón está montada. */
function useNavegadorCaliente() {
  useEffect(() => {
    if (Platform.OS !== "android") return
    void WebBrowser.warmUpAsync().catch(() => {})
    return () => {
      void WebBrowser.coolDownAsync().catch(() => {})
    }
  }, [])
}

export function useGoogleLogin() {
  useNavegadorCaliente()
  const { isLoaded } = useAuth()
  const { startSSOFlow } = useSSO()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Guarda el @ deseado (si vino), corre el SSO y activa la sesión creada.
   *  `true` si quedó una sesión activa; `false` si la persona cerró la ventana
   *  o falló (en ese caso `error` tiene el texto). */
  async function login({ alias }: { alias?: string } = {}): Promise<boolean> {
    if (!isLoaded || cargando) return false
    setCargando(true)
    setError(null)
    if (alias) saveDesiredAlias(alias)
    try {
      const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: REDIRECT_URL,
      })
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
        return true
      }
      // Cerró la ventana o volvió atrás: no es un error, sigue como estaba.
      if (authSessionResult?.type !== "success") return false
      // Volvió de Google pero Clerk pide algo más (un campo obligatorio de la
      // cuenta): el juego no tiene cómo completarlo.
      setError(ERROR_GOOGLE)
      return false
    } catch (e) {
      // Sesión ya activa: no hay OAuth que correr y `useGamePlayer` ya la ve.
      if (isClerkAPIResponseError(e) && e.errors[0]?.code === "session_exists") return true
      console.error("Google SSO error", e)
      setError(ERROR_GOOGLE)
      return false
    } finally {
      setCargando(false)
    }
  }

  return {
    login,
    cargando,
    error,
    limpiarError: () => setError(null),
    // Clerk todavía cargando: el botón espera.
    listo: isLoaded,
  }
}
