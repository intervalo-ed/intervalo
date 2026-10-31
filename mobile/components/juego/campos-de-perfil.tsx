// Carrera y universidad, los pares nativos de `web/src/components/onboarding-fields.tsx`
// (las mismas tarjetas y chips que el onboarding). Sin atajos numéricos: en el
// teléfono no hay teclado físico.
//
// UniversityGrid es controlado, igual que en la web: la universidad elegida,
// "Otra" abierta y el texto tipeado viven en el dueño. Tampoco elige contenedor:
// si la diapo necesita esquivar el teclado, el `KeyboardAvoidingView` lo pone
// quien la arma.

import type { ReactNode, Ref } from "react"
import { Image, type ImageSource } from "expo-image"
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import { CAREERS } from "@intervalo/dx-core/carreras"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { ONBOARDING_UNIVERSITIES, matchUniversities } from "@intervalo/dx-core/university-tags"
import { SugerenciaUniversidad } from "./university-tag"

// Logos monocromos (gris), los de `web/public/universities`. El tamaño natural va
// al lado porque el ancho sale de la proporción: el alto es fijo, como en la web.
const UNIVERSITY_LOGOS: Partial<Record<string, { fuente: ImageSource | number; ancho: number; alto: number }>> = {
  UBA: { fuente: require("@/assets/universities/uba.png"), ancho: 291, alto: 90 },
  UTN: { fuente: require("@/assets/universities/utn.png"), ancho: 255, alto: 93 },
  UNLP: { fuente: require("@/assets/universities/unlp.png"), ancho: 306, alto: 90 },
  UNSAM: { fuente: require("@/assets/universities/unsam.png"), ancho: 378, alto: 90 },
  UNC: { fuente: require("@/assets/universities/unc.png"), ancho: 282, alto: 84 },
  UNL: { fuente: require("@/assets/universities/unl.png"), ancho: 264, alto: 90 },
}

const SELECCIONADO = "#c4c6ff"

function Opcion({
  children,
  selected,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode
  selected: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.opcion,
        selected ? styles.opcionElegida : pressed && styles.opcionApretada,
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}

function CareerCard({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Opcion selected={selected} onPress={onPress} style={styles.carrera}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.textoOpcion, styles.textoCarrera, selected && styles.textoElegido]}>
        {label}
      </Text>
    </Opcion>
  )
}

// «¿Qué estudiás?»: heading + grilla 2×2 + "Otra".
export function CareerSelect({
  value,
  onSelect,
}: {
  value: string
  onSelect: (value: string) => void
}) {
  const filas = [CAREERS.slice(0, 2), CAREERS.slice(2, 4)]
  return (
    <View style={styles.bloque}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>¿Qué estudiás?</Text>
        <Text style={styles.subtitulo}>Marcá la que más se aproxime a tu carrera.</Text>
      </View>
      <View style={styles.grilla}>
        {filas.map((fila, i) => (
          <View key={i} style={styles.fila}>
            {fila.map((c) => (
              <CareerCard
                key={c.value}
                emoji={c.emoji}
                label={c.label}
                selected={value === c.value}
                onPress={() => onSelect(c.value)}
              />
            ))}
          </View>
        ))}
        <View style={styles.fila}>
          <CareerCard emoji="✦" label="Otra" selected={value === "Otra"} onPress={() => onSelect("Otra")} />
        </View>
      </View>
    </View>
  )
}

