// La pantalla del juego. `?auto=1` (solo en desarrollo) lo juega solo: ver
// lib/juego/UseAutoplay.ts. `EXPO_PUBLIC_AUTOPLAY=1` al levantar Metro hace lo
// mismo sin abrir el link, que en el simulador deja un diálogo que nadie toca.

import { Stack, useLocalSearchParams } from "expo-router"
import { MobileFlow } from "@/components/juego/mobile-flow"

export default function Juego() {
  const { auto } = useLocalSearchParams<{ auto?: string }>()
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MobileFlow auto={__DEV__ ? (auto ?? process.env.EXPO_PUBLIC_AUTOPLAY) : undefined} />
    </>
  )
}
