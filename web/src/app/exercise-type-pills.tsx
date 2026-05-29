import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { UnitProgress } from "@/lib/api/types"
import { exerciseTypeInfo } from "@/lib/catalog/exercise-types"

const STATE_META: Record<
  string,
  { pill: string; swatch: string; label: string; description: string }
> = {
  dominado: {
    pill: "border-emerald-600 bg-emerald-600 text-white",
    swatch: "border-emerald-600 bg-emerald-600",
    label: "Dominado",
    description:
      "Ya dominás este tipo de ejercicio. Lo repasás cada cierto tiempo para no olvidarlo.",
  },
  aprendiendo: {
    pill: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    swatch: "border-amber-500/40 bg-amber-500/30",
    label: "Aprendiendo",
    description: "Estás practicando este tipo de ejercicio.",
  },
  sin_empezar: {
    pill: "border-border bg-transparent text-muted-foreground",
    swatch: "border-border bg-transparent",
    label: "Sin empezar",
    description: "Todavía no resolviste ningún ejercicio de este tipo.",
  },
}

export default function ExerciseTypePills({
  units,
}: {
  units: UnitProgress[]
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {units.map((unit) => {
        const info = exerciseTypeInfo({ type: unit.exercise_type })
        const state = STATE_META[unit.state] ?? STATE_META.sin_empezar
        return (
          <li key={unit.exercise_type}>
            <Dialog>
              <DialogTrigger
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring/50 ${state.pill}`}
              >
                {info.label}
                <span className="sr-only"> — {state.label}</span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{info.label}</DialogTitle>
                </DialogHeader>
                {info.description && (
                  <DialogDescription>{info.description}</DialogDescription>
                )}
                <div className="flex flex-col gap-1.5 border-t pt-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-3 shrink-0 rounded-full border ${state.swatch}`}
                    />
                    <span className="text-sm font-medium">{state.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {state.description}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </li>
        )
      })}
    </ul>
  )
}