// «¿Dónde?»: heading + chips con logos + "Otra" con autocompletado.
export function UniversityGrid({
  university,
  showOther,
  otherValue,
  onOtherChange,
  onPick,
  onSelectOther,
  onConfirmOther,
  onPickSuggestion,
  inputRef,
}: {
  university: string
  showOther: boolean
  otherValue: string
  onOtherChange: (value: string) => void
  onPick: (u: string) => void
  onSelectOther: () => void
  onConfirmOther: () => void
  onPickSuggestion: (key: string) => void
  inputRef?: Ref<TextInputInstance>
}) {
  const suggestions = otherValue.trim() ? matchUniversities(otherValue) : []
  const filas = [ONBOARDING_UNIVERSITIES.slice(0, 3), ONBOARDING_UNIVERSITIES.slice(3, 6)]
  return (
    <View style={styles.bloque}>
      <Text style={styles.titulo}>¿Dónde?</Text>
      <View style={styles.grilla}>
        {filas.map((fila, i) => (
          <View key={i} style={styles.fila}>
            {fila.map((u) => {
              const logo = UNIVERSITY_LOGOS[u]
              const isSel = university === u && !showOther
              const alto = u === "UNSAM" || u === "UNC" ? 20 : 23
              return (
                <Opcion
                  key={u}
                  selected={isSel}
                  onPress={() => onPick(u)}
                  accessibilityLabel={u}
                  style={[styles.chip, logo && styles.chipConLogo]}
                >
                  {logo ? (
                    // El gris se lleva a blanco al elegir (el `brightness-150`
                    // de la web): expo-image no aplica `filter`, pero los logos
                    // son de un solo color y teñirlos da lo mismo.
                    <Image
                      source={logo.fuente}
                      contentFit="contain"
                      tintColor={isSel ? TEMA.foreground : null}
                      accessible={false}
                      style={{
                        height: alto,
                        width: (alto * logo.ancho) / logo.alto,
                        maxWidth: "100%",
                        opacity: isSel ? 1 : 0.9,
                      }}
                    />
                  ) : (
                    <Text style={[styles.textoOpcion, isSel && styles.textoElegido]}>{u}</Text>
                  )}
                </Opcion>
              )
            })}
          </View>
        ))}
        {showOther ? (
          <View style={styles.otra}>
            <TextInput
              ref={inputRef}
              value={otherValue}
              onChangeText={onOtherChange}
              onSubmitEditing={onConfirmOther}
              placeholder="Ej: UNQ, UNLa, UNGS…"
              placeholderTextColor={TEMA.mutedForeground}
              autoFocus
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              keyboardAppearance="dark"
              returnKeyType="done"
              selectionColor={TEMA.ring}
              style={styles.input}
            />
            {suggestions.length > 0 && (
              <View style={styles.sugerencias}>
                {suggestions.map((s) => (
                  <SugerenciaUniversidad key={s.key} cfg={s} onPress={() => onPickSuggestion(s.key)} />
                ))}
              </View>
            )}
          </View>
        ) : (
          <Opcion selected={false} onPress={onSelectOther} style={styles.botonOtra}>
            <Text style={styles.textoOpcion}>Otra</Text>
          </Opcion>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bloque: { width: "100%", gap: 20 },
  encabezado: { gap: 8 },
  titulo: { fontSize: 24, fontWeight: "700", color: TEMA.foreground, textAlign: "center" },
  subtitulo: { fontSize: 16, lineHeight: 24, color: "rgba(246,248,252,0.85)", textAlign: "center" },
  grilla: { gap: 10 },
  fila: { flexDirection: "row", gap: 10 },
  opcion: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  opcionElegida: { borderColor: TEMA.ring },
  opcionApretada: { borderColor: "rgba(255,255,255,0.2)" },
  textoOpcion: { fontSize: 16, fontWeight: "500", color: "rgba(246,248,252,0.8)" },
  textoElegido: { color: SELECCIONADO },
  carrera: { flex: 1, paddingVertical: 24, gap: 8 },
  emoji: { fontSize: 24, lineHeight: 28 },
  textoCarrera: { fontSize: 14 },
  chip: { flex: 1, height: 52, paddingHorizontal: 16 },
  chipConLogo: { paddingHorizontal: 8, paddingVertical: 8 },
  botonOtra: { paddingHorizontal: 16, paddingVertical: 14 },
  otra: { gap: 12 },
  input: {
    height: 52,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.ring,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 16,
    fontSize: 16,
    color: TEMA.foreground,
  },
  sugerencias: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
})
