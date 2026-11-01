// El renglón elegible de las diapos de la escalera (frecuencia, opinión,
// repetitividad): el `motion.button` que las tres repiten en la web. Entra
// escalonado, de arriba abajo, corriéndose 8 px SIN opacidad —si la animación no
// llegara a correr, el peor caso es que aparezca corrido, no invisible— y la
// opacidad la decide quien lo usa (la no elegida se apaga, no desaparece).
//
// El contenido lo pone cada diapo: emoji + texto (`EmojiYTexto`) en las dos
// encuestas, el radio de la frecuencia en la suya.

import { useEffect, useRef, type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"

const ENTRADA_MS = 220
const ESCALON_MS = 50

// `bg-accent/40` de la web.
const FONDO_ELEGIDA = "rgba(56,56,90,0.4)"

export function OpcionEncuesta({
  indice,
  seleccionada,
  opacidad,
  onPress,
  disabled = false,
  style,
  children,
}: {
  /** El lugar en la lista: decide el escalón de la entrada. */
  indice: number
  seleccionada: boolean
  opacidad: number
  onPress: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const y = useSharedValue(reduce ? 0 : 8)
  const alfa = useSharedValue(1)
  const montadaRef = useRef(false)

  useEffect(() => {
    if (reduce) return
    y.value = withDelay(
      ESCALON_MS * indice,
      withTiming(0, { duration: ENTRADA_MS, easing: Easing.out(Easing.ease) }),
    )
    // Una sola vez, al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const primera = !montadaRef.current
    montadaRef.current = true
    if (reduce) {
      alfa.value = opacidad
      return
    }
    const ir = withTiming(opacidad, { duration: ENTRADA_MS, easing: Easing.out(Easing.ease) })
    alfa.value = primera ? withDelay(ESCALON_MS * indice, ir) : ir
  }, [opacidad, reduce, indice, alfa])

  const animado = useAnimatedStyle(() => ({
    opacity: alfa.value,
    transform: [{ translateY: y.value }],
  }))

  return (
    <Animated.View style={animado}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: seleccionada, disabled }}
        style={({ pressed }) => [
          styles.opcion,
          seleccionada && styles.elegida,
          pressed && !disabled && !reduce && { transform: [{ scale: 0.97 }] },
          style,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

export function EmojiYTexto({ emoji, texto }: { emoji: string; texto: string }) {
  return (
    <>
      <Text style={styles.emoji} accessibilityElementsHidden importantForAccessibility="no">
        {emoji}
      </Text>
      <Text style={styles.texto}>{texto}</Text>
    </>
  )
}

/** La columna angosta y centrada de opciones (`max-w-xs` de la web). */
export function ListaDeOpciones({ children }: { children: ReactNode }) {
  return <View style={styles.lista}>{children}</View>
}

const styles = StyleSheet.create({
  lista: { width: "100%", maxWidth: 320, alignSelf: "center", gap: 8 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: TEMA.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  elegida: { borderColor: TEMA.ring, backgroundColor: FONDO_ELEGIDA },
  emoji: { fontSize: 24, lineHeight: 32 },
  texto: { fontSize: 16, fontWeight: "500", color: TEMA.foreground },
})
