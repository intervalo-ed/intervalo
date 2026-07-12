"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, HelpCircleIcon } from "lucide-react"

// Selector de "ítems activos" (el cap configurable). Al mover el contador aplica
// el cambio al instante (sin confirmación): subir desbloquea más temas, bajar
// vuelve a bloquear los últimos.
export function LearningCountStepper({
  value,
  total,
  busy,
  applyCap,
}: {
  value: number
  total: number
  busy: boolean
  applyCap: (value: number) => void
}) {
  function step(delta: number) {
    const target = Math.max(1, Math.min(total, value + delta))
    if (target !== value) applyCap(target)
  }

  return (
    <div className="flex h-10 items-center justify-between rounded-md border border-white/10 bg-white/5 px-3">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">Ítems activos</span>
        <Dialog>
          <DialogTrigger
            aria-label="Qué son los ítems activos"
            className="text-foreground/40 outline-none transition-colors hover:text-foreground/70"
          >
            <HelpCircleIcon className="size-3.5" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="gap-1">
              <DialogTitle className="font-sans text-sm font-semibold text-foreground">
                Ítems activos
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-foreground/80">
                Cuántos ítems tenés aprendiendo a la vez. Subir el número
                desbloquea más temas para tus repasos; bajarlo vuelve a bloquear
                los últimos. Los ítems ya consolidados no se ven afectados.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-md"
          aria-label="Menos ítems activos"
          disabled={value <= 1 || busy}
          onClick={() => step(-1)}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-6 text-center text-base font-semibold tabular-nums">
          {value}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-md"
          aria-label="Más ítems activos"
          disabled={value >= total || busy}
          onClick={() => step(1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
