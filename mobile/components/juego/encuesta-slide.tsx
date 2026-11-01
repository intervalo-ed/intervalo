// «Si tuvieras una varita mágica…», el par nativo de
// `web/src/app/derivadas/encuesta-slide.tsx`: la única pregunta sin opciones.
// No hay botón de saltar y el campo no valida nada —un punto alcanza—, y las dos
// cosas son la misma decisión (está contada en la web).
//
// La impresión y la respuesta van al servidor sin esperar: que falle la
// telemetría no puede frenar la partida.

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react"
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { MAX_LARGO_ENCUESTA, PREGUNTA_ENCUESTA } from "@intervalo/dx-core/juego/textos-encuestas"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { BotonCta } from "./boton-cta"

// Mismo número que en «Elegí tu @»: el teclado se abre cuando la diapo ya
// llegó, no a mitad del pase.
const FOCO_MS = 320

// Solo el autoplay: escribe y toca Continuar por los mismos caminos que el dedo.
export type EncuestaHandle = {
  escribir: (texto: string) => void
  // false si Continuar está apagado (el campo vacío).
  continuar: () => boolean
}

export function EncuestaSlide({ onContinue, ref }: { onContinue: () => void; ref?: Ref<EncuestaHandle> }) {
  const api = useGameApi()
  const insets = useSafeAreaInsets()
  const sfx = useSfx()
  const [texto, setTexto] = useState("")
  const [enfocado, setEnfocado] = useState(false)
  const campoRef = useRef<TextInputInstance>(null)
  const enviadoRef = useRef(false)

  useEffect(() => {
    track("game_encuesta_shown", { pregunta: PREGUNTA_ENCUESTA })
    void api
      .POST("/game/derivemos/encuesta", {
        body: { accion: "impression", pregunta: PREGUNTA_ENCUESTA },
      })
      .catch(() => {})
    // Una sola vez por aparición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => campoRef.current?.focus(), FOCO_MS)
    return () => clearTimeout(t)
  }, [])

  const puedeSeguir = texto.trim().length > 0

  // Un solo envío por aparición: un doble toque mandaría dos respuestas.
  const enviar = () => {
    if (enviadoRef.current || !puedeSeguir) return
    enviadoRef.current = true
    sfx.continue()
    const limpio = texto.trim()
    track("game_encuesta_answered", { pregunta: PREGUNTA_ENCUESTA, largo: limpio.length })
    void api
      .POST("/game/derivemos/encuesta", {
        body: { accion: "answer", pregunta: PREGUNTA_ENCUESTA, texto: limpio },
      })
      .catch(() => {})
    onContinue()
  }

  useImperativeHandle(ref, () => ({
    escribir: (t) => setTexto(t.slice(0, MAX_LARGO_ENCUESTA)),
    continuar: () => {
      if (!puedeSeguir) return false
      enviar()
      return true
    },
  }))

  return (
    // `padding` en las dos plataformas, como en «Elegí tu @»: con edge-to-edge
    // el teclado hay que esquivarlo a mano. El desfase es el `paddingTop` de la
    // raíz del flujo, como el chat: el KeyboardAvoidingView mide su marco
    // relativo al padre.
    <KeyboardAvoidingView style={styles.pantalla} behavior="padding" keyboardVerticalOffset={insets.top}>
      <View style={styles.centro}>
        <Text style={styles.titulo}>
          Si tuvieras una varita mágica,{"\n"}¿qué le cambiarías o le agregarías a Intervalo?
        </Text>
        <View style={styles.bloque}>
          <TextInput
            ref={campoRef}
            value={texto}
            onChangeText={(t) => setTexto(t.slice(0, MAX_LARGO_ENCUESTA))}
            onFocus={() => setEnfocado(true)}
            onBlur={() => setEnfocado(false)}
            multiline
            maxLength={MAX_LARGO_ENCUESTA}
            placeholder="Me gustaría..."
            placeholderTextColor={TEMA.mutedForeground}
            keyboardAppearance="dark"
            selectionColor={TEMA.ring}
            textAlignVertical="top"
            accessibilityLabel="Tu respuesta"
            style={[styles.campo, enfocado && styles.campoEnfocado]}
          />
          {/* El contador aparece solo cerca del techo: anunciado desde el
              primer caracter, acortaría respuestas. */}
          <Text style={styles.contador}>
            {texto.length > MAX_LARGO_ENCUESTA - 100 ? `${texto.length} / ${MAX_LARGO_ENCUESTA}` : ""}
          </Text>
        </View>
      </View>
      <BotonCta texto="Continuar" onPress={enviar} disabled={!puedeSeguir} />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20 },
  centro: { flex: 1, justifyContent: "center", gap: 20 },
  titulo: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: TEMA.foreground,
    textAlign: "center",
  },
  bloque: { width: "100%", maxWidth: 384, alignSelf: "center" },
  // `rows={4}` de la web: cuatro renglones de 24 más el relleno.
  campo: {
    minHeight: 4 * 24 + 24,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: TEMA.border,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    paddingTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: TEMA.foreground,
  },
  campoEnfocado: { borderColor: TEMA.ring },
  contador: {
    minHeight: 16,
    paddingTop: 4,
    fontSize: 12,
    lineHeight: 16,
    color: TEMA.mutedForeground,
    textAlign: "right",
  },
})
