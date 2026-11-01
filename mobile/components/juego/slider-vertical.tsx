// El slider de la palanca de dificultad, el par nativo de
// `web/src/app/derivadas/slider-vertical.tsx`: un riel vertical que se arrastra
// de a un paso, con un relleno ACUMULATIVO que crece desde arriba y toma, tramo
// a tramo, el color del nivel que atraviesa, y un pulgar que respira. Arriba es
// más suave y abajo más exigente, como se dibuja.

import { useEffect, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { GestureDetector, usePanGesture } from "react-native-gesture-handler"
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import Svg, { Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { mezclar, rgbaDeRgb } from "@intervalo/dx-core/juego/dificultad"

// El desplazamiento fugaz del cafecito (FUGAZ): 110 ms con salida suave, sin
// rebote, para que el pulgar no parezca pasarse del valor elegido.
const FUGAZ = { duration: 110, easing: Easing.out(Easing.ease) }

// El período del café (RESPIRO_S): a este ritmo no se ve «una animación», se ve
// que la cosa está viva. Late el aura, nunca el tamaño.
const RESPIRO_S = 5.2

const ANCHO = 36
const RIEL = 8
const PULGAR = 14
const ANILLO = 2

function Flecha({
  hacia,
  disabled,
  onPress,
}: {
  hacia: "arriba" | "abajo"
  disabled: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={hacia === "arriba" ? "Más suave" : "Más exigente"}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.flecha,
        pressed && { backgroundColor: TEMA.accent },
        disabled && { opacity: 0.35 },
      ]}
    >
      <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        stroke={TEMA.mutedForeground}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {hacia === "arriba" ? (
          <>
            <Path d="m5 12 7-7 7 7" />
            <Path d="M12 19V5" />
          </>
        ) : (
          <>
            <Path d="M12 5v14" />
            <Path d="m19 12-7 7-7-7" />
          </>
        )}
      </Svg>
    </Pressable>
  )
}

export function SliderVertical({
  valor,
  max,
  colores,
  onCambio,
  accessibilityLabel,
}: {
  valor: number
  max: number
  /** Un color por posición, de 0 a `max`. */
  colores: readonly string[]
  onCambio: (v: number) => void
  accessibilityLabel?: string
}) {
  const quieto = useReducedMotion()
  const [alto, setAlto] = useState(0)
  const t = valor / max
  const suaves = mezclar(colores)
  const color = suaves[valor]

  // El relleno es el degradado de toda la barra, recortado hasta donde se
  // eligió: lo que se ve crecer es el calor.
  const relleno = `linear-gradient(180deg, ${suaves
    .map((c, i) => `${c} ${(i / max) * 100}%`)
    .join(", ")})`

  const lleno = useSharedValue(t)
  const respiro = useSharedValue(1)
  useEffect(() => {
    lleno.value = quieto ? t : withTiming(t, FUGAZ)
  }, [t, quieto, lleno])
  useEffect(() => {
    if (quieto) {
      cancelAnimation(respiro)
      respiro.value = 1
      return
    }
    respiro.value = withRepeat(
      withTiming(1.35, { duration: (RESPIRO_S * 1000) / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
    return () => cancelAnimation(respiro)
  }, [quieto, respiro])

  const estiloRelleno = useAnimatedStyle(() => ({ height: lleno.value * alto }))
  const estiloPulgar = useAnimatedStyle(() => ({
    transform: [{ translateY: lleno.value * alto - PULGAR / 2 }],
  }))
  // El aura del pulgar del cafecito (auraPulgar): crece con la posición y
  // respira, y en lo más suave no hay ninguna.
  // El color sin su alfa («rgba(r, g, b, »): el alfa respira dentro del worklet.
  const sinAlfa = rgbaDeRgb(color, 0).slice(0, -2)
  const estiloAura = useAnimatedStyle(() => {
    const k = respiro.value
    return {
      boxShadow: `0 0 ${((1 + 2 * t) * k).toFixed(1)}px 0 ${sinAlfa}${(0.12 * t * k).toFixed(3)})`,
    }
  })

  // Tocar o arrastrar en el riel lleva el pulgar al paso más cercano.
  const desdeY = (y: number) => {
    if (alto === 0) return
    const v = Math.round(Math.min(1, Math.max(0, y / alto)) * max)
    if (v !== valor) onCambio(v)
  }
  const arrastre = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (e) => desdeY(e.y),
    onUpdate: (e) => desdeY(e.y),
  })

  return (
    <View style={styles.columna}>
      <Flecha hacia="arriba" disabled={valor === 0} onPress={() => onCambio(valor - 1)} />
      <GestureDetector gesture={arrastre}>
        <View
          style={styles.zona}
          onLayout={(e) => setAlto(e.nativeEvent.layout.height)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{ min: 0, max, now: valor }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(e) => {
            const v = Math.min(max, Math.max(0, valor + (e.nativeEvent.actionName === "increment" ? 1 : -1)))
            if (v !== valor) onCambio(v)
          }}
        >
          <View style={styles.riel} />
          {/* Lo elegido, con su luz: crece con lo que se llena, como el
              cafecito. En lo más suave casi no hay, y en lo más profundo la
              barra brilla. */}
          <Animated.View
            style={[
              styles.relleno,
              { boxShadow: `0 0 1px ${rgbaDeRgb(color, 0.03 + 0.1 * t)}` },
              estiloRelleno,
            ]}
          >
            <View style={[styles.degradado, { height: alto, backgroundImage: relleno }]} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.pulgar, { borderColor: color }, estiloAura, estiloPulgar]}
          >
            <View style={[styles.pulgarRelleno, { backgroundColor: color }]} />
          </Animated.View>
        </View>
      </GestureDetector>
      <Flecha hacia="abajo" disabled={valor === max} onPress={() => onCambio(valor + 1)} />
    </View>
  )
}

const styles = StyleSheet.create({
  columna: { height: "100%", alignItems: "center", gap: 12 },
  flecha: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    alignItems: "center",
    justifyContent: "center",
  },
  zona: { flex: 1, width: ANCHO },
  riel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: (ANCHO - RIEL) / 2,
    width: RIEL,
    borderRadius: 999,
    backgroundColor: "rgba(246,248,252,0.12)",
  },
  relleno: {
    position: "absolute",
    top: 0,
    left: (ANCHO - RIEL) / 2,
    width: RIEL,
    borderRadius: 999,
    overflow: "hidden",
  },
  degradado: { width: RIEL },
  pulgar: {
    position: "absolute",
    top: 0,
    left: (ANCHO - PULGAR) / 2 - ANILLO,
    width: PULGAR + ANILLO * 2,
    height: PULGAR + ANILLO * 2,
    marginTop: -ANILLO,
    borderRadius: 999,
    borderWidth: ANILLO,
    overflow: "visible",
  },
  pulgarRelleno: { flex: 1, borderRadius: 999 },
})
