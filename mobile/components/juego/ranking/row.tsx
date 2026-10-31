// La fila de la lista individual y el número del puesto en vuelo
// (web/src/app/derivadas/game-ranking.tsx :: Row, RankEnVuelo).
//
// En la web cada fila es un `motion.li layout` con su propia transición. En
// `Animated.FlatList` el layout animado es UNO para toda la lista
// (`itemLayoutAnimation`, que se pone en la celda que envuelve a la fila), así
// que la transición sale de la fila y la arma `transicionDeFila` para la lista.

import { memo, useEffect, useState } from "react"
import { StyleSheet, Text, View, type HostInstance } from "react-native"
import { LinearTransition } from "react-native-reanimated"
import Svg, { Path } from "react-native-svg"
import { CAREER_EMOJI } from "@intervalo/dx-core/career-emoji"
import { filaConEmpujeRGBA, levelColor } from "@intervalo/dx-core/juego/game-colors"
import { fmtMultiplier } from "@intervalo/dx-core/juego/ranking-formato"
import type { RankingSort } from "@intervalo/dx-core/juego/ranking-reglas"
import { curvaDelSalto } from "@intervalo/dx-core/juego/salto-ranking"
import type { GameLeaderboardEntry } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { UniTag } from "../university-tag"
import { XpDots } from "../xp-dots"
import { EloDeJugador, XpDeJugador } from "./celdas"
import { ESTILOS_FILA } from "./skeleton"

// `text-green-400` / `text-orange-400`.
const VERDE_400 = "#4ade80"
const NARANJA_400 = "#fb923c"

// El resorte del reacomodo de siempre: el que corre cuando el mundo se mueve
// solo, sin salto de por medio. Constante de módulo por lo mismo que en la web:
// una identidad nueva por render le cambia la transición a todas las celdas.
const RESORTE_AMBIENTE = LinearTransition.springify().stiffness(320).damping(32)

// Cuántas muestras de la curva viajan al hilo de UI. La curva es un trapecio
// de velocidad (salto-ranking.ts): suave, y con 65 puntos el error de
// interpolar en línea recta queda por debajo de una centésima de píxel por
// fila.
const MUESTRAS = 65

const curvasEnUI = new Map<(t: number) => number, (t: number) => number>()

/** La misma curva, como worklet. Las curvas de salto-ranking.ts son funciones
 *  comunes —las comparte la web— y el hilo de UI no puede llamarlas; lo que se
 *  le pasa es la curva MUESTREADA acá, en JS, e interpolada allá. La identidad
 *  es estable por curva, como la de `tweenDelSalto` en la web. */
export function curvaEnUI(curva: (t: number) => number): (t: number) => number {
  let w = curvasEnUI.get(curva)
  if (w === undefined) {
    const tabla = Array.from({ length: MUESTRAS }, (_, i) => curva(i / (MUESTRAS - 1)))
    w = (t: number): number => {
      "worklet"
      if (t <= 0) return tabla[0]
      if (t >= 1) return tabla[MUESTRAS - 1]
      const x = t * (MUESTRAS - 1)
      const i = Math.floor(x)
      return tabla[i] + (tabla[i + 1] - tabla[i]) * (x - i)
    }
    curvasEnUI.set(curva, w)
  }
  return w
}

// Un solo objeto de transición por curva y duración, cacheado: es prop de la
// lista y va en `extraData`, así que una identidad nueva por render rehace
// todas las celdas.
const tweens = new Map<(t: number) => number, Map<number, ReturnType<typeof LinearTransition.duration>>>()
function tweenDelSalto(ms: number, curva: (t: number) => number) {
  let porMs = tweens.get(curva)
  if (porMs === undefined) {
    porMs = new Map()
    tweens.set(curva, porMs)
  }
  let t = porMs.get(ms)
  if (t === undefined) {
    if (porMs.size > 64) porMs.clear()
    t = LinearTransition.duration(ms).easing(curvaEnUI(curva))
    porMs.set(ms, t)
  }
  return t
}

/** La transición de las filas para el tramo que se está viendo. `undefined` es
 *  "sin animación": movimiento reducido, el fotograma agachado del salto, o un
 *  commit que no es un reacomodo (ver `animarLayout` en individual-ranking). */
export function transicionDeFila({
  quieto,
  agachado,
  saltoMs,
  curva,
}: {
  quieto: boolean
  agachado: boolean
  saltoMs: number
  curva: (t: number) => number
}) {
  if (quieto || agachado) return undefined
  if (saltoMs === 0) return RESORTE_AMBIENTE
  return tweenDelSalto(saltoMs, curva)
}

/** El número del puesto mientras la fila viaja: cuenta de `desde` a `hasta` con
 *  la MISMA curva y la misma duración que el salto. Estado propio y no un número
 *  que baje desde la lista por lo mismo que en la web: contarlo desde arriba
 *  rehace todas las filas en cada fotograma. */
