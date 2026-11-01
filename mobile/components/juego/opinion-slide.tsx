// «¿Cómo venís?», el par nativo de `web/src/app/derivadas/opinion-slide.tsx`.
// **Elegir no es contestar**: el toque solo marca, se puede cambiar todas las
// veces, y lo que manda el voto es Continuar. Sin elegir nada, Continuar sale
// sin contestar (`contesto: false`), que es lo que lleva la racha de salteos.

import { useEffect, useRef, useState } from "react"
import { StyleSheet, Text, View } from "react-native"
import * as Haptics from "expo-haptics"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import {
  OPCIONES_OPINION,
  RESPUESTA_OPINION,
  type VotoDificultad,
} from "@intervalo/dx-core/juego/textos-encuestas"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { BotonCta } from "./boton-cta"
import { EmojiYTexto, ListaDeOpciones, OpcionEncuesta } from "./opcion-encuesta"

export function OpinionSlide({ onContinue }: { onContinue: (contesto: boolean) => void }) {
  const api = useGameApi()
  const sfx = useSfx()
  const [votado, setVotado] = useState<VotoDificultad | null>(null)
  const seguidoRef = useRef(false)

  useEffect(() => {
    track("game_opinion_shown")
    void api.POST("/game/derivemos/opinion", { body: { accion: "impression" } }).catch(() => {})
    // Una sola vez por aparición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const elegir = (voto: VotoDificultad) => {
    sfx.select()
    void Haptics.selectionAsync()
    setVotado(voto)
  }

  // Un solo Continuar por aparición: el segundo toque mandaría un segundo voto.
  const confirmar = () => {
    if (seguidoRef.current) return
    seguidoRef.current = true
    if (votado !== null) {
      track("game_opinion_answered", { voto: votado })
      void api
        .POST("/game/derivemos/opinion", { body: { accion: "answer", voto: votado } })
        .catch(() => {})
    }
    onContinue(votado !== null)
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        <View>
          <Text style={styles.titulo}>¿Cómo venís?</Text>
          <Text style={styles.subtitulo}>Ajustemos la dificultad.</Text>
        </View>

        <ListaDeOpciones>
          {OPCIONES_OPINION.map((o, i) => (
            <OpcionEncuesta
              key={o.voto}
              indice={i}
              seleccionada={votado === o.voto}
              opacidad={votado !== null && votado !== o.voto ? 0.4 : 1}
              onPress={() => elegir(o.voto)}
            >
              <EmojiYTexto emoji={o.emoji} texto={o.texto} />
            </OpcionEncuesta>
          ))}
        </ListaDeOpciones>

        {/* El alto se reserva desde el principio: sin esto, el renglón aparece y
            empuja las opciones justo cuando se acaba de tocar una. */}
        <Text style={styles.respuesta} accessibilityLiveRegion="polite">
          {votado !== null ? RESPUESTA_OPINION[votado] : ""}
        </Text>
      </View>
      <BotonCta texto="Continuar" onPress={confirmar} />
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
  respuesta: {
    minHeight: 20,
    fontSize: 14,
    lineHeight: 20,
    color: TEMA.mutedForeground,
    textAlign: "center",
  },
})
