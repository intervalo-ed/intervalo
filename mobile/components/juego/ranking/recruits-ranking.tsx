// La vista "Reclutas": quiénes entraron por tu link y cuánto te dieron
// (web/src/app/derivadas/game-ranking.tsx :: RecruitsRanking).
//
// Sin esqueleto de carga: mientras no hay reclutas van los cinco renglones de
// ejemplo, que son datos fijos del cliente y no esperan al servidor. El pedido
// lo hace GameRanking, que con los mismos datos llena los indicadores de arriba.

import { ScrollView, StyleSheet } from "react-native"
import { EJEMPLOS_COUNT } from "@intervalo/dx-core/juego/reclutas"
import type { GameRecruits } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { ListaDeReclutas } from "../reclutas-list"

export function RecruitsRanking({
  data,
  myUniversity,
}: {
  data: GameRecruits | undefined
  myUniversity: string | null
}) {
  return (
    <ScrollView style={estilos.lista} contentContainerStyle={estilos.contenido} showsVerticalScrollIndicator={false}>
      <ListaDeReclutas entries={data?.entries ?? []} university={myUniversity} ejemplos={EJEMPLOS_COUNT} />
    </ScrollView>
  )
}

const estilos = StyleSheet.create({
  lista: { flex: 1, minHeight: 0 },
  contenido: { paddingTop: 5 },
})
