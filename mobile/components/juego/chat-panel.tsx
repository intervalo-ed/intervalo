// El chat del juego, el par nativo de `web/src/app/derivadas/chat-panel.tsx`:
// novedades y mensajes intercalados en UNA lista, anclada abajo como un chat, y
// subiendo trae más historia. El estado (intercalado, envíos optimistas,
// enfriamiento) es el mismo de la web y vive en dx-core (UseChat.ts).
//
// La lista es un FlatList invertido: el índice 0 queda abajo, así que lo nuevo
// entra por el fondo y la historia vieja se agrega al final del arreglo sin
// mover lo que se está leyendo. El teclado lo esquiva quien monta el panel (ver
// novedades-slide.tsx): acá no se sabe a qué altura de la pantalla está.

import { useMemo, useRef } from "react"
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import Animated, { FadeIn } from "react-native-reanimated"
import Svg, { Path } from "react-native-svg"
import { levelColor, TEMA } from "@intervalo/dx-core/juego/game-colors"
import { fmtAgo } from "@intervalo/dx-core/juego/ranking-formato"
import {
  MAX_TEXTO,
  mensajeDePendiente,
  textoPlano,
  type Linea,
  type MensajePendiente,
} from "@intervalo/dx-core/juego/chat"
import { useChat } from "@intervalo/dx-core/juego/UseChat"
import type { GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import type { ConTiempo, GameEvent, GameMessage } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { useSfx } from "@/lib/audio/UseSfx"
import { UniTag } from "./university-tag"

const FUNDIDO = FadeIn.duration(200)

// `text-orange-400` de la web.
const NARANJA = "#fb923c"

type Fila = Linea | { tipo: "pendiente"; clave: string; pendiente: MensajePendiente }

/** El renglón de un mensaje: el @ con el color de su nivel, la sigla en su tag
 *  y la antigüedad a la derecha; el texto abajo, entero. */
function MensajeRow({
  mensaje,
  pendiente,
  onReintentar,
}: {
  mensaje: ConTiempo<GameMessage>
  /** `undefined` = mensaje confirmado por el servidor. */
  pendiente?: "enviando" | "fallo"
  onReintentar?: () => void
}) {
  const multilinea = mensaje.text.includes("\n")
  return (
    <Animated.View
      entering={FUNDIDO}
      style={[
        styles.mensaje,
        mensaje.is_mine && styles.mensajePropio,
        pendiente === "enviando" && { opacity: 0.6 },
      ]}
    >
      <View style={styles.cabecera}>
        <Text style={[styles.alias, { color: levelColor(mensaje.level) }]} numberOfLines={1}>
          {mensaje.alias}
        </Text>
        {mensaje.university && <UniTag university={mensaje.university} />}
        {pendiente === undefined && <Text style={styles.hace}>{fmtAgo(mensaje.seconds_ago)}</Text>}
      </View>
      {/* Monoespaciada solo con más de un renglón: es lo que deja que un dibujo
          ASCII se vea como se escribió. */}
      <Text style={multilinea ? styles.textoMono : styles.texto}>{mensaje.text}</Text>
      {pendiente === "enviando" && <Text style={styles.enviando}>Enviando…</Text>}
      {pendiente === "fallo" && (
        <Pressable onPress={onReintentar} accessibilityRole="button" hitSlop={6}>
          <Text style={styles.reintentar}>No se pudo mandar — reintentar</Text>
        </Pressable>
      )}
    </Animated.View>
  )
}

/** Una novedad adentro del chat: más apagada y más chica que un mensaje. */
function NovedadRow({ evento }: { evento: ConTiempo<GameEvent> }) {
  return (
    <Animated.View entering={FUNDIDO} style={styles.novedad}>
      <Text style={styles.novedadTexto}>
        {textoPlano(evento)} {evento.emoji}
      </Text>
      <Text style={styles.novedadHace}>{fmtAgo(evento.seconds_ago)}</Text>
    </Animated.View>
  )
}

function IconoMandar({ color }: { color: string }) {
  // `SendHorizontal` de lucide, el mismo de la web.
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" />
      <Path d="M6 12h16" />
    </Svg>
  )
}

