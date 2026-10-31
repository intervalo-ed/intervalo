// Ícono de experiencia: 3 bolitas irregulares (web/src/components/xp-dots.tsx).
// En la web toma `currentColor`; acá no hay color heredado, así que va por prop.

import Svg, { Circle } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"

export function XpDots({ size, color = TEMA.foreground }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx="8" cy="8" r="4.6" />
      <Circle cx="17" cy="13" r="3.5" />
      <Circle cx="9.5" cy="17.5" r="2.4" />
    </Svg>
  )
}
