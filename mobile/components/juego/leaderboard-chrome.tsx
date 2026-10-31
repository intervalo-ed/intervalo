// Cabecera del ranking: los números grandes y los selectores
// (web/src/components/leaderboard-chrome.tsx). En la web cada selector es un
// desplegable; acá abre una hoja desde abajo con las opciones.

import { useState, type ReactNode } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { ALL_SCOPE } from "@intervalo/dx-core/juego/ranking-scope"
import {
  CAREER_META,
  CAREER_NAME,
  opcionesDeUniversidad,
  type RankingView,
} from "@intervalo/dx-core/juego/ranking-formato"

const TENUE = "rgba(246,248,252,0.6)"

// El estilo del número grande, para quien arma su propio `value` (número +
// ícono en una fila) y quiere que se vea igual que uno de texto.
export const METRIC_VALOR = {
  fontSize: 18,
  lineHeight: 20,
  fontWeight: "600",
  color: TEMA.foreground,
  fontVariant: ["tabular-nums"],
} as const

const esTexto = (n: ReactNode) => typeof n === "string" || typeof n === "number"

export function Metric({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <View style={styles.caja}>
      <View style={styles.valor}>{esTexto(value) ? <Text style={METRIC_VALOR}>{value}</Text> : value}</View>
      {esTexto(label) ? (
        <Text style={styles.rotulo} numberOfLines={1}>
          {label}
        </Text>
      ) : (
        label
      )}
    </View>
  )
}

export type OpcionFiltro = { value: string; label: string }

function Chevron() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={TENUE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

function Tilde() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={TEMA.foreground} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  )
}

// Deshabilitado de VERDAD, no apagado a medias: un selector que se ve apagado
// y sigue aceptando toques guarda una elección que no tiene efecto.
export function FilterBox({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: OpcionFiltro[]
  disabled?: boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const insets = useSafeAreaInsets()
  const actual = options.find((o) => o.value === value)?.label ?? value

  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [styles.disparador, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.disparadorValor} numberOfLines={1}>
          {actual}
        </Text>
        <View style={styles.disparadorPie}>
          <Text style={styles.disparadorRotulo} numberOfLines={1}>
            {label}
          </Text>
          <Chevron />
        </View>
      </Pressable>
      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <Pressable style={styles.fondo} onPress={() => setAbierto(false)} accessibilityLabel="Cerrar" />
        <View style={[styles.hoja, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.hojaTitulo}>{label}</Text>
          <ScrollView>
            {options.map((o) => {
              const elegida = o.value === value
              return (
                <Pressable
                  key={o.value}
                  onPress={() => {
                    setAbierto(false)
                    if (!elegida) onChange(o.value)
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: elegida }}
                  style={({ pressed }) => [styles.opcion, pressed && { backgroundColor: "rgba(255,255,255,0.05)" }]}
                >
                  <Text style={[styles.opcionTexto, elegida && { fontWeight: "600" }]} numberOfLines={1}>
                    {o.label}
                  </Text>
                  {elegida && <Tilde />}
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
  )
}

// Las vistas se nombran por LO QUE LISTAN, en plural.
const VIEW_LABEL: Record<RankingView, string> = {
  individual: "Estudiantes",
  university: "Universidades",
  countries: "Países",
  recruits: "Reclutas",
}

// Los selectores del ranking, con el mismo orden y las mismas etiquetas que en
// la web. Carrera, países y reclutas son opt-in; `scopeDisabled` apaga (y
// deshabilita) todos menos el primero, sin sacarlos, para que la fila no cambie
// de forma al cambiar de vista.
export function ScopeFilters({
  view,
  onViewChange,
  career = ALL_SCOPE,
  onCareerChange,
  university,
  onUniversityChange,
  universities,
  withRecruits = false,
  withCountries = false,
  withCareer = true,
  scopeDisabled = false,
}: {
  view: RankingView
  onViewChange: (v: RankingView) => void
  career?: string
  onCareerChange?: (v: string) => void
  university: string
  onUniversityChange: (v: string) => void
  universities: string[]
  withRecruits?: boolean
  withCountries?: boolean
  withCareer?: boolean
  scopeDisabled?: boolean
}) {
  const vistas: RankingView[] = [
    "individual",
    "university",
    ...(withCountries ? (["countries"] as const) : []),
    ...(withRecruits ? (["recruits"] as const) : []),
  ]
  const apagada = scopeDisabled ? styles.apagada : undefined
  return (
    <View style={styles.fila}>
      <View style={styles.celda}>
        <FilterBox
          label="Ranking"
          value={view}
          onChange={(v) => onViewChange(v as RankingView)}
          options={vistas.map((v) => ({ value: v, label: VIEW_LABEL[v] }))}
        />
      </View>
      {withCareer && (
        <View style={[styles.celda, apagada]}>
          <FilterBox
            label="Carrera"
            value={career}
            onChange={onCareerChange ?? (() => {})}
            options={[
              { value: ALL_SCOPE, label: "Todas" },
              ...CAREER_META.map((c) => ({ value: c.key, label: CAREER_NAME[c.key] ?? c.name })),
            ]}
            disabled={scopeDisabled}
          />
        </View>
      )}
      <View style={[styles.celda, apagada]}>
        <FilterBox
          label="Universidad"
          value={university}
          onChange={onUniversityChange}
          options={[
            { value: ALL_SCOPE, label: "Todas" },
            ...opcionesDeUniversidad(universities, university).map((u) => ({ value: u, label: u })),
          ]}
          disabled={scopeDisabled}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  caja: {
    justifyContent: "center",
    gap: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  valor: { flexDirection: "row", alignItems: "center", gap: 6 },
  rotulo: { fontSize: 11.2, lineHeight: 14, color: TENUE },
  fila: { flexDirection: "row", gap: 8 },
  celda: { flex: 1, minWidth: 0 },
  apagada: { opacity: 0.4 },
  disparador: {
    justifyContent: "center",
    gap: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  disparadorValor: { fontSize: 12, lineHeight: 13, fontWeight: "600", color: TEMA.foreground },
  disparadorPie: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  disparadorRotulo: { flexShrink: 1, fontSize: 10.4, lineHeight: 13, color: TENUE },
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  hoja: {
    maxHeight: "60%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: TEMA.border,
    backgroundColor: TEMA.card,
    paddingTop: 12,
  },
  hojaTitulo: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: "600",
    color: TENUE,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  opcionTexto: { flexShrink: 1, fontSize: 16, color: TEMA.foreground },
})