export function ChatPanel({ enabled, player }: { enabled: boolean; player: GamePlayer | null }) {
  const sfx = useSfx()
  const {
    lineas,
    pendientes,
    texto,
    setTexto,
    error,
    apagado,
    puedeEscribir,
    puedeMandar,
    mandar,
    reintentar,
    hayMas,
    cargarViejas,
  } = useChat({ enabled, player, onEnviado: sfx.select })
  const listaRef = useRef<FlatList<Fila>>(null)

  // Invertida: lo más nuevo primero. Los pendientes van antes que todo —son lo
  // más reciente y todavía no tienen `at` del servidor para intercalarse.
  const filas = useMemo<Fila[]>(() => {
    const propios: Fila[] = pendientes.map((p) => ({ tipo: "pendiente", clave: `pend-${p.localId}`, pendiente: p }))
    return [...propios.reverse(), ...[...lineas].reverse()]
  }, [lineas, pendientes])

  const enviar = () => {
    if (!mandar()) return
    // Mandar es volver al fondo, aunque se estuviera leyendo más arriba.
    listaRef.current?.scrollToOffset({ offset: 0, animated: true })
  }

  return (
    <View style={styles.panel}>
      {filas.length === 0 ? (
        <View style={styles.vacio}>
          <Text style={styles.vacioTexto}>Todavía no dijo nada nadie.</Text>
        </View>
      ) : (
        <FlatList
          ref={listaRef}
          inverted
          data={filas}
          keyExtractor={(f) => f.clave}
          renderItem={({ item }) =>
            item.tipo === "mensaje" ? (
              <MensajeRow mensaje={item.mensaje} />
            ) : item.tipo === "evento" ? (
              <NovedadRow evento={item.evento} />
            ) : (
              <MensajeRow
                mensaje={mensajeDePendiente(item.pendiente)}
                pendiente={item.pendiente.failed ? "fallo" : "enviando"}
                onReintentar={() => reintentar(item.pendiente)}
              />
            )
          }
          // En una lista invertida el "final" es el techo: ahí se pide más. El
          // pestillo contra pedidos repetidos vive adentro de `cargarViejas`.
          onEndReached={() => {
            if (hayMas) void cargarViejas()
          }}
          onEndReachedThreshold={0.5}
          // Lo que entra abajo no le arrebata el scroll a quien lee arriba;
          // pegado al fondo, lo sigue.
          maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
          style={styles.flex}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.compositor}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          multiline
          maxLength={MAX_TEXTO}
          editable={puedeEscribir}
          placeholder={apagado ? "El chat está apagado por ahora" : "Escribí algo…"}
          placeholderTextColor="rgba(164,179,198,0.7)"
          keyboardAppearance="dark"
          selectionColor={TEMA.ring}
          style={[styles.input, !puedeEscribir && { opacity: 0.6 }]}
        />
        <Pressable
          onPress={enviar}
          disabled={!puedeMandar}
          accessibilityRole="button"
          accessibilityLabel="Mandar"
          accessibilityState={{ disabled: !puedeMandar }}
          style={({ pressed }) => [styles.mandar, pressed && { opacity: 0.9 }, !puedeMandar && { opacity: 0.4 }]}
        >
          <IconoMandar color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: { flex: 1, minHeight: 0, gap: 8 },
  flex: { flex: 1 },
  lista: { paddingVertical: 4, gap: 2 },
  vacio: { flex: 1, justifyContent: "flex-end" },
  vacioTexto: { paddingHorizontal: 8, paddingVertical: 12, fontSize: 12, color: TEMA.mutedForeground },
  mensaje: { gap: 2, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6 },
  // `bg-primary/10`.
  mensajePropio: { backgroundColor: "rgba(84,87,229,0.1)" },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 6 },
  alias: { flexShrink: 1, fontSize: 12, fontWeight: "500" },
  hace: {
    marginLeft: "auto",
    fontSize: 11,
    color: "rgba(164,179,198,0.7)",
    fontVariant: ["tabular-nums"],
  },
  texto: { fontSize: 12, lineHeight: 17, color: "rgba(246,248,252,0.9)" },
  textoMono: { fontSize: 11, lineHeight: 13, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), color: "rgba(246,248,252,0.9)" },
  enviando: { fontSize: 10.5, color: "rgba(164,179,198,0.7)" },
  reintentar: { fontSize: 11, color: NARANJA, textDecorationLine: "underline" },
  novedad: { flexDirection: "row", alignItems: "baseline", gap: 8, paddingHorizontal: 8, paddingVertical: 4 },
  novedadTexto: { flex: 1, fontSize: 11, lineHeight: 15, color: "rgba(164,179,198,0.8)" },
  novedadHace: { fontSize: 11, color: "rgba(164,179,198,0.6)", fontVariant: ["tabular-nums"] },
  error: { paddingHorizontal: 4, fontSize: 11, lineHeight: 15, color: NARANJA },
  compositor: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: TEMA.border,
    borderRadius: 6,
    backgroundColor: TEMA.background,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: TEMA.foreground,
  },
  mandar: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: TEMA.primary,
    alignItems: "center",
    justifyContent: "center",
  },
})
