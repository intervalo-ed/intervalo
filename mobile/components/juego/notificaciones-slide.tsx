// La diapo que ofrece los recordatorios del juego: el par nativo de
// `web/src/app/derivadas/pedido-notificaciones.tsx` (variante del teléfono, con
// los dos botones en el pie). Pide un permiso del sistema que se quema para
// siempre si dicen que no, por eso tiene botón de color y cuenta regresiva antes
// de poder saltearla.
//
// El horario se elige acá y no después en ajustes. En la web es un `<select>`;
// acá es una rueda de hora y minutos (de a 15) que se desliza, sin abrir nada
// encima de la diapo.

import { useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import { Text } from "@/components/texto"
import Svg, { Circle, Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { DEFAULT_REMINDER_TIME } from "@intervalo/dx-core/juego/horarios-de-aviso"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { usePrenderAvisosNativos } from "@/lib/avisos/UseAvisosNativos"
import { Boton3D } from "./boton-3d"
import { CTA_H } from "./exercise-card"
import { RuedaDeHora } from "./rueda-de-hora"
import { FUENTE } from "@/lib/tipografia"

// Lo mismo que espera la diapo de reclutas; en cero en desarrollo para que el
// autoplay no se trabe.
const ESPERA_S = __DEV__ ? 0 : 8

const INDIGO = "#7e80f7"
const LABIO_INDIGO = "#4F52C9"

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
          {/* Sin el cafecito de la web: en la app no existe. */}
          <Text style={styles.parrafo}>
            Te van a llegar a la hora que elijas: cuando alguien te pase en el ranking o simplemente
            para no perder el ritmo.
          </Text>

          <View style={styles.etiqueta}>
            <IconoReloj size={16} color={TEXTO_SUAVE} />
            <Text style={styles.textoEtiqueta}>Recordarme a las</Text>
          </View>
          <View style={styles.rueda}>
            <RuedaDeHora
              hora={hora}
              onCambio={(t) => {
                if (t === hora) return
                sfx.select()
                setHora(t)
              }}
            />
          </View>

          {fallo && (
            <Text style={styles.error}>
              No se pudo activar. Puede que el teléfono tenga las notificaciones bloqueadas.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.salida}>
        <Boton3D
          contorno
          alto={CTA_H}
          disabled={!listo}
          onPress={() => {
            sfx.select()
            onContinue()
          }}
        >
          <Text style={styles.textoSalida}>{listo ? "Ahora no" : `Ahora no (${restante})`}</Text>
        </Boton3D>
      </View>
      <View style={styles.activar}>
        <Boton3D
          cara={INDIGO}
          labio={LABIO_INDIGO}
          alto={CTA_H}
          disabled={cargando}
          accessibilityState={{ busy: cargando }}
          onPress={() => {
            sfx.select()
            setFallo(false)
            prender(hora)
          }}
        >
          <IconoCampana size={20} color="#fff" />
          <Text style={styles.textoActivar}>{cargando ? "Activando…" : "Activar"}</Text>
        </Boton3D>
      </View>
    </View>
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
    fontFamily: FUENTE.medio,
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
  rueda: { marginTop: 10 },
  // `mt-3 text-sm text-foreground/60`.
  error: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(246, 248, 252, 0.6)",
    textAlign: "center",
  },
  salida: { marginTop: 12 },
  textoSalida: { fontSize: 16, color: TEMA.mutedForeground },
  activar: { marginTop: 8 },
  textoActivar: { color: "#fff", fontSize: 16, fontFamily: FUENTE.seminegrita },
})
