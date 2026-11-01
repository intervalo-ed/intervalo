// La barra de arriba del juego (web/src/app/derivadas/mobile-flow.tsx ::
// GameHeader): configuración a la izquierda, y a la derecha tabla, estadísticas,
// chat y compartir. Va en el ejercicio, el ranking, las novedades y el chat.
//
// Cada botón aparece solo si viene su callback: así quien la monta decide qué
// va en cada pantalla (la tabla no va en el ejercicio, que la tiene en el pie;
// las estadísticas, recién desde la derivada 3). El cafecito no va.
//
// No se ocupa del área segura: la raíz del flujo ya baja todo `insets.top`.

import type { ReactNode } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { BotonCompartirCabecera } from "./boton-reclutar"
import { IconoChat, IconoConfiguracion, IconoEstadisticas, IconoTabla } from "./iconos-cabecera"

const ICONO = 15
const ICONO_CONFIG = 17

export function GameHeader({
  onSettings,
  onTable,
  onStats,
  onChat,
  chatSinVer = false,
  onReclutar,
}: {
  onSettings?: () => void
  onTable?: () => void
  onStats?: () => void
  onChat?: () => void
  // El punto del chat: hay algo sin ver. Un punto y no un número, como en la web.
  chatSinVer?: boolean
  // Compartir, el último de la derecha como en la web: abre la diapo de
  // reclutar (el botón ya toca su sonido y anota impresión y click).
  onReclutar?: () => void
}) {
  return (
    <View style={styles.barra}>
      {onSettings ? (
        <Pressable
          onPress={onSettings}
          accessibilityRole="button"
          accessibilityLabel="Configuración"
          hitSlop={8}
          style={({ pressed }) => [styles.config, pressed && styles.apretado]}
        >
          <IconoConfiguracion size={ICONO_CONFIG} color={TEMA.mutedForeground} />
        </Pressable>
      ) : (
        <View />
      )}
      <View style={styles.derecha}>
        {onTable && (
          <BotonDeCabecera etiqueta="Ver la tabla de derivadas" onPress={onTable}>
            <IconoTabla size={ICONO} color={TEMA.mutedForeground} />
          </BotonDeCabecera>
        )}
        {onStats && (
          <BotonDeCabecera etiqueta="Ver tus estadísticas" onPress={onStats}>
            <IconoEstadisticas size={ICONO} color={TEMA.mutedForeground} />
          </BotonDeCabecera>
        )}
        {onChat && (
          <BotonDeCabecera etiqueta="Abrir el chat" onPress={onChat}>
            <IconoChat size={ICONO} color={TEMA.mutedForeground} />
            {chatSinVer && <View style={styles.punto} />}
          </BotonDeCabecera>
        )}
        {onReclutar && <BotonCompartirCabecera placement="header_mobile" onOpen={onReclutar} />}
      </View>
    </View>
  )
}

function BotonDeCabecera({
  etiqueta,
  onPress,
  children,
}: {
  etiqueta: string
  onPress: () => void
  children: ReactNode
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      hitSlop={4}
      style={({ pressed }) => [styles.boton, pressed && styles.apretado]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  barra: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  config: { borderRadius: 6, padding: 4 },
  derecha: { flexDirection: "row", alignItems: "center", gap: 6 },
  boton: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  apretado: { backgroundColor: TEMA.accent },
  punto: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEMA.primary,
  },
})