export function RankEnVuelo({
  desde,
  hasta,
  ms,
  curva,
}: {
  desde: number
  hasta: number
  ms: number
  curva: (t: number) => number
}) {
  const [n, setN] = useState(desde)
  useEffect(() => {
    let raf = 0
    const inicio = performance.now()
    const tick = (ahora: number) => {
      const t = ms <= 0 ? 1 : Math.min(1, (ahora - inicio) / ms)
      setN(Math.round(desde + (hasta - desde) * curva(t)))
      raf = t < 1 ? requestAnimationFrame(tick) : 0
    }
    raf = requestAnimationFrame(tick)
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [desde, hasta, ms, curva])
  return <>{n}</>
}

function Flecha({ sube, color }: { sube: boolean; color: string }) {
  return (
    <Svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d={sube ? "m5 12 7-7 7 7M12 19V5" : "M12 5v14M19 12l-7 7-7-7"} />
    </Svg>
  )
}

// `memo` por lo mismo que en la web: el festejo sube el contador hasta catorce
// veces en dos segundos y cada subida rehace la lista; con esto solo se rehace
// la fila propia, que es la única cuyas props cambian.
export const Row = memo(function Row({
  entry,
  shownRank,
  rankDesde = null,
  xp,
  delta,
  saltoMs = 0,
  curva = curvaDelSalto,
  sort,
  boostMultiplier,
  xpColor = null,
  attachXpTarget,
  previewMultiplier = null,
}: {
  entry: GameLeaderboardEntry
  shownRank: number
  // De qué puesto viene la fila propia mientras dura el viaje: con esto el
  // número cuenta en vez de saltar. `null` en todas las demás.
  rankDesde?: number | null
  xp: number
  // Puestos que ganó (+) o perdió (−) en los últimos minutos. 0 = sin flecha.
  delta: number
  // Cuánto dura el tramo del salto en curso, y con qué curva: los usa el
  // número en vuelo.
  saltoMs?: number
  curva?: (t: number) => number
  sort: RankingSort
  boostMultiplier: number | null
  xpColor?: string | null
  attachXpTarget?: (node: HostInstance | null) => void
  // La diapo del café previsualiza un multiplicador: gana por encima de `sort`.
  previewMultiplier?: { value: number; color: string } | null
}) {
  const mine = entry.is_current_player
  const emoji = entry.career ? CAREER_EMOJI[entry.career] : undefined
  const empuje = previewMultiplier ? previewMultiplier.value : boostMultiplier
  return (
    <View
      style={[
        ESTILOS_FILA.fila,
        mine && ESTILOS_FILA.propia,
        empuje !== null && filaConEmpujeRGBA(empuje),
      ]}
    >
      {/* `w-8` y no `w-4`: con tres cifras el número no entraba. */}
      <Text style={[ESTILOS_FILA.puesto, estilos.puesto]}>
        {rankDesde === null ? (
          shownRank
        ) : (
          <RankEnVuelo desde={rankDesde} hasta={shownRank} ms={saltoMs} curva={curva} />
        )}
      </Text>
      <View style={estilos.nombre}>
        <Text style={[estilos.alias, { color: levelColor(entry.level) }]} numberOfLines={1}>
          {entry.alias}
        </Text>
        {emoji && <Text style={estilos.emoji}>{emoji}</Text>}
      </View>
      {delta !== 0 && (
        <View
          style={estilos.delta}
          accessible
          accessibilityLabel={`${delta > 0 ? "subió" : "bajó"} ${Math.abs(delta)} puestos hoy`}
        >
          <Flecha sube={delta > 0} color={delta > 0 ? VERDE_400 : NARANJA_400} />
          <Text style={[estilos.deltaNumero, { color: delta > 0 ? VERDE_400 : NARANJA_400 }]}>
            {Math.abs(delta)}
          </Text>
        </View>
      )}
      {entry.university && (
        <View style={estilos.uni}>
          <UniTag university={entry.university} />
        </View>
      )}
      {previewMultiplier ? (
        <View style={estilos.preview}>
          <Text style={[estilos.previewNumero, { color: previewMultiplier.color }]}>
            {fmtMultiplier(previewMultiplier.value)}
          </Text>
          <XpDots size={12} color={previewMultiplier.color} />
        </View>
      ) : sort === "elo" ? (
        <EloDeJugador elo={entry.elo} ranked={entry.elo_ranked} alias={entry.alias} />
      ) : (
        <XpDeJugador xp={xp} color={xpColor} attachXpTarget={attachXpTarget} />
      )}
    </View>
  )
})

const estilos = StyleSheet.create({
  puesto: { width: 32 },
  nombre: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  alias: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  emoji: { flexShrink: 0, fontSize: 14, lineHeight: 16 },
  delta: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 2 },
  deltaNumero: { fontSize: 12, lineHeight: 16, fontWeight: "500", fontVariant: ["tabular-nums"] },
  uni: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  preview: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  previewNumero: { fontSize: 14, lineHeight: 20, fontWeight: "600", fontVariant: ["tabular-nums"] },
})
