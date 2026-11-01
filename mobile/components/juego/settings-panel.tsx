// Configuración, el par nativo de `web/src/app/derivadas/settings-panel.tsx` en
// su variante de teléfono: una columna de filas cortas —el @, la carrera y la
// universidad, el sonido, cada cuánto sale el ranking, la dificultad, reclutar,
// reiniciar el progreso, la privacidad y cerrar sesión— y tres subpantallas que
// se corren de costado (el @, la carrera y la universidad).
//
// Sin las filas del cafecito: el cafecito no está en la app. Las filas que
// llevan a diapos que todavía no existen acá (dificultad, frecuencia, reclutar)
// se dibujan solo si quien monta el panel pasa su callback.

import { useRef, useState, type ReactNode } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from "react-native"
import Animated, {
  Easing,
  LayoutAnimationConfig,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated"
import Svg, { Line, Path } from "react-native-svg"
import { useQueryClient } from "@tanstack/react-query"
import { ApiError, unwrap } from "@intervalo/dx-core/api/client"
import { careerLabel } from "@intervalo/dx-core/carreras"
import { canonicalUniversity } from "@intervalo/dx-core/university-tags"
import { USERNAME_MAX, normalizeUsername } from "@intervalo/dx-core/username"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { gameKeys, type GamePlayer } from "@intervalo/dx-core/juego/game-keys"
import { textoDeDificultad } from "@intervalo/dx-core/juego/dificultad"
import {
  saveFrecuenciaRanking,
  siguienteFrecuencia,
  textoDeFrecuencia,
  useFrecuenciaRanking,
  type FrecuenciaRanking,
} from "@intervalo/dx-core/juego/ranking-frecuencia"
import { track } from "@/lib/analytics/track"
import { setSoundMuted, useSoundMuted } from "@/lib/audio/sound-settings"
import { useSfx } from "@/lib/audio/UseSfx"
import { useGamePlayer } from "@/lib/juego/UseGamePlayer"
import { abrirPrivacidad } from "@/lib/legal"
import { BotonCta } from "./boton-cta"
import { CareerSelect, UniversityGrid } from "./campos-de-perfil"
import { PASE_MS } from "./capa-deslizante"

type Section = "root" | "alias" | "career" | "university"

// El verde de la tinta de reclutar (cafecito-cta.tsx :: VERDE_TINTA en la web).
const VERDE_TINTA = "#2CB863"
const ROJO = "#E5484D"
const ROJO_TINTA = "rgba(229,72,77,0.8)"
const ROJO_BORDE = "rgba(229,72,77,0.85)"

// Las subpantallas entran por la derecha y salen por la derecha (solo se sale
// de ellas volviendo); la raíz, al revés. Fijo por pantalla y no por pase: la
// animación de salida es la del último render, que todavía no sabía hacia dónde
// se iba.
const PASE = { duration: PASE_MS, easing: Easing.inOut(Easing.ease) }
const ENTRA_SUB = SlideInRight.duration(PASE.duration).easing(PASE.easing)
const SALE_SUB = SlideOutRight.duration(PASE.duration).easing(PASE.easing)
const ENTRA_RAIZ = SlideInLeft.duration(PASE.duration).easing(PASE.easing)
const SALE_RAIZ = SlideOutLeft.duration(PASE.duration).easing(PASE.easing)

export function SettingsPanel({
  player,
  onClose,
  onReset,
  onNeedsRegister,
  onSignedOut,
  onReclutar,
  onDificultad,
  onFrecuencia,
}: {
  player: GamePlayer | null
  onClose: () => void
  /** Reiniciar vence el ejercicio servido: quien monta esto tira el suyo y pide
   *  otro. No es un cierre más. */
  onReset: () => void
  /** El invitado no elige su @: tocar la fila es el gancho del registro. */
  onNeedsRegister: () => void
  /** Ya se cerró la sesión y hay un invitado nuevo en camino. En la web acá se
   *  recarga la página; en la app, quien monta esto vuelve al principio. */
  onSignedOut: () => void
  onReclutar?: () => void
  /** Además del callback, la fila pide el interruptor del servidor. */
  onDificultad?: () => void
  /** Rota en el lugar, como el sonido; avisa el valor nuevo. */
  onFrecuencia?: (valor: FrecuenciaRanking) => void
}) {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const { cerrarSesion } = useGamePlayer()
  const sfx = useSfx()
  const muted = useSoundMuted()
  const frecuencia = useFrecuenciaRanking()
  const [section, setSection] = useState<Section>("root")
  const [alias, setAlias] = useState(player?.alias ?? "")
  const [aliasError, setAliasError] = useState<string | null>(null)
  const [aliasSaved, setAliasSaved] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [busy, setBusy] = useState(false)
  const [career, setCareer] = useState(player?.career ?? "")
  const [university, setUniversity] = useState(player?.university ?? "")
  const [otherUniversity, setOtherUniversity] = useState("")
  const [showOther, setShowOther] = useState(false)
  const otherRef = useRef<TextInputInstance>(null)

  // Los campos siguen al jugador del servidor (llega tarde, o cambia al volver
  // del registro) sin pisar lo que se está tocando. Igual que la web: durante
  // el render, solo cuando cambia el valor del servidor.
  const [perfilSincronizado, setPerfilSincronizado] = useState(player)
  if (player !== null && player !== perfilSincronizado) {
    setPerfilSincronizado(player)
    if (player.alias !== perfilSincronizado?.alias) setAlias(player.alias)
    if (player.university !== perfilSincronizado?.university) setUniversity(player.university ?? "")
    if (player.career !== perfilSincronizado?.career) setCareer(player.career ?? "")
  }

  // Todo cambio de perfil toca la fila propia del ranking (tag, badge, scope).
  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: gameKeys.me })
    void queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
  }

  const saveProfile = async (body: { career?: string; university?: string }) => {
    if (busy) return
    setBusy(true)
    try {
      await api.PATCH("/game/derivemos/me", { body })
      refreshAll()
    } catch {
      // Sin drama: el juego sigue y la próxima vuelta lo reintenta.
    }
    setBusy(false)
    setSection("root")
  }

  const saveAlias = async () => {
    const value = alias.trim()
    if (!value || busy || value === player?.alias) return
    setBusy(true)
    setAliasError(null)
    try {
      unwrap(await api.PATCH("/game/derivemos/me", { body: { alias: value } }))
      track("game_alias_edited", { via: "settings" })
      setAliasSaved(true)
      refreshAll()
    } catch (err) {
      setAliasError(err instanceof ApiError ? err.message : "No se pudo guardar.")
    }
    setBusy(false)
  }

  const reset = async () => {
    if (busy) return
    setBusy(true)
    try {
      unwrap(await api.POST("/game/derivemos/reset"))
      track("game_reset")
      refreshAll()
      onReset()
    } catch {
      setBusy(false)
      setConfirmReset(false)
    }
  }

  const signOut = async () => {
    if (busy) return
    setBusy(true)
    try {
      await cerrarSesion()
      onSignedOut()
    } catch {
      // El signOut de Clerk falló: la sesión sigue como estaba.
      setBusy(false)
    }
  }

  const confirmOther = () => {
    const value = canonicalUniversity(otherUniversity)
    if (!value) return
    void saveProfile({ university: value })
  }

  // El par de `useCta()("share", "click", …)` de la web: PostHog y la base.
  const reclutar = () => {
    if (!onReclutar) return
    sfx.select()
    track("game_share_click", { placement: "settings" })
    void api
      .POST("/game/derivemos/cta", {
        body: { cta: "share", action: "click", placement: "settings", solved: null },
      })
      .catch(() => {})
    onReclutar()
  }

  const volver = () => {
    sfx.select()
    setSection("root")
  }

  const raiz = (
    <PanelShell onBack={onClose}>
      <ScrollView contentContainerStyle={styles.filas} showsVerticalScrollIndicator={false}>
        <Fila
          onPress={() => {
            sfx.select()
            if (player?.is_guest) onNeedsRegister()
            else setSection("alias")
          }}
          etiqueta="Usuario"
        >
          <Text style={[styles.valor, player?.is_guest && { color: TEMA.ring }]}>@{player?.alias ?? ""}</Text>
        </Fila>

        <Fila
          etiqueta="Carrera"
          onPress={() => {
            sfx.select()
            setSection("career")
          }}
        >
          <Text style={styles.valor}>{careerLabel(player?.career)}</Text>
        </Fila>

        <Fila
          etiqueta="Universidad"
          onPress={() => {
            sfx.select()
            setSection("university")
          }}
        >
          <Text style={styles.valor}>{player?.university ?? "Elegir"}</Text>
        </Fila>

        <Fila
          etiqueta="Sonido"
          onPress={() => {
            setSoundMuted(!muted)
            // Se oye solo al prenderlo; `sfx` lee el silencio en el disparo.
            if (muted) sfx.select()
          }}
        >
          <View style={styles.conIcono}>
            <Text style={styles.valor}>{muted ? "Apagado" : "Encendido"}</Text>
            {muted ? <IconoSinSonido /> : <IconoSonido />}
          </View>
        </Fila>

        {onFrecuencia && (
          <Fila
            etiqueta="Ranking"
            onPress={() => {
              sfx.select()
              const valor = siguienteFrecuencia(frecuencia)
              saveFrecuenciaRanking(valor)
              track("game_ranking_frecuencia_chosen", { valor, via: "settings" })
              onFrecuencia(valor)
            }}
          >
            <View style={styles.conIcono}>
              <Text style={styles.valor}>{textoDeFrecuencia(frecuencia)}</Text>
              <IconoTrofeo />
            </View>
          </Fila>
        )}

        {onDificultad && player?.dificultad_disponible && (
          <Fila
            etiqueta="Dificultad"
            onPress={() => {
              sfx.select()
              onDificultad()
            }}
          >
            <View style={styles.conIcono}>
              <Text style={styles.valor}>{textoDeDificultad(player.dificultad)}</Text>
              <IconoPalancas />
            </View>
          </Fila>
        )}

        {onReclutar && (
          <Fila onPress={reclutar} borde="rgba(44,184,99,0.85)">
            <Text style={[styles.texto, { color: VERDE_TINTA }]}>Reclutar compañeros</Text>
            <IconoWhatsapp color={VERDE_TINTA} />
          </Fila>
        )}

        {confirmReset ? (
          <View style={[styles.fila, styles.confirmar]}>
            <Text style={styles.confirmarTitulo}>¿Reiniciar el progreso?</Text>
            <Text style={styles.confirmarTexto}>
              Volvés a cero en XP, racha y dificultad — el ranking te manda al fondo. Tu nombre, carrera y
              universidad quedan como están.
            </Text>
            <View style={styles.confirmarBotones}>
              <Pressable
                onPress={() => setConfirmReset(false)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.botonChico, pressed && styles.apretada]}
              >
                <Text style={styles.texto}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => void reset()}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                style={({ pressed }) => [
                  styles.botonChico,
                  { borderColor: "rgba(229,72,77,0.5)" },
                  pressed && styles.apretada,
                  busy && { opacity: 0.45 },
                ]}
              >
                <Text style={[styles.texto, { color: ROJO, fontWeight: "500" }]}>Reiniciar</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Fila onPress={() => setConfirmReset(true)} borde={ROJO_BORDE}>
            <Text style={[styles.texto, { color: ROJO_TINTA }]}>Reiniciar progreso</Text>
            <IconoReiniciar color={ROJO_TINTA} />
          </Fila>
        )}

        {/* No está en la configuración de la web, que la tiene en el pie de
            página; en la app no hay pie. */}
        <Fila
          onPress={() => {
            sfx.select()
            void abrirPrivacidad()
          }}
        >
          <Text style={styles.texto}>Privacidad</Text>
          <IconoEscudo />
        </Fila>

        {/* El invitado no tiene sesión de Clerk que cerrar. */}
        {!player?.is_guest && (
          <Fila onPress={() => void signOut()} borde={ROJO_BORDE} disabled={busy}>
            <Text style={[styles.texto, { color: ROJO_TINTA }]}>Cerrar sesión</Text>
            <IconoSalir color={ROJO_TINTA} />
          </Fila>
        )}
      </ScrollView>
    </PanelShell>
  )

  const pantalla =
    section === "career" ? (
      // Sin título: la pantalla es una sola pregunta.
      <PanelShell onBack={volver}>
        <ScrollView contentContainerStyle={styles.crece} showsVerticalScrollIndicator={false}>
          <CareerSelect
            value={career}
            onSelect={(value) => {
              // Elegir marca, no guarda: guarda el botón de abajo.
              sfx.select()
              setCareer(value)
            }}
          />
        </ScrollView>
        <BotonCta
          texto="Guardar"
          disabled={!career || busy}
          onPress={() => {
            sfx.select()
            void saveProfile({ career })
          }}
        />
      </PanelShell>
    ) : section === "alias" ? (
      <PanelShell titulo="Usuario" onBack={volver}>
        <View style={[styles.fila, styles.campoAlias]}>
          <Text style={styles.arroba}>@</Text>
          <TextInput
            autoFocus
            value={alias}
            onChangeText={(texto) => {
              setAlias(normalizeUsername(texto))
              setAliasSaved(false)
              setAliasError(null)
            }}
            onSubmitEditing={() => void saveAlias()}
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
            style={styles.inputAlias}
          />
          <Pressable
            onPress={() => void saveAlias()}
            disabled={busy || alias === player?.alias}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Text style={[styles.guardarAlias, (busy || alias === player?.alias) && { color: TEMA.mutedForeground }]}>
              {aliasSaved ? "Guardado" : "Guardar"}
            </Text>
          </Pressable>
        </View>
        {aliasError && <Text style={styles.error}>{aliasError}</Text>}
      </PanelShell>
    ) : section === "university" ? (
      // Sin título: `UniversityGrid` ya entra con su «¿Dónde?».
      <PanelShell onBack={volver}>
        <ScrollView
          contentContainerStyle={styles.crece}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <UniversityGrid
            university={university}
            showOther={showOther}
            otherValue={otherUniversity}
            onOtherChange={setOtherUniversity}
            onPick={(u) => {
              sfx.select()
              setUniversity(u)
              setShowOther(false)
            }}
            onSelectOther={() => {
              sfx.select()
              setUniversity("")
              setShowOther(true)
            }}
            onConfirmOther={confirmOther}
            onPickSuggestion={(key) => {
              sfx.select()
              setOtherUniversity(key)
              otherRef.current?.focus()
            }}
            inputRef={otherRef}
          />
        </ScrollView>
        {/* Un solo botón para la grilla y el campo libre. */}
        <BotonCta
          texto="Guardar"
          disabled={showOther ? !otherUniversity.trim() || busy : !university || busy}
          onPress={() => {
            sfx.select()
            if (showOther) confirmOther()
            else void saveProfile({ university })
          }}
        />
      </PanelShell>
    ) : (
      raiz
    )

  const esRaiz = section === "root"
  return (
    // `padding` en las dos plataformas, como en username-slide.tsx.
    <KeyboardAvoidingView style={styles.contenedor} behavior="padding">
      <LayoutAnimationConfig skipEntering skipExiting>
        <Animated.View
          key={section}
          entering={esRaiz ? ENTRA_RAIZ : ENTRA_SUB}
          exiting={esRaiz ? SALE_RAIZ : SALE_SUB}
          style={StyleSheet.absoluteFill}
        >
          {pantalla}
        </Animated.View>
      </LayoutAnimationConfig>
    </KeyboardAvoidingView>
  )
}

