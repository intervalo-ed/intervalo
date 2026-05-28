"use client"

import { Button } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"
import { saveOnboarding } from "@/lib/onboarding/storage"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

const CAREERS = [
  { value: "S", label: "Ciencias" },
  { value: "T", label: "Tecnología" },
  { value: "E", label: "Ingeniería" },
  { value: "M", label: "Matemática" },
  { value: "Otra", label: "Otra" },
]

const UNIVERSITIES = ["UBA", "UTN", "UNSAM"]

const BELTS = [
  { name: "Blanco", img: "/belt_white.png" },
  { name: "Azul", img: "/belt_blue.png" },
  { name: "Violeta", img: "/belt_purple.png" },
  { name: "Marrón", img: "/belt_brown.png" },
  { name: "Negro", img: "/belt_black.png" },
]

const GRID_BG_STYLE = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
  backgroundSize: "40px 40px",
}

const TOTAL_STEPS = 5

export default function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [career, setCareer] = useState("")
  const [university, setUniversity] = useState("")
  const [universityOther, setUniversityOther] = useState("")
  const [showOther, setShowOther] = useState(false)

  function pickCareer(value: string) {
    setCareer(value)
    setStep(3)
  }

  function pickUniversity(value: string) {
    setUniversity(value)
    setShowOther(false)
    setStep(4)
  }

  function confirmOther() {
    const value = universityOther.trim()
    if (!value) return
    setUniversity(value)
    setStep(4)
  }

  function onFinish() {
    const finalUniversity = university.trim()
    if (!career || !finalUniversity) return
    saveOnboarding({ career, university: finalUniversity })
    router.push("/sign-in")
  }

  return (
    <Shell>
      <Dots step={step} />

      <div className="rounded-2xl border border-[#38385A] bg-card p-7 shadow-[0_2px_8px_rgba(0,0,0,0.2),0_8px_32px_rgba(0,0,0,0.15)]">
        {step === 0 && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="mt-3">
              <Wordmark textClass="text-[2rem]" barClass="h-[3px]" />
            </div>
            <p className="leading-relaxed text-foreground/70 mt-3">
              Intervalo es un sistema de{" "}
              <strong className="text-foreground">repaso adaptativo</strong> que
              aprende de tus respuestas y prioriza lo que más necesitás
              reforzar.
            </p>
            <div className="flex w-full flex-col gap-2">
              <Button
                size="lg"
                className="mt-2 h-12 w-full"
                onClick={() => setStep(1)}
              >
                Empezar
              </Button>
              <Button
                size="lg"
                className="mt-2 h-12 w-full"
                onClick={() => router.push("/sign-in")}
                variant="link"
              >
                Ya tengo una cuenta
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center gap-5 text-center">
            <h2 className="text-2xl font-bold">¿Cómo funciona?</h2>
            <p className="leading-relaxed text-foreground/70">
              Vas a resolver ejercicios cortos sin material de consulta. El
              algoritmo ajusta{" "}
              <strong className="text-foreground">qué repasar</strong> y{" "}
              <strong className="text-foreground">cada cuánto</strong>: lo
              difícil aparece más seguido, lo que ya dominás cada vez menos. A
              medida que progresás, avanzás de{" "}
              <strong className="text-foreground">cinturón</strong>.
            </p>
            <div className="flex w-full flex-wrap items-center justify-center gap-3 py-1">
              {BELTS.map((belt) => (
                <div
                  key={belt.name}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Image
                    src={belt.img}
                    alt={`Cinturón ${belt.name}`}
                    width={56}
                    height={28}
                    className="h-auto w-14"
                  />
                  <span className="text-[0.68rem] font-semibold text-foreground/70">
                    {belt.name}
                  </span>
                </div>
              ))}
            </div>
            <Button
              size="lg"
              className="mt-2 h-12 w-full"
              onClick={() => setStep(2)}
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5 text-center">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">
                ¿Qué tipo de carrera estudiás?
              </h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {CAREERS.map((c) => (
                <OptionButton
                  key={c.value}
                  selected={career === c.value}
                  onClick={() => pickCareer(c.value)}
                >
                  {c.label}
                </OptionButton>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5 text-center">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold">¿En qué universidad?</h2>
            </div>
            <div className="flex flex-col gap-2.5">
              <div className="flex gap-2.5">
                {UNIVERSITIES.map((u) => (
                  <OptionButton
                    key={u}
                    className="flex-1"
                    selected={university === u && !showOther}
                    onClick={() => pickUniversity(u)}
                  >
                    {u}
                  </OptionButton>
                ))}
              </div>
              <OptionButton
                selected={showOther}
                onClick={() => setShowOther(true)}
              >
                Otra
              </OptionButton>
              {showOther && (
                <div className="flex flex-col gap-3 pt-1">
                  <input
                    type="text"
                    value={universityOther}
                    onChange={(e) => setUniversityOther(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmOther()}
                    placeholder="Ej: UNLP, UNQ, UNLa…"
                    autoFocus
                    className="h-11 rounded-xl border border-[#38385A] bg-[#2A2A4A] px-4 text-foreground outline-none focus:border-primary"
                  />
                  <Button
                    size="lg"
                    className="h-12 w-full"
                    onClick={confirmOther}
                    disabled={!universityOther.trim()}
                  >
                    Continuar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col items-center gap-5 text-center">
            <h2 className="text-2xl font-bold">¡Listo!</h2>
            <p className="leading-relaxed text-foreground/70 text-balance">
              Creá tu cuenta y empezá tu primer repaso. No te va a llevar más de
              5 minutos.
            </p>
            <Button size="lg" className="mt-2 h-12 w-full" onClick={onFinish}>
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {step > 0 && (
        <button
          onClick={() => {
            if (step === 3 && showOther) {
              setShowOther(false)
              return
            }
            if (step === 4) {
              setStep(3)
              return
            }
            setStep((s) => Math.max(0, s - 1))
          }}
          className="mt-2 w-full py-2 text-center text-sm text-muted-foreground"
        >
          Volver
        </button>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10"
      style={GRID_BG_STYLE}
    >
      <div className="w-full max-w-md">{children}</div>
    </main>
  )
}

function Dots({ step }: { step: number }) {
  return (
    <div className="mb-6 flex justify-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === step ? "w-6" : "w-2",
            i <= step ? "bg-primary" : "bg-[#38385A]",
          )}
        />
      ))}
    </div>
  )
}

function OptionButton({
  children,
  selected,
  onClick,
  className,
}: {
  children: React.ReactNode
  selected?: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-[#2A2A4A] px-4 py-3.5 font-semibold text-foreground transition-colors",
        selected ? "border-primary" : "border-[#38385A] hover:border-[#5457E5]",
        className,
      )}
    >
      {children}
    </button>
  )
}
