// Carrera y después universidad, el par nativo de `ProfileSlides` en
// `web/src/app/derivadas/register-slides.tsx`. Las dos preguntas son una sola
// diapo del flujo: entre una y otra la cara se desliza adentro, sin cambiar de
// diapo. Todo se puede saltear con «Ahora no».

import { useEffect, useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from "react-native"
import Animated, { SlideInRight, SlideOutLeft } from "react-native-reanimated"
import { TEMA } from "@intervalo/dx-core/juego/game-colors"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { canonicalUniversity } from "@intervalo/dx-core/university-tags"
import { track } from "@/lib/analytics/track"
import { useSfx } from "@/lib/audio/UseSfx"
import { BotonCta } from "./boton-cta"
import { CareerSelect, UniversityGrid } from "./campos-de-perfil"
import { PASE_MS } from "./capa-deslizante"

export function PerfilSlides({
  onDone,
  onSkip,
}: {
  /** Ya guardó (o falló sin drama) y ya sonó el `continue`. */
  onDone: (data: { career: string; university: string }) => void
  onSkip: () => void
}) {
  const sfx = useSfx()
  const api = useGameApi()
  const [phase, setPhase] = useState<"career" | "university">("career")
  const [career, setCareer] = useState("")
  const [university, setUniversity] = useState("")
  const [universityOther, setUniversityOther] = useState("")
  const [showOther, setShowOther] = useState(false)
  const inputRef = useRef<TextInputInstance>(null)
  const [saving, setSaving] = useState(false)
  // Se sale UNA vez, guardando o salteando: un ref porque dos toques en el mismo
  // instante leían `saving` los dos en `false`. Y se suelta al rato, por si pedir
  // la derivada siguiente falla y la diapo no se va.
  const saliendoRef = useRef(false)
  const soltarRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (soltarRef.current) clearTimeout(soltarRef.current)
    },
    [],
  )
  const soltarLuego = () => {
    if (soltarRef.current) clearTimeout(soltarRef.current)
    soltarRef.current = setTimeout(() => {
      saliendoRef.current = false
      setSaving(false)
    }, 1500)
  }

  const finish = async (chosenUniversity: string) => {
    if (saliendoRef.current) return
    saliendoRef.current = true
    setSaving(true)
    sfx.continue()
    try {
      await api.PATCH("/game/derivemos/me", {
        body: { career, university: chosenUniversity },
      })
    } catch {
      // Sin drama: el juego sigue; la próxima vuelta lo reintenta.
    }
    track("game_register_completed", { slide: "profile" })
    onDone({ career, university: chosenUniversity })
    soltarLuego()
  }

  const confirmOther = () => {
    const value = canonicalUniversity(universityOther)
    if (!value) return
    void finish(value)
  }

  const elegirCarrera = (v: string) => {
    sfx.select()
    setCareer(v)
  }
  const elegirUniversidad = (u: string) => {
    sfx.select()
    setUniversity(u)
    setShowOther(false)
  }
  const abrirOtra = () => {
    sfx.select()
    setUniversity("")
    setShowOther(true)
  }
  const pasarAUniversidad = () => {
    sfx.continue()
    track("game_register_slide_shown", { slide: "university" })
    setPhase("university")
  }
  const saltar = () => {
    if (saliendoRef.current) return
    saliendoRef.current = true
    onSkip()
    soltarLuego()
  }

  const continuar =
    phase === "career"
      ? { onPress: pasarAUniversidad, disabled: !career }
      : showOther
        ? { onPress: confirmOther, disabled: !universityOther.trim() || saving }
        : { onPress: () => void finish(university), disabled: !university || saving }

  return (
    // `padding` en las dos plataformas, como en «Elegí tu @»: con edge-to-edge
    // el teclado de «Otra» hay que esquivarlo a mano.
    <KeyboardAvoidingView style={styles.pantalla} behavior="padding">
      <View style={styles.marco}>
        <Animated.View
          key={phase}
          entering={phase === "university" ? SlideInRight.duration(PASE_MS) : undefined}
          exiting={phase === "career" ? SlideOutLeft.duration(PASE_MS) : undefined}
          style={styles.cara}
        >
          {/* Centrado con `flexGrow` y no fijo: si el contenido no entra (el
              teclado abierto con sugerencias), se scrollea en vez de perder
              el título por arriba. */}
          <ScrollView
            contentContainerStyle={styles.cuerpo}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {phase === "career" ? (
              <CareerSelect value={career} onSelect={elegirCarrera} />
            ) : (
              <UniversityGrid
                university={university}
                showOther={showOther}
                otherValue={universityOther}
                onOtherChange={setUniversityOther}
                onPick={elegirUniversidad}
                onSelectOther={abrirOtra}
                onConfirmOther={confirmOther}
                onPickSuggestion={(key) => {
                  sfx.select()
                  setUniversityOther(key)
                  inputRef.current?.focus()
                }}
                inputRef={inputRef}
              />
            )}
          </ScrollView>
        </Animated.View>
      </View>
      {/* «Ahora no» arriba y Continuar abajo, donde llega el pulgar. */}
      <View style={styles.pie}>
        <Pressable onPress={saltar} accessibilityRole="button" style={styles.ahoraNo}>
          <Text style={styles.textoAhoraNo}>Ahora no</Text>
        </Pressable>
        <BotonCta texto="Continuar" onPress={continuar.onPress} disabled={continuar.disabled} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 16, gap: 24 },
  marco: { flex: 1, overflow: "hidden" },
  cara: { flex: 1 },
  // Más aire arriba que abajo: «Ahora no» es texto suelto y no pesa, y centrado
  // de verdad el bloque se leía pegado al techo (`pt-12 pb-2` de la web).
  cuerpo: { flexGrow: 1, justifyContent: "center", paddingTop: 48, paddingBottom: 8 },
  pie: { gap: 8 },
  ahoraNo: { paddingVertical: 8, alignItems: "center" },
  textoAhoraNo: { fontSize: 14, color: TEMA.mutedForeground },
})
