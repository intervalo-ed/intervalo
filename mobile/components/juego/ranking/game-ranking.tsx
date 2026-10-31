// El ranking del juego (web/src/app/derivadas/game-ranking.tsx :: GameRanking):
// los dos números de arriba, los selectores, el cartel de empujes y la vista
// elegida. Es también el marcador del juego: muestra el XP mientras el conteo
// del festejo lo va llenando (`liveXp`), pintado del color de ese paso.
//
// Sin la vista de reclutas (llega con las reclutas, M5) y sin `boostPreview` ni
// `viewOverride`, que solo existen para las diapos del café y de reclutas.

import { useEffect, useRef, useState } from "react"
import { StyleSheet, Text, View, type HostInstance, type StyleProp, type ViewStyle } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { ALL_SCOPE } from "@intervalo/dx-core/juego/ranking-scope"
import { fmtCount, type RankingView } from "@intervalo/dx-core/juego/ranking-formato"
import { type MemoriaDelRanking } from "@intervalo/dx-core/juego/ranking-orden"
import { SIN_SCOPE, type RankingSort } from "@intervalo/dx-core/juego/ranking-reglas"
import {
  useGameBoosts,
  useGameLeaderboardSummary,
  useGameUniversityLeaderboard,
  type Scope,
} from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { BoostBanner } from "../boost-banner"
import { CountUp } from "../count-up"
import { Metric, METRIC_VALOR, ScopeFilters } from "../leaderboard-chrome"
import { CountryRanking } from "./country-ranking"
import { IndividualRanking } from "./individual-ranking"
import { UniversityRanking } from "./university-ranking"

export type { RankingSort }

export type GameRankingProps = {
  // Puesto anterior: si viene y es peor que el actual, se anima el salto.
  climbFrom?: number | null
  // Avisa que el salto arrancó: quien manda `climbFrom` lo pone en null acá.
  onSaltoArranca?: () => void
  cortarSalto?: number
  enabled?: boolean
  liveXp?: number | null
  // El mismo conteo como delta, para la vuelta universitaria.
  liveXpDelta?: number | null
  counting?: boolean
  xpColor?: string | null
  attachXpTarget?: (node: HostInstance | null) => void
  // Cambiar este número vuelve a centrar la fila propia.
  centerKey?: number
  universityRound?: boolean
  mobile?: boolean
  leerMemoria?: () => MemoriaDelRanking
  guardarMemoria?: (m: MemoriaDelRanking) => void
  // Con qué vista y filtro arranca: el teléfono lo manda para que volver del
  // chat devuelva la lista que se estaba mirando.
  scopeInicial?: { view: RankingView; university: string }
  onScopeElegido?: (s: { view: RankingView; university: string }) => void
  myUniversity?: string | null
  sort?: RankingSort
  onViewChange?: (view: RankingView) => void
  style?: StyleProp<ViewStyle>
}

const SCOPE_INICIAL = { view: "individual" as RankingView, university: ALL_SCOPE }

const iconoProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: TEMA.primary,
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const

// `UsersIcon` de lucide.
function IconoUsuarios({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} {...iconoProps} accessibilityElementsHidden importantForAccessibility="no">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  )
}

// `LayersIcon` de lucide.
function IconoCapas({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} {...iconoProps} accessibilityElementsHidden importantForAccessibility="no">
      <Path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
      <Path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
      <Path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
    </Svg>
  )
}

// Mientras el resumen viaja va una barra y no un cero: el cero diría que no hay
// nadie jugando, que es una afirmación, y falsa.
function HuecoMetrica() {
  return (
    <View style={styles.hueco}>
      <View style={styles.barra} />
    </View>
  )
}

const ICONO = Math.round(METRIC_VALOR.fontSize * 0.85)

