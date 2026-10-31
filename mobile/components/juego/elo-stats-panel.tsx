// La diapo de estadísticas (web/src/app/derivadas/mobile-flow.tsx, diapo
// `stats`): las tiles con los números propios, la campana del Elo y la tabla de
// derivadas con velocidad y efectividad, apiladas en una sola pantalla que
// scrollea entera. El panel es el de la web (elo-stats-panel.tsx ::
// EloStatsPanel) y las cuentas viven en dx-core (estadisticas-formato.ts).
//
// Sin la tile de «XP extra por cafecitos» ni el botón de cafecito de la
// cabecera: el cafecito no está en la app.

import { useEffect, useState, type ReactNode } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"
import Svg, { Path } from "react-native-svg"
import { TEMA, levelColor } from "@intervalo/dx-core/juego/game-colors"
import { fmtCount } from "@intervalo/dx-core/juego/ranking-formato"
import {
  HIST_ALTO,
  HIST_ESQUELETO,
  altoDeBarra,
  etiquetaDelEje,
  maxCount,
  pasoEtiqueta,
  rotuloDeBarra,
} from "@intervalo/dx-core/juego/estadisticas-formato"
import { useGameStats, type GameStats } from "@intervalo/dx-core/juego/UseGameStats"
import type { GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import { BotonCta } from "./boton-cta"
import { DerivativesStatsTable, HojaDeCartel, type Cartel } from "./derivatives-table"
import { XpDots } from "./xp-dots"

// El verde de WhatsApp, el mismo de reclutas en la web (cafecito-cta.tsx :: VERDE).
const VERDE = "#25D366"
const VERDE_BORDE = "rgba(37,211,102,0.35)"

const TENUE = "rgba(246,248,252,0.6)"
const BORDE = "rgba(255,255,255,0.10)"
const FONDO_TILE = "rgba(255,255,255,0.05)"

// `animate-pulse`: todo late junto, desde el contenedor.
function useLatido() {
  const opacidad = useSharedValue(1)
  useEffect(() => {
    opacidad.value = withRepeat(withTiming(0.5, { duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1) }), -1, true)
  }, [opacidad])
  return useAnimatedStyle(() => ({ opacity: opacidad.value }))
}

function EloHistogram({
  stats,
  isLoading,
  rating,
  nivel,
}: {
  stats: GameStats | undefined
  isLoading: boolean
  rating: number
  nivel: number
}) {
  const latido = useLatido()

  // Esqueleto con la FORMA de barras: así no hay salto cuando el pedido resuelve.
  if (isLoading) {
    return (
      <View style={styles.histo}>
        <Text style={styles.tituloSeccion}>Elo</Text>
        <Animated.View
          style={[styles.barras, { height: HIST_ALTO, paddingBottom: 8 }, latido]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {HIST_ESQUELETO.map((alto, i) => (
            <View key={i} style={[styles.barra, { height: `${alto}%`, backgroundColor: "rgba(255,255,255,0.10)" }]} />
          ))}
        </Animated.View>
      </View>
    )
  }

  // Con pocos jugadores calificados una campana no es un gráfico (game/stats.py
  // :: MIN_HISTOGRAM_PLAYERS): se muestra el propio rating y nada más.
  if (!stats || !stats.enough_for_histogram) {
    return (
      <View style={styles.histo}>
        <Text style={styles.tituloSeccion}>Elo</Text>
        <View style={styles.sinCampana}>
          <Text style={styles.ratingSolo}>{fmtCount(rating)}</Text>
          <Text style={styles.sinCampanaTexto}>
            Todavía hay pocos jugadores con diez o más derivadas resueltas para armar la comparación
            {stats ? ` (${stats.n_rated_players} hasta ahora)` : ""}. Cuando haya más, acá vas a ver dónde
            estás parado.
          </Text>
        </View>
      </View>
    )
  }

  const max = maxCount(stats.histogram)
  const paso = pasoEtiqueta(stats.histogram)
  const tinta = { color: levelColor(nivel), fontWeight: "600" } as const

  return (
    <View style={styles.histo}>
      <Text style={styles.tituloSeccion}>Elo</Text>
      <View style={[styles.barras, { height: HIST_ALTO }]}>
        {stats.histogram.map((bucket, i) => (
          <View
            key={bucket.from_rating}
            accessible
            accessibilityLabel={rotuloDeBarra({ bucket, fmt: fmtCount })}
            style={[
              styles.barra,
              {
                height: `${altoDeBarra({ count: bucket.count, max })}%`,
                backgroundColor: i === stats.player_bucket_index ? TEMA.primary : "rgba(255,255,255,0.15)",
              },
            ]}
          />
        ))}
      </View>
      {/* Un slot por bucket, con el mismo `gap` que las barras, para que cada
          etiqueta caiga debajo de SU barra. */}
      <View style={styles.eje}>
        {stats.histogram.map((bucket, i) => {
          const etiqueta = etiquetaDelEje({ histogram: stats.histogram, i, paso })
          return (
            <View key={bucket.from_rating} style={styles.slotEje}>
              {etiqueta && (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.etiquetaEje,
                    etiqueta.alinear === "left" && { left: 0 },
                    etiqueta.alinear === "right" && { right: 0 },
                    etiqueta.alinear === "center" && styles.etiquetaCentro,
                  ]}
                >
                  {fmtCount(etiqueta.valor)}
                </Text>
              )}
            </View>
          )
        })}
      </View>
      <Text style={styles.frase}>
        {stats.percentile !== null ? (
          <>
            Con <Text style={tinta}>{fmtCount(rating)}</Text> estás por encima del{" "}
            <Text style={styles.fuerte}>{stats.percentile}%</Text> de los {fmtCount(stats.n_rated_players)}{" "}
            jugadores calificados
          </>
        ) : (
          <>
            Tu Elo es <Text style={tinta}>{fmtCount(rating)}</Text>
          </>
        )}
      </Text>
    </View>
  )
}

