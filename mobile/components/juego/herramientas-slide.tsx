// Con qué contás, antes de la primera derivada: el par nativo de
// `web/src/app/derivadas/herramientas-slide.tsx`. Nombra las dos salidas del pie
// (la tabla y el salteo) justo antes del momento en que más gente se va.
//
// El símbolo es el MISMO del botón del pie (`pie-rampa.tsx`), con la misma caja:
// lo que se enseña es cuál de los dos botones de abajo hace qué.

import { useEffect, type ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { track } from "@/lib/analytics/track"
import { BotonCta } from "./boton-cta"
import { IconoDeAyuda, TRAZOS_SALTEAR, TRAZOS_TABLA } from "./pie-rampa"

export function HerramientasSlide({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    track("game_herramientas_shown")
  }, [])

  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        <Renglon trazos={TRAZOS_TABLA}>
          Si te trabás podés mirar la <Text style={styles.fuerte}>tabla</Text> de derivadas.
        </Renglon>
        <Renglon trazos={TRAZOS_SALTEAR}>
          Y si una no te sale, podés <Text style={styles.fuerte}>saltearla</Text> y seguir con otra.
        </Renglon>
      </View>
      <BotonCta texto="Continuar" onPress={onContinue} />
    </View>
  )
}

function Renglon({ trazos, children }: { trazos: readonly string[]; children: ReactNode }) {
  return (
    <View style={styles.renglon}>
      <View style={styles.simbolo} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <IconoDeAyuda trazos={trazos} color={TEMA.mutedForeground} />
      </View>
      <Text style={styles.parrafo}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20 },
  centro: { flex: 1, justifyContent: "center", gap: 16 },
  renglon: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  // `size-[1.625em]` de la web sobre 16 px de cuerpo.
  simbolo: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    alignItems: "center",
    justifyContent: "center",
  },
  parrafo: { flex: 1, fontSize: 16, lineHeight: 26, color: "rgba(246,248,252,0.85)" },
  fuerte: { fontWeight: "600", color: TEMA.foreground },
})