function PanelShell({
  titulo,
  onBack,
  children,
}: {
  titulo?: string
  onBack: () => void
  children: ReactNode
}) {
  return (
    <View style={styles.shell}>
      <View style={styles.cabecera}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={8}
          style={({ pressed }) => [styles.volver, pressed && { backgroundColor: TEMA.accent }]}
        >
          <Trazo size={18} color={TEMA.mutedForeground}>
            <Path d="m15 18-6-6 6-6" />
          </Trazo>
        </Pressable>
        {titulo && <Text style={styles.titulo}>{titulo}</Text>}
      </View>
      {children}
    </View>
  )
}

function Fila({
  etiqueta,
  onPress,
  borde,
  disabled = false,
  children,
}: {
  etiqueta?: string
  onPress: () => void
  borde?: string
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.fila,
        styles.filaBoton,
        borde ? { borderColor: borde } : pressed && styles.apretada,
        pressed && borde && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}
    >
      {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
      {children}
    </Pressable>
  )
}

// Íconos de lucide (los de la web), dibujados con react-native-svg.
type IconoProps = { color?: string }

function Trazo({ size = 16, color, children }: { size?: number; color: string; children: ReactNode }) {
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
      {children}
    </Svg>
  )
}

const PARLANTE =
  "M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"

