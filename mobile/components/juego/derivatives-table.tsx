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

import { useMemo, useState, type ReactNode } from "react"
import { FlatList, Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import {
  accuracyColor,
  fmtSegundos,
  motivoDeLaCelda,
} from "@intervalo/dx-core/juego/estadisticas-formato"
import type { GameStatsRow } from "@intervalo/dx-core/juego/UseGameStats"
import { FILAS, acomodar, type Fila } from "@intervalo/dx-core/juego/tabla-derivadas"
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

  const { filas, subidas, pedidas } = useMemo(() => acomodar(clave, desborda), [clave, desborda])

  return (
    <FlatList
      data={filas}
      keyExtractor={(f) => f.slug}
      renderItem={({ item, index }) => (
        <Renglon
          fila={item}
          pedida={pedidas.has(item.slug)}
          costura={subidas > 0 && index === subidas}
        />
      )}
      ListHeaderComponent={Cabecera}
      stickyHeaderIndices={[0]}
      initialNumToRender={FILAS.length}
      showsVerticalScrollIndicator={false}
      onLayout={(e) => setCaja(e.nativeEvent.layout.height)}
      onContentSizeChange={(_w, h) => setContenido(h)}
      style={[styles.marco, style]}
    />
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

export type Cartel = { titulo: string; cuerpo: string }

/** El cartel que explica una tile o una celda. En la web es un popover que abre
 *  con el mouse encima; acá no hay mouse, así que se toca y sube una hoja desde
 *  abajo, la misma de los selectores del ranking (leaderboard-chrome.tsx). */
export function HojaDeCartel({ cartel, onClose }: { cartel: Cartel | null; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={cartel !== null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.fondo} onPress={onClose} accessibilityLabel="Cerrar" />
      <View style={[styles.hoja, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.hojaTitulo}>{cartel?.titulo}</Text>
        <Text style={styles.hojaCuerpo}>{cartel?.cuerpo}</Text>
      </View>
    </Modal>
  )
}

// El 0.82rem de la web.
const TAMANO_STATS = 13.1

function Placeholder() {
  return <Text style={[styles.dato, { color: "rgba(164,179,198,0.5)" }]}>—</Text>
}

function CeldaStats({
  titulo,
  cuerpo,
  onCartel,
  children,
}: {
  titulo: string
  cuerpo: string
  onCartel: (c: Cartel) => void
  children: ReactNode
}) {
  return (
    <Pressable
      onPress={() => onCartel({ titulo, cuerpo })}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={cuerpo}
      style={({ pressed }) => [styles.celdaStats, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  )
}

function RenglonStats({
  fila,
  datos,
  onCartel,
}: {
  fila: Fila
  datos?: GameStatsRow
  onCartel: (c: Cartel) => void
}) {
  // Sin dato para esta fila —el payload todavía no llegó, o el server manda un
  // slug que no conocemos— es el mismo placeholder que "no hay plantilla".
  const noExiste = datos === undefined || datos.unlock_elo === null
  const ms = noExiste ? null : (datos.avg_response_ms ?? null)
  const acierto = noExiste ? null : (datos.accuracy ?? null)
  const sample = datos?.sample ?? 0
  return (
    <View style={styles.renglon}>
      <View style={[styles.celda, styles.celdaIzquierda]}>
        <Latex tex={mate(fila.f)} size={TAMANO} />
      </View>
      <View style={[styles.celdaStatsMarco, styles.celdaIzquierda]}>
        <CeldaStats
          titulo="Velocidad"
          cuerpo={motivoDeLaCelda({ noExiste, sample, hayDato: ms !== null, quien: "Promedio de tiempo" })}
          onCartel={onCartel}
        >
          {/* Sin heatmap a propósito: no hay "bien" o "mal" en cuánto tardás. */}
          {ms !== null ? <Text style={styles.dato}>{fmtSegundos(ms)}</Text> : <Placeholder />}
        </CeldaStats>
      </View>
      <View style={styles.celdaStatsMarco}>
        <CeldaStats
          titulo="Efectividad"
          cuerpo={motivoDeLaCelda({ noExiste, sample, hayDato: acierto !== null, quien: "Acierto" })}
          onCartel={onCartel}
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
 *  entera. `onCartel` abre la explicación de la celda tocada. */
export function DerivativesStatsTable({
  rows,
  onCartel,
}: {
  rows: GameStatsRow[]
  onCartel: (c: Cartel) => void
}) {
  const porSlug = useMemo(() => new Map(rows.map((fila) => [fila.slug, fila])), [rows])
  return (
    <View style={[styles.marco, { overflow: "hidden" }]}>
      <View style={styles.cabecera}>
        <Text style={[styles.titulo, styles.celdaIzquierda]}>función</Text>
        <Text style={[styles.titulo, styles.celdaIzquierda]}>velocidad</Text>
        <Text style={styles.titulo}>efectividad</Text>
      </View>
      {FILAS.map((fila) => (
        <RenglonStats key={fila.slug} fila={fila} datos={porSlug.get(fila.slug)} onCartel={onCartel} />
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
  },
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
  renglon: {
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
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  hoja: {
    gap: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: TEMA.border,
    backgroundColor: TEMA.card,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  hojaTitulo: { fontSize: 15, fontWeight: "600", color: TEMA.foreground },
  hojaCuerpo: { fontSize: 14, lineHeight: 21, color: TEMA.mutedForeground },
})
