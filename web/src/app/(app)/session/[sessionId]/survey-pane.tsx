import { cn } from "@/lib/utils"

const SURVEY_QUESTIONS: Record<
  "A" | "B",
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
}

// Slide de la micro-encuesta post-ejercicio. Se comporta como un mini
// ejercicio: elegir una opción y tocar "Continuar" la envía (sin seleccionar,
// "Continuar" saltea la encuesta — ver session-runner.tsx).
export function SurveyPane({
  type,
  value,
  freeText,
  submitted,
  onSelect,
  onFreeTextChange,
}: {
  type: "A" | "B"
  value: string | null
  freeText: string
  submitted: boolean
  onSelect: (value: string) => void
  onFreeTextChange: (text: string) => void
}) {
  const { question, options } = SURVEY_QUESTIONS[type]
  const showFreeText = type === "B" && value === "no_util"

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
      {showFreeText && (
        <textarea
          value={freeText}
          disabled={submitted}
          onChange={(e) => onFreeTextChange(e.target.value)}
          placeholder="¿Qué no se entendió? (opcional)"
          className="min-h-20 rounded-md border border-white/10 bg-white/5 p-2 text-sm text-foreground/85 outline-none focus:border-white/40 disabled:opacity-60"
        />
      )}
    </div>
  )
}