function IconoSonido({ color = TEMA.foreground }: IconoProps) {
  return (
    <Trazo color={color}>
      <Path d={PARLANTE} />
      <Path d="M16 9a5 5 0 0 1 0 6" />
      <Path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </Trazo>
  )
}

function IconoSinSonido({ color = TEMA.foreground }: IconoProps) {
  return (
    <Trazo color={color}>
      <Path d={PARLANTE} />
      <Line x1={22} x2={16} y1={9} y2={15} />
      <Line x1={16} x2={22} y1={9} y2={15} />
    </Trazo>
  )
}

function IconoTrofeo({ color = TEMA.foreground }: IconoProps) {
  return (
    <Trazo color={color}>
      <Path d="M10 14.66V17a1 1 0 0 1-1 1 2 2 0 0 0-2 2v2" />
      <Path d="M14 14.66V17a1 1 0 0 0 1 1 2 2 0 0 1 2 2v2" />
      <Path d="M17.916 10H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3" />
      <Path d="M4 22h16" />
      <Path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" />
      <Path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3" />
    </Trazo>
  )
}

function IconoPalancas({ color = TEMA.foreground }: IconoProps) {
  return (
    <Trazo color={color}>
      <Path d="M10 8h4" />
      <Path d="M12 21v-9" />
      <Path d="M12 8V3" />
      <Path d="M17 16h4" />
      <Path d="M19 12V3" />
      <Path d="M19 21v-5" />
      <Path d="M3 14h4" />
      <Path d="M5 10V3" />
      <Path d="M5 21v-7" />
    </Trazo>
  )
}

