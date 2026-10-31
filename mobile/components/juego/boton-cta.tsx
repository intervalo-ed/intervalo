// El botón blanco de ancho completo de las diapos (`ctaCls` de mobile-flow.tsx
// en la web): ¡Vamos!, Volver, Continuar.

import { Pressable, StyleSheet, Text } from "react-native"
import { CTA_H } from "./exercise-card"

export function BotonCta({
  texto,
  onPress,
  disabled = false,
}: {
  texto: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.boton, pressed && { opacity: 0.9 }, disabled && { opacity: 0.5 }]}
    >
      <Text style={styles.texto}>{texto}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  boton: {
    height: CTA_H,
    borderRadius: 6,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  texto: { color: "#000", fontSize: 16, fontWeight: "700" },
})
