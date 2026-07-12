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
import { ChevronLeft, ChevronRight, InfoIcon } from "lucide-react"

// Selector numérico del editor de curso (contador con < valor >). Aplica el
// cambio al instante y muestra un (?) con una explicación breve.
export function EditorStepper({
  label,
  help,
  value,
  min = 1,
  max,
  busy,
  onChange,
}: {
  label: string
  help: string
  value: number
  min?: number
  max: number
  busy: boolean
  onChange: (value: number) => void
}) {
  function step(delta: number) {
    const target = Math.max(min, Math.min(max, value + delta))
    if (target !== value) onChange(target)
  }

  return (
    <div className="flex h-10 items-center justify-between rounded-md border border-white/10 bg-white/5 px-3">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{label}</span>
        <Dialog>
          <DialogTrigger
            aria-label={`Qué es ${label}`}
            className="text-foreground/40 outline-none transition-colors hover:text-foreground/70"
          >
            <InfoIcon className="size-3.5" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader className="gap-1">
              <DialogTitle className="font-sans text-sm font-semibold text-foreground">
                {label}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-foreground/80">
                {help}
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
          aria-label={`Menos: ${label}`}
          disabled={value <= min || busy}
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
          aria-label={`Más: ${label}`}
          disabled={value >= max || busy}
          onClick={() => step(1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
