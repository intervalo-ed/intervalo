// El splash de la app: el logo completo (d/dx [ intervalo ]) está quieto en el
// centro desde el primer cuadro y, cuando lo que viene del servidor ya cargó,
// VIAJA hasta el lugar que tiene en la portada. Después de aterrizar el splash
// desaparece y el logo que queda es el de la portada.
//
// Para que al aterrizar no se note ningún cambio, el que viaja y el que queda
// son el mismo dibujo (`GameLogo`) a distinta escala. Este se dibuja GRANDE y se
// achica: escalar hacia abajo conserva la nitidez de la letra, escalar hacia
// arriba la pixela.
//
// Todo el movimiento corre en el hilo de UI (Reanimated): el arranque de la app
// ocupa el de JS con el alta del jugador, MathJax y la tabla de derivadas, y un
// vuelo que dependiera de él saldría a tirones justo donde más se mira.
//
// El splash NATIVO ya trae el logo (assets/images/splash-logo.png): es una
// captura de este mismo dibujo a TAMANO_GRANDE, recortada simétrica al centro
// de la pantalla, así que el traspaso del nativo a este es invisible. Si cambia
// el logo, `TAMANO_GRANDE` o la tipografía, hay que sacar esa captura de nuevo
// (ver mobile/README.md).

import { useEffect, useState } from "react"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { GameLogo } from "@/components/juego/game-logo"
import {
  iniciarViaje,
  leerSplash,
  terminarSplash,
  useSplash,
} from "@/lib/splash/estado-splash"

// El tamaño del logo quieto, en el centro de la pantalla.
const TAMANO_GRANDE = 46
// Cuánto se queda quieto antes de poder salir, aunque todo esté listo: sin
// esto, con un servidor rápido el logo apenas se ve y el vuelo parece un salto.
const QUIETO_MIN_MS = 500
// Si la portada nunca avisa dónde está su logo (el flujo arrancó en otra
// pantalla, un error), el splash se retira con un fundido en vez de tapar el
// juego para siempre.
const TOPE_MS = 6000

// Arranca decidido y se asienta largo, sin rebote: tiene que aterrizar EXACTO
// sobre el logo de la portada.
const VUELO = { duration: 950, easing: Easing.bezier(0.32, 0.72, 0, 1) }
const FONDO_SALE = { duration: 600, easing: Easing.out(Easing.quad) }
const RETIRADA = { duration: 350, easing: Easing.out(Easing.quad) }

export function SplashAnimado() {
  const { fase, contenidoListo, destino } = useSplash()
  const { width: ancho, height: alto } = useWindowDimensions()
  const quieto = useReducedMotion()
  const [medida, setMedida] = useState<{ ancho: number } | null>(null)
  const [pasoElMinimo, setPasoElMinimo] = useState(false)

  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const escala = useSharedValue(1)
  const fondo = useSharedValue(1)
  const general = useSharedValue(1)

  useEffect(() => {
    const minimo = setTimeout(() => setPasoElMinimo(true), QUIETO_MIN_MS)
    const tope = setTimeout(() => {
      if (leerSplash().fase !== "esperando") return
      general.value = withTiming(0, RETIRADA, (fin) => {
        if (fin) runOnJS(terminarSplash)()
      })
    }, TOPE_MS)
    return () => {
      clearTimeout(minimo)
      clearTimeout(tope)
    }
  }, [general])

  // Sale cuando están las tres cosas: el servidor contestó, la portada dijo
  // dónde queda su logo (ya con su forma final) y el logo se dejó ver.
  useEffect(() => {
    if (fase === "esperando" && contenidoListo && destino && pasoElMinimo && medida) iniciarViaje()
  }, [fase, contenidoListo, destino, pasoElMinimo, medida])

  useEffect(() => {
    if (fase !== "viajando" || !destino || !medida) return
    const dx = destino.x + destino.width / 2 - ancho / 2
    const dy = destino.y + destino.height / 2 - alto / 2
    const k = destino.width / medida.ancho
    if (quieto) {
      x.value = dx
      y.value = dy
      escala.value = k
      fondo.value = 0
      terminarSplash()
      return
    }
    x.value = withTiming(dx, VUELO)
    y.value = withTiming(dy, VUELO)
    fondo.value = withTiming(0, FONDO_SALE)
    escala.value = withTiming(k, VUELO, (fin) => {
      if (fin) runOnJS(terminarSplash)()
    })
  }, [fase, destino, medida, ancho, alto, quieto, x, y, escala, fondo])

  const estiloGeneral = useAnimatedStyle(() => ({ opacity: general.value }))
  const estiloFondo = useAnimatedStyle(() => ({ opacity: fondo.value }))
  const estiloLogo = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: escala.value }],
  }))

  if (fase === "terminado") return null

  return (
    <Animated.View
      // Una vez que sale, el juego de abajo tiene que recibir los toques.
      pointerEvents={fase === "esperando" ? "auto" : "none"}
      style={[StyleSheet.absoluteFill, estiloGeneral]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.fondo, estiloFondo]} />
      <View style={styles.centro} pointerEvents="none">
        <Animated.View
          style={estiloLogo}
          onLayout={(e) => setMedida({ ancho: e.nativeEvent.layout.width })}
        >
          <GameLogo fontSize={TAMANO_GRANDE} conFundido={false} />
        </Animated.View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  fondo: { backgroundColor: TEMA.background },
  centro: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
})
