// El hito 2, registro con Google: el par nativo de `RegisterSlide` de
// web/src/app/derivadas/register-slides.tsx, como la dibuja el teléfono.
//
// En la web, volver de Google es una recarga que saca a la persona de esta
// diapo; acá no se va nunca de la app, así que la saca quien la monta
// (`onLoggedIn`). El @ deseado lo aplica `useGamePlayer` al ver la sesión.
//
// `desdeConfiguracion`: se llega tocando "Usuario" en Configuración siendo
// invitado. Ahí no hay "Ahora no" (la tuerca de la cabecera ya es la vuelta) y
// el pie dice "Guardar": el mismo PATCH de Configuración, no el registro.

import { useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import Svg, { Path } from "react-native-svg"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, unwrap } from "@intervalo/dx-core/api/client"
import { TEMA, levelColor } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { gameKeys, type GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import { SIN_SCOPE } from "@intervalo/dx-core/juego/ranking-reglas"
import { useGameLeaderboard, useGameRecruits } from "@intervalo/dx-core/juego/UseGameLeaderboard"
import { USERNAME_MAX, normalizeUsername } from "@intervalo/dx-core/username"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { useGoogleLogin } from "@/lib/auth/UseGoogleLogin"
import { BotonCta } from "./boton-cta"
import { CTA_H } from "./exercise-card"
import { GoogleIcon } from "./google-icon"
import { ESTILOS_FILA } from "./ranking/skeleton"
import { XpDots } from "./xp-dots"

// El `VERDE` de cafecito-cta.tsx en la web: la XP que dieron los reclutas.
const VERDE = "#25D366"
// `text-green-400`.
const VERDE_400 = "#4ade80"

/** La fila propia del ranking, en miniatura: puesto, @ del color de su nivel,
 *  cuánto subió y XP. Con la caja de las filas de verdad (`ESTILOS_FILA`). */
function FilaPropia({ player, delta }: { player: GamePlayer; delta: number }) {
  const rank = player.rank ?? null
  return (
    <View style={[ESTILOS_FILA.fila, ESTILOS_FILA.propia, styles.filaPropia]}>
      {rank !== null && <Text style={ESTILOS_FILA.puesto}>{rank}</Text>}
      <Text style={[styles.filaAlias, { color: levelColor(player.level) }]} numberOfLines={1}>
        {player.alias}
      </Text>
      {delta > 0 && (
        <View style={styles.filaDelta} accessible accessibilityLabel={`subió ${delta} puestos`}>
          <Svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke={VERDE_400}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="m5 12 7-7 7 7M12 19V5" />
          </Svg>
          <Text style={styles.filaDeltaNumero}>{delta}</Text>
        </View>
      )}
      <View style={styles.filaXp}>
        <Text style={styles.filaXpNumero}>{player.xp}</Text>
        <XpDots size={12} />
      </View>
    </View>
  )
}

export function RegistroSlide({
  player,
  onSkip,
  onLoggedIn,
  onOpenPrivacy,
  desdeConfiguracion = false,
}: {
  player: GamePlayer
  /** "Ahora no" en el hito; "Guardar" (con o sin cambio) desde Configuración. */
  onSkip: () => void
  /** Volvió de Google con la sesión activa. */
  onLoggedIn: () => void
  /** La hoja de «¿Qué pasa con mis datos?». Sin ella, el link no se dibuja. */
  onOpenPrivacy?: () => void
  desdeConfiguracion?: boolean
}) {
  const api = useGameApi()
  const sfx = useSfx()
  const queryClient = useQueryClient()
  const google = useGoogleLogin()
  const [desired, setDesired] = useState("")
  const [savingAlias, setSavingAlias] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  // El mismo `rank_delta` que la fila del ranking individual sin acotar, con la
  // misma clave de caché: si ya está cargado, no pide nada.
  const miEntrada = useGameLeaderboard(SIN_SCOPE, true).data?.pages[0]?.entries.find(
    (e) => e.is_current_player,
  )

  // Solo cuando hay algo que cobrar: «ya te dieron 0 XP» sería peor que nada.
  const { data } = useGameRecruits(true)
  const entries = data?.entries ?? []
  const xpReclutas = entries.reduce((total, r) => total + r.xp_given, 0)
  const reclutas = xpReclutas > 0 ? { xp: xpReclutas, gente: entries.length } : null

  const conectarConGoogle = async () => {
    if (!google.listo || google.cargando) return
    sfx.select()
    setErrorGuardar(null)
    track("game_register_slide_shown", { slide: "google_tap" })
    const ok = await google.login({ alias: desired })
    if (ok) onLoggedIn()
  }

  // El backend decide: un invitado que todavía no gastó su edición gratis
  // guarda; si ya la gastó, 403, y el error señala el botón de Google.
  const guardarAlias = async () => {
    if (savingAlias) return
    const value = desired.trim()
    if (!value || value === player.alias) {
      onSkip()
      return
    }
    setSavingAlias(true)
    setErrorGuardar(null)
    google.limpiarError()
    try {
      const updated = unwrap(await api.PATCH("/game/derivemos/me", { body: { alias: value } }))
      queryClient.setQueryData(gameKeys.me, updated)
      void queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
      track("game_alias_edited", { via: "settings_register" })
      onSkip()
    } catch (err) {
      setErrorGuardar(err instanceof ApiError ? err.message : "No se pudo guardar.")
    }
    setSavingAlias(false)
  }

  const error = errorGuardar ?? google.error
  const googleDeshabilitado = !google.listo || google.cargando

  const botonGoogle = (
    <Pressable
      onPress={() => void conectarConGoogle()}
      disabled={googleDeshabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: googleDeshabilitado }}
      style={({ pressed }) => [
        styles.botonGoogle,
        pressed && { opacity: 0.9 },
        googleDeshabilitado && { opacity: 0.5 },
      ]}
    >
      {google.cargando ? <ActivityIndicator size="small" color="#000" /> : <GoogleIcon />}
      <Text style={styles.textoGoogle}>
        {google.cargando ? "Conectando…" : "Continuar con Google"}
      </Text>
    </Pressable>
  )

  const linkPrivacidad = onOpenPrivacy && (
    <Pressable onPress={onOpenPrivacy} accessibilityRole="link" hitSlop={8}>
      <Text style={styles.privacidad}>¿Qué pasa con mis datos?</Text>
    </Pressable>
  )

  return (
    <KeyboardAvoidingView style={styles.pantalla} behavior="padding">
      <ScrollView
        style={styles.cuerpo}
        contentContainerStyle={styles.centro}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {desdeConfiguracion ? (
          <Text style={styles.titulo}>Elegí tu @</Text>
        ) : reclutas ? (
          <>
            <Text style={styles.titulo}>
              Ya te dieron <Text style={[styles.numero, { color: VERDE }]}>{reclutas.xp} XP</Text>
            </Text>
            <Text style={styles.parrafo}>
              {reclutas.gente === 1
                ? "Alguien entró por tu link y suma para vos."
                : `${reclutas.gente} personas entraron por tu link y suman para vos.`}
              {"\n"}Sin cuenta, todo eso vive solo en este teléfono.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.titulo}>¡Guardá tu progreso!</Text>
            <Text style={styles.parrafo}>
              Ya llevás <Text style={styles.resaltado}>{player.exercises_correct}</Text>{" "}
              {player.exercises_correct === 1 ? "derivada resuelta" : "derivadas resueltas"}.
            </Text>
            <FilaPropia player={player} delta={miEntrada?.rank_delta ?? 0} />
          </>
        )}
        {desdeConfiguracion && (
          <View style={styles.campo}>
            <Text style={styles.arroba}>@</Text>
            <TextInput
              value={desired}
              onChangeText={(texto) => {
                setDesired(normalizeUsername(texto))
                setErrorGuardar(null)
              }}
              onSubmitEditing={() => void guardarAlias()}
              placeholder={player.alias}
              placeholderTextColor={TEMA.mutedForeground}
              maxLength={USERNAME_MAX}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
              keyboardType={Platform.OS === "ios" ? "ascii-capable" : "visible-password"}
              keyboardAppearance="dark"
              returnKeyType="done"
              submitBehavior="submit"
              selectionColor={TEMA.ring}
              style={styles.input}
            />
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        {/* Desde Configuración el de Google queda en la caja: es otra acción,
            crear la cuenta, no otra manera de "Guardar". */}
        {desdeConfiguracion && (
          <View style={styles.bloque}>
            {player.is_guest && botonGoogle}
            {linkPrivacidad}
          </View>
        )}
      </ScrollView>
      {desdeConfiguracion ? (
        <BotonCta
          texto={savingAlias ? "Guardando…" : "Guardar"}
          onPress={() => void guardarAlias()}
          disabled={savingAlias}
        />
      ) : (
        // "Ahora no" arriba del botón de color, como el pie del teléfono en la
        // web; el link de datos último: no es una salida, es una aclaración.
        <View style={styles.pie}>
          <Pressable onPress={onSkip} accessibilityRole="button" style={styles.ahoraNo}>
            <Text style={styles.textoAhoraNo}>Ahora no</Text>
          </Pressable>
          {botonGoogle}
          {linkPrivacidad}
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 16 },
  cuerpo: { flex: 1 },
  // Más relleno arriba que abajo (`pb-2 pt-12`): centrado de verdad se leía
  // pegado al techo, con «Ahora no» abajo que no pesa.
  centro: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingTop: 48,
    paddingBottom: 8,
  },
  titulo: { fontSize: 24, fontWeight: "700", color: TEMA.foreground, textAlign: "center" },
  numero: { fontVariant: ["tabular-nums"] },
  parrafo: { fontSize: 14, lineHeight: 22, color: TEMA.mutedForeground, textAlign: "center" },
  resaltado: { color: TEMA.foreground },
  filaPropia: { width: "100%", maxWidth: 320 },
  filaAlias: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  filaDelta: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 2 },
  filaDeltaNumero: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: VERDE_400,
    fontVariant: ["tabular-nums"],
  },
  filaXp: { flexShrink: 0, flexDirection: "row", alignItems: "center", gap: 4 },
  filaXpNumero: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: TEMA.foreground,
    fontVariant: ["tabular-nums"],
  },
  campo: {
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: TEMA.ring,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
  },
  arroba: { fontSize: 18, color: TEMA.mutedForeground },
  input: { flex: 1, height: 52, fontSize: 16, color: TEMA.foreground },
  // `text-orange-300`.
  error: { fontSize: 14, color: "#fdba74", textAlign: "center" },
  bloque: { width: "100%", maxWidth: 320, gap: 8 },
  pie: { gap: 8 },
  ahoraNo: { paddingVertical: 8, alignItems: "center" },
  textoAhoraNo: { fontSize: 14, color: TEMA.mutedForeground },
  botonGoogle: {
    height: CTA_H,
    borderRadius: 6,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  textoGoogle: { color: "#000", fontSize: 16, fontWeight: "700" },
  // `text-foreground/45`.
  privacidad: {
    fontSize: 12,
    lineHeight: 20,
    color: "rgba(246,248,252,0.45)",
    textDecorationLine: "underline",
    textAlign: "center",
  },
})
