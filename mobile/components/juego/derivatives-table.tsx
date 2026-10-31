// La tabla de derivadas en la app. Mismas filas, mismo orden y mismo
// reacomodo que la web (web/src/app/derivadas/derivatives-table.tsx): las
// filas y `acomodar` viven en dx-core (juego/tabla-derivadas.ts).
//
// Las 32 fórmulas son fijas, así que se pueden convertir antes de que la
// tabla se abra (`precalentarTablaDeDerivadas`) y abrirla no cuesta nada más
// que montar vistas.

import { useMemo, useState } from "react"
import { FlatList, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
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
})
