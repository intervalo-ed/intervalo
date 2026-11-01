// La diapo del festejo (web/src/app/derivadas/mobile-flow.tsx :: RankingSlide):
// el ranking con su Continuar. Es la que TIENE el número que sube, así que
// también garantiza que el conteo empiece: lo larga el toque en Continuar, y
// esta diapo lo vuelve a intentar al montarse por si se llegó por otro camino.
//
// La cabecera la pasa quien la monta (`cabecera`), arriba de todo como en la
// web. Mirando "Reclutas", el pie ofrece reclutar y deja Seguir al lado.

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import type { RankingView } from "@intervalo/dx-core/juego/ranking-formato"
import type { MemoriaDelRanking } from "@intervalo/dx-core/juego/ranking-orden"
import type { GameAnswer } from "@intervalo/dx-core/juego/UseGameExercise"
import { BotonCta } from "./boton-cta"
import { ReclutarButton } from "./boton-reclutar"
import { CTA_H } from "./exercise-card"
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
  alias,
  enabled,
  onRelease,
  onContinue,
  continueDisabled,
  cabecera,
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
  // El @ propio, para el link de reclutar del pie.
  alias: string | null
  enabled: boolean
  onRelease: () => void
  onContinue: () => void
  continueDisabled: boolean
  cabecera?: ReactNode
}) {
  // Red de seguridad, no el disparo: si el conteo ya se largó no hace nada.
  const releaseRef = useRef(onRelease)
  useEffect(() => {
    releaseRef.current = onRelease
  })
  useEffect(() => {
    releaseRef.current()
  }, [answer])

  // Qué está mostrando el ranking: lo dice él, porque el selector vive adentro.
  const [vista, setVista] = useState<RankingView>(scopeInicial.view)

  return (
    <View style={styles.pantalla}>
      {cabecera}
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
        onViewChange={setVista}
        style={styles.ranking}
      />
      {vista === "recruits" ? (
        <View style={styles.pie}>
          <ReclutarButton alias={alias} placement="ranking_reclutas" style={styles.reclutar} />
          <Pressable
            onPress={onContinue}
            disabled={continueDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: continueDisabled }}
            style={({ pressed }) => [styles.seguir, pressed && styles.apretado, continueDisabled && { opacity: 0.5 }]}
          >
            <Text style={styles.seguirTexto}>Seguir</Text>
          </Pressable>
        </View>
      ) : (
        <BotonCta texto="Continuar" onPress={onContinue} disabled={continueDisabled} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, minHeight: 0, gap: 12, paddingHorizontal: 16 },
  ranking: { flex: 1 },
  pie: { flexDirection: "row", alignItems: "stretch", gap: 8, height: CTA_H },
  reclutar: { flex: 1 },
  seguir: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.background,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  apretado: { backgroundColor: TEMA.accent },
  seguirTexto: { color: TEMA.foreground, fontSize: 16, fontWeight: "500" },
})
