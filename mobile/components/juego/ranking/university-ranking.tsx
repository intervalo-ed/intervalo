// La vista "Universidades" del ranking
// (web/src/app/derivadas/game-ranking.tsx :: UniversityRanking).
//
// En la vuelta universitaria el conteo apunta a la fila de la universidad
// propia: el número que trepa es el de la universidad, así que llega como DELTA
// sobre el total que ya estaba en pantalla.

import { useCallback, useEffect, useMemo, useRef } from "react"
import { StyleSheet, Text, View, type FlatList, type HostInstance } from "react-native"
import Animated, { LinearTransition } from "react-native-reanimated"
import { filaConEmpujeRGBA } from "@intervalo/dx-core/juego/game-colors"
import { scrollEnReposo, type RankingSort } from "@intervalo/dx-core/juego/ranking-reglas"
import { ALTO_FILA_PX } from "@intervalo/dx-core/juego/salto-ranking"
import { useBoostMultipliers } from "@intervalo/dx-core/juego/UseBoosts"
import {
  porExperiencia,
  useGameBoosts,
  useGameUniversityLeaderboard,
  type GameUniversityRow,
  type Scope,
} from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { UniTag } from "../university-tag"
import { EloDeUniversidad, JugadoresDe, XpDeUniversidad } from "./celdas"
import { ALTO_FILA, ESTILOS_FILA, ListSkeleton } from "./skeleton"

export function UniversityRanking({
  scope,
  enabled,
  myUniversity,
  sort,
  liveXpDelta = null,
  counting = false,
  xpColor = null,
  attachXpTarget,
}: {
  scope: Scope
  enabled: boolean
  myUniversity: string | null
  sort: RankingSort
  liveXpDelta?: number | null
  counting?: boolean
  xpColor?: string | null
  attachXpTarget?: (node: HostInstance | null) => void
}) {
  const { data, isPending } = useGameUniversityLeaderboard(scope, enabled)
  const boostByUni = useBoostMultipliers(useGameBoosts())
  const listaRef = useRef<FlatList<GameUniversityRow>>(null)
  const placedRef = useRef(false)

  // El total propio ANTES del acierto que se está contando. La lista no se
  // refresca mientras el conteo corre, así que `row.xp` es el valor viejo todo
  // el festejo; el `max` de abajo evita contar dos veces cuando sí se refresca.
  const miXpPrevia = useMemo(
    () => data?.rows.find((r) => r.university === myUniversity)?.xp ?? null,
    [data, myUniversity],
  )
  const previaRef = useRef<number | null>(null)
  useEffect(() => {
    if (!counting) previaRef.current = miXpPrevia
  }, [counting, miXpPrevia])

  // Por Elo el orden ya llega del servidor; por experiencia se reordena acá con
  // la misma función que usa el cartel del cafecito.
  const rows = useMemo(
    () => (data ? (sort === "experiencia" ? porExperiencia(data.rows) : data.rows) : []),
    [data, sort],
  )

  // La universidad propia descansa a cuatro filas del techo, como la fila
  // propia de la vista individual.
  useEffect(() => {
    placedRef.current = false
  }, [scope.university, scope.career, myUniversity])

  const colocar = useCallback(() => {
    if (placedRef.current || rows.length === 0) return
    const indice = myUniversity === null ? -1 : rows.findIndex((r) => r.university === myUniversity)
    if (indice < 0) return
    listaRef.current?.scrollToOffset({ offset: scrollEnReposo({ indice, paso: ALTO_FILA_PX }), animated: false })
    placedRef.current = true
  }, [rows, myUniversity])

  useEffect(() => {
    colocar()
  })

  if (isPending) return <ListSkeleton />
  if (!data || data.rows.length === 0) {
    return <Text style={ESTILOS_FILA.vacio}>Todavía no hay ranking de universidades.</Text>
  }

  return (
    <Animated.FlatList
      ref={listaRef}
      data={rows}
      keyExtractor={(row) => row.university}
      style={estilos.lista}
      contentContainerStyle={ESTILOS_FILA.lista}
      showsVerticalScrollIndicator={false}
      itemLayoutAnimation={LinearTransition}
      getItemLayout={(_, index) => ({ length: ALTO_FILA, offset: 4 + index * ALTO_FILA_PX, index })}
      onContentSizeChange={colocar}
      extraData={[liveXpDelta, xpColor, boostByUni, attachXpTarget]}
      renderItem={({ item: row, index }) => {
        const mine = myUniversity !== null && row.university === myUniversity
        // "No cuenta todavía" es un concepto del Elo; la experiencia es una
        // suma sin piso, así que en esa pestaña compiten todas.
        const entra = sort === "elo" ? row.ranked : true
        const empuje = boostByUni.get(row.university)
        return (
          <View
            style={[
              ESTILOS_FILA.fila,
              estilos.fila,
              mine && ESTILOS_FILA.propia,
              !entra && ESTILOS_FILA.fuera,
              empuje !== undefined && filaConEmpujeRGBA(empuje),
            ]}
          >
            <Text style={ESTILOS_FILA.puesto}>{entra ? index + 1 : "—"}</Text>
            <View style={estilos.nombre}>
              <UniTag university={row.university} />
            </View>
            <JugadoresDe players={row.players} />
            {/* Lo que se muestra es por lo que se ordena. */}
            {sort === "experiencia" ? (
              <XpDeUniversidad
                row={row}
                xp={
                  mine && liveXpDelta !== null && previaRef.current !== null
                    ? Math.max(row.xp, previaRef.current + liveXpDelta)
                    : row.xp
                }
                color={mine ? xpColor : null}
                attachXpTarget={mine ? attachXpTarget : undefined}
              />
            ) : (
              <EloDeUniversidad row={row} />
            )}
          </View>
        )
      }}
    />
  )
}

const estilos = StyleSheet.create({
  lista: { flex: 1, minHeight: 0 },
  // `gap-2` y no el `gap-3` de la fila individual.
  fila: { gap: 8 },
  nombre: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4 },
})
