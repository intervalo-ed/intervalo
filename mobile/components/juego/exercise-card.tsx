// La card del ejercicio y las piezas del feedback, en la app. Es el par de
// web/src/app/derivadas/exercise-card.tsx en su forma de teléfono: el marcador
// (ejercicios, racha, Elo), la caja del enunciado, el campo con su latido o su
// sacudón, el botón principal que destella, el «¿Por qué?» y el cartel de
// ¡Correcto!/¿Seguro? que asoma detrás de los botones.
//
// El campo (MathField) NO vive acá: lo arma la pantalla una sola vez y lo pasa
// como hijo de `AnswerField`, así ninguna de estas piezas puede remontarlo.

import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  SlideInRight,
  SlideOutDown,
  SlideOutLeft,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import Svg, { Circle, Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import type { GameAnswer } from "@intervalo/dx-core/juego/UseGameExercise"
import { ESCALA_MATE, Latex } from "@/components/latex/latex"
import { texASvg } from "@/components/latex/mathjax"

export const WRONG = "#F97316"
export const VERDE_ACIERTO = "#22C55E"
const VERDE_400 = "#4ade80"
const TONE_PULSE = {
  correct: "rgba(34, 197, 94, 0.26)",
  wrong: "rgba(249, 115, 22, 0.28)",
} as const

// `--cta-h` de la web: 3.3rem.
export const CTA_H = 52.8
// El `min-h-20` que comparten el campo, el botón que lo reemplaza y su hueco.
export const CAMPO_MIN_H = 80

export type AnswerTone = "correct" | "wrong" | null

export function answerTone(answer: GameAnswer | null): AnswerTone {
  if (!answer) return null
  // Un LaTeX que no se pudo leer no consume intento, pero visualmente es un
  // rebote igual: la respuesta no entró.
  if (!answer.parse_ok) return "wrong"
  return answer.correct ? "correct" : "wrong"
}

const SHAKE = [0, -8, 8, -6, 6, -3, 0]
const SHAKE_MS = 400
const PULSE_MS = 450
const FLASH_MS = 480
const FUNDIDO_MS = 220

function sacudir(x: { value: number }) {
  const tramo = SHAKE_MS / (SHAKE.length - 1)
  x.value = withSequence(
    ...SHAKE.slice(1).map((v) => withTiming(v, { duration: tramo, easing: Easing.inOut(Easing.ease) })),
  )
}

// Un momento que tiene que volver a correr en cada respuesta, aunque la
// anterior haya sido del mismo tono: se dispara por `seq`, una vez por valor.
function useAlCambiarSeq(seq: number, activo: boolean, disparar: () => void) {
  const visto = useRef(seq)
  useEffect(() => {
    if (visto.current === seq) return
    visto.current = seq
    if (activo) disparar()
  })
}

// ── El marcador ─────────────────────────────────────────────────────────

// Enteros y no em, por lo mismo que en la web: cada dígito cae en un píxel
// exacto y las cifras de un mismo número quedan alineadas.
const LINE_PX = 22
const DIGIT_W_PX = 12
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function RollingDigit({ d }: { d: number }) {
  const y = useSharedValue(-d * LINE_PX)
  useEffect(() => {
    y.value = withSpring(-d * LINE_PX, { stiffness: 300, damping: 32 })
  }, [d, y])
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  return (
    <View style={{ height: LINE_PX, width: DIGIT_W_PX, overflow: "hidden" }}>
      <Animated.View style={estilo}>
        {DIGITS.map((n) => (
          <Text key={n} allowFontScaling={false} style={styles.digito}>
            {n}
          </Text>
        ))}
      </Animated.View>
    </View>
  )
}

function RollingNumber({ value }: { value: number }) {
  const digits = Math.max(0, Math.trunc(value)).toString().split("")
  return (
    <View style={styles.fila} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {digits.map((d, i) => (
        // La key cuenta desde la derecha: de 9 a 10 las unidades ruedan.
        <RollingDigit key={digits.length - i} d={Number(d)} />
      ))}
    </View>
  )
}

function Counter({
  value,
  emoji,
  label,
  dim = false,
  glifoGrande = false,
}: {
  value: number
  emoji: string
  label: string
  dim?: boolean
  glifoGrande?: boolean
}) {
  return (
    <View style={[styles.fila, { gap: 4 }]} accessible accessibilityLabel={label}>
      <View style={dim && { opacity: 0.55 }}>
        <RollingNumber value={value} />
      </View>
      <Text
        allowFontScaling={false}
        style={[
          styles.emoji,
          glifoGrande && { fontSize: 16 * 1.35, color: TEMA.foreground },
          dim && { opacity: 0.4 },
        ]}
      >
        {emoji}
      </Text>
    </View>
  )
}

/** Los marcadores del juego en una pastilla: ejercicios, racha y Elo. */
export function Counters({
  attempted,
  streak,
  elo,
  onLongPress,
}: {
  attempted: number
  streak: number
  elo: number | null
  // Solo en desarrollo: la puerta a la pantalla de depuración.
  onLongPress?: () => void
}) {
  const barra = <View style={styles.separador} />
  return (
    <Pressable onLongPress={onLongPress} disabled={!onLongPress} delayLongPress={600} style={styles.pastilla}>
      <Counter value={attempted} emoji="🧩" label={`${attempted} ejercicios`} />
      {barra}
      <Counter value={streak} emoji="🔥" label={`racha de ${streak}`} dim={streak === 0} />
      {elo !== null && (
        <>
          {barra}
          {/* El selector de texto deja al peón como glifo y no como emoji. */}
          <Counter value={elo} emoji={"♟︎"} label={`elo ${elo}`} glifoGrande />
        </>
      )}
    </Pressable>
  )
}

// ── El enunciado ────────────────────────────────────────────────────────

const LEIBNIZ = (latex: string) => `\\frac{d}{dx}\\left[\\,${latex}\\,\\right] =`

// El cuerpo con el que se dibuja si entra, y hasta dónde se lo deja achicar.
const PROMPT_FONT_PX = 20
const PROMPT_FONT_MIN_PX = 13
const PROMPT_PAD_X = 24

/** Achica la fórmula hasta que entra en el ancho de la caja, en vez de dejarla
 *  scrollear. Se ajusta el cuerpo y no una escala: MathJax la vuelve a armar y
 *  los trazos quedan del mismo grosor que el resto. */
function cuerpoQueEntra(tex: string, ancho: number): number {
  if (ancho <= 0) return PROMPT_FONT_PX
  const r = texASvg({ tex, display: true })
  if (!r.ok) return PROMPT_FONT_PX
  const necesario = r.svg.ancho * PROMPT_FONT_PX * ESCALA_MATE
  if (necesario <= ancho) return PROMPT_FONT_PX
  return Math.max(PROMPT_FONT_MIN_PX, Math.floor((PROMPT_FONT_PX * ancho) / necesario))
}

function PromptBox({
  exerciseId,
  promptLatex,
  solvedLatex,
  deslizar,
}: {
  exerciseId: number | null
  promptLatex: string
  solvedLatex: string | null
  deslizar: boolean
}) {
  const [ancho, setAncho] = useState(0)
  const tex = solvedLatex !== null ? `f'(x) = ${solvedLatex}` : LEIBNIZ(promptLatex)
  const size = cuerpoQueEntra(tex, ancho)
  return (
    <View
      style={styles.promptMarco}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width - 2 * PROMPT_PAD_X - 2)}
    >
      {/* Saltear cambia de derivada sin cambiar de pantalla: la caja vieja se
          va por la izquierda y entra la nueva por la derecha. Después de
          responder no, porque ahí ya se movió la pantalla entera. */}
      <Animated.View
        key={exerciseId ?? "vacio"}
        entering={deslizar ? SlideInRight.duration(280) : undefined}
        exiting={deslizar ? SlideOutLeft.duration(280) : undefined}
        style={styles.promptCaja}
      >
        {promptLatex === "" ? null : solvedLatex !== null ? (
          <Animated.View key="resuelto" entering={FadeIn.duration(FUNDIDO_MS)}>
            <Formula tex={tex} size={size} />
          </Animated.View>
        ) : (
          <Formula tex={tex} size={size} />
        )}
      </Animated.View>
    </View>
  )
}

