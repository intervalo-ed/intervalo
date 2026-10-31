// El «¿Por qué?» en la app: de dónde salía la derivada que se pedía. Mismo
// contenido y mismo orden que web/src/app/derivadas/porque-panel.tsx (en el
// teléfono de la web es una pantalla propia, y acá también): la explicación
// del server, el parrafito que abre el gráfico, la leyenda y el gráfico.
//
// Texto y fórmulas son nativos (components/latex). El gráfico es mafs en un
// DOM component, o sea un WebView: arrancar uno cuesta ~1.3 s en frío, así
// que se monta recién cuando el panel está en pantalla —no lo paga nadie que
// no abra el «¿Por qué?»— y queda montado mientras el panel exista.

import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { LINE_COLOR, SECOND_LINE_COLOR } from "@intervalo/dx-core/grafico/math-graph-colors"
import { GRAPH_INTRO, GRAPH_POINTS, type PorQueGraph } from "@intervalo/dx-core/juego/porque"
import { MathText } from "@/components/latex/latex"
import PorQueGrafico from "./porque-grafico.dom"

export type { PorQueGraph }

// La caja del gráfico de la web (math-graph.tsx :: BOX_W × BOX_H).
const ASPECTO_GRAFICO = 480 / 420

const TAMANO = 16

export function PorQuePanel({
  explanation,
  isPending,
  isError,
  onRetry,
  graph = null,
  onGraficoListo,
  style,
}: {
  explanation: string | null
  isPending: boolean
  isError: boolean
  onRetry: () => void
  // `graficoDelExplain(data)` de dx-core (juego/porque.ts).
  graph?: PorQueGraph | null
  // Para medir: ms desde que se montó el WebView hasta que el gráfico pintó.
  onGraficoListo?: (ms: number) => void
  style?: StyleProp<ViewStyle>
}) {
  return (
    <ScrollView
      style={[styles.scroller, style]}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.columna}>
        {isError ? (
          <View style={styles.error}>
            <Text style={styles.errorTexto}>No pudimos traer la explicación.</Text>
            <Pressable
              onPress={onRetry}
              style={({ pressed }) => [styles.reintentar, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
            >
              <Text style={styles.reintentarTexto}>Probar de nuevo</Text>
            </Pressable>
          </View>
        ) : isPending || explanation === null ? (
          <Esqueleto />
        ) : (
          <>
            <MathText text={explanation} size={TAMANO} interlineado={1.625} />
            {graph && (
              <View style={styles.bloqueGrafico}>
                <View style={styles.puntos}>
                  <MathText text={GRAPH_INTRO} size={TAMANO} interlineado={1.625} />
                  {GRAPH_POINTS.map((punto) => (
                    <View key={punto} style={styles.punto}>
                      <Text style={styles.vineta}>•</Text>
                      <View style={styles.puntoTexto}>
                        <MathText text={punto} size={TAMANO} interlineado={1.625} />
                      </View>
                    </View>
                  ))}
                </View>
                <View style={styles.leyenda}>
                  <Leyenda color={LINE_COLOR} tex={graph.fnLatex} />
                  <Leyenda color={SECOND_LINE_COLOR} tex={graph.fn2Latex} />
                </View>
                <Grafico graph={graph} onListo={onGraficoListo} />
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  )
}

function Leyenda({ color, tex }: { color: string; tex: string }) {
  return (
    <View style={styles.leyendaItem}>
      <View style={[styles.rayita, { backgroundColor: color }]} />
      <MathText text={`$${tex}$`} size={12} color={TEMA.mutedForeground} />
    </View>
  )
}

function Grafico({ graph, onListo }: { graph: PorQueGraph; onListo?: (ms: number) => void }) {
  const [ancho, setAncho] = useState(0)
  const [listo, setListo] = useState(false)
  // Un frame después del primer layout y no en el mismo: así el texto del
  // panel se pinta primero y el WebView arranca detrás, sin demorarlo.
  const [montar, setMontar] = useState(false)
  const t0 = useRef(0)
  useEffect(() => {
    if (ancho === 0 || montar) return
    const id = requestAnimationFrame(() => {
      t0.current = performance.now()
      setMontar(true)
    })
    return () => cancelAnimationFrame(id)
  }, [ancho, montar])

  const alto = Math.round(ancho / ASPECTO_GRAFICO)
  return (
    <View
      style={[styles.grafico, ancho > 0 && { height: alto }]}
      onLayout={(e) => setAncho(Math.round(e.nativeEvent.layout.width))}
    >
      {montar && (
        <PorQueGrafico
          fn={graph.fn}
          fn2={graph.fn2}
          view={graph.view}
          ancho={ancho}
          alto={alto}
          onListo={async () => {
            setListo(true)
            onListo?.(performance.now() - t0.current)
          }}
          dom={{
            containerStyle: { flex: 0, width: ancho, height: alto },
            scrollEnabled: false,
            bounces: false,
          }}
        />
      )}
      {!listo && <View style={styles.huecoGrafico} pointerEvents="none" />}
    </View>
  )
}

// Un esqueleto y no un "cargando...": la web hace lo mismo. Cinco renglones de
// distinto largo, que es la forma de un párrafo.
function Esqueleto() {
  const pulso = useRef(new Animated.Value(0.5)).current
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [pulso])
  return (
    <View style={styles.esqueleto} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {["100%", "92%", "67%", "83%", "50%"].map((w, i) => (
        <Animated.View
          key={i}
          style={[styles.esqueletoRenglon, { width: w as `${number}%`, opacity: pulso }]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  scroller: { flex: 1 },
  // `flexGrow` + centrado: centra mientras la explicación entre, y cuando no
  // entra se apoya arriba y scrollea (el `m-auto` de la web).
  contenido: { flexGrow: 1, justifyContent: "center" },
  columna: { padding: 16, gap: 12 },
  error: { alignItems: "flex-start", gap: 12 },
  errorTexto: { fontSize: 14, color: TEMA.mutedForeground },
  reintentar: {
    borderWidth: 1,
    borderColor: TEMA.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reintentarTexto: { fontSize: 14, color: TEMA.foreground, fontWeight: "500" },
  bloqueGrafico: { marginTop: 8, gap: 6 },
  puntos: { gap: 8 },
  punto: { flexDirection: "row", paddingLeft: 4 },
  vineta: { width: 16, fontSize: TAMANO, lineHeight: TAMANO * 1.625, color: TEMA.foreground },
  puntoTexto: { flex: 1 },
  leyenda: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  rayita: { width: 12, height: 6, borderRadius: 3 },
  grafico: {
    width: "100%",
    aspectRatio: ASPECTO_GRAFICO,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: "#ffffff",
    overflow: "hidden",
  },
  huecoGrafico: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#ffffff" },
  esqueleto: { gap: 12, padding: 4 },
  esqueletoRenglon: { height: 16, borderRadius: 4, backgroundColor: "rgba(246,248,252,0.10)" },
})
