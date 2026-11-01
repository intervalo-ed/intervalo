// «¿Te están saliendo repetidas?», el par nativo de
// `web/src/app/derivadas/repetitividad-slide.tsx`. Hermana de la de opinión,
// con una diferencia: acá el primer toque es el voto —se manda en el acto y las
// otras opciones se apagan— y la respuesta es siempre «Anotado.», porque este
// voto se guarda y no mueve nada.

import { useEffect, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import {
  OPCIONES_REPETITIVIDAD,
  type VotoRepetitividad,
} from "@intervalo/dx-core/juego/textos-encuestas"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { BotonCta } from "./boton-cta"
import { EmojiYTexto, ListaDeOpciones, OpcionEncuesta } from "./opcion-encuesta"

export function RepetitividadSlide({ onContinue }: { onContinue: (contesto: boolean) => void }) {
  const api = useGameApi()
  const sfx = useSfx()
  const reduce = useReducedMotion()
  const [votado, setVotado] = useState<VotoRepetitividad | null>(null)
  const votadoRef = useRef(false)
  const seguidoRef = useRef(false)

  useEffect(() => {
    track("game_repetitividad_shown")
    void api.POST("/game/derivemos/repetitividad", { body: { accion: "impression" } }).catch(() => {})
    // Una sola vez por aparición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const votar = (voto: VotoRepetitividad) => {
    if (votadoRef.current) return
    votadoRef.current = true
    setVotado(voto)
    sfx.select()
    void Haptics.selectionAsync()
    track("game_repetitividad_answered", { voto })
    void api
      .POST("/game/derivemos/repetitividad", { body: { accion: "answer", voto } })
      .catch(() => {})
  }

  const seguir = () => {
    if (seguidoRef.current) return
    seguidoRef.current = true
    onContinue(votado !== null)
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        <View>
          <Text style={styles.titulo}>¿Te están saliendo repetidas?</Text>
          <Text style={styles.subtitulo}>Nos sirve para saber cuánto ampliar el banco.</Text>
        </View>

        <ListaDeOpciones>
          {OPCIONES_REPETITIVIDAD.map((o, i) => (
            <OpcionEncuesta
              key={o.voto}
              indice={i}
              seleccionada={votado === o.voto}
              opacidad={votado !== null && votado !== o.voto ? 0.4 : 1}
              disabled={votado !== null}
              onPress={() => votar(o.voto)}
            >
              <EmojiYTexto emoji={o.emoji} texto={o.texto} />
            </OpcionEncuesta>
          ))}
        </ListaDeOpciones>

        {/* El alto se reserva igual que en la de opinión. */}
        <View style={styles.renglon}>
          {votado !== null && (
            <Animated.Text
              entering={reduce ? undefined : FadeIn.duration(250)}
              style={styles.respuesta}
              accessibilityLiveRegion="polite"
            >
              Anotado.
            </Animated.Text>
          )}
        </View>
      </View>
      <BotonCta texto="Continuar" onPress={seguir} />
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
  renglon: { minHeight: 20 },
  respuesta: { fontSize: 14, lineHeight: 20, color: TEMA.mutedForeground, textAlign: "center" },
})