export function GameRanking({
  climbFrom = null,
  onSaltoArranca,
  cortarSalto = 0,
  enabled = true,
  liveXp = null,
  liveXpDelta = null,
  counting = false,
  xpColor = null,
  attachXpTarget,
  centerKey = 0,
  universityRound = false,
  mobile = false,
  leerMemoria,
  guardarMemoria,
  scopeInicial = SCOPE_INICIAL,
  onScopeElegido,
  myUniversity = null,
  sort = "experiencia",
  onViewChange,
  style,
}: GameRankingProps) {
  // Al acertar (`centerKey` cambia) el ranking vuelve solo a donde el XP puede
  // caer: la individual —o la universitaria en la vuelta universitaria— y suelta
  // el filtro salvo que sea el propio. Derivado de la clave, no de un efecto.
  const [elegido, setElegido] = useState<{ key: number; view: RankingView; university: string }>({
    key: centerKey,
    view: scopeInicial.view,
    university: scopeInicial.university,
  })

  const acaboDeAcertar = elegido.key !== centerKey
  const propio = (valor: string, mio: string | null) => (mio !== null && valor === mio ? valor : ALL_SCOPE)

  const view: RankingView = acaboDeAcertar ? (universityRound ? "university" : "individual") : elegido.view
  const university = acaboDeAcertar ? propio(elegido.university, myUniversity) : elegido.university
  // `career` va siempre: es parte de la clave de caché del ranking.
  const scope: Scope = { university, career: ALL_SCOPE }

  const setView = (v: RankingView) => {
    setElegido({ key: centerKey, view: v, university })
    onScopeElegido?.({ view: v, university })
  }
  const setUniversity = (v: string) => {
    setElegido({ key: centerKey, view, university: v })
    onScopeElegido?.({ view, university: v })
  }

  const onViewChangeRef = useRef(onViewChange)
  useEffect(() => {
    onViewChangeRef.current = onViewChange
  })
  useEffect(() => {
    onViewChangeRef.current?.(view)
  }, [view])

  const summary = useGameLeaderboardSummary(scope, enabled)
  // El catálogo del desplegable va SIN scope: la lista es la misma para
  // cualquiera y así está en caché desde el montaje.
  const catalogo = useGameLeaderboardSummary(SIN_SCOPE, enabled)
  const boostsVigentes = useGameBoosts()
  // Se pide siempre, para que la vuelta universitaria no caiga sobre un esqueleto.
  useGameUniversityLeaderboard(scope, enabled)

  return (
    <View style={[styles.raiz, style]}>
      <View style={styles.cabecera}>
        <View style={styles.metricas}>
          <View style={styles.metrica}>
            <Metric
              label="Estudiantes"
              value={
                <>
                  {summary.isPending ? (
                    <HuecoMetrica />
                  ) : (
                    <CountUp value={summary.data?.players ?? 0} format={fmtCount} style={METRIC_VALOR} />
                  )}
                  <IconoUsuarios size={ICONO} />
                </>
              }
            />
          </View>
          <View style={styles.metrica}>
            {/* Por Elo, el promedio con "ELO" pegado al número, como en cada fila. */}
            <Metric
              label={sort === "elo" ? "Promedio" : "Derivadas"}
              value={
                sort === "elo" ? (
                  <View style={styles.conElo}>
                    {summary.isPending ? (
                      <HuecoMetrica />
                    ) : summary.data?.elo_avg == null ? (
                      // El guion es un dato: todavía no hay partidas para promediar.
                      <Text style={[METRIC_VALOR, styles.tenue]}>—</Text>
                    ) : (
                      <CountUp value={summary.data.elo_avg} format={fmtCount} style={METRIC_VALOR} />
                    )}
                    <Text style={styles.elo}>ELO</Text>
                  </View>
                ) : (
                  <>
                    {summary.isPending ? (
                      <HuecoMetrica />
                    ) : (
                      <CountUp value={summary.data?.exercises ?? 0} format={fmtCount} style={METRIC_VALOR} />
                    )}
                    <IconoCapas size={ICONO} />
                  </>
                )
              }
            />
          </View>
        </View>
        <ScopeFilters
          view={view}
          onViewChange={setView}
          university={university}
          onUniversityChange={setUniversity}
          universities={catalogo.data?.universities ?? []}
          withCountries
          withCareer={false}
          scopeDisabled={view === "countries"}
        />
        <BoostBanner boosts={boostsVigentes} myUniversity={myUniversity} />
      </View>

      {view === "individual" ? (
        <IndividualRanking
          scope={scope}
          enabled={enabled}
          sort={sort}
          // Por Elo el festejo queda apagado: el salto y el conteo son de XP.
          climbFrom={sort === "elo" ? null : climbFrom}
          onSaltoArranca={onSaltoArranca}
          cortarSalto={cortarSalto}
          liveXp={sort === "elo" ? null : liveXp}
          counting={counting}
          xpColor={xpColor}
          attachXpTarget={sort === "elo" ? undefined : attachXpTarget}
          centerKey={centerKey}
          mobile={mobile}
          leerMemoria={leerMemoria}
          guardarMemoria={guardarMemoria}
        />
      ) : view === "countries" ? (
        <CountryRanking enabled={enabled} myUniversity={myUniversity} sort={sort} />
      ) : (
        <UniversityRanking
          scope={scope}
          enabled={enabled}
          myUniversity={myUniversity}
          sort={sort}
          liveXpDelta={sort === "elo" ? null : liveXpDelta}
          counting={counting}
          xpColor={xpColor}
          attachXpTarget={sort === "elo" ? undefined : attachXpTarget}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  raiz: { minHeight: 0, gap: 12 },
  cabecera: { flexShrink: 0, gap: 8 },
  metricas: { flexDirection: "row", gap: 8 },
  metrica: { flex: 1, minWidth: 0 },
  conElo: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  elo: { fontSize: 12.6, letterSpacing: 0.8, color: TEMA.mutedForeground },
  tenue: { color: TEMA.mutedForeground },
  hueco: { height: METRIC_VALOR.lineHeight, width: 40, justifyContent: "center" },
  barra: { height: 14, borderRadius: 4, backgroundColor: "rgba(246, 248, 252, 0.1)" },
})
