import { useState } from "react"
import { cn } from "@/lib/utils"

export type SurveyType = "A" | "B" | "D"

const SURVEY_QUESTIONS: Record<
  SurveyType,
  { question: string; options: { value: string; emoji: string; label: string }[] }
> = {
  A: {
    question: "¿Cómo se sintió el ejercicio anterior?",
    options: [
      { value: "muy_facil", emoji: "😴", label: "Muy fácil" },
      { value: "justo", emoji: "👌", label: "Justo" },
      { value: "muy_dificil", emoji: "🤯", label: "Muy difícil" },
    ],
  },
  B: {
    question: "¿La explicación anterior fue útil?",
    options: [
      { value: "util", emoji: "👍", label: "Sí" },
      { value: "no_util", emoji: "👎", label: "No" },
    ],
  },
  D: {
    question: "¿Cómo estuvo este problema?",
    options: [
      { value: "aburrido", emoji: "🥱", label: "Aburrido" },
      { value: "justo", emoji: "🙂", label: "Justo" },
      { value: "interesante", emoji: "💡", label: "Interesante" },
    ],
  },
}

export function isSurveyType(type: string): type is SurveyType {
  return type in SURVEY_QUESTIONS
}

// Chips de razón del canal D, solo en los extremos ("justo" no ofrece ninguno).
// Los `value` tienen que coincidir exactamente con D_REASONS de
// backend/feedback_survey.py, que los valida antes de persistir.
const D_REASONS: Record<string, { value: string; label: string }[]> = {
  interesante: [
    { value: "me_hizo_pensar", label: "Me hizo pensar" },
    { value: "buen_contexto", label: "Buen contexto" },
    { value: "aprendi_algo", label: "Aprendí algo" },
  ],
  aburrido: [
    { value: "pura_cuenta", label: "Pura cuenta" },
    { value: "no_le_vi_sentido", label: "No le vi el sentido" },
    { value: "ya_lo_sabia", label: "Ya lo sabía" },
  ],
}

// Slide de la micro-encuesta post-ejercicio. Se comporta como un mini
// ejercicio: elegir una opción y tocar "Continuar" la envía (sin seleccionar,
// "Continuar" saltea la encuesta — ver session-runner.tsx).
export function SurveyPane({
  type,
  value,
  reason,
  freeTextRef,
  submitted,
  onSelect,
  onSelectReason,
}: {
  type: SurveyType
  value: string | null
  reason: string | null
  // Ver ReportPane: el texto vive local y se espeja en el ref del runner para
  // que tipear no re-renderice el ejercicio entero.
  freeTextRef: React.RefObject<string>
  submitted: boolean
  onSelect: (value: string) => void
  onSelectReason: (reason: string) => void
}) {
  const [freeText, setFreeText] = useState("")
  const { question, options } = SURVEY_QUESTIONS[type]
  const showFreeText = type === "B" && value === "no_util"
  const reasons = type === "D" && value ? D_REASONS[value] : undefined

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-base leading-snug">{question}</p>
      <div className={cn("gap-2", options.length === 3 ? "grid grid-cols-3" : "grid grid-cols-2")}>
        {options.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              disabled={submitted}
              onClick={() => onSelect(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-md border bg-white/5 px-4 py-4 text-base transition-colors disabled:pointer-events-none",
                isSelected
                  ? "border-[#7e80f7] text-[#c4c6ff]"
                  : "border-white/10 text-foreground/80",
                submitted && !isSelected && "opacity-40",
              )}
            >
              <span className="text-2xl">{opt.emoji}</span>
              <span className="text-sm">{opt.label}</span>
            </button>
          )
        })}
      </div>
      {reasons && (
        <div className="flex flex-col gap-2.5">
          <p className="text-center text-sm text-foreground/70">¿Por qué?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {reasons.map((r) => {
              const isSelected = reason === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  disabled={submitted}
                  onClick={() => onSelectReason(r.value)}
                  className={cn(
                    "rounded-full border bg-white/5 px-3 py-2 text-sm transition-colors disabled:pointer-events-none",
                    isSelected
                      ? "border-[#7e80f7] text-[#c4c6ff]"
                      : "border-white/10 text-foreground/80",
                    submitted && !isSelected && "opacity-40",
                  )}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
      {showFreeText && (
        <textarea
          value={freeText}
          disabled={submitted}
          onChange={(e) => {
            setFreeText(e.target.value)
            freeTextRef.current = e.target.value
          }}
          placeholder="¿Qué no se entendió? (opcional)"
          className="min-h-20 rounded-md border border-white/10 bg-white/5 p-2 text-base text-foreground/85 outline-none focus:border-white/40 disabled:opacity-60"
        />
      )}
    </div>
  )
}
