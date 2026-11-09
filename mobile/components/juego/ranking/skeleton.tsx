// El esqueleto de la lista del ranking y la fila hueca del salto
// (web/src/app/derivadas/game-ranking.tsx :: ListSkeleton, FilaHueca), con los
// estilos de fila que comparten las vistas.
//
// La regla de skeleton-barra.tsx vale igual acá: el esqueleto se calca de la
// fila, no se dibuja "parecido". Por eso la caja de la fila sale de este archivo
// y la usan las filas de verdad: si una cambia de alto, cambian las dos.

import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { ALTO_FILA_PX } from "@intervalo/dx-core/juego/salto-ranking"
import { FUENTE } from "@/lib/tipografia"

// Separación entre filas (`gap-2`). Fila + separación = ALTO_FILA_PX, que es con
// lo que salto-ranking.ts convierte puestos en píxeles.
export const SEPARACION_FILAS = 8
// 12 px de `py-3` por lado + 20 px de la línea de `text-sm`.
export const ALTO_FILA = ALTO_FILA_PX - SEPARACION_FILAS

export const ESTILOS_FILA = StyleSheet.create({
  // El `ring-1` de la web es una sombra que no ocupa lugar; acá el borde sí, así
  // que sale del padding y el alto queda fijo.
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: ALTO_FILA,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(246, 248, 252, 0.1)",
    paddingHorizontal: 15,
  },
  // "Esta fila sos vos" (`bg-primary/10 ring-primary/30`), igual en todas las vistas.
  propia: { backgroundColor: "rgba(84, 87, 229, 0.1)", borderColor: "rgba(84, 87, 229, 0.3)" },
  // La que no entra en el orden por Elo.
  fuera: { opacity: 0.55 },
  // El puesto: ancho fijo, centrado. 44 y no los 16 de la web (`w-4`): con dos
  // cifras el número se partía en dos renglones (el «20» se veía como un 2
  // sobre un 0), y con cuatro cifras 32 y 40 quedaban justos y iOS cortaba
  // algunos («1080» salía como «10…»). La fila individual además achica la letra
  // en vez de cortar.
  puesto: {
    width: 44,
    flexShrink: 0,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FUENTE.seminegrita,
    color: TEMA.mutedForeground,
    fontVariant: ["tabular-nums"],
  },
  // El contenedor de la lista (`flex flex-col gap-2 py-1`).
  lista: { gap: SEPARACION_FILAS, paddingVertical: 4 },
  vacio: { fontSize: 14, lineHeight: 20, color: TEMA.mutedForeground },
})

const ANCHOS = [96, 128, 112, 144, 96, 128, 104, 120]

/** Qué vista se está esperando. El esqueleto se calca de ESA fila, no de una
 *  genérica: el chip de universidad, la bandera, el contador de jugadores y el
 *  número tienen lugares distintos en cada una, y que aparezcan antes que los
 *  datos hace que la lista no se reacomode cuando llegan. */
export type FormaDeEsqueleto = "individual" | "universidad" | "pais"

// Lo que mide la etiqueta de universidad (`UniTag`) y la bandera de la fila.
const CHIP_ANCHO = 68
const CHIP_ALTO = 26
const BANDERA = 22

/** Una barra del esqueleto, adentro de una caja del alto de la línea real. */
function Hueco({ ancho }: { ancho: number | "100%" }) {
  return (
    <View style={estilos.hueco}>
      <View style={[estilos.barra, { width: ancho }]} />
    </View>
  )
}

/** La etiqueta de universidad: una caja con el borde del `UniTag` de verdad. */
function HuecoChip() {
  return <View style={estilos.chip} />
}

function FilaDeEsqueleto({ forma, indice }: { forma: FormaDeEsqueleto; indice: number }) {
  const ancho = ANCHOS[indice % ANCHOS.length]
  return (
    <View style={[ESTILOS_FILA.fila, forma !== "individual" && estilos.conGap]}>
      <View style={estilos.puesto}>
        <Hueco ancho="100%" />
      </View>
      {forma === "individual" && (
        <>
          <View style={estilos.flex}>
            <Hueco ancho={ancho} />
          </View>
          {/* Con la universidad de cada uno al lado, como la fila de verdad. */}
          <HuecoChip />
        </>
      )}
      {forma === "universidad" && (
        <View style={estilos.flex}>
          <HuecoChip />
        </View>
      )}
      {forma === "pais" && (
        <View style={[estilos.flex, estilos.nombrePais]}>
          <Hueco ancho={ancho} />
          <View style={estilos.bandera} />
        </View>
      )}
      {forma !== "individual" && (
        <View style={estilos.jugadores}>
          <Hueco ancho="100%" />
        </View>
      )}
      <View style={estilos.numero}>
        <Hueco ancho="100%" />
      </View>
    </View>
  )
}

/** El esqueleto de la lista. `filas` es cuántas se esperan: con un filtro que
 *  ya se sabe cuánta gente tiene (una universidad de 7 jugadores) no se
 *  dibujan 8, sino 7. */
export function ListSkeleton({ forma = "individual", filas = 8 }: { forma?: FormaDeEsqueleto; filas?: number }) {
  // `animate-pulse`: todas las barras laten juntas, desde el contenedor.
  const opacidad = useSharedValue(1)
  useEffect(() => {
    opacidad.value = withRepeat(withTiming(0.5, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1) }), -1, true)
  }, [opacidad])
  const latido = useAnimatedStyle(() => ({ opacity: opacidad.value }))

  return (
    <View style={estilos.contenedor} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[ESTILOS_FILA.lista, latido]}>
        {Array.from({ length: Math.max(1, filas) }, (_, i) => (
          <FilaDeEsqueleto key={i} forma={forma} indice={i} />
        ))}
      </Animated.View>
    </View>
  )
}

/** El lugar que se abre y se cierra en el salto de la lista individual: una fila
 *  vacía e invisible, del mismo alto que una de verdad. Lleva el layout animado
 *  como las demás, que es lo que hace que aparecer y desaparecer se vea como la
 *  lista corriéndose y no como un parpadeo. */
export function FilaHueca({ quieto }: { quieto: boolean }) {
  return (
    <Animated.View
      layout={quieto ? undefined : LinearTransition}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[ESTILOS_FILA.fila, estilos.hueca]}
    />
  )
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, minHeight: 0, overflow: "hidden" },
  flex: { flex: 1, minWidth: 0 },
  puesto: { width: 44, flexShrink: 0 },
  numero: { width: 48, flexShrink: 0 },
  jugadores: { width: 36, flexShrink: 0 },
  conGap: { gap: 8 },
  nombrePais: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: {
    width: CHIP_ANCHO,
    height: CHIP_ALTO,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(246, 248, 252, 0.1)",
    backgroundColor: "rgba(246, 248, 252, 0.05)",
  },
  bandera: { width: BANDERA, height: BANDERA * 0.7, borderRadius: 3, backgroundColor: "rgba(246, 248, 252, 0.1)" },
  hueco: { height: 20, justifyContent: "center" },
  barra: { height: 14, borderRadius: 4, backgroundColor: "rgba(246, 248, 252, 0.1)" },
  hueca: { opacity: 0, borderWidth: 0 },
})
