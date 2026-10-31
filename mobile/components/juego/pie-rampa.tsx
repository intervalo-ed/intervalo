// La fila de ayudas del pie del ejercicio: Tabla y Saltear, partidas por la
// mitad. Es la fila de arriba de `PieDeRampa` en la web
// (web/src/app/derivadas/pie-rampa.tsx); la de abajo —Revisar/Continuar y el
// «¿Por qué?»— la arma la pantalla del ejercicio debajo de esta.
//
// Las reglas de cuándo se ve salen de dx-core (juego/pie-de-rampa.ts): abierto
// el ejercicio se ve; cerrado, en el teléfono, la fila conserva su lugar sin
// dibujarse para que el teclado de arriba no se corra al responder.

import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import Svg, { Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { filaDeAyudas } from "@intervalo/dx-core/juego/pie-de-rampa"

export type PieRampaProps = {
  // El ejercicio ya se cerró y la pantalla lo muestra así.
  cerradoVisual: boolean
  // Cerrado, la fila reserva su alto en vez de irse. La web lo usa siempre en
  // el teléfono (mobile-flow.tsx), así que acá es el default.
  ayudasFijas?: boolean
  // Saltear se deshabilita mientras viaja su propio pedido (o el de responder).
  // No se atenúa: se apagaba y volvía en cada toque.
  skipDisabled?: boolean
  onTabla: () => void
  onSaltear: () => void
  style?: StyleProp<ViewStyle>
}

export function PieRampa({
  cerradoVisual,
  ayudasFijas = true,
  skipDisabled = false,
  onTabla,
  onSaltear,
  style,
}: PieRampaProps) {
  const fila = filaDeAyudas({ cerradoVisual, ayudasFijas })
  if (fila === "ninguna") return null
  const reservada = fila === "reservadas"
  return (
    <View
      style={[styles.fila, reservada && styles.invisible, style]}
      pointerEvents={reservada ? "none" : "auto"}
      accessibilityElementsHidden={reservada}
      importantForAccessibility={reservada ? "no-hide-descendants" : "auto"}
    >
      <BotonDeAyuda texto="Tabla" icono={TRAZOS_TABLA} onPress={onTabla} disabled={reservada} />
      <BotonDeAyuda
        texto="Saltear"
        icono={TRAZOS_SALTEAR}
        onPress={onSaltear}
        disabled={reservada || skipDisabled}
      />
    </View>
  )
}

// El texto primero y el ícono a la DERECHA: lo que se lee primero tiene que
// ser qué hace el botón.
function BotonDeAyuda({
  texto,
  icono,
  onPress,
  disabled,
}: {
  texto: string
  icono: string[]
  onPress: () => void
  disabled: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.boton,
        pressed && { opacity: 0.9, transform: [{ translateY: 2 }] },
      ]}
    >
      <Text numberOfLines={1} style={styles.texto}>
        {texto}
      </Text>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={TEMA.foreground} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {icono.map((d) => (
          <Path key={d} d={d} />
        ))}
      </Svg>
    </Pressable>
  )
}

// lucide `Table2` y `SkipForward`, los de la web.
const TRAZOS_TABLA = [
  "M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18",
]
const TRAZOS_SALTEAR = [
  "M21 4v16",
  "M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z",
]

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 8 },
  invisible: { opacity: 0 },
  boton: {
    flex: 1,
    minWidth: 0,
    // `--cta-h` de la web: 3.3rem.
    height: 52.8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.background,
  },
  texto: { color: TEMA.foreground, fontSize: 14, flexShrink: 1 },
})
