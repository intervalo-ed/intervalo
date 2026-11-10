import "@/lib/almacen/instalar-almacen"
import { useEffect, useState, type ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"
import { Stack } from "expo-router"
import { useFonts } from "expo-font"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import * as SplashScreen from "expo-splash-screen"
import { ClerkProvider } from "@clerk/expo"
import { tokenCache } from "@clerk/expo/token-cache"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PostHogProvider } from "posthog-react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { GameApiProvider } from "@intervalo/dx-core/juego/game-api-context"
import type { Rescate } from "@intervalo/dx-core/juego/game-storage"
import { precalentarTablaDeDerivadas } from "@/components/juego/derivatives-table"
import { SplashAnimado } from "@/components/splash-animado"
import { precalentarMathJax } from "@/components/latex/mathjax"
import { posthog } from "@/lib/analytics/posthog"
import { liberarSonidosDelJuego, precargarSonidosDelJuego } from "@/lib/audio/UseSfx"
import { useGameApiNativo } from "@/lib/api/UseGameApiNativo"
import { reafirmarTokenDeAvisos, refrescarPermisoDeAvisos } from "@/lib/avisos/registro-push"
import { useTapDeAviso } from "@/lib/avisos/UseTapDeAviso"
import { RescateProvider } from "@/lib/almacen/rescate-context"
import { restaurarToken } from "@/lib/almacen/token-seguro"
import { env } from "@/lib/env"
import { FUENTES_CRITICAS, FUENTES_DIFERIDAS } from "@/lib/tipografia"

void SplashScreen.preventAutoHideAsync()

// Los mismos defaults que la web (web/src/app/providers.tsx).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function RootLayout() {
  // El splash queda arriba hasta que el respaldo del llavero se adoptó: el alta
  // del jugador no puede salir antes, o crearía un invitado nuevo.
  const [rescate, setRescate] = useState<Rescate | null>(null)
  // Las fuentes también se esperan con el splash arriba: si no, el primer
  // cuadro saldría en la tipografía del sistema y después saltaría. Si fallan
  // en cargar se sigue igual (cae a la del sistema) para no bloquear el juego.
  const [fuentesListas, errorDeFuentes] = useFonts(FUENTES_CRITICAS)
  useFonts(FUENTES_DIFERIDAS)
  const fuentesResueltas = fuentesListas || errorDeFuentes !== null
  useTapDeAviso()

  useEffect(() => {
    let vivo = true
    void restaurarToken().then((r) => {
      if (vivo) setRescate(r)
    })
    // Lo que la primera pantalla del juego va a necesitar, mientras el splash
    // sigue arriba: MathJax armado (con las fórmulas de la tabla ya
    // convertidas) y los reproductores de los sonidos.
    precargarSonidosDelJuego()
    precalentarMathJax()
    precalentarTablaDeDerivadas()
    return () => {
      vivo = false
      liberarSonidosDelJuego()
    }
  }, [])

  // El splash nativo es solo el fondo: apenas está la tipografía del logo se
  // retira y queda el splash animado (components/splash-animado.tsx), que es
  // quien tapa el arranque del resto de la app.
  useEffect(() => {
    if (fuentesResueltas || !env.clerkPublishableKey) SplashScreen.hide()
  }, [fuentesResueltas])

  if (!env.clerkPublishableKey) {
    return (
      <View style={styles.falta}>
        <Text style={styles.faltaTitulo}>Falta EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY</Text>
        <Text>Copiá mobile/.env.example a mobile/.env, completala y reiniciá Metro.</Text>
      </View>
    )
  }

  if (!fuentesResueltas) return null

  return (
    <GestureHandlerRootView style={styles.raiz}>
      {/* El árbol del juego se arma debajo del splash, que lo tapa hasta que el
          logo sale hacia su lugar. */}
      {rescate !== null && (
        <ClerkProvider publishableKey={env.clerkPublishableKey} tokenCache={tokenCache}>
          <QueryClientProvider client={queryClient}>
            <ConPostHog>
              <GameApi>
                <RescateProvider value={rescate}>
                  <Stack />
                </RescateProvider>
              </GameApi>
            </ConPostHog>
          </QueryClientProvider>
        </ClerkProvider>
      )}
      <SplashAnimado />
    </GestureHandlerRootView>
  )
}

function GameApi({ children }: { children: ReactNode }) {
  const api = useGameApiNativo()
  // Al arrancar: el permiso para el ladder y, si ya estaba dado, el token de
  // vuelta al backend (el cliente es estable; si cambia, reafirmar no daña).
  useEffect(() => {
    void refrescarPermisoDeAvisos()
    void reafirmarTokenDeAvisos({ api })
  }, [api])
  return <GameApiProvider value={api}>{children}</GameApiProvider>
}

function ConPostHog({ children }: { children: ReactNode }) {
  if (posthog === null) return children
  return (
    // Las pantallas no se autocapturan: eso necesita el NavigationContainer de
    // react-navigation, que expo-router no expone. Se trackean a mano después.
    <PostHogProvider client={posthog} autocapture={{ captureScreens: false }}>
      {children}
    </PostHogProvider>
  )
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: TEMA.background },
  falta: { flex: 1, justifyContent: "center", padding: 24, gap: 8 },
  faltaTitulo: { fontSize: 18, fontWeight: "600", color: "#b00020" },
})
