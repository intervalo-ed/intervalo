// El lugar de una diapo de la escalera que la app todavía no tiene (ranking, el
// @, las reglas, el registro, las encuestas…). Se ve, se nombra y se sale con
// Continuar, que retoma la escalera como lo haría la diapo de verdad.

import { StyleSheet, Text, View } from "react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { BotonCta } from "./boton-cta"

export function ProximamenteSlide({
  paso,
  onContinue,
  disabled,
}: {
  paso: string
  onContinue: () => void
  disabled?: boolean
}) {
  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        <Text style={styles.titulo}>{paso}</Text>
        <Text style={styles.subtitulo}>próximamente</Text>
      </View>
      <BotonCta texto="Continuar" onPress={onContinue} disabled={disabled} />
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
  titulo: { fontSize: 22, fontWeight: "600", color: TEMA.foreground },
  subtitulo: { fontSize: 15, color: TEMA.mutedForeground },
})
