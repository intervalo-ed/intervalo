// Una pantalla del flujo que entra y sale de costado: el `slideVariants` de la
// web (slide-horizontal.tsx), 0,28 s ease-in-out. "adelante" entra por la
// derecha y sale por la izquierda; "atras" es el espejo.
//
// A diferencia de la web, la capa no se monta y desmonta con cada pase: quien
// la usa decide cuánto vive. La del ejercicio vive siempre (adentro está el
// campo, que no se puede remontar) y cuando no está activa queda corrida fuera
// de la pantalla; las demás se montan al entrar y se sueltan cuando terminó su
// salida.

import { useEffect, useRef, type ReactNode } from "react"
import { StyleSheet, useWindowDimensions } from "react-native"
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

export type Direccion = "adelante" | "atras"

export const PASE_MS = 280
const PASE = { duration: PASE_MS, easing: Easing.inOut(Easing.ease) }

export function CapaDeslizante({
  activa,
  direccion,
  // Si al montarse ya activa entra deslizando (una diapo nueva) o aparece
  // quieta (la primera pantalla de la sesión, como `initial={false}`).
  entrarAlMontar,
  children,
}: {
  activa: boolean
  direccion: Direccion
  entrarAlMontar: boolean
  children: ReactNode
}) {
  const { width } = useWindowDimensions()
  const desde = direccion === "atras" ? -width : width
  const x = useSharedValue(activa ? (entrarAlMontar ? desde : 0) : width)
  const montada = useRef(false)

  useEffect(() => {
    const primera = !montada.current
    montada.current = true
    if (primera) {
      if (activa && entrarAlMontar) x.value = withTiming(0, PASE)
      return
    }
    if (activa) {
      x.value = direccion === "atras" ? -width : width
      x.value = withTiming(0, PASE)
    } else {
      x.value = withTiming(direccion === "atras" ? width : -width, PASE)
    }
    // Solo cuando cambia `activa`: la dirección es la del pase que la cambió.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa])

  const estilo = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, estilo]}
      pointerEvents={activa ? "auto" : "none"}
    >
      {children}
    </Animated.View>
  )
}
