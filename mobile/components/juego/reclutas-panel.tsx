// La diapo `¿Reclutas?` del teléfono (web/src/app/derivadas/reclutas-panel.tsx,
// variante `fullBleed` con `conLista`): ícono, título, dos párrafos, la lista
// de reclutas y abajo, en el orden del pulgar, salir y reclutar.
//
// Cuando la sacó el juego ("hito") salir tarda unos segundos en habilitarse: la
// persona viene despachando derivadas y sin la espera la diapo se salta antes de
// verse. Cuando la abrió ella ("pedido") no hay espera y el botón dice Volver.
//
// El tinte verde en la web cubre toda la pantalla desde mobile-flow; acá todavía
// no hay capa de pantalla completa, así que es el fondo de la propia diapo.

import { useEffect, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { mezclarRGB, TEMA } from "@intervalo/dx-core/juego/game-colors"
import type { GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import { PORCENTAJE_POR_DEFECTO, VERDE, type ReclutasTrigger } from "@intervalo/dx-core/juego/reclutas"
import { useGameRecruits } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { useCta } from "@/lib/analytics/UseCta"
import { useSfx } from "@/lib/audio/UseSfx"
import { ReclutarButton, WhatsappGlyph } from "./boton-reclutar"
import { CTA_H } from "./exercise-card"
import { ListaDeReclutas } from "./reclutas-list"

// Dos segundos menos que la del cafecito; en cero en desarrollo para que el
// autoplay no se trabe.
const ESPERA_S = __DEV__ ? 0 : 8

const VERDE_RGB = [0x25, 0xd3, 0x66] as const
const FONDO_RGB = [0x13, 0x13, 0x24] as const
// El 6% de `fondoDeSlide` (mobile-flow.tsx de la web).
const TINTE = `rgba(${VERDE_RGB.join(", ")}, 0.06)`
// El botón de salir: ni gris ni verde, el 70% de ese 6% sobre el fondo.
const FONDO_SALIDA = mezclarRGB(FONDO_RGB, VERDE_RGB, 0.042)

function useCuentaRegresiva(segundos: number): number {
  const [restante, setRestante] = useState(segundos)
  useEffect(() => {
    if (segundos <= 0) return
    const t = setInterval(() => setRestante((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [segundos])
  return restante
}

export function ReclutasPanel({
  player,
  trigger,
  onContinue,
}: {
  player: GamePlayer | null
  trigger: ReclutasTrigger
  /** "hito": seguir después de responder. "pedido": volver a donde estaba. */
  onContinue: () => void
}) {
  const cta = useCta()
  const sfx = useSfx()
  const university = player?.university ?? null
  const reclutas = useGameRecruits(true)
  const porcentaje = reclutas.data?.share_percent ?? PORCENTAJE_POR_DEFECTO
  const loPidio = trigger === "pedido"
  const restante = useCuentaRegresiva(loPidio ? 0 : ESPERA_S)
  const listo = restante === 0

  useEffect(() => {
    cta("share", "impression", { placement: trigger })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        <View style={styles.caja}>
          <View style={styles.icono}>
            <WhatsappGlyph size={34} color={VERDE} />
          </View>
          <Text style={styles.titulo}>¿Reclutas?</Text>
          {/* Dos párrafos: el motivo y lo que se cobra. Con universidad, el copy
              la nombra y hace explícito el circuito completo. */}
          {university ? (
            <>
              <Text style={[styles.parrafo, { marginTop: 16 }]}>
                La <Text style={styles.verde}>{university}</Text> crece y escala más rápido el
                ranking con cada compañero que traigas.
              </Text>
              <Text style={[styles.parrafo, { marginTop: 12 }]}>
                Quienes ingresen con tu link generan un{" "}
                <Text style={[styles.verde, styles.numero]}>{porcentaje}%</Text> más de XP, el cual
                va <Text style={styles.verde}>para vos</Text> y por lo tanto a la{" "}
                <Text style={styles.verde}>{university}</Text> también.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.parrafo, { marginTop: 16 }]}>
                Tu universidad crece con cada persona que traigas.
              </Text>
              <Text style={[styles.parrafo, { marginTop: 12 }]}>
                Te llevás el <Text style={[styles.verde, styles.numero]}>{porcentaje}%</Text> de todo
                el XP que generen quienes practiquen gracias a vos.
              </Text>
            </>
          )}
          {/* Tres y no cinco: con cinco la lista empuja los botones fuera de la
              pantalla. */}
          <View style={{ marginTop: 20 }}>
            <ListaDeReclutas entries={reclutas.data?.entries ?? []} university={university} ejemplos={3} />
          </View>
        </View>
      </View>

      <Pressable
        disabled={!listo}
        onPress={() => {
          sfx.select()
          onContinue()
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled: !listo }}
        style={({ pressed }) => [styles.salida, pressed && { backgroundColor: TEMA.accent }]}
      >
        <Text style={[styles.textoSalida, !listo && { color: "rgba(164, 179, 198, 0.5)" }]}>
          {loPidio ? "Volver" : listo ? "Ahora no" : `Ahora no (${restante})`}
        </Text>
      </Pressable>
      <ReclutarButton
        alias={player?.alias}
        placement={trigger}
        telemetryProps={{ reclutas: reclutas.data?.entries.length ?? 0 }}
        style={{ marginTop: 8 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: TINTE, paddingHorizontal: 20, paddingTop: 16 },
  centro: { flex: 1, minHeight: 0, justifyContent: "center" },
  caja: { width: "100%", maxWidth: 384, alignSelf: "center", padding: 24 },
  icono: { alignSelf: "center" },
  titulo: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "500",
    color: TEMA.foreground,
    textAlign: "center",
  },
  // `text-sm leading-relaxed text-foreground/90`.
  parrafo: {
    fontSize: 14,
    lineHeight: 23,
    color: "rgba(246, 248, 252, 0.9)",
    textAlign: "center",
  },
  verde: { color: VERDE, fontWeight: "600" },
  numero: { fontVariant: ["tabular-nums"] },
  salida: {
    marginTop: 12,
    height: CTA_H,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: FONDO_SALIDA,
    alignItems: "center",
    justifyContent: "center",
  },
  textoSalida: { fontSize: 16, color: TEMA.mutedForeground },
})
