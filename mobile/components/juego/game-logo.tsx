// El logo del juego: d/dx [ intervalo ] con la barra de cinturones debajo de la
// palabra. Es el lockup ya armado de web/src/app/derivadas/game-logo.tsx, sin
// la presentación (el typewriter que lo escribe en el centro y lo deja en su
// lugar): acá aparece entero, con un fundido.

import { StyleSheet, View } from "react-native"
import { Text } from "@/components/texto"
import Animated, { FadeIn } from "react-native-reanimated"
import { BELT_LEGEND_BAR_COLORS } from "@intervalo/dx-core/catalog"
import { FUENTE } from "@/lib/tipografia"

const GAP_EM = 0.16
const BAR_EM = 0.12
const OP_EM = 0.66
const OP_BAR_EM = 0.075
const BRACKET_W_EM = 0.2
const BRACKET_STEM_EM = 0.07
const BRACKET_ARM_EM = 0.055
const BRACKET_PAD_EM = 0.13
// Cuánto sobra de aire bajo la línea de base de la palabra en iOS respecto de la web.
const BAJADA_EM = 0.15
const COLOR = "#F6F8FC"

export function GameLogo({
  fontSize,
  conFundido = true,
}: {
  fontSize: number
  /** El fundido de entrada. Se apaga cuando quien lo usa lo anima por su cuenta
   *  (el splash) o cuando tiene que estar puesto desde el primer cuadro. */
  conFundido?: boolean
}) {
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
    <Animated.View
      entering={conFundido ? FadeIn.duration(500) : undefined}
      style={[styles.fila, { gap: em(GAP_EM) }]}
      accessibilityLabel="intervalo"
    >
      <View style={{ alignItems: "center", gap: em(OP_BAR_EM * 1.6 * OP_EM) }}>
        <Text style={[styles.texto, { fontSize: op, lineHeight: op }]}>d</Text>
        <View style={{ height: em(OP_BAR_EM * OP_EM), alignSelf: "stretch", backgroundColor: COLOR }} />
        <Text style={[styles.texto, { fontSize: op, lineHeight: op }]}>dx</Text>
      </View>
      <View style={[styles.filaEstirada, { gap: em(BRACKET_PAD_EM) }]}>
        {corchete("left")}
        <View style={{ alignItems: "center", gap: em(GAP_EM), paddingVertical: em(BRACKET_PAD_EM) }}>
          {/* El margen negativo compensa cómo iOS reparte el interlineado de la Noto
              Serif: con la caja de 1em de la web el subrayado queda a ~0,27em de
              la línea de base, y sin él quedaba a ~0,43em, despegado de la palabra. */}
          <Text style={[styles.texto, { fontSize, lineHeight: fontSize, marginBottom: -em(BAJADA_EM) }]}>intervalo</Text>
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
  // Noto Serif 600: el `font-heading` de la web (ver lib/tipografia.ts).
  texto: { color: COLOR, fontFamily: FUENTE.logo },
  barra: { flexDirection: "row", alignSelf: "stretch", borderRadius: 2, overflow: "hidden" },
})
