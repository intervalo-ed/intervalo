// Reclutar desde la app (web/src/app/derivadas/cafecito-cta.tsx :: ReclutarButton,
// ShareButton, WhatsappGlyph). En la web es un link a wa.me; acá es la hoja de
// compartir del sistema con el mismo link, así se elige WhatsApp o lo que sea.

import { useEffect } from "react"
import { Pressable, Share, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native"
import Svg, { Path } from "react-native-svg"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { shareLink, VERDE, VERDE_TINTA, VERDE_TINTA_OSCURA } from "@intervalo/dx-core/juego/reclutas"
import { useCta, type CtaOptions } from "@/lib/analytics/UseCta"
import { useSfx } from "@/lib/audio/UseSfx"
import { env } from "@/lib/env"
import { CTA_H } from "./exercise-card"

const WHATSAPP_PATH =
  "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.17h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.4c0-4.54 3.7-8.23 8.25-8.23a8.23 8.23 0 0 1 8.24 8.24c0 4.54-3.7 8.25-8.24 8.25Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.63 4.18 3.69.58.25 1.04.4 1.4.52.59.18 1.12.16 1.55.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z"

/** El logo de WhatsApp, relleno como lo dibuja WhatsApp. */
export function WhatsappGlyph({ size = 16, color = VERDE }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} accessibilityElementsHidden importantForAccessibility="no">
      <Path d={WHATSAPP_PATH} />
    </Svg>
  )
}

/** El link a /derivadas con el @ de quien comparte, en la hoja del sistema.
 *  Devuelve si se compartió (en Android siempre sí: el sistema no avisa). */
async function compartir(alias?: string | null): Promise<boolean> {
  try {
    const r = await Share.share({ message: shareLink({ alias, base: `${env.webUrl}/derivadas` }) })
    return r.action === Share.sharedAction
  } catch {
    return false
  }
}

/** El botón verde de reclutar: `VERDE` con letra oscura y el logo después de la
 *  palabra. Anota el click (`share click`) y abre la hoja de compartir. */
export function ReclutarButton({
  alias,
  placement,
  solved,
  label = "Reclutar",
  compacto = false,
  telemetryProps,
  onShared,
  style,
}: {
  alias?: string | null
  placement: string
  solved?: number
  label?: string
  /** Más bajo y angosto, para ir al lado de otro botón. Sin él, alto de CTA. */
  compacto?: boolean
  telemetryProps?: CtaOptions["props"]
  /** La hoja se cerró compartiendo. */
  onShared?: () => void
  style?: StyleProp<ViewStyle>
}) {
  const cta = useCta()
  const sfx = useSfx()
  return (
    <Pressable
      onPress={() => {
        sfx.select()
        cta("share", "click", { placement, solved, props: telemetryProps })
        void compartir(alias).then((ok) => {
          if (ok) onShared?.()
        })
      }}
      accessibilityRole="button"
      accessibilityLabel={`${label} por WhatsApp`}
      style={({ pressed }) => [
        styles.reclutar,
        compacto ? styles.reclutarCompacto : { height: CTA_H },
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      <Text style={[styles.textoReclutar, compacto && { fontSize: 14 }]}>{label}</Text>
      <WhatsappGlyph size={compacto ? 15 : 18} color={VERDE_TINTA_OSCURA} />
    </Pressable>
  )
}

// Una impresión por placement y por sesión de la app, como `useImpresionPorPartida`
// de la web: la cabecera se remonta en cada cambio de diapo.
const impresionesAnotadas = new Set<string>()

/** El botón de compartir de la cabecera del juego. En la web abre la diapo
 *  `¿Reclutas?`; acá comparte directo. */
export function BotonCompartirCabecera({ alias, placement }: { alias?: string | null; placement: string }) {
  const cta = useCta()
  const sfx = useSfx()
  useEffect(() => {
    if (impresionesAnotadas.has(placement)) return
    impresionesAnotadas.add(placement)
    cta("share", "impression", { placement })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Pressable
      onPress={() => {
        sfx.select()
        cta("share", "click", { placement })
        void compartir(alias)
      }}
      accessibilityRole="button"
      accessibilityLabel="Reclutar por WhatsApp"
      hitSlop={4}
      style={({ pressed }) => [styles.cabecera, pressed && styles.apretado]}
    >
      <WhatsappGlyph size={15} color={VERDE_TINTA} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  reclutar: {
    borderRadius: 6,
    backgroundColor: VERDE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reclutarCompacto: { height: 40, paddingHorizontal: 14 },
  textoReclutar: { color: VERDE_TINTA_OSCURA, fontSize: 16, fontWeight: "700" },
  // Las medidas de `BotonDeCabecera` (game-header.tsx), con el borde verde al
  // 60% de la web (`${VERDE_TINTA}99`).
  cabecera: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${VERDE_TINTA}99`,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  apretado: { backgroundColor: TEMA.accent },
})
