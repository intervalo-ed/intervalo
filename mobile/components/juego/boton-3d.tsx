// El botón pulsable en 3D de la app: una cara con un "labio" de otro tono
// debajo. Al apretar, la cara baja hasta tapar el labio, como una tecla que se
// hunde. Lo usan los botones de ancho completo (Revisar, Continuar, Reclutar…),
// la fila de ayudas del ejercicio y las opciones que se eligen (carrera,
// universidad, encuestas).
//
// El labio ocupa `LABIO` px debajo de la cara y ES parte del botón: con `alto`
// ese alto es el TOTAL (el pie no se corre respecto de un botón plano); sin él
// el botón mide lo que mide su contenido más el labio.

import type { ReactNode } from "react"
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native"
import Animated, {
  type AnimatedStyle,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"

export const LABIO = 4
const BAJADA = { duration: 60 }
const SUBIDA = { duration: 110 }

// El labio de cada cara. El blanco lleva un gris azulado: un gris neutro se leía
// como sombra sucia sobre el fondo violáceo.
export const LABIO_BLANCO = "#A8ADBF"
// Un escalón apenas más claro que el fondo: el labio de los botones de contorno
// tiene que acompañar al borde, no competir con él.
export const LABIO_CONTORNO = "#2B2B45"

export function Boton3D({
  children,
  onPress,
  disabled = false,
  alto,
  cara = "#fff",
  labio,
  contorno = false,
  radio = 8,
  caraEstilo,
  caraStyle,
  labioStyle,
  style,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
}: {
  children: ReactNode
  onPress: () => void
  disabled?: boolean
  /** Alto total, labio incluido. Sin él, el del contenido. */
  alto?: number
  /** Color de la cara. Con `contorno` es el del fondo de la app. */
  cara?: string
  labio?: string
  /** Cara del color del fondo con borde (Tabla, Saltear) en vez de llena. */
  contorno?: boolean
  radio?: number
  /** Estilos de la cara (relleno, borde, cómo acomoda lo de adentro). */
  caraEstilo?: StyleProp<ViewStyle>
  /** Estilos animados que pisan el color de la cara o del labio (el destello
   *  verde de Revisar). */
  caraStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>
  labioStyle?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  accessibilityRole?: "button" | "radio"
  accessibilityState?: { selected?: boolean; disabled?: boolean; busy?: boolean }
}) {
  const quieto = useReducedMotion()
  const hundida = useSharedValue(0)
  const bajada = useAnimatedStyle(() => ({ transform: [{ translateY: hundida.value * LABIO }] }))
  const fijo = alto !== undefined
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        hundida.value = quieto ? 1 : withTiming(1, BAJADA)
      }}
      onPressOut={() => {
        hundida.value = quieto ? 0 : withTiming(0, SUBIDA)
      }}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled, ...accessibilityState }}
      accessibilityLabel={accessibilityLabel}
      style={[fijo && { height: alto }, disabled && { opacity: 0.5 }, style]}
    >
      <Animated.View
        style={[
          { borderRadius: radio, paddingBottom: LABIO, backgroundColor: labio ?? (contorno ? LABIO_CONTORNO : LABIO_BLANCO) },
          fijo && styles.llena,
          labioStyle,
        ]}
      >
        <Animated.View
          style={[
            styles.cara,
            { borderRadius: radio, backgroundColor: contorno ? TEMA.background : cara },
            contorno && { borderWidth: 1, borderColor: TEMA.border },
            fijo && styles.llena,
            caraEstilo,
            bajada,
            caraStyle,
          ]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  llena: { flex: 1 },
  cara: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
})
