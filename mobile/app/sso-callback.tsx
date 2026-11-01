// El retorno de Google (`derivadas://sso-callback`). En iOS la ventanita del
// sistema lo atrapa y nunca llega acá; en Android el deep link también abre la
// app y Expo Router navega a esta ruta. Sin ella se vería «Unmatched route»:
// lo que hace es volver al juego, que ya tiene el resultado del login.

import { useEffect } from "react"
import { Stack, useRouter } from "expo-router"

export default function SsoCallback() {
  const router = useRouter()
  useEffect(() => {
    if (router.canGoBack()) router.back()
    else router.replace("/")
  }, [router])
  return <Stack.Screen options={{ headerShown: false, animation: "none" }} />
}
