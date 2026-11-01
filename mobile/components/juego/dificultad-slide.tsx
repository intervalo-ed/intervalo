// «Elegí con qué nivel querés practicar»: la palanca de dificultad, el par
// nativo de `web/src/app/derivadas/dificultad-slide.tsx`.
//
// Se abre desde Configuración. La elección se guarda al Continuar —no al mover
// el slider— porque cada paso movería el próximo ejercicio y la persona está
// mirando, todavía eligiendo. «<» vuelve sin guardar.

import { useEffect, useState } from "react"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated"
import Svg, { Path } from "react-native-svg"
import * as Haptics from "expo-haptics"
import { useQueryClient } from "@tanstack/react-query"
import { unwrap } from "@intervalo/dx-core/api/client"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { gameKeys, type GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import {
  POSICIONES,
  POSICION_MAX,
  colorDePosicion,
  mezclar,
  posicionInicial,
  rgbaDeRgb,
} from "@intervalo/dx-core/juego/dificultad"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { BotonCta } from "./boton-cta"
import { CTA_H } from "./exercise-card"
import { SliderVertical } from "./slider-vertical"

// Lo que ocupa la fila elegida: la fórmula agrandada y dos renglones de texto.
const ALTO_ELEGIDA = 92

const COLORES = POSICIONES.map((_, i) => colorDePosicion(i))
// Los mismos tonos que pinta la barra, para que cada derivada lleve el color de
// su celda.
const TONOS = mezclar(COLORES)
const APAGADO = "#a4b3c6"
const NARANJA = "#fdba74"
const MONO = Platform.select({ ios: "Menlo", default: "monospace" })

// La lista se desliza con la misma curva corta del slider: llega antes que el ojo.
const DESLIZ = { duration: 200, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }
const APARECE = { duration: 200, easing: Easing.out(Easing.ease) }

export function DificultadSlide({
  player,
  onBack,
  onDone,
}: {
  player: GamePlayer | null
  /** Vuelve a Configuración sin guardar. */
  onBack: () => void
  /** Ya se guardó, se invalidó el jugador y sonó el `continue`. */
  onDone: () => void
}) {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const sfx = useSfx()
  const quieto = useReducedMotion()
  const [valor, setValor] = useState(() => posicionInicial(player?.dificultad))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alto, setAlto] = useState(352)

  // Las nueve a la vista, siempre: el paso se reparte para que, con la elegida
  // donde le toca, entren las que quedan arriba y las que quedan abajo.
  const paso = Math.min(48, Math.max(24, (alto - ALTO_ELEGIDA - 6) / 8))

  useEffect(() => {
    track("game_dificultad_shown")
  }, [])

  const cambiar = (v: number) => {
    if (v === valor) return
    sfx.select()
    void Haptics.selectionAsync()
    setValor(v)
  }

  const continuar = async (nuevo: number | null) => {
    if (guardando) return
    setGuardando(true)
    setError(null)
    try {
      unwrap(await api.PATCH("/game/derivemos/me", { body: { dificultad: nuevo } }))
      await queryClient.invalidateQueries({ queryKey: gameKeys.me })
      track("game_dificultad_chosen", { valor: nuevo, via: "settings" })
      sfx.continue()
      onDone()
    } catch {
      setError("No se pudo guardar. Probá de nuevo.")
      setGuardando(false)
    }
  }

  // La elegida se lleva SU lugar —la fórmula grande y la línea de texto— y las
  // de abajo arrancan después de ese bloque. Y ese lugar SIGUE al slider: la
  // primera pegada al tope, la última pegada al fondo, las del medio
  // proporcionalmente.
  const y0 = (valor / POSICION_MAX) * Math.max(0, alto - ALTO_ELEGIDA)

  return (
    <View style={styles.pantalla}>
      <Pressable
        onPress={() => {
          sfx.select()
          onBack()
        }}
        accessibilityRole="button"
        accessibilityLabel="Volver"
        hitSlop={8}
        style={({ pressed }) => [styles.volver, pressed && { backgroundColor: TEMA.accent }]}
      >
        <Svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke={TEMA.mutedForeground}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="m15 18-6-6 6-6" />
        </Svg>
      </Pressable>

      <Text style={styles.titulo}>Elegí con qué nivel querés practicar.</Text>

      <View style={styles.cuerpo}>
        {/* La lista mide lo mismo que la columna del slider: la primera
            derivada arranca a la altura de la flecha de arriba y la última
            termina a la de la flecha de abajo. */}
        <View style={styles.lista} onLayout={(e) => setAlto(e.nativeEvent.layout.height)}>
          {POSICIONES.map((p, i) => {
            const d = i - valor
            const sel = d === 0
            const y = sel ? y0 : d < 0 ? y0 + d * paso : y0 + ALTO_ELEGIDA + 6 + (d - 1) * paso
            return (
              <FilaDeNivel
                key={p.formula}
                formula={p.formula}
                texto={p.texto}
                y={y}
                opacidad={sel ? 1 : Math.max(0.38, 0.85 - Math.abs(d) * 0.1)}
                elegida={sel}
                color={i <= valor ? TONOS[i] : APAGADO}
                // El resplandor de la elegida crece con lo que se llenó la
                // barra, como el de la barra misma.
                brillo={sel ? rgbaDeRgb(TONOS[i], 0.04 + 0.08 * (valor / POSICION_MAX)) : null}
                quieto={quieto}
                onPress={() => cambiar(i)}
              />
            )
          })}
        </View>
        <View style={styles.slider}>
          <SliderVertical
            valor={valor}
            max={POSICION_MAX}
            colores={COLORES}
            onCambio={cambiar}
            accessibilityLabel="Dificultad"
          />
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Dos botones partidos: «Automático» devuelve el control al motor y
          «Continuar» guarda la posición elegida. */}
      <View style={styles.pie}>
        <Pressable
          onPress={() => void continuar(null)}
          disabled={guardando}
          accessibilityRole="button"
          accessibilityState={{ disabled: guardando }}
          style={({ pressed }) => [
            styles.automatico,
            pressed && { backgroundColor: TEMA.accent },
            guardando && { opacity: 0.5 },
          ]}
        >
          <Text style={styles.textoAutomatico}>Automático</Text>
        </Pressable>
        <View style={styles.mitad}>
          <BotonCta texto="Continuar" disabled={guardando} onPress={() => void continuar(valor)} />
        </View>
      </View>
    </View>
  )
}

