// Fórmulas en la app: MathJax → SVG (ver mathjax.ts) dibujado con
// react-native-svg. Sin WebView: una fórmula es una vista nativa más y puede
// ir adentro de un <Text>, alineada a la línea de base del texto de al lado.

import { memo, type ReactNode } from "react"
import { Platform, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native"
import { SvgAst } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { parseMathText, type MathSegment } from "@intervalo/dx-core/latex/math-text"
import { texASvg } from "./mathjax"

// Cuánto más grande que el texto de al lado se dibuja la fórmula. Es lo que
// hace la web: KaTeX dibuja a 1.21em y math-text.tsx le suma un 5%
// (`[&_.katex]:text-[1.05em]`).
export const ESCALA_MATE = 1.21 * 1.05

const TAMANO_POR_DEFECTO = 16

type LatexProps = {
  tex: string
  // `\displaystyle`: fracciones a tamaño completo, límites arriba y abajo.
  display?: boolean
  // El cuerpo del texto que acompaña; la fórmula sale a ESCALA_MATE de esto.
  size?: number
  color?: string
  // Va adentro de un <Text>: se baja lo que la fórmula cae debajo de la línea
  // de base, porque RN apoya el borde inferior de una vista inline sobre ella.
  inline?: boolean
  // El `lineHeight` del <Text> que la contiene, si tiene. Ver `corrimiento`.
  alturaDeRenglon?: number
  style?: StyleProp<ViewStyle>
}

/** Una fórmula sola. Con TeX inválido muestra el fuente, apagado, y nunca
 *  rompe: en dev avisa por consola (mathjax.ts). */
export const Latex = memo(function Latex({
  tex,
  display = false,
  size = TAMANO_POR_DEFECTO,
  color = TEMA.foreground,
  inline = false,
  alturaDeRenglon,
  style,
}: LatexProps) {
  const r = texASvg({ tex, display })
  if (!r.ok) {
    return (
      <Text style={[styles.crudo, { fontSize: size * 0.9 }]} accessibilityLabel={tex}>
        {tex}
      </Text>
    )
  }
  const em = size * ESCALA_MATE
  const { ast, ancho, alto, profundidad } = r.svg
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={tex}
      style={[
        inline && { transform: [{ translateY: profundidad * em - corrimiento({ size, alturaDeRenglon }) }] },
        style,
      ]}
    >
      <SvgAst ast={ast} override={{ width: ancho * em, height: alto * em, color }} />
    </View>
  )
})

// El alto de renglón propio de la fuente del sistema (SF), en em: lo que mide
// `UIFont.lineHeight`.
const ALTO_NATURAL_SF = 1.193

// Con `lineHeight` en el <Text>, RN en iOS sube el texto la mitad de lo que
// sobra (`NSBaselineOffset`) para centrarlo en el renglón, pero a las vistas
// inline no: sin esto, cada fórmula quedaba esos puntos más abajo que la
// letra de al lado (medido: ~2.5 pt con 1.5 y ~3.5 pt con 1.625 a 16 pt).
function corrimiento({ size, alturaDeRenglon }: { size: number; alturaDeRenglon?: number }) {
  if (alturaDeRenglon === undefined) return 0
  return Math.max(0, (alturaDeRenglon - size * ALTO_NATURAL_SF) / 2)
}

type MathTextProps = {
  text: string
  size?: number
  color?: string
  // Alto de renglón como múltiplo de `size`.
  interlineado?: number
  style?: StyleProp<TextStyle>
}

/** Prosa con `$…$`, bloques `$$…$$` y `**negrita**`: el mismo formato y el
 *  mismo partidor que web/src/components/math-text.tsx. Los `$$…$$` son
 *  bloques aparte, centrados y con scroll horizontal si no entran. */
export function MathText({
  text,
  size = TAMANO_POR_DEFECTO,
  color = TEMA.foreground,
  interlineado = 1.5,
  style,
}: MathTextProps) {
  const bloques = agrupar(parseMathText(text))
  const estiloTexto: StyleProp<TextStyle> = [
    { fontSize: size, lineHeight: size * interlineado, color },
    style,
  ]
  if (bloques.length === 1 && bloques[0].tipo === "renglon") {
    return (
      <Text style={estiloTexto}>
        {enLinea({ segmentos: bloques[0].segmentos, size, color, alturaDeRenglon: size * interlineado })}
      </Text>
    )
  }
  return (
    <View>
      {bloques.map((b, i) =>
        b.tipo === "display" ? (
          <ScrollView
            key={i}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.display}
            contentContainerStyle={styles.displayAdentro}
          >
            <Latex tex={b.tex} display size={size} color={color} />
          </ScrollView>
        ) : (
          <Text key={i} style={estiloTexto}>
            {enLinea({ segmentos: b.segmentos, size, color, alturaDeRenglon: size * interlineado })}
          </Text>
        ),
      )}
    </View>
  )
}

type Bloque =
  | { tipo: "renglon"; segmentos: MathSegment[] }
  | { tipo: "display"; tex: string }

// Un <Text> no puede tener un bloque adentro: lo que va entre dos `$$…$$` se
// junta en un solo <Text>, y cada `$$…$$` queda suelto entre medio.
function agrupar(segmentos: MathSegment[]): Bloque[] {
  const out: Bloque[] = []
  for (const s of segmentos) {
    if (s.type === "display") {
      out.push({ tipo: "display", tex: s.value })
      continue
    }
    // El texto vacío que deja el partidor al lado de un display no es un renglón.
    if (s.type === "text" && s.value === "") continue
    const ultimo = out[out.length - 1]
    if (ultimo?.tipo === "renglon") ultimo.segmentos.push(s)
    else out.push({ tipo: "renglon", segmentos: [s] })
  }
  return out
}

function enLinea({
  segmentos,
  size,
  color,
  alturaDeRenglon,
}: {
  segmentos: MathSegment[]
  size: number
  color: string
  alturaDeRenglon: number
}): ReactNode[] {
  return segmentos.map((s, i) => {
    if (s.type === "text") return s.value
    if (s.type === "bold")
      return (
        <Text key={i} style={styles.negrita}>
          {enLinea({ segmentos: parseMathText(s.value), size, color, alturaDeRenglon })}
        </Text>
      )
    // Un `$$…$$` adentro de una negrita no puede ser bloque: va en línea, en
    // displaystyle.
    return (
      <Latex
        key={i}
        tex={s.value}
        display={s.type === "display"}
        size={size}
        color={color}
        inline
        alturaDeRenglon={alturaDeRenglon}
      />
    )
  })
}

const styles = StyleSheet.create({
  crudo: { color: TEMA.mutedForeground, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }) },
  negrita: { fontWeight: "700" },
  display: { marginVertical: 12, flexGrow: 0 },
  displayAdentro: { flexGrow: 1, justifyContent: "center" },
})
