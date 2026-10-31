// Los íconos de la cabecera del juego, con los trazos de lucide que usa la web
// (Settings, Table2, BarChart3 → ChartColumn, MessageCircle; lucide-react 1.27).

import type { ReactNode } from "react"
import Svg, { Circle, Path } from "react-native-svg"

type IconoProps = { size: number; color: string }

function Trazo({ size, color, children }: IconoProps & { children: ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  )
}

export function IconoConfiguracion(props: IconoProps) {
  return (
    <Trazo {...props}>
      <Path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <Circle cx={12} cy={12} r={3} />
    </Trazo>
  )
}

export function IconoTabla(props: IconoProps) {
  return (
    <Trazo {...props}>
      <Path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </Trazo>
  )
}

export function IconoEstadisticas(props: IconoProps) {
  return (
    <Trazo {...props}>
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <Path d="M18 17V9" />
      <Path d="M13 17V5" />
      <Path d="M8 17v-3" />
    </Trazo>
  )
}

export function IconoChat(props: IconoProps) {
  return (
    <Trazo {...props}>
      <Path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
    </Trazo>
  )
}
