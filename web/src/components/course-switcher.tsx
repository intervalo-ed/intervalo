"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { COURSE_LABEL, type CourseId } from "@/lib/catalog"
import {
  markEditorGearSeen,
  useEditorGearSeen,
} from "@/lib/nav/editor-gear-seen"
import { ChevronLeft, ChevronRight, SettingsIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { usePathname } from "next/navigation"
import posthog from "posthog-js"

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
  const gearSeen = useEditorGearSeen()
  const pathname = usePathname()
  // Hojear cursos no navega (el estado vive en la URL como query), así que sin
  // evento propio es invisible en PostHog — y es justo el "mirar qué más hay"
  // que se quiere ver en los recién registrados. Se captura acá y no en cada
  // pantalla para que repaso y práctica midan igual.
  function trackSwitch(direction: "prev" | "next") {
    posthog.capture("course_switch", { from: course, direction, page: pathname })
  }
  return (
    <div className="flex h-9 shrink-0 items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.03] px-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Curso anterior"
        onClick={() => {
          trackSwitch("prev")
          onPrev()
        }}
        className={cn(editing && "text-[#7E80F7] hover:text-[#7E80F7]")}
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
          <span
            className={cn(
              "text-sm font-semibold",
              editing && "text-[#7E80F7]",
            )}
          >
            {COURSE_LABEL[course]}
          </span>
          {onToggleEdit && (
            <button
              type="button"
              onClick={() => {
                markEditorGearSeen()
                // Solo la apertura: el cierre no dice nada de curiosidad.
                if (!editing) {
                  posthog.capture("course_editor_open", {
                    course,
                    page: pathname,
                  })
                }
                onToggleEdit()
              }}
              aria-label={editing ? "Salir del editor" : "Editar curso"}
              aria-pressed={editing}
              className={cn(
                "relative flex size-6 items-center justify-center transition-colors",
                editing
                  ? "text-[#7E80F7]"
                  : "text-foreground/50 hover:text-foreground",
              )}
            >
              <SettingsIcon className="size-4" />
              {!gearSeen && !editing && (
                <span
                  aria-hidden
                  className="absolute right-[2px] top-[2px] rounded-full ring-1 ring-background"
                  style={{ width: 4, height: 4, backgroundColor: "#EC4869" }}
                />
              )}
            </button>
          )}
        </motion.div>
      </AnimatePresence>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Curso siguiente"
        onClick={() => {
          trackSwitch("next")
          onNext()
        }}
        className={cn(editing && "text-[#7E80F7] hover:text-[#7E80F7]")}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
