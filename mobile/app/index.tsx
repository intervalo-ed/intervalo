// Pantalla de depuración, provisoria: muestra que el almacén, el rescate del
// llavero y el alta del jugador funcionan de punta a punta.

import { Platform, ScrollView, StyleSheet, Text, View } from "react-native"
import { Stack } from "expo-router"
import { useAuth } from "@clerk/expo"
import { useRescate } from "@/lib/almacen/rescate-context"
import { useGamePlayer, useGameToken } from "@/lib/juego/UseGamePlayer"
import { env } from "@/lib/env"

export default function Depuracion() {
  const rescate = useRescate()
  const token = useGameToken()
  const { isLoaded } = useAuth()
  const { player, isSignedIn, error } = useGamePlayer()

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.pantalla}
    >
      <Stack.Screen options={{ title: "Derivadas · debug" }} />
      <Fila etiqueta="Plataforma" valor={Platform.OS} />
      <Fila etiqueta="API" valor={env.apiUrl || "(sin EXPO_PUBLIC_API_URL)"} />
      <Fila
        etiqueta="Rescate"
        valor={
          rescate === null
            ? "—"
            : `sinTokenLocal: ${rescate.sinTokenLocal} · rescatado: ${rescate.rescatado}`
        }
      />
      <Fila etiqueta="Token" valor={token ? `${token.slice(0, 6)}…` : "(ninguno)"} />
      <Fila etiqueta="Clerk" valor={!isLoaded ? "cargando…" : isSignedIn ? "con sesión" : "sin sesión"} />
      <Fila
        etiqueta="/me"
        valor={player ? `@${player.alias} · id ${player.player_id}${player.is_guest ? " · invitado" : ""}` : error ? "—" : "cargando…"}
      />
      {error ? <Text style={styles.error}>{String(error)}</Text> : null}
    </ScrollView>
  )
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <Text selectable>{valor}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: { padding: 20, gap: 14 },
  fila: { gap: 2 },
  etiqueta: { fontSize: 12, color: "#666", textTransform: "uppercase" },
  error: { color: "#b00020" },
})
