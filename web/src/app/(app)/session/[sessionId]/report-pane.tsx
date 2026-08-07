import { cn } from "@/lib/utils"
import { Flag } from "lucide-react"

export const REPORT_CATEGORIES = [
  { value: "enunciado_error", label: "Error en el enunciado" },
  { value: "opcion_ambigua", label: "Opción ambigua" },
  { value: "explicacion_error", label: "Error en la explicación" },
] as const

// Slide del canal de reporte (bandera 🏳, siempre disponible, no muestreada).
// Misma mecánica que SurveyPane, pero acá "Continuar" queda deshabilitado
// hasta elegir una categoría — a diferencia de la encuesta, no hay "skip".
export function ReportPane({
  value,
  freeText,
  submitted,
  onSelect,
  onFreeTextChange,
}: {
  value: string | null
  freeText: string
  submitted: boolean
  onSelect: (value: string) => void
  onFreeTextChange: (text: string) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-1.5 text-base leading-snug">
        Reportar un problema
        <Flag className="size-4 text-foreground/60" />
      </p>
      <div className="flex flex-col gap-2">
        {REPORT_CATEGORIES.map((cat) => {
          const isSelected = value === cat.value
          return (
            <button
              key={cat.value}
              type="button"
              disabled={submitted}
              onClick={() => onSelect(cat.value)}
              className={cn(
                "w-full rounded-md border bg-white/5 px-4 py-3.5 text-left text-base transition-colors disabled:pointer-events-none",
                isSelected
                  ? "border-[#7e80f7] text-[#c4c6ff]"
                  : "border-white/10 text-foreground/80",
                submitted && !isSelected && "opacity-40",
              )}
            >
              {cat.label}
            </button>
          )
        })}
      </div>
      <textarea
        value={freeText}
        disabled={submitted}
        onChange={(e) => onFreeTextChange(e.target.value)}
        placeholder="Contanos qué pasó (opcional)"
        className="min-h-20 rounded-md border border-white/10 bg-white/5 p-2 text-base text-foreground/85 outline-none focus:border-white/40 disabled:opacity-60"
      />
    </div>
  )
}
