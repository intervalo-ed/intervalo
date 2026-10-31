// La portada del juego: el logo, qué es esto y «¡Vamos!». Es el respaldo de
// `PuertaMinima` de la web (intro-panel.tsx), con los mismos textos de dx-core
// (textos-reglas.ts); el saludo con el digest de `/bienvenida` y la
// presentación animada del logo quedan para después.

import { StyleSheet, Text, View } from "react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import {
  BIENVENIDA_MINIMA,
  INSTRUCCION_MINIMA,
  QUE_ES,
} from "@intervalo/dx-core/juego/textos-reglas"
import { BotonCta } from "./boton-cta"
import { GameLogo } from "./game-logo"

export function IntroSlide({
  onStart,
  startDisabled,
}: {
  onStart: () => void
  startDisabled: boolean
}) {
  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        {/* 1.9125rem, el del teléfono en la web. */}
        <GameLogo fontSize={30.6} />
        <View style={styles.texto}>
          <Text style={[styles.parrafo, styles.fuerte]}>{BIENVENIDA_MINIMA}</Text>
          <Text style={styles.parrafo}>{QUE_ES}</Text>
          <Text style={[styles.parrafo, styles.fuerte]}>{INSTRUCCION_MINIMA}</Text>
        </View>
      </View>
      <BotonCta texto="¡Vamos!" onPress={onStart} disabled={startDisabled} />
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  texto: { marginTop: 40, maxWidth: 320, gap: 20 },
  parrafo: { textAlign: "center", fontSize: 16, lineHeight: 26, color: "rgba(246,248,252,0.85)" },
  fuerte: { fontWeight: "600", color: TEMA.foreground },
})
