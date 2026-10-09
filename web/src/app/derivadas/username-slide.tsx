"use client"

import { useEffect, useRef, useState } from "react"
import { useIsPresent } from "motion/react"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ApiError, unwrap } from "@/lib/api/client"
import { normalizeUsername, validateUsername } from "@/lib/username"
import { useSfx } from "@/lib/audio/useSfx"
import { KeyCap } from "./exercise-card"
import { GoogleIcon, saveDesiredAlias, useGoogleLogin } from "./google-login"
import { Salida } from "./slide-salida"
import { useTeclas } from "./teclas"
import { useGameApi } from "./UseGameApi"
import { gameKeys, type GamePlayer } from "./UseGamePlayer"

const ctaCls =
  "h-[var(--cta-h)] w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"

// Primera vez en este dispositivo, antes de la primera derivada: acá se
// ELIGE el @, no se hereda el generado. El campo arranca vacío —el generado
// queda de `placeholder`, como referencia, nunca como valor que se pueda
// mandar sin tocar— y Continuar no habilita hasta que hay algo propio y
// válido escrito.
//
// Sigue siendo la única edición gratis del alias (ver el carve-out de
// `patch_me` en backend/game/router.py), pero ya no es opcional: es la
// puerta de entrada al juego. Un 409 (@ tomado) o 422 (inválido) se muestra y
// no deja seguir —es justamente lo que hay que corregir—; cualquier otro
// error (red, servidor caído) no es culpa de lo que se eligió, así que ahí sí
// se sigue jugando en vez de dejar a alguien varado en esta pantalla por un
// problema que no puede resolver escribiendo de nuevo.
//
// Y debajo del campo, «Vincular con Google». Es la respuesta a dos personas
// que escribieron en la varita: una perdió su progreso porque el teléfono le
// dio un invitado nuevo y se registró sobre ESE, y otra abrió el juego en otro
// equipo y «no la reconoció». Las dos tenían cuenta o estaban por tenerla; lo
// que no tenían era ningún lugar visible donde entrar. Esta pantalla es la
// primera que ve cualquier aparato nuevo, así que es donde tiene que estar.
export function UsernameSlide({
  player,
  onDone,
  slotSalida,
  popup = false,
  autoFocus = false,
  keyboard = false,
}: {
  player: GamePlayer
  onDone: () => void
  // Dónde dibujar el botón de Continuar: el pie de la columna en escritorio y
  // el hueco de abajo de la diapo en el teléfono (`ConSalidaAbajo`), como en
  // reglas y en el cafecito. Es el mismo botón en el mismo lugar en todas las
  // pantallas del juego, y acá dejó de ser la excepción.
  slotSalida?: HTMLElement | null
  // Solo escritorio: el login corre en una ventanita (ver google-login.tsx).
  popup?: boolean
  // Solo escritorio. En el teléfono enfocar el campo al entrar abría el
  // teclado del sistema sobre la mitad de la diapo —tapaba el botón de Google
  // y el Continuar— y achicaba el `h-dvh` con la diapo todavía deslizándose.
  // Quien quiere escribir toca el campo, que está a la vista.
  autoFocus?: boolean
  // Atajos de teclado, solo escritorio: Enter es Continuar (lo maneja el
  // campo) y Alt+Enter es Conectar con Google, la misma tecla que en las demás
  // diapos dispara la segunda acción (Saltear, Ahora no).
  keyboard?: boolean
}) {
  const api = useGameApi()
  const sfx = useSfx()
  const teclas = useTeclas()
  const presente = useIsPresent()
  const queryClient = useQueryClient()
  const [alias, setAlias] = useState("")
  const campoRef = useRef<HTMLInputElement>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const savingRef = useRef(false)
  const error = alias.length > 0 ? validateUsername(alias) : null
  const google = useGoogleLogin({
    popup,
    antesDeIr: () => {
      posthog.capture("game_username_slide_google_tap")
      // Si ya escribió un @, que no se pierda en el viaje: se aplica al
      // volver si la cuenta no tenía uno elegido (register-slides.tsx ::
      // useApplyDesiredAlias).
      saveDesiredAlias(alias)
    },
  })

  // El foco se pide cuando la diapo ya LLEGÓ, no en el primer commit: un foco
  // en el primer commit trae el elemento a la vista y colapsa el deslizamiento
  // (misma historia que el cafecito, cafecito-panel.tsx). 320 ms cubre el
  // fundido de escritorio (220) con margen.
  useEffect(() => {
    if (!autoFocus) return
    const t = window.setTimeout(
      () => campoRef.current?.focus({ preventScroll: true }),
      320,
    )
    return () => window.clearTimeout(t)
  }, [autoFocus])
  const puedeContinuar = alias.length > 0 && !error && !google.pendiente

  // Alt+Enter llega siempre, esté el campo enfocado o no: nada en un `<input>`
  // le da un uso especial. En captura y frenando la tecla, para que el
  // Alt+Enter de Saltear del layout no la vea. Por ref, como en las otras
  // diapos: `iniciar` es una closure nueva en cada render.
  const iniciarRef = useRef(google.iniciar)
  iniciarRef.current = google.iniciar
  useEffect(() => {
    if (!keyboard || !presente) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || !e.altKey) return
      e.preventDefault()
      e.stopPropagation()
      void iniciarRef.current()
    }
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [keyboard, presente])

  const finish = async () => {
    if (savingRef.current || !puedeContinuar) return
    savingRef.current = true
    setSubmitError(null)
    sfx.continue()
    try {
      const updated = unwrap(await api.PATCH("/game/derivemos/me", { body: { alias } }))
      queryClient.setQueryData(gameKeys.me, updated)
      posthog.capture("game_username_slide_completed", { changed: true })
      onDone()
      return
    } catch (err) {
      posthog.capture("game_username_slide_completed", { changed: false })
      // 409 (tomado) o 422 (inválido): es lo que hay que elegir distinto, no
      // se sigue sin resolverlo.
      if (err instanceof ApiError && (err.status === 409 || err.status === 422)) {
        setSubmitError(err.message)
        savingRef.current = false
        return
      }
      // Cualquier otro error (red, servidor caído) no lo arregla reintentar
      // el @: se sigue jugando, como el resto del juego cuando la red falla.
      onDone()
    }
  }

  const mensaje = error ?? submitError ?? google.error

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-bold">Elegí tu @</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Así te van a ver los demás en el ranking.
      </p>
      <div className="flex w-full max-w-xs items-center gap-1 rounded-md border border-[#7e80f7] bg-white/5 px-3">
        <span className="text-lg text-muted-foreground">@</span>
        <input
          ref={campoRef}
          type="text"
          value={alias}
          onChange={(e) => {
            setAlias(normalizeUsername(e.target.value))
            setSubmitError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.altKey) void finish()
          }}
          placeholder={player.alias}
          maxLength={15}
          className="h-[52px] w-full bg-transparent text-foreground outline-none"
        />
      </div>
      {/* Blanco sólido como el Continuar: es una acción de verdad, no una
          salida. Mide lo mismo que el campo. */}
      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button
          size="lg"
          className={ctaCls}
          disabled={!google.listo || google.pendiente}
          onClick={() => {
            sfx.select()
            void google.iniciar()
          }}
        >
          {google.pendiente ? "Conectando…" : "Conectar con Google"}
          <GoogleIcon className="ml-2 size-4" />
          {keyboard && <KeyCap>{teclas.altEnter}</KeyCap>}
        </Button>
        <p className="text-xs leading-relaxed text-foreground/55">
          Vinculá tu cuenta para no perder tu progreso.
        </p>
      </div>
      {mensaje && <p className="text-sm text-orange-300">{mensaje}</p>}
      <Salida slot={slotSalida}>
        <Button
          size="lg"
          className={ctaCls}
          disabled={!puedeContinuar}
          onClick={() => void finish()}
        >
          Continuar
          {keyboard && <KeyCap>{teclas.enter}</KeyCap>}
        </Button>
      </Salida>
    </div>
  )
}