function IconoReiniciar({ color = TEMA.foreground }: IconoProps) {
  return (
    <Trazo color={color}>
      <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <Path d="M3 3v5h5" />
    </Trazo>
  )
}

function IconoEscudo({ color = TEMA.foreground }: IconoProps) {
  return (
    <Trazo color={color}>
      <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Trazo>
  )
}

function IconoSalir({ color = TEMA.foreground }: IconoProps) {
  return (
    <Trazo color={color}>
      <Path d="m16 17 5-5-5-5" />
      <Path d="M21 12H9" />
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </Trazo>
  )
}

// `WhatsappGlyph` de la web (cafecito-cta.tsx): relleno, no trazo.
function IconoWhatsapp({ color = TEMA.foreground }: IconoProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={color}>
      <Path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.17h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.4c0-4.54 3.7-8.23 8.25-8.23a8.23 8.23 0 0 1 8.24 8.24c0 4.54-3.7 8.25-8.24 8.25Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.63 4.18 3.69.58.25 1.04.4 1.4.52.59.18 1.12.16 1.55.1.47-.07 1.46-.6 1.67-1.18.2-.58.2-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
    </Svg>
  )
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, overflow: "hidden" },
  shell: { flex: 1, width: "100%", maxWidth: 448, alignSelf: "center", paddingHorizontal: 16, gap: 16 },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 8 },
  volver: { borderRadius: 6, padding: 6 },
  titulo: { fontSize: 18, fontWeight: "600", color: TEMA.foreground },
  filas: { gap: 8, paddingBottom: 8 },
  crece: { flexGrow: 1, paddingBottom: 16 },
  fila: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TEMA.border,
    backgroundColor: TEMA.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filaBoton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  apretada: { borderColor: "rgba(255,255,255,0.2)" },
  etiqueta: { fontSize: 14, color: TEMA.mutedForeground },
  valor: { fontSize: 14, color: TEMA.foreground, flexShrink: 1, textAlign: "right" },
  texto: { fontSize: 14, color: TEMA.foreground },
  conIcono: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  confirmar: { borderColor: "rgba(229,72,77,0.5)" },
  confirmarTitulo: { fontSize: 14, fontWeight: "500", color: ROJO },
  confirmarTexto: { marginTop: 4, fontSize: 12, lineHeight: 19.5, color: "rgba(246,248,252,0.85)" },
  confirmarBotones: { marginTop: 12, flexDirection: "row", gap: 8 },
  botonChico: {
    flex: 1,
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: TEMA.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  campoAlias: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 0 },
  arroba: { fontSize: 16, color: TEMA.mutedForeground },
  inputAlias: { flex: 1, height: 48, fontSize: 16, color: TEMA.foreground },
  guardarAlias: { fontSize: 12, color: TEMA.ring },
  // `text-orange-300` de la web.
  error: { marginTop: -12, fontSize: 12, color: "#fdba74" },
})
