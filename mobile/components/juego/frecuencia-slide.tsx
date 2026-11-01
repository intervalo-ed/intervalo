// «¿Cada cuánto querés ver el ranking?», el par nativo de
// `web/src/app/derivadas/ranking-frecuencia-slide.tsx`. La elección se guarda al
// tocarla, no al Continuar: quien la pasa de largo se queda con lo de siempre.

import { useEffect } from "react"
import { StyleSheet, Text, View } from "react-native"
import * as Haptics from "expo-haptics"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import {
  FRECUENCIAS,
  saveFrecuenciaRanking,
  useFrecuenciaRanking,
  type FrecuenciaRanking,
} from "@intervalo/dx-core/juego/ranking-frecuencia"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { BotonCta } from "./boton-cta"
import { IconoConfiguracion } from "./iconos-cabecera"
import { ListaDeOpciones, OpcionEncuesta } from "./opcion-encuesta"

export function FrecuenciaSlide({ onContinue }: { onContinue: () => void }) {
  const sfx = useSfx()
  const elegida = useFrecuenciaRanking()

  useEffect(() => {
    track("game_ranking_frecuencia_shown")
  }, [])

  const elegir = (valor: FrecuenciaRanking) => {
    if (valor === elegida) return
    sfx.select()
    void Haptics.selectionAsync()
    saveFrecuenciaRanking(valor)
    track("game_ranking_frecuencia_chosen", { valor, via: "slide" })
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        <View>
          <Text style={styles.titulo}>¿Cada cuánto querés ver el ranking?</Text>
          <Text style={styles.subtitulo}>Hoy aparece después de cada derivada. Elegí cómo seguir.</Text>
        </View>

        <ListaDeOpciones>
          {FRECUENCIAS.map((o, i) => {
            const activa = elegida === o.valor
            return (
              <OpcionEncuesta
                key={o.valor}
                indice={i}
                seleccionada={activa}
                opacidad={activa ? 1 : 0.6}
                onPress={() => elegir(o.valor)}
                style={styles.fila}
              >
                <View style={[styles.radio, activa && styles.radioActivo]}>
                  {activa && <View style={styles.punto} />}
                </View>
                <Text style={styles.textoOpcion}>{o.texto}</Text>
              </OpcionEncuesta>
            )
          })}
        </ListaDeOpciones>

        {/* El corte de renglón es a mano, como en la web: el ícono queda
            siempre pegado a «ajustes». */}
        <View>
          <Text style={styles.nota}>Podés cambiar esta preferencia</Text>
          <View style={styles.renglonIcono}>
            <Text style={styles.nota}>cuando quieras desde los ajustes</Text>
            <IconoConfiguracion size={14} color={TEMA.mutedForeground} />
          </View>
        </View>
      </View>
      <BotonCta texto="Continuar" onPress={onContinue} />
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20 },
  centro: { flex: 1, justifyContent: "center", gap: 24 },
  titulo: { fontSize: 20, fontWeight: "600", color: TEMA.foreground, textAlign: "center" },
  subtitulo: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: TEMA.mutedForeground,
    textAlign: "center",
  },
  fila: { justifyContent: "flex-start" },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: TEMA.mutedForeground,
  },
  // `bg-chart-5` con el anillo interior del color de fondo: el punto lleno.
  radioActivo: { borderColor: TEMA.ring, padding: 2 },
  punto: { flex: 1, borderRadius: 8, backgroundColor: TEMA.ring },
  textoOpcion: { flexShrink: 1, fontSize: 16, fontWeight: "500", color: TEMA.foreground },
  nota: { fontSize: 12, lineHeight: 19, color: TEMA.mutedForeground, textAlign: "center" },
  renglonIcono: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
})
