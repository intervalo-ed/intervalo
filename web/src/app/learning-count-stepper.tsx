"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { topicShortLabel, type CourseId } from "@/lib/catalog"
import type { components } from "@/lib/api/schema"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

type CapPreview = components["schemas"]["CapPreviewResponse"]

const confirmCls =
  "h-10 w-full rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
const cancelCls = "h-10 w-full rounded-md bg-background dark:bg-background"

// Selector de "ítems en aprendizaje" (el cap configurable). Al mover el contador
// consulta el preview; si hay temas que se desbloquean/re-bloquean, confirma con
// un diálogo antes de aplicar.
export function LearningCountStepper({
  course,
  value,
  total,
  busy,
  previewCap,
  applyCap,
}: {
  course: CourseId
  value: number
  total: number
  busy: boolean
  previewCap: (value: number) => Promise<CapPreview>
  applyCap: (value: number) => void
}) {
  const [pending, setPending] = useState<{ target: number; preview: CapPreview } | null>(
    null,
  )

  async function step(delta: number) {
    const target = Math.max(1, Math.min(total, value + delta))
    if (target === value) return
    const preview = await previewCap(target)
    if (preview.unlock.length === 0 && preview.lock.length === 0) {
      applyCap(target) // nada que confirmar (no cambia ningún tema aún)
      return
    }
    setPending({ target, preview })
  }

  function labelOf(key: string): string {
    const topic = key.split("/")[1] ?? key
    return topicShortLabel({ topic, course, fallback: topic })
  }

  const isUnlock = pending !== null && pending.target > value

  return (
    <div className="flex h-12 items-center justify-between rounded-md border border-white/10 bg-white/5 px-3">
      <span className="text-sm">Ítems en aprendizaje</span>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          className="rounded-md"
          aria-label="Menos ítems en aprendizaje"
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
          aria-label="Más ítems en aprendizaje"
          disabled={value >= total || busy}
          onClick={() => step(1)}
        >
          <ChevronRight />
        </Button>
      </div>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center font-sans">
              {isUnlock ? "¿Desbloquear temas?" : "¿Volver a bloquear temas?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {pending && pending.preview.unlock.length > 0 && (
                <>Se van a desbloquear: {pending.preview.unlock.map(labelOf).join(", ")}.</>
              )}
              {pending && pending.preview.lock.length > 0 && (
                <>
                  Se van a volver a bloquear:{" "}
                  {pending.preview.lock.map(labelOf).join(", ")}. Sus ítems vuelven a
                  quedar bloqueados.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className={confirmCls}
              onClick={() => {
                if (pending) applyCap(pending.target)
                setPending(null)
              }}
            >
              Confirmar
            </AlertDialogAction>
            <AlertDialogCancel className={cancelCls}>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
