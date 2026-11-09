// `Text` y `TextInput` con la tipografía de la app (DM Sans, la de la web). En
// React Native no hay una fuente global y, con una fuente custom, `fontWeight`
// no hace nada: cada peso es un archivo distinto. Estos envoltorios resuelven
// las dos cosas en un solo lugar:
//
//   1. Sin `fontFamily`, usan DM Sans. Un Text ANIDADO no la pone: hereda la
//      del padre, como siempre (si no, un hijo sin estilo pisaría la
//      seminegrita o la mono del Text de afuera).
//   2. Un `fontWeight` sin `fontFamily` se traduce a la DM Sans de ese peso. Así
//      el código que ya escribe `fontWeight: "600"` sigue funcionando, y un
//      `fontFamily` explícito (el logo, la mono, Times del teclado) manda.
//
// Límite: el Text de adentro de un <View> que está adentro de otro Text (los
// chips en línea de texto-con-huecos) cuenta como anidado aunque no herede
// nada. Esos casos declaran su `fontFamily` (UniTag usa la de las tags).

import { createContext, useContext, type ComponentProps } from "react"
import { StyleSheet, Text as RNText, TextInput as RNTextInput, type TextStyle } from "react-native"
import { FUENTE } from "@/lib/tipografia"

const DentroDeText = createContext(false)

const POR_PESO: Record<string, string> = {
  normal: FUENTE.normal,
  "400": FUENTE.normal,
  "500": FUENTE.medio,
  "600": FUENTE.seminegrita,
  "700": FUENTE.negrita,
  bold: FUENTE.negrita,
}

const BASE = { fontFamily: FUENTE.normal } as const

// El tamaño de letra del sistema (Dynamic Type de iOS) NO agranda el texto de la
// app. Todo está portado píxel por píxel de la web, que no escala: las filas del
// ranking, las teclas y el botón principal tienen alto fijo y el logo es texto,
// así que con la letra grande del iPhone el texto se salía de su caja, el alias
// se cortaba y el logo ya no coincidía con la captura del splash. Se puede
// pisar en un Text puntual con `maxFontSizeMultiplier`.
const SIN_ESCALA = 1

/** El estilo con la fuente resuelta. Sin nada que resolver devuelve el mismo
 *  `style` (misma referencia), para no invalidar a los hijos memoizados. */
function conFuente(style: ComponentProps<typeof RNText>["style"], anidado: boolean) {
  if (style == null) return anidado ? undefined : BASE
  const plano = StyleSheet.flatten(style) as TextStyle | undefined
  if (plano?.fontFamily) return style
  const familia = plano?.fontWeight !== undefined ? POR_PESO[String(plano.fontWeight)] : undefined
  if (familia) return [style, { fontFamily: familia, fontWeight: undefined }]
  return anidado ? style : [BASE, style]
}

export function Text({ style, children, ...resto }: ComponentProps<typeof RNText>) {
  const anidado = useContext(DentroDeText)
  return (
    <RNText maxFontSizeMultiplier={SIN_ESCALA} {...resto} style={conFuente(style, anidado)}>
      <DentroDeText.Provider value={true}>{children}</DentroDeText.Provider>
    </RNText>
  )
}

export function TextInput({ style, ...resto }: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput maxFontSizeMultiplier={SIN_ESCALA} {...resto} style={conFuente(style, false)} />
}
