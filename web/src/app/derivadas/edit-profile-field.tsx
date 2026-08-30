"use client"

import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CareerSelect, UniversityGrid } from "@/components/onboarding-fields"
import { canonicalUniversity } from "@/lib/university-tags"
import { useSfx } from "@/lib/audio/useSfx"
import { cn } from "@/lib/utils"
import { Salida } from "./slide-salida"
import { useGameApi } from "./UseGameApi"
import { gameKeys } from "./UseGamePlayer"

// Blanco, como Continuar/Empezar: a diferencia de las diapos de cafecito y
// reclutas —donde el botón del pie es Volver/Ahora no, una salida—, acá es la
// acción que confirma lo elegido, así que lleva el mismo peso visual que el
// resto de las acciones primarias del juego.
const guardarCls =
  "flex w-full items-center justify-center rounded-md bg-white text-base font-semibold text-black transition-colors hover:bg-white/90 disabled:pointer-events-none disabled:opacity-45"

// Editar carrera y universidad desde escritorio, en el contenedor del
// ejercicio — no un desplegable colgado de la fila de configuración. Mismas
// slides que el onboarding (CareerSelect/UniversityGrid); lo que cambia acá
// es dónde aparecen y que cada una guarda un único campo.
//
// El botón de Guardar vive en el pie de la columna —el mismo lugar que
// Revisar/Saltear— y se dibuja por portal (ver slide-salida.tsx), igual que
// las diapos de cafecito y reclutas: es la misma idea de "pedir algo es una
// pausa, no cambiar de pantalla", aplicada acá a elegir un campo.

// Guardar es fire-and-forget, igual que el resto de las pantallas de trámite
// del juego: si falla, la próxima vuelta a esta pantalla lo reintenta.
function useGuardarPerfil(onDone: () => void) {
  const api = useGameApi()
  const queryClient = useQueryClient()
  const savingRef = useRef(false)
  return async (body: { career?: string; university?: string }) => {
    if (savingRef.current) return
    savingRef.current = true
    try {
      await api.PATCH("/game/derivemos/me", { body })
    } catch {
      // Sin drama.
    }
    queryClient.invalidateQueries({ queryKey: gameKeys.me })
    queryClient.invalidateQueries({ queryKey: gameKeys.leaderboard })
    savingRef.current = false
    onDone()
  }
}

export function EditCareerPanel({
  initialValue,
  slotSalida,
  onDone,
}: {
  initialValue: string
  slotSalida: HTMLElement | null
  onDone: () => void
}) {
  const sfx = useSfx()
  const [career, setCareer] = useState(initialValue)
  const guardar = useGuardarPerfil(onDone)

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center">
      <CareerSelect
        value={career}
        onSelect={(v) => {
          sfx.select()
          setCareer(v)
        }}
      />
      <Salida slot={slotSalida}>
        <button
          type="button"
          disabled={!career}
          onClick={() => void guardar({ career })}
          className={cn(guardarCls, slotSalida ? "h-[var(--cta-h)]" : "mt-6 px-4 py-3")}
        >
          Guardar
        </button>
      </Salida>
    </div>
  )
}

export function EditUniversityPanel({
  initialValue,
  slotSalida,
  onDone,
}: {
  initialValue: string
  slotSalida: HTMLElement | null
  onDone: () => void
}) {
  const sfx = useSfx()
  const [university, setUniversity] = useState(initialValue)
  const [otherValue, setOtherValue] = useState("")
  const [showOther, setShowOther] = useState(false)
  const otherRef = useRef<HTMLInputElement>(null)
  const guardar = useGuardarPerfil(onDone)

  const confirmOther = () => {
    const value = canonicalUniversity(otherValue)
    if (!value) return
    void guardar({ university: value })
  }

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col justify-center">
      <UniversityGrid
        university={university}
        showOther={showOther}
        otherValue={otherValue}
        onOtherChange={setOtherValue}
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
          setOtherValue(key)
          otherRef.current?.focus()
        }}
        inputRef={otherRef}
      />
      <Salida slot={slotSalida}>
        <button
          type="button"
          disabled={showOther ? !otherValue.trim() : !university}
          onClick={() => {
            sfx.select()
            if (showOther) confirmOther()
            else void guardar({ university })
          }}
          className={cn(guardarCls, slotSalida ? "h-[var(--cta-h)]" : "mt-6 px-4 py-3")}
        >
          Guardar
        </button>
      </Salida>
    </div>
  )
}
