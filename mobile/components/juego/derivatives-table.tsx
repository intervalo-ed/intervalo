// La tabla de derivadas en la app. Mismas filas, mismo orden y mismo
// reacomodo que la web (web/src/app/derivadas/derivatives-table.tsx): las
// filas y `acomodar` viven en dx-core (juego/tabla-derivadas.ts).
//
// Abajo, la tabla enriquecida de la diapo de estadísticas
// (`DerivativesStatsTable`): las mismas filas con tu velocidad y tu efectividad
// en vez de la derivada.
//
// Las 32 fórmulas son fijas, así que se pueden convertir antes de que la
// tabla se abra (`precalentarTablaDeDerivadas`) y abrirla no cuesta nada más
// que montar vistas.

import { useMemo, useRef, useState, type ReactNode } from "react"
import {
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { Text } from "@/components/texto"
import { vib } from "@/lib/haptics"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import {
  accuracyColor,
  fmtSegundos,
  motivoDeLaCelda,
} from "@intervalo/dx-core/juego/estadisticas-formato"
import type { GameStatsRow } from "@intervalo/dx-core/juego/UseGameStats"
import { FILAS, acomodar, type Fila } from "@intervalo/dx-core/juego/tabla-derivadas"
import { Cartel, CartelTexto, Fuerte } from "./ranking/cartel"
import { Latex } from "@/components/latex/latex"
import { precalentarMathJax } from "@/components/latex/mathjax"

// Todo en `\displaystyle`, como la web: en modo texto las fracciones salen al
// 70% y la tabla terminaba con dos tamaños de letra.
const mate = (latex: string) => `\\displaystyle ${latex}`

// El 0.95rem de la web.
const TAMANO = 15.2

const BORDE = "rgba(255,255,255,0.10)"
// El tinte de la fila pedida: el mismo `bg-primary/10` que la web, que es el
// del ranking para tu propia fila.
const FILA_PEDIDA = "rgba(84,87,229,0.10)"
const COSTURA = "rgba(255,255,255,0.25)"

export function precalentarTablaDeDerivadas(): void {
  precalentarMathJax({
    formulas: FILAS.flatMap((f) => [
      { tex: mate(f.f), display: false },
      { tex: mate(f.d), display: false },
    ]),
  })
}

function Renglon({
  fila,
  pedida,
  costura,
}: {
  fila: Fila
  pedida: boolean
  costura: boolean
}) {
  return (
    <View
      style={[
        styles.renglon,
        pedida && { backgroundColor: FILA_PEDIDA },
        costura && { borderTopWidth: 2, borderTopColor: COSTURA },
      ]}
    >
      <View style={[styles.celda, styles.celdaIzquierda]}>
        <Latex tex={mate(fila.f)} size={TAMANO} />
      </View>
      <View style={styles.celda}>
        <Latex tex={mate(fila.d)} size={TAMANO} />
      </View>
    </View>
  )
}

/** La tabla de derivadas. `destacar` son los slugs que pide el ejercicio
 *  (`GameExerciseOut.tabla_slugs`): se tiñen siempre, y suben arriba de todo
 *  solo si la tabla no entra entera en su caja (ver `acomodar`). */
export function DerivativesTable({
  destacar,
  style,
}: {
  destacar?: string[]
  style?: StyleProp<ViewStyle>
}) {
  const clave = destacar?.join(",") ?? ""
  const [caja, setCaja] = useState(0)
  const [contenido, setContenido] = useState(0)
  // El +1 por el redondeo subpíxel, igual que la web.
  const desborda = clave !== "" && caja > 0 && contenido > caja + 1

  // Un roce al llegar a un extremo de la tabla, una sola vez por llegada.
  const enExtremoRef = useRef(false)
  const alScrollear = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const maximo = contentSize.height - layoutMeasurement.height
    if (maximo <= 1) return
    const extremo = contentOffset.y <= 0 || contentOffset.y >= maximo - 1
    if (extremo && !enExtremoRef.current) vib.roce()
    enExtremoRef.current = extremo
  }

  const { filas, subidas, pedidas } = useMemo(() => acomodar(clave, desborda), [clave, desborda])

  return (
    // ScrollView y no FlatList: los renglones tienen que poder crecer (`flexGrow`)
    // para repartirse el sobrante de la caja, como en la web, y la FlatList los
    // envuelve en celdas que no crecen. Son 16 filas fijas, no hace falta virtualizar.
    <ScrollView
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contenido}
      onLayout={(e) => setCaja(e.nativeEvent.layout.height)}
      onContentSizeChange={(_w, h) => setContenido(h)}
      onScroll={alScrollear}
      scrollEventThrottle={32}
      style={[styles.marco, style]}
    >
      <Cabecera />
      {filas.map((fila, index) => (
        <Renglon
          key={fila.slug}
          fila={fila}
          pedida={pedidas.has(fila.slug)}
          costura={subidas > 0 && index === subidas}
        />
      ))}
    </ScrollView>
  )
}

function Cabecera() {
  return (
    <View style={styles.cabecera}>
      <Text style={[styles.titulo, styles.celdaIzquierda]}>función</Text>
      <Text style={styles.titulo}>derivada</Text>
    </View>
  )
}

