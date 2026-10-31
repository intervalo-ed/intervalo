// «Elegí tu @», el par nativo de `web/src/app/derivadas/username-slide.tsx`. El
// campo arranca vacío —el @ generado queda de placeholder, nunca como valor que
// se pueda mandar sin tocar— y Continuar no habilita hasta que hay algo propio
// y válido.
//
// Un 409 (@ tomado) o 422 (inválido) se muestra y no deja seguir: es lo que hay
// que elegir distinto. Cualquier otro error (red, servidor caído) no lo arregla
// reescribir el @, así que se sigue jugando.
//
// «Conectar con Google» guarda antes el @ que haya escrito: se aplica al volver
// (`useGamePlayer`), si la cuenta no tenía uno elegido.

import { useRef, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, unwrap } from "@intervalo/dx-core/api/client"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { gameKeys, type GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import { USERNAME_MAX, normalizeUsername, validateUsername } from "@intervalo/dx-core/username"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { useGoogleLogin } from "@/lib/auth/UseGoogleLogin"
import { BotonCta } from "./boton-cta"
import { CTA_H } from "./exercise-card"
import { GoogleIcon } from "./google-icon"

export function UsernameSlide({
  player,
  onDone,
  onOpenPrivacy,
  onGoogleLogin,
}: {
  player: GamePlayer
  onDone: () => void
  /** La hoja de «¿Qué pasa con mis datos?». Sin ella, el link no se dibuja. */
  onOpenPrivacy?: () => void
  /** Volvió de Google con la sesión activa. En la web la recarga saca a la
   *  persona de esta diapo; acá la saca quien la monta (`onDone` si no viene). */
  onGoogleLogin?: () => void
}) {
  const api = useGameApi()
  const sfx = useSfx()
  const queryClient = useQueryClient()
  const [alias, setAlias] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const savingRef = useRef(false)
  const google = useGoogleLogin()
  const error = alias.length > 0 ? validateUsername(alias) : null
  const puedeContinuar = alias.length > 0 && !error && !google.cargando

  const conectarConGoogle = async () => {
    sfx.select()
    track("game_username_slide_google_tap")
    const ok = await google.login({ alias })
    if (ok) (onGoogleLogin ?? onDone)()
  }

  const finish = async () => {
    if (savingRef.current || !puedeContinuar) return
    savingRef.current = true
    setGuardando(true)
    setSubmitError(null)
    sfx.continue()
    try {
      const updated = unwrap(await api.PATCH("/game/derivemos/me", { body: { alias } }))
      queryClient.setQueryData(gameKeys.me, updated)
      track("game_username_slide_completed", { changed: true })
      onDone()
      return
    } catch (err) {
      track("game_username_slide_completed", { changed: false })
      if (err instanceof ApiError && (err.status === 409 || err.status === 422)) {
        setSubmitError(err.message)
        savingRef.current = false
        setGuardando(false)
        return
      }
      onDone()
    }
  }

  const mensaje = error ?? submitError ?? google.error

  return (
    // `padding` en las dos plataformas: con edge-to-edge (obligatorio en
    // Android desde SDK 53) el sistema ya no achica la ventana, así que el
    // teclado hay que esquivarlo a mano también ahí.
    <KeyboardAvoidingView style={styles.pantalla} behavior="padding">
      <View style={styles.centro}>
        <Text style={styles.titulo}>Elegí tu @</Text>
        <Text style={styles.subtitulo}>Así te van a ver los demás en el ranking.</Text>
        <View style={styles.campo}>
          <Text style={styles.arroba}>@</Text>
          <TextInput
            value={alias}
            onChangeText={(texto) => {
              setAlias(normalizeUsername(texto))
              setSubmitError(null)
            }}
            onSubmitEditing={() => void finish()}
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
        {/* Blanco sólido como el Continuar: es una acción de verdad, no una
            salida. Mide lo mismo que el campo. */}
        <View style={styles.bloqueGoogle}>
          <Pressable
            onPress={() => void conectarConGoogle()}
            disabled={!google.listo || google.cargando}
            accessibilityRole="button"
            accessibilityState={{ disabled: !google.listo || google.cargando }}
            style={({ pressed }) => [
              styles.botonGoogle,
              pressed && { opacity: 0.9 },
              (!google.listo || google.cargando) && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.textoGoogle}>
              {google.cargando ? "Conectando…" : "Conectar con Google"}
            </Text>
            {google.cargando ? <ActivityIndicator size="small" color="#000" /> : <GoogleIcon />}
          </Pressable>
          <Text style={styles.leyendaGoogle}>Vinculá tu cuenta para no perder tu progreso.</Text>
          {onOpenPrivacy && (
            <Pressable onPress={onOpenPrivacy} accessibilityRole="link" hitSlop={8}>
              <Text style={styles.privacidad}>¿Qué pasa con mis datos?</Text>
            </Pressable>
          )}
        </View>
        {mensaje && <Text style={styles.error}>{mensaje}</Text>}
      </View>
      <BotonCta
        texto="Continuar"
        onPress={() => void finish()}
        disabled={!puedeContinuar || guardando}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 20 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  titulo: { fontSize: 24, fontWeight: "700", color: TEMA.foreground, textAlign: "center" },
  subtitulo: {
    fontSize: 14,
    lineHeight: 22,
    color: TEMA.mutedForeground,
    textAlign: "center",
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
  bloqueGoogle: { width: "100%", maxWidth: 320, gap: 8 },
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
  // `text-foreground/55` de la web.
  leyendaGoogle: {
    fontSize: 12,
    lineHeight: 20,
    color: "rgba(246,248,252,0.55)",
    textAlign: "center",
  },
  arroba: { fontSize: 18, color: TEMA.mutedForeground },
  input: { flex: 1, height: 52, fontSize: 16, color: TEMA.foreground },
  // `text-orange-300` de la web.
  error: { fontSize: 14, color: "#fdba74", textAlign: "center" },
  privacidad: {
    fontSize: 12,
    lineHeight: 20,
    color: "rgba(246,248,252,0.45)",
    textDecorationLine: "underline",
    textAlign: "center",
  },
})
