"use client"

import { useRef, useState } from "react"
import posthog from "posthog-js"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ApiError, unwrap } from "@/lib/api/client"
import { normalizeUsername, validateUsername } from "@/lib/username"
import { useSfx } from "@/lib/audio/useSfx"
import { KeyCap } from "./exercise-card"
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
export function UsernameSlide({
  player,
  onDone,
  slotSalida,
}: {
  player: GamePlayer
  onDone: () => void
  // Dónde dibujar el botón de Continuar: el pie de la columna, AFUERA de la
  // caja — misma idea que cafecito/reclutas y el registro desde Configuración
  // (slide-salida.tsx), para que la caja mida lo mismo que la del ejercicio
  // en vez de comerse la columna entera. Solo lo manda `desktop-layout.tsx`;
  // en el teléfono el botón se queda adentro, donde siempre estuvo.
  slotSalida?: HTMLElement | null
}) {
  const api = useGameApi()
  const sfx = useSfx()
  const teclas = useTeclas()
  const queryClient = useQueryClient()
  const [alias, setAlias] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const savingRef = useRef(false)
  const error = alias.length > 0 ? validateUsername(alias) : null
  const puedeContinuar = alias.length > 0 && !error

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

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-bold">Elegí tu @</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Así te van a ver los demás en el ranking.
        <br />
        Elegilo para arrancar.
      </p>
      <div className="flex w-full max-w-xs items-center gap-1 rounded-md border border-[#7e80f7] bg-white/5 px-3">
        <span className="text-lg text-muted-foreground">@</span>
        <input
          type="text"
          autoFocus
          value={alias}
          onChange={(e) => {
            setAlias(normalizeUsername(e.target.value))
            setSubmitError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void finish()
          }}
          placeholder={player.alias}
          maxLength={15}
          className="h-[52px] w-full bg-transparent text-foreground outline-none"
        />
      </div>
      {(error || submitError) && (
        <p className="text-sm text-orange-300">{error ?? submitError}</p>
      )}
      <Salida slot={slotSalida}>
        {/* En el teléfono el botón mide lo mismo que la caja del @ (`max-w-xs`,
            como el div de arriba): son la misma pregunta, uno debajo del otro, y
            con el botón heredando el `max-w-md` del padre se veía como si
            pertenecieran a dos pantallas distintas. En escritorio no: ahí el
            botón se portaliza al pie de la columna (`slotSalida`), donde tiene
            que medir lo mismo que Revisar y Saltear. */}
        <div
          className={cn(
            "flex flex-col gap-2",
            slotSalida ? "w-full" : "w-full max-w-xs",
          )}
        >
          <Button
            size="lg"
            className={ctaCls}
            disabled={!puedeContinuar}
            onClick={() => void finish()}
          >
            Continuar
            <KeyCap>{teclas.enter}</KeyCap>
          </Button>
        </div>
      </Salida>
    </div>
  )
}
