"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { CAREERS, CareerCard, OptionButton } from "@/app/onboarding/onboarding-wizard"
import { useEnrollMutation } from "@/app/onboarding/UseEnrollMutation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ONBOARDING_UNIVERSITIES, canonicalUniversity, matchUniversities } from "@/lib/university-tags"

/**
 * Usuarios con progreso real (unit_states) pero sin Enrollment nunca llegaron
 * a completar el onboarding (ej. el bug de "Ya tengo una cuenta" arrastrado
 * desde antes de este fix) — no tiene sentido hacerlos repetir todo el wizard
 * ni el ejercicio de prueba, así que este formulario les pide solo lo mínimo
 * que falta (carrera + universidad) para poder enrolarlos sin tocar su
 * progreso existente.
 */
export function RecoverProfileForm({ onDone }: { onDone: () => void }) {
  const { user } = useUser()
  const enroll = useEnrollMutation()
  const [career, setCareer] = useState("")
  const [university, setUniversity] = useState("")
  const [universityOther, setUniversityOther] = useState("")
  const [showOther, setShowOther] = useState(false)
  const suggestions = universityOther.trim() ? matchUniversities(universityOther) : []

  const finalUniversity = showOther ? canonicalUniversity(universityOther) : university
  const canSubmit = Boolean(career && finalUniversity)

  async function handleSubmit() {
    if (!canSubmit) return
    await enroll.mutateAsync({
      university: finalUniversity,
      career,
      name: user?.fullName || user?.firstName || null,
    })
    await user?.update({ unsafeMetadata: { onboarded: true } })
    onDone()
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-2xl font-bold">Nos falta un dato</h2>
          <p className="text-sm text-muted-foreground">
            Para terminar de armar tu perfil, contanos qué estudiás y dónde.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-foreground/85">¿Qué estudiás?</span>
          <div className="grid grid-cols-2 gap-2.5">
            {CAREERS.map((c) => (
              <CareerCard
                key={c.value}
                emoji={c.emoji}
                label={c.label}
                selected={career === c.value}
                onClick={() => setCareer(c.value)}
              />
            ))}
            <CareerCard
              className="col-span-2"
              emoji="✦"
              label="Otra"
              selected={career === "Otra"}
              onClick={() => setCareer("Otra")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-foreground/85">¿Dónde?</span>
          <div className="grid grid-cols-3 gap-2.5">
            {ONBOARDING_UNIVERSITIES.map((u) => (
              <OptionButton
                key={u}
                selected={university === u && !showOther}
                onClick={() => {
                  setUniversity(u)
                  setShowOther(false)
                }}
              >
                {u}
              </OptionButton>
            ))}
          </div>
          {showOther ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={universityOther}
                onChange={(e) => setUniversityOther(e.target.value)}
                placeholder="Ej: UNQ, UNLa, UNGS…"
                autoFocus
                className="h-12 rounded-md border border-[#7e80f7] bg-white/5 px-4 text-foreground outline-none transition-colors"
              />
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setUniversityOther(s.key)}
                      className="inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 text-xs transition-opacity hover:opacity-80"
                      style={{
                        color: s.color,
                        borderColor: `${s.color}99`,
                        backgroundColor: `${s.color}33`,
                        ...s.font,
                      }}
                    >
                      {s.key}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <OptionButton
              selected={false}
              onClick={() => {
                setUniversity("")
                setShowOther(true)
              }}
            >
              Otra
            </OptionButton>
          )}
        </div>

        <Button
          size="lg"
          className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
          disabled={!canSubmit || enroll.isPending}
          onClick={handleSubmit}
        >
          {enroll.isPending ? <Spinner className="size-4" /> : "Continuar"}
        </Button>
        {enroll.error && (
          <p className="text-center text-sm text-red-500">
            No pudimos guardar tu perfil. Probá de nuevo.
          </p>
        )}
      </div>
    </main>
  )
}
