// El logo del juego: d/dx [ intervalo ] con la barra de cinturones debajo de la
// palabra. Es el lockup ya armado de web/src/app/derivadas/game-logo.tsx, sin
// la presentación (el typewriter que lo escribe en el centro y lo deja en su
// lugar): acá aparece entero, con un fundido.

import { StyleSheet, Text, View } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import { BELT_LEGEND_BAR_COLORS } from "@intervalo/dx-core/catalog"

const GAP_EM = 0.16
const BAR_EM = 0.12
const OP_EM = 0.66
const OP_BAR_EM = 0.075
const BRACKET_W_EM = 0.2
const BRACKET_STEM_EM = 0.07
const BRACKET_ARM_EM = 0.055
const BRACKET_PAD_EM = 0.13
const COLOR = "#F6F8FC"

export function GameLogo({ fontSize }: { fontSize: number }) {
  const em = (n: number) => n * fontSize
  const corchete = (lado: "left" | "right") => (
    <View
      style={{
        width: em(BRACKET_W_EM),
        borderTopWidth: em(BRACKET_ARM_EM),
        borderBottomWidth: em(BRACKET_ARM_EM),
        [lado === "left" ? "borderLeftWidth" : "borderRightWidth"]: em(BRACKET_STEM_EM),
        borderColor: COLOR,
      }}
    />
  )
  const op = em(OP_EM)
  return (
    <Animated.View entering={FadeIn.duration(500)} style={[styles.fila, { gap: em(GAP_EM) }]} accessibilityLabel="intervalo">
      <View style={{ alignItems: "center", gap: em(OP_BAR_EM * 1.6 * OP_EM) }}>
        <Text style={[styles.texto, { fontSize: op, lineHeight: op }]}>d</Text>
        <View style={{ height: em(OP_BAR_EM * OP_EM), alignSelf: "stretch", backgroundColor: COLOR }} />
        <Text style={[styles.texto, { fontSize: op, lineHeight: op }]}>dx</Text>
      </View>
      <View style={[styles.filaEstirada, { gap: em(BRACKET_PAD_EM) }]}>
        {corchete("left")}
        <View style={{ alignItems: "center", gap: em(GAP_EM), paddingVertical: em(BRACKET_PAD_EM) }}>
          <Text style={[styles.texto, { fontSize, lineHeight: fontSize * 1.1 }]}>intervalo</Text>
          <View style={[styles.barra, { height: em(BAR_EM) }]}>
            {BELT_LEGEND_BAR_COLORS.map((color, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: color }} />
            ))}
          </View>
        </View>
        {corchete("right")}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center" },
  filaEstirada: { flexDirection: "row", alignItems: "stretch" },
  texto: { color: COLOR, fontWeight: "600" },
  barra: { flexDirection: "row", alignSelf: "stretch", borderRadius: 2, overflow: "hidden" },
})
