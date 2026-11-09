// Cabecera del ranking: los números grandes y los selectores
// (web/src/components/leaderboard-chrome.tsx). En la web cada selector es un
// desplegable, y acá también: una lista colgada del selector.

import { useRef, useState, type ComponentRef, type ReactNode } from "react"
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native"
import { Text } from "@/components/texto"
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
import { FUENTE } from "@/lib/tipografia"

const TENUE = "rgba(246,248,252,0.6)"

// El estilo del número grande, para quien arma su propio `value` (número +
// ícono en una fila) y quiere que se vea igual que uno de texto.
export const METRIC_VALOR = {
  fontSize: 18,
  lineHeight: 20,
  fontFamily: FUENTE.seminegrita,
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

type Ancla = { x: number; y: number; w: number; h: number }

const MIN_ANCHO = 144
const ALTO_OPCION = 36
const TOPE_ALTO = 320

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
  const [ancla, setAncla] = useState<Ancla | null>(null)
  const disparadorRef = useRef<ComponentRef<typeof View>>(null)
  const { width: anchoPantalla, height: altoPantalla } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const actual = options.find((o) => o.value === value)?.label ?? value

  const abrir = () => {
    disparadorRef.current?.measureInWindow((x, y, w, h) => setAncla({ x, y, w, h }))
  }
  const cerrar = () => setAncla(null)

  // El desplegable de la web (`SelectContent alignItemWithTrigger={false}`):
  // colgado del disparador, del ancho de este (mínimo 144 px), con su propio
  // scroll. Si abajo no entra, se abre hacia arriba.
  const ancho = ancla ? Math.max(ancla.w, MIN_ANCHO) : 0
  const izquierda = ancla ? Math.max(8, Math.min(ancla.x, anchoPantalla - ancho - 8)) : 0
  const altoOpciones = options.length * ALTO_OPCION + 8
  const libreAbajo = ancla ? altoPantalla - insets.bottom - (ancla.y + ancla.h) - 12 : 0
  const libreArriba = ancla ? ancla.y - insets.top - 12 : 0
  const haciaArriba = ancla !== null && altoOpciones > libreAbajo && libreArriba > libreAbajo
  const alto = Math.min(altoOpciones, Math.min(TOPE_ALTO, haciaArriba ? libreArriba : libreAbajo))

  return (
    <>
      <Pressable
        ref={disparadorRef}
        collapsable={false}
        onPress={abrir}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, expanded: ancla !== null }}
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
      <Modal visible={ancla !== null} transparent animationType="fade" onRequestClose={cerrar}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityLabel="Cerrar" />
        {ancla && (
          <View
            style={[
              styles.lista,
              {
                left: izquierda,
                width: ancho,
                height: alto,
                ...(haciaArriba ? { bottom: altoPantalla - ancla.y + 4 } : { top: ancla.y + ancla.h + 4 }),
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listaContenido}>
              {options.map((o) => {
                const elegida = o.value === value
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => {
                      cerrar()
                      if (!elegida) onChange(o.value)
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: elegida }}
                    style={({ pressed }) => [styles.opcion, pressed && { backgroundColor: "rgba(255,255,255,0.06)" }]}
                  >
                    <Text style={[styles.opcionTexto, elegida && { fontFamily: FUENTE.seminegrita }]} numberOfLines={1}>
                      {o.label}
                    </Text>
                    {elegida && <Tilde />}
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>
        )}
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
  disparadorValor: { fontSize: 12, lineHeight: 13, fontFamily: FUENTE.seminegrita, color: TEMA.foreground },
  disparadorPie: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  disparadorRotulo: { flexShrink: 1, fontSize: 10.4, lineHeight: 13, color: TENUE },
  // El popover de la web: del color de las cartas, con borde y sombra.
  lista: {
    position: "absolute",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.card,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  listaContenido: { padding: 4 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    height: ALTO_OPCION,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  opcionTexto: { flexShrink: 1, fontSize: 14, color: TEMA.foreground },
})
