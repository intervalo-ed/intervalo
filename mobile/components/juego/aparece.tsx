// Una pieza de la portada que entra con una animación sutil (fundido y un
// asomo hacia arriba) cuando el logo del splash sale hacia su lugar. `orden`
// escalona las piezas: el texto primero, párrafo por párrafo, y el botón al
// final.
//
// Si la portada se monta cuando el splash ya terminó (se vuelve a ella desde
// otra diapo), aparece puesta, sin animar.

import { useEffect, useState, type ReactNode } from "react"
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated"
import { leerSplash, useSplash } from "@/lib/splash/estado-splash"

// Cuándo arranca la primera pieza, desde que el logo sale: cuando el vuelo ya
// va casi llegando, para que el texto aparezca alrededor del logo y no debajo
// de un logo que todavía se mueve.
const ARRANQUE_MS = 450
const ENTRE_PIEZAS_MS = 120
const ENTRADA = { duration: 450, easing: Easing.out(Easing.cubic) }
const ASOMO = 10

export function Aparece({ orden, children }: { orden: number; children: ReactNode }) {
  const { fase } = useSplash()
  const quieto = useReducedMotion()
  // Se decide al montar: una portada que nace con el splash ya terminado no
  // tiene nada que revelar.
  const [yaEstaba] = useState(() => leerSplash().fase === "terminado")
  const progreso = useSharedValue(yaEstaba ? 1 : 0)

  useEffect(() => {
    if (yaEstaba || fase === "esperando") return
    progreso.value = quieto
      ? 1
      : withDelay(ARRANQUE_MS + orden * ENTRE_PIEZAS_MS, withTiming(1, ENTRADA))
  }, [fase, yaEstaba, quieto, orden, progreso])

  const estilo = useAnimatedStyle(() => ({
    opacity: progreso.value,
    transform: [{ translateY: (1 - progreso.value) * ASOMO }],
  }))

  return (
    // Invisible no es intocable por sí solo: hasta que sale el logo, nada de
    // esto recibe toques.
    <Animated.View pointerEvents={yaEstaba || fase !== "esperando" ? "auto" : "none"} style={estilo}>
      {children}
    </Animated.View>
  )
}
