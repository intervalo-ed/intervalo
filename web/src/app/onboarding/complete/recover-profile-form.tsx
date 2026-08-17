"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { CAREERS, CareerCard, OptionButton, UNIVERSITY_LOGOS } from "@/app/onboarding/onboarding-wizard"
import { useEnrollMutation } from "@/app/onboarding/UseEnrollMutation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import {
  ONBOARDING_UNIVERSITIES,
  UNIVERSITY_TAG_BY_KEY,
  canonicalUniversity,
  matchUniversities,
} from "@/lib/university-tags"

/**
 * Usuarios con progreso real (unit_states) pero sin Enrollment nunca llegaron
 * a completar el onboarding (ej. el bug de "Ya tengo una cuenta" arrastrado
 * desde antes de este fix) — no tiene sentido hacerlos repetir todo el wizard
 * ni el ejercicio de prueba, así que este formulario les pide solo lo mínimo
 * que falta (carrera + universidad) para poder enrolarlos sin tocar su
 * progreso existente. Mismo formato que el wizard: dos pasos, uno por
 * pregunta.
 */
export function RecoverProfileForm({ onDone }: { onDone: () => void }) {
  const { user } = useUser()
  const enroll = useEnrollMutation()
  const [step, setStep] = useState<"carrera" | "universidad">("carrera")
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
        {step === "carrera" ? (
          <>
            <div className="flex flex-col gap-2 text-center">
              <p className="text-sm text-muted-foreground">
                Para terminar de armar tu perfil, contanos dos cosas.
              </p>
              <h2 className="text-2xl font-bold">¿Qué estudiás?</h2>
              <p className="text-foreground/85">
                Marcá la que más se aproxime a tu carrera.
              </p>
            </div>
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
            <Button
              size="lg"
              className="h-12 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
              disabled={!career}
              onClick={() => setStep("universidad")}
            >
              Continuar
            </Button>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2 text-center">
              <h2 className="text-2xl font-bold">¿Dónde?</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-3 gap-2.5">
                {ONBOARDING_UNIVERSITIES.map((u) => {
                  const logo = UNIVERSITY_LOGOS[u]
                  const isSel = university === u && !showOther
                  return (
                    <OptionButton
                      key={u}
                      className={cn(
                        "flex h-[52px] items-center justify-center text-base",
                        logo && "px-2 py-2",
                      )}
                      style={logo ? undefined : UNIVERSITY_TAG_BY_KEY[u]?.font}
                      selected={isSel}
                      onClick={() => {
                        setUniversity(u)
                        setShowOther(false)
                      }}
                    >
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logo}
                          alt={u}
                          className={cn(
                            "w-auto max-w-full object-contain transition-[filter,opacity]",
                            u === "UNSAM" || u === "UNC" ? "h-[20px]" : "h-[23px]",
                            isSel ? "opacity-100 brightness-150" : "opacity-90",
                          )}
                        />
                      ) : (
                        u
                      )}
                    </OptionButton>
                  )
                })}
              </div>
              {showOther ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={universityOther}
                    onChange={(e) => setUniversityOther(e.target.value)}
                    placeholder="Ej: UNQ, UNLa, UNGS…"
                    autoFocus
                    className="h-[52px] rounded-md border border-[#7e80f7] bg-white/5 px-4 text-foreground outline-none transition-colors"
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
            <button
              type="button"
              onClick={() => setStep("carrera")}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Volver
            </button>
          </>
        )}
      </div>
    </main>
  )
}
