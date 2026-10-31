// El teclado del juego, nativo. Mismas teclas, mismo orden y misma rampa que el
// teclado del teléfono en la web (web/src/app/derivadas/math-keyboard.tsx con
// `numpad`): todo eso vive en dx-core (juego/teclado.ts) y acá queda el dibujo.
//
// Al tocar una tecla no se hace nada más que avisar (`onKey`) y vibrar: el
// insert lo hace quien tiene el campo (`MathFieldHandle.press`). La tecla
// responde en `onPressIn` y no al soltar, que es lo que lo hace sentir
// inmediato.

import { memo, useMemo, type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import Animated, {
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import {
  DYNAMIC_ROW_REM,
  KB_ROW_TELEFONO_REM,
  NUMPAD,
  PAD_COLS,
  PAD_DYNAMIC_SLOTS,
  PAD_FIXED,
  PAD_ROWS,
  RAMPA_GAP_REM,
  TONO_HEX,
  altoDeRampaRem,
  columnasDeRampaDibujada,
  filasDelPad,
  inventarioDinamico,
  rampaDibujada,
  type EntradaDeTecla,
  type IconoDeTecla,
  type Key,
  type Tamano,
} from "@intervalo/dx-core/juego/teclado"

const REM = 16
const GAP = RAMPA_GAP_REM * REM
const ROW = KB_ROW_TELEFONO_REM * REM
const ALTO_BLOQUE = PAD_ROWS * ROW + (PAD_ROWS - 1) * GAP

// Los cuerpos del teléfono en la web (math-keyboard.tsx :: SIZES, sin `md:`).
const CUERPO: Record<Tamano, number> = {
  dyn: 0.95 * REM,
  sm: 1.05 * REM,
  md: 1.25 * REM,
  lg: 1.5 * REM,
  num: 1.25 * REM,
}

const RESORTE = { stiffness: 420, damping: 26 }

/** Lo que recibe `renderEtiqueta`. `ancha` es la forma larga (`sen(□)`), la de
 *  la fila ancha del inventario. */
export type EtiquetaDeTecla = { key: Key; ancha: boolean; color: string; fontSize: number }

export type MathKeyboardProps = {
  // Inventario dinámico completo del jugador, en orden canónico (`exercise.keys`).
  keys?: string[]
  // Las que se desbloquearon con ESTE ejercicio: las únicas que nacen animadas.
  newKeys?: string[]
  // Las fijas desbloqueadas (`exercise.fijas`): la rampa.
  fijas?: string[]
  newFijas?: string[]
  onKey: (key: Key) => void
  // Para dibujar el glifo en LaTeX (KaTeX) en vez del texto plano. Sin esto la
  // tecla muestra `key.texto`, o su forma larga si `ancha`.
  renderEtiqueta?: (etiqueta: EtiquetaDeTecla) => ReactNode
  // El ejercicio se cerró: el teclado sigue ahí (sacarlo movería todo) pero
  // apagado, como el `opacity-45` de la web.
  apagado?: boolean
  // Suma el inset de abajo al aire de abajo. Apagalo si debajo va otra cosa
  // (el pie de la rampa) que ya lo respeta.
  areaSegura?: boolean
  style?: StyleProp<ViewStyle>
}

export function MathKeyboard({
  keys = [],
  newKeys = [],
  fijas = [],
  newFijas = [],
  onKey,
  renderEtiqueta,
  apagado = false,
  areaSegura = true,
  style,
}: MathKeyboardProps) {
  const insets = useSafeAreaInsets()
  const dynamic = useMemo(
    () => inventarioDinamico({ keys, newKeys, numpad: true }),
    [keys, newKeys],
  )
  const filasRampa = useMemo(
    () => rampaDibujada(fijas, dynamic, newFijas),
    [fijas, dynamic, newFijas],
  )

  const tecla = ({
    entrada,
    llave,
    celda,
    estilo,
    ancha = false,
  }: {
    entrada: EntradaDeTecla
    llave: string
    celda?: StyleProp<ViewStyle>
    estilo?: StyleProp<ViewStyle>
    ancha?: boolean
  }) => (
    <Tecla
      key={llave}
      entrada={entrada}
      ancha={ancha}
      celda={celda}
      estilo={estilo}
      onKey={onKey}
      renderEtiqueta={renderEtiqueta}
    />
  )

  let cuerpo: ReactNode
  if (filasRampa) {
    // Empaquetado: filas centradas y parejas, todas las teclas del mismo ancho.
    // El hueco va como relleno de cada celda (y un margen negativo en la fila)
    // para que el ancho salga en porcentaje sin medir el canal.
    const cols = columnasDeRampaDibujada(filasRampa)
    const alto = altoDeRampaRem(filasRampa.length) * REM
    cuerpo = (
      <View style={{ gap: GAP }}>
        {filasRampa.map((fila, f) => (
          <View key={`rampa-${f}`} style={[styles.filaCentrada, { marginHorizontal: -GAP / 2 }]}>
            {fila.map((entrada) =>
              tecla({
                entrada,
                llave: `${entrada.id}-${entrada.key.texto}`,
                celda: { width: `${100 / cols}%`, paddingHorizontal: GAP / 2 },
                estilo: { height: alto },
              }),
            )}
          </View>
        ))}
      </View>
    )
  } else {
    const padDynamic = dynamic.slice(0, PAD_DYNAMIC_SLOTS)
    const wideDynamic = dynamic.slice(PAD_DYNAMIC_SLOTS)
    const { dinamicas: padDinFilas, altoDeFija } = filasDelPad({
      dinamicasEnElPad: padDynamic.length,
    })
    const padFilas: { entradas: EntradaDeTecla[]; peso: number; fija: boolean }[] = [
      ...Array.from({ length: padDinFilas }, (_, i) => ({
        entradas: padDynamic
          .slice(i * PAD_COLS, (i + 1) * PAD_COLS)
          .map((e) => ({ ...e, key: { ...e.key, size: "dyn" as const } })),
        peso: 1,
        fija: false,
      })),
      ...[0, 1].map((i) => ({
        entradas: PAD_FIXED.slice(i * PAD_COLS, (i + 1) * PAD_COLS).map((key) => ({
          id: "",
          key,
          nueva: false,
        })),
        peso: altoDeFija,
        fija: true,
      })),
    ]
    cuerpo = (
      <View style={{ gap: GAP }}>
        {wideDynamic.length > 0 ? (
          <View style={[styles.filaCentrada, { gap: GAP, flexWrap: "wrap" }]}>
            {wideDynamic.map((entrada) =>
              tecla({
                entrada: {
                  ...entrada,
                  key: { ...entrada.key, size: entrada.key.texWide ? "dyn" : "sm" },
                },
                llave: `dyn-${entrada.id}`,
                estilo: { height: DYNAMIC_ROW_REM * REM, minWidth: 2.6 * REM, paddingHorizontal: 12 },
                ancha: true,
              }),
            )}
          </View>
        ) : null}
        <View style={{ flexDirection: "row", gap: GAP, height: ALTO_BLOQUE }}>
          {/* El numérico va PRIMERO, a la izquierda, donde lo tiene la calculadora. */}
          <View style={{ flex: 3, gap: GAP }}>
            {[0, 1, 2, 3].map((f) => (
              <View key={`num-${f}`} style={{ flex: 1, flexDirection: "row", gap: GAP }}>
                {NUMPAD.slice(f * 3, f * 3 + 3).map((key, i) =>
                  tecla({
                    entrada: { id: "", key, nueva: false },
                    llave: `num-${f}-${i}`,
                    celda: { flex: 1 },
                    estilo: { flex: 1 },
                  }),
                )}
              </View>
            ))}
          </View>
          {/* El pad: el inventario arriba y las fijas abajo. Las filas se
              reparten el alto del numérico (ver `filasDelPad`). */}
          <View style={{ flex: 4, gap: GAP }}>
            {padFilas.map((fila, f) => (
              <View key={`pad-${f}`} style={{ flex: fila.peso, flexDirection: "row", gap: GAP }}>
                {Array.from({ length: PAD_COLS }, (_, i) => {
                  const entrada = fila.entradas[i]
                  if (!entrada) return <View key={`hueco-${i}`} style={{ flex: 1 }} />
                  return tecla({
                    entrada,
                    llave: fila.fija ? `fija-${f}-${i}` : `dyn-${entrada.id}`,
                    celda: { flex: 1 },
                    estilo: { flex: 1 },
                  })
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View
      pointerEvents={apagado ? "none" : "auto"}
      style={[
        styles.teclado,
        { paddingBottom: 32 + (areaSegura ? insets.bottom : 0), opacity: apagado ? 0.45 : 1 },
        style,
      ]}
    >
      {cuerpo}
    </View>
  )
}

const Tecla = memo(function Tecla({
  entrada,
  ancha,
  celda,
  estilo,
  onKey,
  renderEtiqueta,
}: {
  entrada: EntradaDeTecla
  ancha: boolean
  celda?: StyleProp<ViewStyle>
  estilo?: StyleProp<ViewStyle>
  onKey: (key: Key) => void
  renderEtiqueta?: (etiqueta: EtiquetaDeTecla) => ReactNode
}) {
  const { key, nueva } = entrada
  const apretada = useSharedValue(0)
  const animado = useAnimatedStyle(() => ({
    backgroundColor: apretada.value ? TEMA.accent : TEMA.background,
    transform: [{ scale: withTiming(apretada.value ? 0.94 : 1, { duration: 60 }) }],
  }))
  const color = TONO_HEX[key.tone ?? "plain"]
  const fontSize = CUERPO[key.size ?? "md"]

  return (
    <Animated.View
      entering={nueva ? nacer : undefined}
      layout={LinearTransition.springify().stiffness(RESORTE.stiffness).damping(RESORTE.damping)}
      style={celda}
    >
    <Animated.View style={[styles.tecla, estilo, animado]}>
      <Pressable
        style={styles.toque}
        onPressIn={() => {
          apretada.value = 1
          onKey(key)
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }}
        onPressOut={() => {
          apretada.value = 0
        }}
        accessibilityRole="button"
        accessibilityLabel={key.texto}
      >
        {key.icono ? (
          <Icono icono={key.icono} color={color} />
        ) : renderEtiqueta ? (
          renderEtiqueta({ key, ancha, color, fontSize })
        ) : (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[
              styles.glifo,
              { color, fontSize },
              /^[a-z]$/.test(key.texto) && styles.letra,
            ]}
          >
            {ancha && key.texWide ? textoAncho(key) : key.texto}
          </Text>
        )}
      </Pressable>
    </Animated.View>
    </Animated.View>
  )
})

// TODO(integración): con `renderEtiqueta` + el LaTeX nativo esto se va; es la
// forma larga (`sen(□)`) en texto plano.
function textoAncho(key: Key) {
  return `${key.texto}(□)`
}

function nacer() {
  "worklet"
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.4 }] },
    animations: {
      opacity: withSpring(1, RESORTE),
      transform: [{ scale: withSpring(1, RESORTE) }],
    },
  }
}

// Los íconos de lucide que usa la web (ArrowLeft, ArrowRight, Delete), a 19 px.
const TRAZOS: Record<IconoDeTecla, string[]> = {
  izquierda: ["m12 19-7-7 7-7", "M19 12H5"],
  derecha: ["M5 12h14", "m12 5 7 7-7 7"],
  borrar: [
    "M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z",
    "m12 9 6 6",
    "m18 9-6 6",
  ],
}

function Icono({ icono, color }: { icono: IconoDeTecla; color: string }) {
  return (
    <Svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {TRAZOS[icono].map((d) => (
        <Path key={d} d={d} />
      ))}
    </Svg>
  )
}

const styles = StyleSheet.create({
  teclado: { paddingHorizontal: 16, paddingTop: 16 },
  filaCentrada: { flexDirection: "row", justifyContent: "center" },
  tecla: { borderRadius: 6, overflow: "hidden" },
  toque: { flex: 1, alignItems: "center", justifyContent: "center" },
  glifo: { fontWeight: "500", includeFontPadding: false },
  letra: { fontFamily: "Times New Roman", fontStyle: "italic", fontWeight: "400" },
})
