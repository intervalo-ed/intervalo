// La rueda de hora y minutos de la diapo de recordatorios: dos columnas que se
// deslizan y se traban en cada valor, con la franja del medio como el elegido.
// Cada valor que cruza la franja hace un tic de vibración (`vib.muesca`), como
// la ruedita de un despertador.
//
// Es de JS y no la nativa de iOS (`@react-native-community/datetimepicker`):
// esa pide un módulo nativo nuevo, o sea reconstruir el dev client y el build, y
// acá además hace falta limitar las horas (08–22) y los minutos (de a 15, que es
// lo que sabe el backend: game/schemas.py::GameNotificationSettings).

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from "react-native"
import { Text } from "@/components/texto"
import { vib } from "@/lib/haptics"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { FUENTE } from "@/lib/tipografia"

const ALTO_ITEM = 44
const FILAS_VISIBLES = 5
const ALTO = ALTO_ITEM * FILAS_VISIBLES
const RELLENO = (ALTO - ALTO_ITEM) / 2

export const HORAS = Array.from({ length: 22 - 8 + 1 }, (_, i) => 8 + i)
export const MINUTOS = [0, 15, 30, 45]

const dos = (n: number) => String(n).padStart(2, "0")

/** "19:30" → índices de la rueda. Lo que no entra (minutos sueltos, hora fuera
 *  de 08–22) cae en el valor más cercano. */
function indices(hora: string): { h: number; m: number } {
  const [hh, mm] = hora.split(":").map(Number)
  const h = Math.min(HORAS.length - 1, Math.max(0, hh - HORAS[0]))
  const m = Math.max(0, MINUTOS.findIndex((x) => x >= mm))
  return { h, m: mm > MINUTOS[MINUTOS.length - 1] ? MINUTOS.length - 1 : m }
}

function Columna({
  valores,
  indice,
  onIndice,
  etiqueta,
}: {
  valores: number[]
  indice: number
  onIndice: (i: number) => void
  etiqueta: string
}) {
  const ref = useRef<ScrollViewInstance>(null)
  // Dónde está la columna AHORA, mientras se desliza: define el tic y qué fila se
  // pinta como la elegida. `indice` (el valor confirmado) llega recién al soltar.
  const [vivo, setVivo] = useState(indice)
  const vivoRef = useRef(indice)

  useEffect(() => {
    ref.current?.scrollTo({ y: indice * ALTO_ITEM, animated: false })
    // Solo al montar: después la columna manda ella.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const alDeslizar = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.min(valores.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ALTO_ITEM)))
      if (i === vivoRef.current) return
      vivoRef.current = i
      setVivo(i)
      vib.muesca()
    },
    [valores.length],
  )

  const alSoltar = useCallback(() => onIndice(vivoRef.current), [onIndice])

  return (
    <ScrollView
      ref={ref}
      style={styles.columna}
      contentContainerStyle={{ paddingVertical: RELLENO }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ALTO_ITEM}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onScroll={alDeslizar}
      onMomentumScrollEnd={alSoltar}
      onScrollEndDrag={(e) => {
        // Soltar sin inercia no dispara `onMomentumScrollEnd`.
        if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.05) alSoltar()
      }}
      accessibilityLabel={etiqueta}
      accessibilityRole="adjustable"
    >
      {valores.map((v, i) => {
        const distancia = Math.abs(i - vivo)
        return (
          <View key={v} style={styles.item}>
            <Text
              style={[
                styles.numero,
                distancia === 0 && styles.elegido,
                distancia === 1 && { opacity: 0.55 },
                distancia >= 2 && { opacity: 0.25 },
              ]}
            >
              {dos(v)}
            </Text>
          </View>
        )
      })}
    </ScrollView>
  )
}

export function RuedaDeHora({ hora, onCambio }: { hora: string; onCambio: (hora: string) => void }) {
  const inicial = useRef(indices(hora)).current
  const h = useRef(inicial.h)
  const m = useRef(inicial.m)

  const emitir = useCallback(() => onCambio(`${dos(HORAS[h.current])}:${dos(MINUTOS[m.current])}`), [onCambio])

  return (
    <View style={styles.rueda}>
      {/* La franja del medio: lo que queda adentro es lo elegido. */}
      <View pointerEvents="none" style={styles.franja} />
      <Columna
        valores={HORAS}
        indice={inicial.h}
        etiqueta="Hora"
        onIndice={(i) => {
          h.current = i
          emitir()
        }}
      />
      <Text style={styles.puntos}>:</Text>
      <Columna
        valores={MINUTOS}
        indice={inicial.m}
        etiqueta="Minutos"
        onIndice={(i) => {
          m.current = i
          emitir()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  rueda: {
    height: ALTO,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    overflow: "hidden",
  },
  franja: {
    position: "absolute",
    left: 0,
    right: 0,
    top: RELLENO,
    height: ALTO_ITEM,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#7e80f7",
    backgroundColor: "rgba(126, 128, 247, 0.14)",
  },
  columna: { width: 84, flexGrow: 0, height: ALTO },
  item: { height: ALTO_ITEM, alignItems: "center", justifyContent: "center" },
  numero: {
    fontSize: 24,
    color: TEMA.mutedForeground,
    fontVariant: ["tabular-nums"],
  },
  elegido: { color: TEMA.foreground, fontFamily: FUENTE.seminegrita },
  puntos: { fontSize: 24, fontFamily: FUENTE.seminegrita, color: TEMA.foreground, marginTop: -2 },
})
