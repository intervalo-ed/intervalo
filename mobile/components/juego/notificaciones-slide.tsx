// La diapo que ofrece los recordatorios del juego: el par nativo de
// `web/src/app/derivadas/pedido-notificaciones.tsx` (variante del teléfono, con
// los dos botones en el pie). Pide un permiso del sistema que se quema para
// siempre si dicen que no, por eso tiene botón de color y cuenta regresiva antes
// de poder saltearla.
//
// El horario se elige acá y no después en ajustes. En la web es un `<select>`;
// acá es una tira de horarios que se desliza: son quince, se ven varios a la vez
// y se elige con un toque, sin abrir nada encima de la diapo.

import { useEffect, useRef, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native"
import * as Haptics from "expo-haptics"
import Svg, { Circle, Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { DEFAULT_REMINDER_TIME, REMINDER_TIME_OPTIONS } from "@intervalo/dx-core/juego/horarios-de-aviso"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { usePrenderAvisosNativos } from "@/lib/avisos/UseAvisosNativos"
import { CTA_H } from "./exercise-card"

// Lo mismo que espera la diapo de reclutas; en cero en desarrollo para que el
// autoplay no se trabe.
const ESPERA_S = __DEV__ ? 0 : 8

const INDIGO = "#7e80f7"
const INDIGO_RGB = [0x7e, 0x80, 0xf7] as const

const ANCHO_CHIP = 64
const HUECO_CHIP = 8

function useCuentaRegresiva(segundos: number): number {
  const [restante, setRestante] = useState(segundos)
  useEffect(() => {
    if (segundos <= 0) return
    const t = setInterval(() => setRestante((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(t)
  }, [segundos])
  return restante
}

export function NotificacionesSlide({ onContinue }: { onContinue: () => void }) {
  const sfx = useSfx()
  const [hora, setHora] = useState(DEFAULT_REMINDER_TIME)
  const [fallo, setFallo] = useState(false)
  const { prender, cargando } = usePrenderAvisosNativos({
    onSuccess: onContinue,
    onError: () => setFallo(true),
  })
  const restante = useCuentaRegresiva(ESPERA_S)
  const listo = restante === 0

  useEffect(() => {
    track("game_notify_hint_shown")
  }, [])

  return (
    <View style={styles.pantalla}>
      <View style={styles.centro}>
        <View style={styles.caja}>
          <View style={styles.icono}>
            <IconoCampana size={32} color={INDIGO} />
          </View>
          <Text style={styles.titulo}>Activá los recordatorios</Text>
          <Text style={styles.parrafo}>
            Te van a llegar a la hora que elijas: cuando alguien te pase en el ranking, cuando haya
            cafecito para tu universidad, o simplemente para no perder el ritmo.
          </Text>

          <View style={styles.etiqueta}>
            <IconoReloj size={16} color={TEXTO_SUAVE} />
            <Text style={styles.textoEtiqueta}>Recordarme a las</Text>
          </View>
          <TiraDeHorarios
            hora={hora}
            onElegir={(t) => {
              if (t === hora) return
              sfx.select()
              void Haptics.selectionAsync()
              setHora(t)
            }}
          />

          {fallo && (
            <Text style={styles.error}>
              No se pudo activar. Puede que el teléfono tenga las notificaciones bloqueadas.
            </Text>
          )}
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
          {listo ? "Ahora no" : `Ahora no (${restante})`}
        </Text>
      </Pressable>
      <Pressable
        disabled={cargando}
        onPress={() => {
          sfx.select()
          setFallo(false)
          prender(hora)
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled: cargando, busy: cargando }}
        style={({ pressed }) => [styles.activar, pressed && { opacity: 0.9 }, cargando && { opacity: 0.6 }]}
      >
        <IconoCampana size={20} color="#fff" />
        <Text style={styles.textoActivar}>{cargando ? "Activando…" : "Activar"}</Text>
      </Pressable>
    </View>
  )
}

function TiraDeHorarios({ hora, onElegir }: { hora: string; onElegir: (t: string) => void }) {
  const ref = useRef<ScrollViewInstance>(null)
  const [ancho, setAncho] = useState(0)

  // Arranca con el horario elegido centrado: el de por defecto (19:00) cae
  // cerca del final y sin esto quedaría fuera de la pantalla.
  useEffect(() => {
    if (!ancho) return
    const i = Math.max(0, REMINDER_TIME_OPTIONS.indexOf(hora))
    const x = i * (ANCHO_CHIP + HUECO_CHIP) - (ancho - ANCHO_CHIP) / 2
    ref.current?.scrollTo({ x: Math.max(0, x), animated: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancho])

  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={styles.tira}
      contentContainerStyle={styles.tiraContenido}
    >
      {REMINDER_TIME_OPTIONS.map((t) => {
        const activo = t === hora
        return (
          <Pressable
            key={t}
            onPress={() => onElegir(t)}
            accessibilityRole="radio"
            accessibilityState={{ selected: activo }}
            style={({ pressed }) => [
              styles.chip,
              activo && styles.chipActivo,
              pressed && !activo && { backgroundColor: TEMA.accent },
            ]}
          >
            <Text style={[styles.textoChip, activo && { color: TEMA.foreground, fontWeight: "600" }]}>{t}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

// Íconos de lucide (los de la web), dibujados con react-native-svg.
type IconoProps = { size: number; color: string }

function IconoCampana({ size, color }: IconoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M10.268 21a2 2 0 0 0 3.464 0" />
      <Path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
    </Svg>
  )
}

function IconoReloj({ size, color }: IconoProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 6v6l4 2" />
    </Svg>
  )
}

// `text-foreground/70`.
const TEXTO_SUAVE = "rgba(246, 248, 252, 0.7)"

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
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
  // `mt-3 leading-relaxed text-foreground/70`.
  parrafo: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 26,
    color: TEXTO_SUAVE,
    textAlign: "center",
  },
  etiqueta: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  textoEtiqueta: { fontSize: 16, color: TEXTO_SUAVE },
  // La tira sale del relleno de la caja para que los horarios lleguen al borde.
  tira: { marginTop: 10, marginHorizontal: -24, flexGrow: 0 },
  tiraContenido: { paddingHorizontal: 24, gap: HUECO_CHIP },
  chip: {
    width: ANCHO_CHIP,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.background,
    alignItems: "center",
  },
  chipActivo: {
    borderColor: INDIGO,
    backgroundColor: `rgba(${INDIGO_RGB.join(", ")}, 0.18)`,
  },
  textoChip: { fontSize: 15, color: TEMA.mutedForeground, fontVariant: ["tabular-nums"] },
  // `mt-3 text-sm text-foreground/60`.
  error: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(246, 248, 252, 0.6)",
    textAlign: "center",
  },
  salida: {
    marginTop: 12,
    height: CTA_H,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.background,
    alignItems: "center",
    justifyContent: "center",
  },
  textoSalida: { fontSize: 16, color: TEMA.mutedForeground },
  activar: {
    marginTop: 8,
    height: CTA_H,
    borderRadius: 6,
    backgroundColor: INDIGO,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  textoActivar: { color: "#fff", fontSize: 16, fontWeight: "600" },
})
