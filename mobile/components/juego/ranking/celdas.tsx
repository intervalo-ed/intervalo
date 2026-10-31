// Las celdas del final de una fila del ranking: el número que ordena la lista
// —experiencia o Elo, de una persona o de una universidad— con el cartel que
// explica qué mide (web/src/app/derivadas/game-ranking.tsx). Los textos de los
// carteles son los de la web palabra por palabra: tienen que envejecer juntos.

import { StyleSheet, Text, View, type HostInstance } from "react-native"
import Svg, { Circle, Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { fmtCount } from "@intervalo/dx-core/juego/ranking-formato"
import { MIN_PLAYERS_RANKED, RAMP_UPDATES } from "@intervalo/dx-core/juego/ranking-reglas"
import type { GameUniversityRow } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { CountUp } from "../count-up"
import { XpDots } from "../xp-dots"
import { Cartel, CartelNota, CartelTexto, Fuerte } from "./cartel"

// `size-[0.85em]` de `text-sm`.
const ICONO_XP = 12

// El mismo texto que elo-stats-panel.tsx :: EloStatsPanel en la web.
const QUE_ES_EL_ELO =
  "El Elo mide qué tan difíciles son las derivadas que resolvés. Se ajusta con tus respuestas, sube con los aciertos y baja con los errores."

/** La experiencia de una persona. `color` pinta el número Y su ícono mientras
 *  dura el festejo; en null el número va del color de la fila y el ícono blanco. */
export function XpDeJugador({
  xp,
  color = null,
  attachXpTarget,
}: {
  xp: number
  color?: string | null
  attachXpTarget?: (node: HostInstance | null) => void
}) {
  return (
    <Cartel
      triggerRef={attachXpTarget}
      accessibilityLabel="Qué es la experiencia"
      contenido={
        <>
          <CartelTexto>
            <Fuerte>{fmtCount(xp)} de experiencia</Fuerte>. Cada derivada bien resuelta suma según qué tan
            difícil era —la más difícil paga cuatro veces lo que la más fácil— y bastante más si sale al
            primer intento.
          </CartelTexto>
          <CartelNota>
            Mide cuánto jugaste, no qué tan bien — nunca baja, y los cafecitos la multiplican. Qué tan difícil
            es lo que resolvés lo dice el Elo.
          </CartelNota>
        </>
      }
    >
      <Text style={[estilos.numero, color !== null && { color }]}>{fmtCount(xp)}</Text>
      <XpDots size={ICONO_XP} color={color ?? "#fff"} />
    </Cartel>
  )
}

/** El Elo de una persona: provisorio ("—") hasta las RAMP_UPDATES respuestas. */
export function EloDeJugador({ elo, ranked, alias }: { elo: number; ranked: boolean; alias: string }) {
  return (
    <Cartel
      accessibilityLabel={`Qué mide el Elo de ${alias}`}
      style={estilos.base}
      contenido={
        <>
          {ranked ? (
            <CartelTexto>
              <Fuerte>{fmtCount(elo)} de Elo</Fuerte>.
            </CartelTexto>
          ) : (
            <CartelTexto>
              El Elo de {alias} todavía es provisorio: se firma a las <Fuerte>{RAMP_UPDATES} respuestas</Fuerte>,
              y hasta entonces va al final de esta tabla.
            </CartelTexto>
          )}
          <CartelNota>{QUE_ES_EL_ELO}</CartelNota>
        </>
      }
    >
      {ranked ? (
        <Text style={estilos.numero}>{fmtCount(elo)}</Text>
      ) : (
        <Text style={[estilos.numero, estilos.tenue]}>—</Text>
      )}
      <Text style={estilos.elo}>ELO</Text>
    </Cartel>
  )
}

/** La experiencia de una universidad (o de un país): la SUMA de toda su gente.
 *  `xp` casi siempre es `row.xp`; en la vuelta universitaria es el número que va
 *  trepando mientras dura el conteo. */
export function XpDeUniversidad({
  row,
  xp,
  color = null,
  attachXpTarget,
}: {
  row: GameUniversityRow
  xp: number
  color?: string | null
  attachXpTarget?: (node: HostInstance | null) => void
}) {
  return (
    <Cartel
      triggerRef={attachXpTarget}
      accessibilityLabel={`Cuánta experiencia sumó ${row.university}`}
      contenido={
        <>
          <CartelTexto>
            <Fuerte>{fmtCount(row.xp)} de experiencia</Fuerte> es lo que sumaron entre todos los estudiantes
            de {row.university}.
          </CartelTexto>
          <CartelNota>
            Mide cuánto jugaron, no qué tan bien — nunca baja, y los cafecitos la multiplican. Qué tan difícil
            es lo que resuelven lo dice el Elo.
          </CartelNota>
        </>
      }
    >
      <CountUp value={xp} format={fmtCount} style={[estilos.numero, color !== null && { color }]} />
      <XpDots size={ICONO_XP} color={color ?? TEMA.foreground} />
    </Cartel>
  )
}

/** El Elo promedio de una universidad (o de un país). Sin MIN_PLAYERS_RANKED
 *  jugadores firmes no entra al promedio y muestra "—". */
export function EloDeUniversidad({ row }: { row: GameUniversityRow }) {
  return (
    <Cartel
      accessibilityLabel={`Qué mide el Elo de ${row.university}`}
      style={estilos.base}
      contenido={
        row.ranked ? (
          <>
            <CartelTexto>
              <Fuerte>{fmtCount(row.rating_avg)} de Elo</Fuerte> es el promedio de los{" "}
              <Fuerte>{row.rated_players} estudiantes</Fuerte> de {row.university} que ya jugaron lo
              suficiente.
            </CartelTexto>
            <CartelNota>{QUE_ES_EL_ELO}</CartelNota>
          </>
        ) : (
          <>
            <CartelTexto>
              {row.university} todavía no entra al promedio: hacen falta{" "}
              <Fuerte>{MIN_PLAYERS_RANKED} estudiantes</Fuerte> que hayan jugado lo suficiente y por ahora son{" "}
              <Fuerte>{row.rated_players}</Fuerte>.
            </CartelTexto>
            <CartelNota>
              Con menos, un solo jugador con suerte manda la universidad al tope y la tabla mide suerte en vez
              de nivel.
            </CartelNota>
          </>
        )
      }
    >
      {row.ranked ? (
        <CountUp value={row.rating_avg} format={fmtCount} style={estilos.numero} />
      ) : (
        <Text style={[estilos.numero, estilos.tenue]}>—</Text>
      )}
      <Text style={estilos.elo}>ELO</Text>
    </Cartel>
  )
}

/** Cuántos estudiantes tiene una universidad o un país: número + ícono. */
export function JugadoresDe({ players }: { players: number }) {
  return (
    <View style={estilos.jugadores}>
      <CountUp value={players} format={fmtCount} style={estilos.numero} />
      <IconoJugadores />
    </View>
  )
}

// `UsersIcon` de lucide, a `0.9em` de `text-sm`.
function IconoJugadores() {
  return (
    <Svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  )
}

const estilos = StyleSheet.create({
  // El Elo se alinea por la línea de base: "ELO" va a 0,7em al lado del número.
  base: { alignItems: "baseline" },
  numero: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: TEMA.foreground,
    fontVariant: ["tabular-nums"],
  },
  tenue: { color: TEMA.mutedForeground },
  // Versalita con aire: pegado, "ELO" se lee como una sola mancha.
  elo: { fontSize: 9.8, fontWeight: "400", letterSpacing: 0.5, color: TEMA.mutedForeground },
  jugadores: { flexDirection: "row", flexShrink: 0, alignItems: "center", gap: 4 },
})
