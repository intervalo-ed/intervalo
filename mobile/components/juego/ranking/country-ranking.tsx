// La vista "Países": las universidades sumadas por país, con la bandera
// (web/src/app/derivadas/game-ranking.tsx :: CountryRanking).
//
// Reusa las celdas de la vista de universidades: el país es, para esas celdas,
// una universidad más grande (ver `agruparPorPais`). Sin conteo del festejo ni
// empuje de cafecitos: ninguno de los dos existe a escala de país.

import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"
import Animated, { LinearTransition } from "react-native-reanimated"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { agruparPorPais } from "@intervalo/dx-core/juego/ranking-por-pais"
import { MIN_PLAYERS_RANKED, SIN_SCOPE, type RankingSort } from "@intervalo/dx-core/juego/ranking-reglas"
import { ALTO_FILA_PX } from "@intervalo/dx-core/juego/salto-ranking"
import { porExperiencia, useGameUniversityLeaderboard } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { tagDe } from "@intervalo/dx-core/university-tags"
import { Bandera } from "../university-tag"
import { EloDeUniversidad, JugadoresDe, XpDeUniversidad } from "./celdas"
import { ALTO_FILA, ESTILOS_FILA, ListSkeleton } from "./skeleton"

export function CountryRanking({
  enabled,
  myUniversity,
  sort,
}: {
  enabled: boolean
  myUniversity: string | null
  sort: RankingSort
}) {
  const { data, isPending } = useGameUniversityLeaderboard(SIN_SCOPE, enabled)
  const filas = useMemo(() => (data ? agruparPorPais(data.rows, MIN_PLAYERS_RANKED) : []), [data])
  const rows = useMemo(() => (sort === "experiencia" ? porExperiencia(filas) : filas), [filas, sort])

  if (isPending) return <ListSkeleton />
  if (filas.length === 0) {
    return <Text style={ESTILOS_FILA.vacio}>Todavía no hay ranking de países.</Text>
  }
  const miPais = myUniversity ? tagDe(myUniversity).country : undefined

  return (
    <Animated.FlatList
      data={rows}
      keyExtractor={(row) => row.pais}
      style={estilos.lista}
      contentContainerStyle={ESTILOS_FILA.lista}
      showsVerticalScrollIndicator={false}
      itemLayoutAnimation={LinearTransition}
      getItemLayout={(_, index) => ({ length: ALTO_FILA, offset: 4 + index * ALTO_FILA_PX, index })}
      renderItem={({ item: row, index }) => {
        const entra = sort === "elo" ? row.ranked : true
        return (
          <View
            style={[
              ESTILOS_FILA.fila,
              estilos.fila,
              miPais === row.pais && ESTILOS_FILA.propia,
              !entra && ESTILOS_FILA.fuera,
            ]}
          >
            <Text style={ESTILOS_FILA.puesto}>{entra ? index + 1 : "—"}</Text>
            <View style={estilos.nombre}>
              <Text style={estilos.pais} numberOfLines={1}>
                {row.university}
              </Text>
              <Bandera country={row.pais} size={22} />
            </View>
            <JugadoresDe players={row.players} />
            {sort === "experiencia" ? <XpDeUniversidad row={row} xp={row.xp} /> : <EloDeUniversidad row={row} />}
          </View>
        )
      }}
    />
  )
}

const estilos = StyleSheet.create({
  lista: { flex: 1, minHeight: 0 },
  fila: { gap: 8 },
  nombre: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  pais: { flexShrink: 1, fontSize: 14, lineHeight: 20, fontWeight: "500", color: TEMA.foreground },
})