// ── La tabla enriquecida ─────────────────────────────────────────────────

// El 0.82rem de la web.
const TAMANO_STATS = 13.1

function Placeholder() {
  return <Text style={[styles.dato, { color: "rgba(164,179,198,0.5)" }]}>—</Text>
}

function CeldaStats({ titulo, cuerpo, children }: { titulo: string; cuerpo: string; children: ReactNode }) {
  return (
    <Cartel
      accessibilityLabel={titulo}
      style={[styles.celdaStats, { flexShrink: 1 }]}
      contenido={
        <CartelTexto>
          <Fuerte>{titulo}</Fuerte>. {cuerpo}
        </CartelTexto>
      }
    >
      {children}
    </Cartel>
  )
}

function RenglonStats({ fila, datos }: { fila: Fila; datos?: GameStatsRow }) {
  // Sin dato para esta fila —el payload todavía no llegó, o el server manda un
  // slug que no conocemos— es el mismo placeholder que "no hay plantilla".
  const noExiste = datos === undefined || datos.unlock_elo === null
  const ms = noExiste ? null : (datos.avg_response_ms ?? null)
  const acierto = noExiste ? null : (datos.accuracy ?? null)
  const sample = datos?.sample ?? 0
  return (
    <View style={styles.renglon}>
      <View style={[styles.celda, styles.celdaIzquierda, styles.tercio]}>
        <Latex tex={mate(fila.f)} size={TAMANO} />
      </View>
      <View style={[styles.celdaStatsMarco, styles.celdaIzquierda, styles.tercio]}>
        <CeldaStats
          titulo="Velocidad"
          cuerpo={motivoDeLaCelda({ noExiste, sample, hayDato: ms !== null, quien: "Promedio de tiempo" })}
        >
          {/* Sin heatmap a propósito: no hay "bien" o "mal" en cuánto tardás. */}
          {ms !== null ? <Text style={styles.dato}>{fmtSegundos(ms)}</Text> : <Placeholder />}
        </CeldaStats>
      </View>
      <View style={[styles.celdaStatsMarco, styles.tercio]}>
        <CeldaStats
          titulo="Efectividad"
          cuerpo={motivoDeLaCelda({ noExiste, sample, hayDato: acierto !== null, quien: "Acierto" })}
        >
          {acierto !== null ? (
            <Text style={[styles.dato, { color: accuracyColor(acierto) }]}>{acierto}%</Text>
          ) : (
            <Placeholder />
          )}
        </CeldaStats>
      </View>
    </View>
  )
}

/** La tabla de derivadas con tu velocidad y tu efectividad de los últimos 10
 *  intentos limpios en cada familia (game/stats.py :: _personal_accuracy). Sin
 *  scroll propio: es el último tramo de la diapo de estadísticas, que scrollea
 *  entera. Tocar una celda abre su explicación, el mismo cartel del ranking. */
export function DerivativesStatsTable({ rows }: { rows: GameStatsRow[] }) {
  const porSlug = useMemo(() => new Map(rows.map((fila) => [fila.slug, fila])), [rows])
  return (
    <View style={[styles.marco, { overflow: "hidden" }]}>
      <View style={styles.cabecera}>
        <Text style={[styles.titulo, styles.celdaIzquierda, styles.tercio]}>función</Text>
        <Text style={[styles.titulo, styles.celdaIzquierda, styles.tercio]}>velocidad</Text>
        <Text style={[styles.titulo, styles.tercio]}>efectividad</Text>
      </View>
      {FILAS.map((fila) => (
        <RenglonStats key={fila.slug} fila={fila} datos={porSlug.get(fila.slug)} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  marco: {
    flexGrow: 0,
    borderWidth: 1,
    borderColor: BORDE,
    borderRadius: 6,
    overflow: "hidden",
  },
  contenido: { flexGrow: 1 },
  cabecera: {
    flexDirection: "row",
    backgroundColor: "#1f1f30",
  },
  titulo: {
    flex: 1,
    paddingVertical: 4,
    textAlign: "center",
    fontSize: 11.2,
    fontWeight: "500",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: TEMA.mutedForeground,
  },
  // `flex: 1 0 auto` como el renglón de la web: reparte el sobrante de la caja
  // sin encoger nunca, así el que tiene una raíz sigue siendo más alto.
  renglon: {
    flexGrow: 1,
    flexShrink: 0,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BORDE,
  },
  celda: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  // Tres columnas idénticas: con `flex: 1` el contenido (una fórmula ancha)
  // empujaba la primera y la cabecera quedaba corrida respecto de las filas.
  tercio: { flex: 0, flexGrow: 0, flexShrink: 0, flexBasis: "auto", width: "33.3333%" },
  celdaIzquierda: {
    borderRightWidth: 1,
    borderRightColor: BORDE,
  },
  celdaStatsMarco: { flex: 1, alignItems: "stretch", justifyContent: "center" },
  celdaStats: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dato: {
    fontSize: TAMANO_STATS,
    color: TEMA.foreground,
    fontVariant: ["tabular-nums"],
  },
})