function Formula({ tex, size }: { tex: string; size: number }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.formula}
    >
      <Latex tex={tex} display size={size} />
    </ScrollView>
  )
}

export function ExerciseCard({
  streak,
  attempted,
  elo,
  exerciseId,
  promptLatex,
  solvedLatex,
  deslizar,
  onLongPressMarcador,
  children,
}: {
  streak: number
  attempted: number
  elo: number | null
  exerciseId: number | null
  promptLatex: string
  solvedLatex: string | null
  deslizar: boolean
  onLongPressMarcador?: () => void
  children?: ReactNode
}) {
  return (
    <View style={styles.card}>
      <Counters attempted={attempted} streak={streak} elo={elo} onLongPress={onLongPressMarcador} />
      <View style={styles.cuerpo}>
        <PromptBox
          exerciseId={exerciseId}
          promptLatex={promptLatex}
          solvedLatex={solvedLatex}
          deslizar={deslizar}
        />
        {children}
      </View>
    </View>
  )
}

// ── La caja de la respuesta ─────────────────────────────────────────────

/** Late al confirmar y se sacude si está mal. Con `hint` puesto, el botón del
 *  «¿Por qué?» ocupa el lugar del campo: las dos caras están montadas siempre
 *  y la de adelante (el campo) es la que da el alto. */
