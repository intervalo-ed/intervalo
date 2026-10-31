// Las reglas que la puerta no dijo, después del ranking: el par nativo de
// `web/src/app/derivadas/reglas-slide.tsx`. La lista no se escribe de nuevo: es
// `REGLAS` de dx-core (textos-reglas.ts), y acá solo se eligen índices
// (reglas-trigger.ts :: REGLAS_DE_LA_DIAPO). Sin numerar, como en la web.

import { useEffect } from "react"
import { StyleSheet, Text, View } from "react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { REGLAS } from "@intervalo/dx-core/juego/textos-reglas"
import { track } from "@/lib/analytics/track"
import { BotonCta } from "./boton-cta"

export function ReglasSlide({
  cuales,
  onContinue,
}: {
  /** Índices de `REGLAS` (reglas-trigger.ts :: REGLAS_DE_LA_DIAPO). */
  cuales: number[]
  onContinue: () => void
}) {
  useEffect(() => {
    track("game_reglas_shown", { reglas: cuales })
  }, [cuales])

  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        {cuales.map((idx) => (
          <Text key={idx} style={styles.parrafo}>
            {REGLAS[idx]?.map((tramo, i) => (
              <Text key={i} style={tramo.enfasis ? styles.fuerte : undefined}>
                {tramo.texto}
              </Text>
            ))}
          </Text>
        ))}
      </View>
      <BotonCta texto="Continuar" onPress={onContinue} />
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20 },
  centro: { flex: 1, justifyContent: "center", gap: 12 },
  parrafo: { fontSize: 16, lineHeight: 26, color: "rgba(246,248,252,0.85)" },
  fuerte: { fontWeight: "600", color: TEMA.foreground },
})
