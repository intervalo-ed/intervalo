// El botón blanco de ancho completo de las diapos (`ctaCls` de mobile-flow.tsx
// en la web): ¡Vamos!, Volver, Continuar, Guardar. En 3D, como los de abajo del
// ejercicio (boton-3d.tsx).

import { StyleSheet } from "react-native"
import { Text } from "@/components/texto"
import { Boton3D } from "./boton-3d"
import { CTA_H } from "./exercise-card"
import { FUENTE } from "@/lib/tipografia"

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
    <Boton3D onPress={onPress} disabled={disabled} alto={CTA_H}>
      <Text style={styles.texto}>{texto}</Text>
    </Boton3D>
  )
}

const styles = StyleSheet.create({
  texto: { color: "#000", fontSize: 16, fontFamily: FUENTE.negrita },
})
