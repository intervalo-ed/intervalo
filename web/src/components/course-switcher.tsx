"use client"

import { Button } from "@/components/ui/button"
import { COURSE_LABEL, type CourseId } from "@/lib/catalog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

// Selector de curso (Análisis ↔ Probabilidad) con chevrons prev/next. El estado
// vive en cada pantalla (URL en repaso, query state en práctica); acá solo se
// renderiza y se disparan los callbacks.
export function CourseSwitcher({
  course,
  onPrev,
  onNext,
}: {
  course: CourseId
  onPrev: () => void
  onNext: () => void
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
        <motion.span
          key={course}
          className="text-sm font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {COURSE_LABEL[course]}
        </motion.span>
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