function Tile({
  label,
  value,
  explicacion,
  onCartel,
  destacada,
  ancha = false,
}: {
  label: string
  value: ReactNode
  explicacion: string
  onCartel: (c: Cartel) => void
  // Borde y valor de color propio: el del canal que ya tiñe el resto del juego.
  destacada?: { borde: string; tinta: string }
  ancha?: boolean
}) {
  return (
    <Pressable
      onPress={() => onCartel({ titulo: label, cuerpo: explicacion })}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={explicacion}
      style={({ pressed }) => [
        styles.tile,
        ancha ? styles.tileAncha : styles.tileMitad,
        destacada && { borderColor: destacada.borde },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.tileValorFila}>
        <Text style={[styles.tileValor, destacada && { color: destacada.tinta }]}>{value}</Text>
        {destacada && <XpDots size={15} color={destacada.tinta} />}
      </View>
      <Text style={styles.tileRotulo} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

// Qué dice cada cartel: chequeado contra el backend, igual que en la web
// (backend/game/router.py, game/stats.py).
function GeneralTiles({
  general,
  onCartel,
}: {
  general: GameStats["general"]
  onCartel: (c: Cartel) => void
}) {
  return (
    <View style={styles.grilla}>
      <Tile
        label="Derivadas resueltas"
        value={`${fmtCount(general.exercises_correct)} 🧩`}
        explicacion="Las que terminaste bien. Los intentos son ilimitados: equivocarte no te saca la derivada de encima, y cuando sale suma igual."
        onCartel={onCartel}
      />
      <Tile
        label="Efectividad"
        value={`${general.accuracy_overall === null ? "—" : `${general.accuracy_overall}%`} 🎯`}
        explicacion="De todo lo que respondiste, cuánto salió bien. Cada intento cuenta, así que acertar de una la sube y llegar después de errar la baja. Saltear no cuenta como intento."
        onCartel={onCartel}
      />
      <Tile
        label="Racha más larga"
        value={`${fmtCount(general.best_combo)} 🔥`}
        explicacion="La mayor cantidad de derivadas que resolviste bien una atrás de la otra. Errar la corta, y saltear también; mirar la tabla o este panel no."
        onCartel={onCartel}
      />
      <Tile
        label="Mejor puesto"
        value={general.best_rank == null ? "—" : `#${fmtCount(general.best_rank)}`}
        explicacion="El puesto más alto al que llegaste en el ranking. Se queda con el mejor que hiciste, aunque después bajes."
        onCartel={onCartel}
      />
      {/* Ancha: sin la de cafecitos quedaba sola en su fila, a media pantalla. */}
      <Tile
        ancha
        label="XP generado por reclutas"
        value={fmtCount(general.xp_from_referrals)}
        explicacion="Cada persona que entra por tu link de reclutar te suma el 10% de la experiencia que gana, sin que a ella le reste nada. Es para siempre: sigue sumando cada vez que juega."
        destacada={{ borde: VERDE_BORDE, tinta: VERDE }}
        onCartel={onCartel}
      />
    </View>
  )
}

/** El hueco de las tiles mientras `/stats` viaja: misma caja, mismos renglones. */
function TilesSkeleton() {
  const latido = useLatido()
  return (
    <Animated.View
      style={[styles.grilla, latido]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={[styles.tile, i === 4 ? styles.tileAncha : styles.tileMitad]}>
          <View style={[styles.huecoValor]} />
          <View style={[styles.huecoRotulo]} />
        </View>
      ))}
    </Animated.View>
  )
}

/** Las tiles y la caja del Elo. Sin scroll propio: es un tramo de la diapo. */
export function EloStatsPanel({
  player,
  stats,
  isLoading,
  onCartel,
}: {
  player: GamePlayer | null
  stats: GameStats | undefined
  isLoading: boolean
  onCartel: (c: Cartel) => void
}) {
  // `player.elo` ya viaja sin esperar a `/stats`; se pisa apenas llega.
  const rating = stats?.player_rating ?? player?.elo ?? 1000
  const nivel = player?.level ?? 0
  return (
    <View style={styles.panel}>
      {stats ? (
        <GeneralTiles general={stats.general} onCartel={onCartel} />
      ) : isLoading ? (
        <TilesSkeleton />
      ) : null}
      <View style={styles.cajaElo}>
        <EloHistogram stats={stats} isLoading={isLoading} rating={rating} nivel={nivel} />
        {/* Mismo texto, palabra por palabra, que game-ranking.tsx :: EloDeUniversidad. */}
        <Text style={styles.explicacion}>
          El Elo mide qué tan difíciles son las derivadas que resolvés. Se ajusta con tus respuestas, sube con los
          aciertos y baja con los errores.
        </Text>
      </View>
    </View>
  )
}

function FlechaAtras() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={TEMA.mutedForeground} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m15 18-6-6 6-6" />
    </Svg>
  )
}

