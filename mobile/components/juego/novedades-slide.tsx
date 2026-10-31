// «Novedades», el par nativo de la diapo `novedades` de la web
// (mobile-flow.tsx): el chat entero, anclado abajo, y Seguir. Las marcas de
// visto viven arriba (`useNovedades` de dx-core) porque también las leen el
// punto del botón del chat y la decisión de mostrar esta diapo.
//
// Sin la cabecera del juego ni el pedido de reclutas todavía (M5).

import { KeyboardAvoidingView, StyleSheet } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import type { GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import { useSfx } from "@/lib/audio/UseSfx"
import { BotonCta } from "./boton-cta"
import { ChatPanel } from "./chat-panel"

export function NovedadesSlide({
  player,
  onSeguir,
}: {
  player: GamePlayer | null
  /** marcarVisto() + marcarVistoChat() + advanceAfterAnswer("novedades"). */
  onSeguir: () => void
}) {
  const sfx = useSfx()
  const insets = useSafeAreaInsets()
  return (
    // `padding` en las dos plataformas, como la diapo del @. El desfase es lo
    // que hay entre el borde de la pantalla y el de la diapo (el `paddingTop`
    // de la raíz): el KeyboardAvoidingView mide su marco relativo al padre.
    <KeyboardAvoidingView style={styles.pantalla} behavior="padding" keyboardVerticalOffset={insets.top}>
      <ChatPanel enabled={player !== null} player={player} />
      <BotonCta
        texto="Seguir"
        onPress={() => {
          sfx.select()
          onSeguir()
        }}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 16, gap: 12 },
})