export function AnswerField({
  tone,
  seq,
  hint,
  children,
}: {
  tone: AnswerTone
  seq: number
  hint?: ReactNode
  children: ReactNode
}) {
  const pulso = hint ? "hint" : tone
  const [ultimoHint, setUltimoHint] = useState<ReactNode>(null)
  if (hint && hint !== ultimoHint) setUltimoHint(hint)

  const x = useSharedValue(0)
  const brillo = useSharedValue(0)
  const anillo = useSharedValue(0)
  const cara = useSharedValue(hint ? 1 : 0)

  useAlCambiarSeq(seq, tone === "wrong", () => sacudir(x))
  useAlCambiarSeq(seq, pulso === "correct" || pulso === "wrong", () => {
    brillo.value = withSequence(
      withTiming(1, { duration: PULSE_MS * 0.22, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: PULSE_MS * 0.78, easing: Easing.out(Easing.ease) }),
    )
  })

  const conHint = !!hint
  useEffect(() => {
    cara.value = withTiming(conHint ? 1 : 0, { duration: FUNDIDO_MS })
    if (conHint) {
      anillo.value = 0
      anillo.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.ease) })
    }
  }, [conHint, cara, anillo])

  const sacudon = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const frente = useAnimatedStyle(() => ({
    opacity: 1 - cara.value,
    transform: [{ scale: 1 - 0.03 * cara.value }],
  }))
  const dorso = useAnimatedStyle(() => ({
    opacity: cara.value,
    transform: [{ scale: 0.97 + 0.03 * cara.value }],
  }))
  const aro = useAnimatedStyle(() => ({
    opacity: anillo.value === 0 ? 0 : 1 - anillo.value,
    transform: [{ scale: 1 + 0.08 * anillo.value }],
  }))
  const destello = useAnimatedStyle(() => ({ opacity: brillo.value }))
  const colorPulso = tone ? TONE_PULSE[tone] : "transparent"

  return (
    <Animated.View style={sacudon}>
      <Animated.View style={frente} pointerEvents={hint ? "none" : "auto"}>
        {children}
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, dorso]} pointerEvents={hint ? "auto" : "none"}>
        {ultimoHint}
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.aro, aro]} />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { borderRadius: 8, backgroundColor: colorPulso }, destello]}
      />
    </Animated.View>
  )
}

// ── Botones ─────────────────────────────────────────────────────────────

/** Revisar/Continuar. Destella verde al acertar y vuelve a blanco; se sacude al
 *  errar. `sinFlash` en el primer intento, donde el pie entero se reacomoda. */
export function AnswerButton({
  tone,
  seq,
  closed,
  disabled = false,
  sinFlash = false,
  onPress,
  style,
}: {
  tone: AnswerTone
  seq: number
  closed: boolean
  disabled?: boolean
  sinFlash?: boolean
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  const x = useSharedValue(0)
  const flash = useSharedValue(0)
  useAlCambiarSeq(seq, tone === "wrong", () => sacudir(x))
  useAlCambiarSeq(seq, tone === "correct" && !sinFlash, () => {
    flash.value = withSequence(
      withTiming(1, { duration: 150 }),
      withDelay(FLASH_MS - 150, withTiming(0, { duration: 600 })),
    )
  })
  const sacudon = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const fondo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(flash.value, [0, 1], ["#FFFFFF", VERDE_ACIERTO]),
  }))
  return (
    <Animated.View style={[{ flex: 1 }, sacudon, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => [pressed && { opacity: 0.9 }, disabled && { opacity: 0.5 }]}
      >
        <Animated.View style={[styles.principal, fondo]}>
          <Text style={styles.principalTexto}>{closed ? "Continuar" : "Revisar"}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  )
}

/** El «¿Por qué?». `plano`: contorno grueso sobre el fondo (el del pie, al lado
 *  de Revisar). `blanco`: blanco con letra negra (el que reemplaza al campo). */
export function PorQueButton({
  onPress,
  plano = false,
  alto = CTA_H,
  style,
}: {
  onPress: () => void
  plano?: boolean
  alto?: number
  style?: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.porque,
        { minHeight: alto },
        plano ? styles.porquePlano : styles.porqueBlanco,
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      <Text style={[styles.porqueTexto, { color: plano ? TEMA.foreground : "#000" }]}>¿Por qué?</Text>
    </Pressable>
  )
}

// ── El cartel del veredicto ─────────────────────────────────────────────

