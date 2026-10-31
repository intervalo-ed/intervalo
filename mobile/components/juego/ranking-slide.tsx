// La diapo del festejo (web/src/app/derivadas/mobile-flow.tsx :: RankingSlide):
// el ranking con su Continuar. Es la que TIENE el número que sube, así que
// también garantiza que el conteo empiece: lo larga el toque en Continuar, y
// esta diapo lo vuelve a intentar al montarse por si se llegó por otro camino.
//
// Sin GameHeader (todavía no existe en la app) ni el pie de reclutas.

import { useEffect, useRef } from "react"
import { StyleSheet, View } from "react-native"
import type { RankingView } from "@intervalo/dx-core/juego/ranking-formato"
import type { MemoriaDelRanking } from "@intervalo/dx-core/juego/ranking-orden"
import type { GameAnswer } from "@intervalo/dx-core/juego/UseGameExercise"
import { BotonCta } from "./boton-cta"
import { GameRanking } from "./ranking/game-ranking"

export function RankingSlide({
  answer,
  climbFrom,
  onSaltoArranca,
  leerMemoria,
  guardarMemoria,
  scopeInicial,
  onScopeElegido,
  liveXp,
  liveXpDelta,
  counting,
  xpColor,
  myUniversity,
  enabled,
  onRelease,
  onContinue,
  continueDisabled,
}: {
  answer: GameAnswer
  climbFrom: number | null
  onSaltoArranca: () => void
  leerMemoria: () => MemoriaDelRanking
  guardarMemoria: (m: MemoriaDelRanking) => void
  scopeInicial: { view: RankingView; university: string }
  onScopeElegido: (s: { view: RankingView; university: string }) => void
  liveXp: number | null
  liveXpDelta: number | null
  counting: boolean
  xpColor: string | null
  myUniversity: string | null
  enabled: boolean
  onRelease: () => void
  onContinue: () => void
  continueDisabled: boolean
}) {
  // Red de seguridad, no el disparo: si el conteo ya se largó no hace nada.
  const releaseRef = useRef(onRelease)
  useEffect(() => {
    releaseRef.current = onRelease
  })
  useEffect(() => {
    releaseRef.current()
  }, [answer])

  return (
    <View style={styles.pantalla}>
      <GameRanking
        climbFrom={climbFrom}
        onSaltoArranca={onSaltoArranca}
        leerMemoria={leerMemoria}
        guardarMemoria={guardarMemoria}
        scopeInicial={scopeInicial}
        onScopeElegido={onScopeElegido}
        enabled={enabled}
        liveXp={liveXp}
        counting={counting}
        liveXpDelta={liveXpDelta}
        xpColor={xpColor}
        myUniversity={myUniversity}
        mobile
        style={styles.ranking}
      />
      <BotonCta texto="Continuar" onPress={onContinue} disabled={continueDisabled} />
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, minHeight: 0, gap: 12, paddingHorizontal: 16 },
  ranking: { flex: 1 },
})
