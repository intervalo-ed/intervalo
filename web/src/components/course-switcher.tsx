"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COURSE_LABEL, type CourseId } from "@/lib/catalog"
import { ChevronLeft, ChevronRight, SettingsIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

// Selector de curso (Análisis ↔ Probabilidad) con chevrons prev/next. El estado
// vive en cada pantalla (URL en repaso, query state en práctica); acá solo se
// renderiza y se disparan los callbacks. En repaso, `onToggleEdit` agrega una
// tuerca a la derecha del título para entrar/salir del modo editor.
export function CourseSwitcher({
  course,
  onPrev,
  onNext,
  editing,
  onToggleEdit,
}: {
  course: CourseId
  onPrev: () => void
  onNext: () => void
  editing?: boolean
  onToggleEdit?: () => void
}) {
  return (
    <div className="flex h-9 shrink-0 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] px-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Curso anterior"
        onClick={onPrev}
      >
        <ChevronLeft />
      </Button>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={course}
          className="flex items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span className="text-sm font-semibold">{COURSE_LABEL[course]}</span>
          {onToggleEdit && (
            <button
              type="button"
              onClick={onToggleEdit}
              aria-label={editing ? "Salir del editor" : "Editar curso"}
              aria-pressed={editing}
              className={cn(
                "flex size-6 items-center justify-center rounded-md border transition-colors",
                editing
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-transparent text-foreground/50 hover:text-foreground",
              )}
            >
              <SettingsIcon className="size-4" />
            </button>
          )}
        </motion.div>
      </AnimatePresence>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Curso siguiente"
        onClick={onNext}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