function XpDots({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="8" cy="8" r="4.6" />
      <Circle cx="17" cy="13" r="3.5" />
      <Circle cx="9.5" cy="17.5" r="2.4" />
    </Svg>
  )
}

function IconoTabla({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </Svg>
  )
}

/** ¡Correcto!/¿Seguro? asomando desde abajo, detrás de los botones. Una caja
 *  opaca con el color del fondo y encima el tinte. `reservaAbajo` es el alto
 *  del pie: lo que deja el texto a la vista en vez de tapado por los botones. */
export function BannerDelVeredicto({
  tone,
  answer,
  reservaAbajo,
}: {
  tone: AnswerTone
  answer: GameAnswer | null
  reservaAbajo: number
}) {
  if (tone === "correct") {
    return (
      <Animated.View
        key="banner-correcto"
        entering={SlideInDown.duration(250)}
        exiting={SlideOutDown.duration(250)}
        pointerEvents="none"
        style={styles.banner}
      >
        <View style={[styles.bannerTinte, styles.tinteCorrecto, { paddingBottom: reservaAbajo }]}>
          <View style={styles.fila}>
            <Text style={[styles.bannerTitulo, { color: VERDE_400 }]}>¡Correcto!</Text>
            {/* Sin respuesta del servidor todavía no hay número: no se inventa. */}
            {answer?.xp_awarded ? (
              <View style={[styles.fila, { marginLeft: 6, gap: 1 }]}>
                <Text style={[styles.bannerTitulo, { color: VERDE_400 }]}>+{answer.xp_awarded}</Text>
                <XpDots size={14} color={VERDE_400} />
              </View>
            ) : null}
          </View>
          <Text style={styles.bannerCuerpo}>
            Podés continuar o revisar la explicación con el botón de «¿Por qué?».
          </Text>
        </View>
      </Animated.View>
    )
  }
  if (tone === "wrong") {
    const ilegible = answer?.parse_ok === false
    return (
      <Animated.View
        key="banner-seguro"
        entering={SlideInDown.duration(250)}
        exiting={SlideOutDown.duration(250)}
        pointerEvents="none"
        style={styles.banner}
      >
        <View style={[styles.bannerTinte, styles.tinteSeguro, { paddingBottom: reservaAbajo }]}>
          {/* `parse_ok: false` es que no se pudo LEER, no que esté mal. */}
          {ilegible ? (
            <>
              <Text style={[styles.bannerTitulo, { color: "#fff" }]}>No se pudo leer</Text>
              <Text style={styles.bannerCuerpo}>
                Algo falló en la lectura de tu respuesta. Revisá cómo la escribiste.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.bannerTitulo, { color: "#fff" }]}>¿Seguro?</Text>
              <Text style={styles.bannerCuerpo}>
                Podés ayudarte con la tabla <IconoTabla size={14} color={TEMA.foreground} /> o
                revisar la explicación con el botón de «¿Por qué?».
              </Text>
            </>
          )}
        </View>
      </Animated.View>
    )
  }
  return null
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center" },
  digito: {
    height: LINE_PX,
    lineHeight: LINE_PX,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    color: TEMA.foreground,
  },
  emoji: { fontSize: 16, lineHeight: LINE_PX },
  separador: { height: 14, width: StyleSheet.hairlineWidth * 2, backgroundColor: TEMA.border },
  pastilla: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  card: { flex: 1, gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  cuerpo: { flex: 1, gap: 12 },
  promptMarco: {
    flex: 1,
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.background,
    overflow: "hidden",
  },
  promptCaja: { flex: 1, justifyContent: "center", paddingHorizontal: PROMPT_PAD_X },
  formula: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  aro: { borderRadius: 8, borderWidth: 2, borderColor: "#fff" },
  principal: {
    height: CTA_H,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  principalTexto: { color: "#000", fontSize: 16, fontWeight: "700" },
  porque: {
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  porquePlano: { borderWidth: 2, borderColor: TEMA.border, backgroundColor: TEMA.background },
  porqueBlanco: { backgroundColor: "#fff" },
  porqueTexto: { fontSize: 16, fontWeight: "700" },
  banner: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: TEMA.background },
  bannerTinte: { borderTopWidth: 1, paddingTop: 24, paddingHorizontal: 20 },
  tinteCorrecto: { borderTopColor: "rgba(34,197,94,0.5)", backgroundColor: "rgba(34,197,94,0.15)" },
  tinteSeguro: { borderTopColor: "rgba(249,115,22,0.5)", backgroundColor: "rgba(249,115,22,0.20)" },
  bannerTitulo: { fontSize: 15, fontWeight: "600" },
  bannerCuerpo: { marginTop: 12, fontSize: 15, lineHeight: 22, color: "rgba(246,248,252,0.85)" },
})