/** La diapo entera. Pide `/stats` al montarse (el pedido es perezoso: agrega
 *  sobre todos los jugadores calificados). La flecha y el «Volver» hacen lo
 *  mismo: `onVolver`. `derecha` es el hueco de la cabecera donde la web pone
 *  compartir. */
export function EstadisticasSlide({
  player,
  onVolver,
  derecha,
}: {
  player: GamePlayer | null
  onVolver: () => void
  derecha?: ReactNode
}) {
  const statsQuery = useGameStats(true)
  const [cartel, setCartel] = useState<Cartel | null>(null)
  return (
    <View style={styles.pantalla}>
      <View style={styles.cabecera}>
        <Pressable
          onPress={onVolver}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          style={({ pressed }) => [styles.flecha, pressed && { backgroundColor: TEMA.accent }]}
        >
          <FlechaAtras />
        </Pressable>
        <View style={styles.cabeceraDerecha}>{derecha}</View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollAdentro}
        showsVerticalScrollIndicator={false}
      >
        <EloStatsPanel
          player={player}
          stats={statsQuery.data}
          isLoading={statsQuery.isPending}
          onCartel={setCartel}
        />
        <DerivativesStatsTable rows={statsQuery.data?.rows ?? []} onCartel={setCartel} />
      </ScrollView>
      <BotonCta texto="Volver" onPress={onVolver} />
      <HojaDeCartel cartel={cartel} onClose={() => setCartel(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, gap: 12, paddingHorizontal: 16 },
  cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cabeceraDerecha: { flexDirection: "row", alignItems: "center", gap: 6 },
  flecha: { borderRadius: 6, padding: 6 },
  scroll: { flex: 1, minHeight: 0 },
  scrollAdentro: { gap: 8, paddingBottom: 4 },
  panel: { gap: 8 },
  grilla: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: {
    justifyContent: "center",
    gap: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDE,
    backgroundColor: FONDO_TILE,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  // Dos por fila descontando el `gap` de 8.
  tileMitad: { flexBasis: "47%", flexGrow: 1 },
  tileAncha: { flexBasis: "100%" },
  tileValorFila: { flexDirection: "row", alignItems: "center", gap: 4 },
  tileValor: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "600",
    color: TEMA.foreground,
    fontVariant: ["tabular-nums"],
  },
  tileRotulo: { fontSize: 12.8, lineHeight: 16, color: TENUE },
  huecoValor: { height: 18, width: 48, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.10)" },
  huecoRotulo: { height: 14, width: 96, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.07)" },
  cajaElo: {
    gap: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BORDE,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  histo: { gap: 8 },
  tituloSeccion: {
    fontSize: 12.5,
    fontWeight: "500",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: TEMA.mutedForeground,
  },
  barras: { flexDirection: "row", alignItems: "flex-end", gap: 4, paddingTop: 8 },
  barra: { flex: 1, borderRadius: 2 },
  eje: { flexDirection: "row", gap: 4, height: 14 },
  slotEje: { flex: 1 },
  // Absoluta para que un número más ancho que su slot no empuje a los vecinos.
  etiquetaEje: {
    position: "absolute",
    fontSize: 10.4,
    color: "rgba(164,179,198,0.7)",
    fontVariant: ["tabular-nums"],
  },
  etiquetaCentro: { left: -20, right: -20, textAlign: "center" },
  frase: { textAlign: "center", fontSize: 14, lineHeight: 20, color: TEMA.mutedForeground },
  fuerte: { fontWeight: "600", color: TEMA.foreground },
  sinCampana: { alignItems: "center", gap: 8, paddingVertical: 8 },
  ratingSolo: { fontSize: 24, fontWeight: "700", color: TEMA.foreground, fontVariant: ["tabular-nums"] },
  sinCampanaTexto: { textAlign: "center", fontSize: 12, lineHeight: 19.5, color: TEMA.mutedForeground },
  explicacion: { fontSize: 14, lineHeight: 22.75, color: TEMA.mutedForeground },
})
