// El cartel de empujes vigentes y su chip (web/src/components/boost-banner.tsx),
// de solo lectura: muestra qué universidades tienen un multiplicador corriendo y
// cuánto le queda. Los hooks y las intensidades salen de dx-core, así los dos
// carteles cuentan y brillan igual.
//
// Sin `color-mix` en RN: mezclar el ámbar con transparente al N% es el ámbar con
// alfa N%, y la mezcla con blanco se hace en RGB.

import { StyleSheet, Text, View } from "react-native"
import {
  CAFE_AMBAR_RGB,
  intensidadDelChip,
  mezclarRGB,
  ORO_CHIP_PCT,
} from "@intervalo/dx-core/juego/game-colors"
import { fmtMultiplier, fmtRemaining, type EmpujeVigente } from "@intervalo/dx-core/juego/ranking-formato"
import { useCountdown, useEmpujesAMostrar } from "@intervalo/dx-core/juego/UseBoosts"
import { UniTag } from "./university-tag"
import { XpDots } from "./xp-dots"

const BLANCO = [255, 255, 255] as const
const ambarAlfa = (pct: number) => `rgba(${CAFE_AMBAR_RGB.join(", ")}, ${pct / 100})`
const ambarConBlanco = (pct: number) => mezclarRGB(CAFE_AMBAR_RGB, BLANCO, 1 - pct / 100)
const ORO_CHIP = ambarConBlanco(ORO_CHIP_PCT)

// Todos marrones, no solo el propio: un empuje ES un cafecito. El brillo lo
// decide el multiplicador; al propio lo distinguen el peso y el dorado del texto.
export function BoostChip({ boost, mine }: { boost: EmpujeVigente; mine: boolean }) {
  const left = useCountdown({ initialSeconds: boost.expires_in_seconds })
  if (left <= 0) return null
  const k = intensidadDelChip(boost.multiplier)
  const color = mine ? ORO_CHIP : ambarConBlanco(k.texto)
  const peso = mine ? "600" : "400"
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: ambarAlfa(k.fondo),
          borderColor: ambarAlfa(k.borde),
          boxShadow: `0 0 ${k.haloRadio}px ${ambarAlfa(k.haloOpacidad)}`,
        },
      ]}
    >
      {/* Sin sigla es el empuje GLOBAL, el que cobra todo el mundo. */}
      {boost.university ? (
        <UniTag university={boost.university} />
      ) : (
        <Text style={[styles.texto, styles.todos, { color }]}>TODOS</Text>
      )}
      {/* El multiplicador con el ícono de XP pegado: dice QUÉ se multiplica. */}
      <View style={styles.multiplicador}>
        <Text style={[styles.texto, { color, fontWeight: "600" }]}>{fmtMultiplier(boost.multiplier)}</Text>
        <XpDots size={10} color={color} />
      </View>
      {/* Contra el borde derecho: con los chips del mismo ancho, los relojes
          quedan en una vertical. */}
      <Text style={[styles.texto, styles.reloj, { color, fontWeight: peso }, mine && { opacity: 0.8 }]}>
        {fmtRemaining(left)}
      </Text>
    </View>
  )
}

/** Cartel de empujes vigentes, arriba del ranking: dos por fila, la propia
 *  primero. Muestra también los de las OTRAS universidades a propósito. */
export function BoostBanner({
  boosts,
  myUniversity,
}: {
  boosts: EmpujeVigente[]
  myUniversity: string | null
}) {
  const shown = useEmpujesAMostrar({ boosts, myUniversity })
  if (shown.length === 0) return null
  const filas: EmpujeVigente[][] = []
  for (let i = 0; i < shown.length; i += 2) filas.push(shown.slice(i, i + 2))
  return (
    <View style={styles.cartel}>
      {filas.map((fila, i) => (
        <View key={i} style={styles.fila}>
          {fila.map((b) => (
            <View key={`${b.university}:${b.expires_in_seconds}`} style={styles.celda}>
              {/* Los segundos van en la key: con una respuesta nueva del
                  servidor el chip se remonta y la cuenta vuelve al valor de
                  verdad (ver useCountdown). */}
              <BoostChip boost={b} mine={b.university === myUniversity} />
            </View>
          ))}
          {fila.length === 1 && <View style={styles.celda} />}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  cartel: { gap: 6 },
  fila: { flexDirection: "row", gap: 6 },
  celda: { flex: 1, minWidth: 0 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  texto: { fontSize: 12, lineHeight: 16, fontVariant: ["tabular-nums"] },
  todos: { fontWeight: "600", letterSpacing: 0.3 },
  multiplicador: { flexDirection: "row", alignItems: "center", gap: 2 },
  reloj: { marginLeft: "auto" },
})