function FilaDeNivel({
  formula,
  texto,
  y,
  opacidad,
  elegida,
  color,
  brillo,
  quieto,
  onPress,
}: {
  formula: string
  texto: string
  y: number
  opacidad: number
  elegida: boolean
  color: string
  brillo: string | null
  quieto: boolean
  onPress: () => void
}) {
  const desliz = quieto ? { duration: 0 } : DESLIZ
  const aparece = quieto ? { duration: 0 } : APARECE
  const estiloFila = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(y, desliz) }],
    opacity: withTiming(opacidad, desliz),
  }))
  const estiloFormula = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(elegida ? 1.6 : 1, desliz) }],
    color: withTiming(color, desliz),
  }))
  const estiloTexto = useAnimatedStyle(() => ({
    opacity: withTiming(elegida ? 1 : 0, aparece),
  }))

  return (
    <Animated.View style={[styles.fila, estiloFila]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${formula}. ${texto}`}
      >
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.formula,
            brillo && { textShadowColor: brillo, textShadowRadius: 2 },
            estiloFormula,
          ]}
        >
          {formula}
        </Animated.Text>
        <Animated.Text style={[styles.texto, estiloTexto]}>{texto}</Animated.Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 16, paddingBottom: 8 },
  volver: { alignSelf: "flex-start", marginLeft: -4, borderRadius: 6, padding: 4 },
  titulo: {
    marginTop: 48,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: TEMA.foreground,
  },
  cuerpo: {
    flex: 1,
    maxHeight: 352,
    width: "100%",
    maxWidth: 280,
    alignSelf: "center",
    marginVertical: "auto",
    paddingTop: 12,
    flexDirection: "row",
  },
  lista: { flex: 1, minWidth: 0, overflow: "hidden" },
  slider: { marginLeft: 8 },
  fila: { position: "absolute", left: 0, right: 0, top: 0 },
  formula: {
    alignSelf: "flex-start",
    transformOrigin: "left",
    fontFamily: MONO,
    fontSize: 17,
    lineHeight: 21,
    fontWeight: "600",
  },
  texto: {
    marginTop: 12,
    maxWidth: 200,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "500",
    color: TEMA.foreground,
  },
  error: { marginTop: 12, textAlign: "center", fontSize: 14, color: NARANJA },
  pie: { marginTop: 12, flexDirection: "row", gap: 8 },
  automatico: {
    flex: 1,
    minWidth: 0,
    height: CTA_H,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    alignItems: "center",
    justifyContent: "center",
  },
  textoAutomatico: { color: TEMA.foreground, fontSize: 16, fontWeight: "700" },
  mitad: { flex: 1, minWidth: 0 },
})
