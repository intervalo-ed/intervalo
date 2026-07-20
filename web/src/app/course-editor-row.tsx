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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import MathText from "@/components/math-text"
import { cn } from "@/lib/utils"
import { InfoIcon, PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react"
import type { ReactNode } from "react"

export type TopicEditState = "locked" | "unlocked" | "suspended"

const confirmCls =
  "h-10 w-full sm:w-auto rounded-md bg-white text-black hover:bg-white/90 hover:text-black"
const cancelCls = "h-10 w-full sm:w-auto rounded-md bg-background dark:bg-background"

// Mismo tamaño que los pills de ítem (h-6 w-9) para igualar el ritmo vertical.
const btnCls = "flex h-6 w-9 items-center justify-center rounded-md border"

function ActionButton({
  enabled,
  icon,
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  enabled: boolean
  icon: ReactNode
  label: string
  title: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
}) {
  if (!enabled) {
    return (
      <span aria-hidden className={cn(btnCls, "border-white/5 text-foreground/20")}>
        {icon}
      </span>
    )
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              btnCls,
              "border-white/15 bg-white/5 text-foreground transition-colors hover:bg-white/10",
            )}
          >
            {icon}
          </button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center font-sans">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction className={confirmCls} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
          <AlertDialogCancel className={cancelCls}>Cancelar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Fila de tema en modo editor: label + tres acciones (Adelantar / Suspender /
// Reiniciar). El botón "encendido" depende del estado del tema.
export function CourseEditorRow({
  label,
  description,
  state,
  onAdvance,
  onSuspend,
  onReset,
}: {
  label: string
  description?: string
  state: TopicEditState
  onAdvance: () => void
  onSuspend: () => void
  onReset: () => void
}) {
  const unlocked = state === "unlocked"
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        state === "suspended" && "opacity-40",
      )}
    >
      {description ? (
        <Dialog>
          <DialogTrigger
            aria-label={`Qué es ${label}`}
            className="flex items-center gap-1.5 text-left outline-none"
          >
            <span className="text-sm leading-tight text-foreground/80">
              {label}
            </span>
            <InfoIcon className="size-3.5 shrink-0 text-foreground/40" />
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader className="gap-0.5">
              <DialogTitle className="font-sans text-sm font-semibold text-foreground">
                {label}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed text-foreground/80">
                <MathText text={description} />
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      ) : (
        <span className="text-sm leading-tight text-foreground/80">{label}</span>
      )}
      <div className="flex gap-1.5">
        {/* Botón que alterna adelantar (play) ↔ suspender (pause): uno cancela al
            otro según el estado del tema. */}
        {unlocked ? (
          <ActionButton
            enabled
            icon={<PauseIcon className="size-3.5" />}
            label={`Suspender ${label}`}
            title="¿Suspender este tema?"
            description={
              <>
                Se va a ocultar de tu curso y no aparecerá en tus repasos. Sus
                ítems en aprendizaje se ceden a los temas siguientes. Podés
                revertir esto usando la opción de{" "}
                <em className="italic">adelantar</em>.
              </>
            }
            confirmLabel="Suspender"
            onConfirm={onSuspend}
          />
        ) : (
          <ActionButton
            enabled
            icon={<PlayIcon className="size-3.5" />}
            label={`Adelantar ${label}`}
            title="¿Adelantar este tema?"
            description={
              <>
                Los ejercicios de este tema van a aparecer en tus sesiones de
                repaso. Podés revertir esto usando la opción de{" "}
                <em className="italic">suspender</em>.
              </>
            }
            confirmLabel="Adelantar"
            onConfirm={onAdvance}
          />
        )}
        <ActionButton
          enabled={unlocked}
          icon={<RotateCcwIcon className="size-3.5" />}
          label={`Reiniciar ${label}`}
          title="¿Reiniciar este tema?"
          description="Todos sus ítems vuelven a estado nuevo y se reprograman desde cero en tus próximas sesiones."
          confirmLabel="Reiniciar"
          onConfirm={onReset}
        />
      </div>
    </div>
  )
}
