// El cartel que explica un número del ranking (el Popover de `useCartel` en
// web/src/app/derivadas/game-ranking.tsx). En la web abre con hover y con click;
// acá no hay hover, así que abre con un toque y cierra tocando afuera.
//
// Se dibuja en un Modal transparente, pegado al disparador: abajo si entra,
// arriba si no.

import { useCallback, useRef, useState, type ReactNode } from "react"
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type HostInstance,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"

const ANCHO_MAX = 288
const MARGEN = 16
const SEPARACION = 4

type Lugar = { x: number; y: number; w: number; h: number }

export function Cartel({
  contenido,
  children,
  accessibilityLabel,
  style,
  triggerRef,
}: {
  contenido: ReactNode
  children: ReactNode
  accessibilityLabel: string
  style?: StyleProp<ViewStyle>
  // El nodo del disparador, para quien necesita apuntarle (los orbes de XP).
  triggerRef?: (node: HostInstance | null) => void
}) {
  const [lugar, setLugar] = useState<Lugar | null>(null)
  const [altoCartel, setAltoCartel] = useState<number | null>(null)
  const nodoRef = useRef<HostInstance | null>(null)
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const ref = useCallback(
    (node: HostInstance | null) => {
      nodoRef.current = node
      triggerRef?.(node)
    },
    [triggerRef],
  )

  const abrir = () => {
    nodoRef.current?.measureInWindow((x, y, w, h) => {
      setAltoCartel(null)
      setLugar({ x, y, w, h })
    })
  }
  const cerrar = () => setLugar(null)

  const ancho = Math.min(ANCHO_MAX, width - 2 * MARGEN)
  let posicion: ViewStyle | null = null
  if (lugar) {
    const left = Math.min(Math.max(lugar.x + lugar.w / 2 - ancho / 2, MARGEN), width - MARGEN - ancho)
    const abajo = lugar.y + lugar.h + SEPARACION
    const entraAbajo = altoCartel === null || abajo + altoCartel <= height - insets.bottom - MARGEN
    const top = entraAbajo ? abajo : Math.max(insets.top + MARGEN, lugar.y - SEPARACION - (altoCartel ?? 0))
    posicion = { left, top, width: ancho, opacity: altoCartel === null ? 0 : 1 }
  }

  return (
    <>
      <Pressable
        ref={ref}
        onPress={abrir}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={6}
        style={({ pressed }) => [estilos.disparador, style, pressed && { opacity: 0.8 }]}
      >
        {children}
      </Pressable>
      <Modal visible={lugar !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={cerrar}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityLabel="Cerrar" />
        {posicion && (
          <View
            style={[estilos.cartel, posicion]}
            onLayout={(e) => setAltoCartel(e.nativeEvent.layout.height)}
          >
            {contenido}
          </View>
        )}
      </Modal>
    </>
  )
}

// Los renglones del cartel: `text-xs leading-relaxed`, con el segundo párrafo
// en gris (`CartelNota`) y los números en negrita (`Fuerte`).
export function CartelTexto({ children }: { children: ReactNode }) {
  return <Text style={estilos.texto}>{children}</Text>
}

export function CartelNota({ children }: { children: ReactNode }) {
  return <Text style={[estilos.texto, estilos.nota]}>{children}</Text>
}

export function Fuerte({ children }: { children: ReactNode }) {
  return <Text style={estilos.fuerte}>{children}</Text>
}

const estilos = StyleSheet.create({
  disparador: { flexDirection: "row", flexShrink: 0, alignItems: "center", gap: 4, borderRadius: 4 },
  cartel: {
    position: "absolute",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.card,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  texto: { fontSize: 12, lineHeight: 19.5, color: TEMA.foreground },
  nota: { marginTop: 8, color: TEMA.mutedForeground },
  fuerte: { fontWeight: "600", color: TEMA.foreground },
})
