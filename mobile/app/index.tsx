// La pantalla del juego. `?auto=1` (solo en desarrollo) lo juega solo: ver
// lib/juego/UseAutoplay.ts.

import { Stack, useLocalSearchParams } from "expo-router"
import { MobileFlow } from "@/components/juego/mobile-flow"

export default function Juego() {
  const { auto } = useLocalSearchParams<{ auto?: string }>()
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MobileFlow auto={__DEV__ ? auto : undefined} />
    </>
  )
}
