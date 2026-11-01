// La lista de reclutas del juego: quiénes entraron por tu link y cuánto te
// dieron (web/src/app/derivadas/reclutas-list.tsx + la tabla de
// web/src/components/reclutas-list.tsx). Sin reclutas, los renglones de
// ejemplo: punteados en verde, con la universidad de quien mira.
//
// Cada renglón no lleva la XP propia del recluta: con los dos números al lado
// el ojo compara y el que importa pierde.

import { StyleSheet, Text, View } from "react-native"
import { badgeWithCrown, CAREER_EMOJI } from "@intervalo/dx-core/career-emoji"
import { levelColor, TEMA } from "@intervalo/dx-core/juego/game-colors"
import { EJEMPLOS_COUNT, VERDE, type FilaRecluta } from "@intervalo/dx-core/juego/reclutas"
import { useFilasDeEjemplo } from "@intervalo/dx-core/juego/UseFilasDeEjemplo"
import type { GameRecruitEntry } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { UniTag } from "./university-tag"
import { XpDots } from "./xp-dots"

const VERDE_RGB = [0x25, 0xd3, 0x66].join(", ")

function aFila(entry: GameRecruitEntry): FilaRecluta {
  return {
    key: entry.player_id,
    rank: entry.rank,
    nombre: entry.alias,
    color: levelColor(entry.level),
    university: entry.university,
    career: entry.career,
    xp_given: entry.xp_given,
  }
}

function Fila({ fila, ejemplo }: { fila: FilaRecluta; ejemplo: boolean }) {
  const emoji = badgeWithCrown({
    crowned: fila.crowned,
    resolved: fila.career ? CAREER_EMOJI[fila.career] : undefined,
  })
  return (
    // Las mismas medidas que una fila del ranking: es la misma tabla vista de
    // otra manera.
    <View style={[styles.fila, ejemplo ? styles.filaEjemplo : styles.filaReal]}>
      <Text style={styles.puesto}>{fila.rank}</Text>
      <View style={styles.nombreYEmoji}>
        <Text style={[styles.nombre, { color: fila.color }]} numberOfLines={1}>
          {fila.nombre}
        </Text>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      </View>
      {fila.university && <UniTag university={fila.university} />}
      <View style={styles.aporte}>
        <Text style={styles.aporteTexto}>+{fila.xp_given}</Text>
        <XpDots size={12} color={VERDE} />
      </View>
    </View>
  )
}

export function ListaDeReclutas({
  entries,
  // La de quien mira, para pintar los ejemplos con la suya. `null` si no eligió.
  university = null,
  // Cuántos renglones de ejemplo sin reclutas: cinco en el ranking, tres en la
  // diapo, donde la lista viene detrás del copy y del botón.
  ejemplos = EJEMPLOS_COUNT,
}: {
  entries: GameRecruitEntry[]
  university?: string | null
  ejemplos?: number
}) {
  // El hook va siempre: llamarlo adentro del ternario sería un hook condicional.
  const filasEjemplo = useFilasDeEjemplo(university, ejemplos)
  const vacia = entries.length === 0
  const filas = vacia ? filasEjemplo : entries.map(aFila)
  return (
    <View style={[styles.lista, vacia && { opacity: 0.9 }]}>
      {filas.map((fila) => (
        <Fila key={fila.key} fila={fila} ejemplo={vacia} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  lista: { gap: 8 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // `ring-1 ring-foreground/10`.
  filaReal: { borderColor: "rgba(246, 248, 252, 0.1)" },
  // El punteado verde: verde y no gris, porque el gris se leía como un hueco.
  filaEjemplo: {
    borderStyle: "dashed",
    borderColor: `rgba(${VERDE_RGB}, 0.75)`,
    backgroundColor: `rgba(${VERDE_RGB}, 0.13)`,
  },
  puesto: {
    width: 16,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    color: TEMA.mutedForeground,
  },
  nombreYEmoji: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  nombre: { flexShrink: 1, fontSize: 14, fontWeight: "500" },
  emoji: { fontSize: 14, lineHeight: 16 },
  aporte: { flexDirection: "row", alignItems: "center", gap: 4 },
  aporteTexto: { fontSize: 14, fontWeight: "600", fontVariant: ["tabular-nums"], color: VERDE },
})
