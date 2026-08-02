"use client"

import MathText from "@/components/math-text"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { components } from "@/lib/api/schema"
import type { Topic } from "@/lib/catalog/analisis.generated"
import { topicShortLabel } from "@/lib/catalog"
import { exerciseTypeInfo } from "@/lib/catalog/exercise-types"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"

type TopicProgress = components["schemas"]["TopicProgress"]

function topicLabel(topic: Topic): string {
  return topicShortLabel({ topic: topic.key, fallback: topic.name })
}

// Paleta de estados de ítem. Fuente de verdad de colores, espejada del onboarding.
export const ITEM_COLORS = {
  nuevo: "#3B82F6", // azul
  pendiente: "#F2B705", // amarillo
  aprendiendo: "#8BC34A", // verde-lima
  lejano: "#43A047", // verde césped
  lejanoMas: "#2E7D32", // verde pino (más maduro, misma categoría "Lejano"; usado para el relleno)
  lejanoMasAccent: "#4CAF50", // variante más brillante del pino, para contorno y texto
} as const

// Estado de un ítem en la grilla. `days` = días restantes hasta el próximo repaso.
export type Cell =
  | { kind: "empty" }
  | { kind: "nuevo" }
  | { kind: "pendiente" } // repaso para hoy → 0 días
  | { kind: "aprendiendo"; days: number } // days > 0
  | { kind: "lejano"; days: number } // days > 0
  | { kind: "lejano_mas"; days: number } // days > 0, variante más madura

export function cellColor(cell: Cell): string | null {
  switch (cell.kind) {
    case "nuevo":
      return ITEM_COLORS.nuevo
    case "pendiente":
      return ITEM_COLORS.pendiente
    case "aprendiendo":
      return ITEM_COLORS.aprendiendo
    case "lejano":
      return ITEM_COLORS.lejano
    case "lejano_mas":
      return ITEM_COLORS.lejanoMas
    case "empty":
      return null
  }
}

// Color de texto/contorno. Igual a cellColor salvo en "lejano_mas", donde el
// relleno usa el pino oscuro pero el texto/borde se ve más brillante.
export function cellAccentColor(cell: Cell): string | null {
  if (cell.kind === "lejano_mas") return ITEM_COLORS.lejanoMasAccent
  return cellColor(cell)
}

export function cellLabel(cell: Cell): string {
  switch (cell.kind) {
    case "pendiente":
      return "0d"
    case "aprendiendo":
    case "lejano":
    case "lejano_mas":
      return `${cell.days}d`
    case "nuevo":
    case "empty":
      return "-"
  }
}

const STATE_INFO: Record<
  Cell["kind"],
  { label: string; description: string; color: string }
> = {
  empty: {
    label: "Bloqueado",
    description: "Se desbloquea a medida que avanzás en la unidad.",
    color: "#9CA3AF",
  },
  nuevo: {
    label: "Nuevo",
    description: "Todavía no resolviste ejercicios de este tipo.",
    color: ITEM_COLORS.nuevo,
  },
  pendiente: {
    label: "Pendiente",
    description: "Tenés un repaso para hacer hoy.",
    color: ITEM_COLORS.pendiente,
  },
  // Visibles por días restantes; ocultan el estado interno (aprendiendo/lejano).
  // La descripción se calcula con stateDescription() según los días.
  aprendiendo: {
    label: "Próximo",
    description: "",
    color: ITEM_COLORS.aprendiendo,
  },
  lejano: {
    label: "Lejano",
    description: "",
    color: ITEM_COLORS.lejano,
  },
  lejano_mas: {
    label: "Lejano",
    description: "",
    color: ITEM_COLORS.lejanoMasAccent,
  },
}

function stateDescription(cell: Cell): string {
  if (cell.kind === "aprendiendo" || cell.kind === "lejano" || cell.kind === "lejano_mas") {
    return cell.days === 1
      ? "Mañana vas a volver a repasar este ítem."
      : `Dentro de ${cell.days} días vas a volver a repasar este ítem.`
  }
  return STATE_INFO[cell.kind].description
}

const DAY_MS = 24 * 60 * 60 * 1000

// Parsea "YYYY-MM-DD" como fecha LOCAL a medianoche. `new Date("YYYY-MM-DD")` la
// interpreta como UTC, lo que en husos negativos (ej. Argentina) corre el día uno
// para atrás y haría que "mañana" se vea como vencido hoy.
function parseLocalDate(s: string): Date {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d)
}

// Días de calendario hasta el próximo repaso (puede ser 0 o negativo = vencido).
function daysUntil(nextReview: string | null | undefined): number | null {
  if (!nextReview) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = parseLocalDate(nextReview)
  return Math.round((target.getTime() - today.getTime()) / DAY_MS)
}

// A partir de cuántos días de intervalo se considera "lejano" (verde) en vez de
// "próximo" (lima). Por debajo de esto el repaso es cercano.
const CONSOLIDATED_DAYS = 3

// A partir de cuántos días un "lejano" pasa a la variante más madura
// "lejano_mas" (mismo texto "Lejano", color más oscuro para dar variedad).
const LEJANO_MAS_DAYS = 14

// Mapea el progreso real de un tema → una celda por cada exercise_type esperado,
// usando el `next_review` PROPIO de cada unit. Temas bloqueados → "empty".
export function topicToCells({
  topic,
  types,
}: {
  topic: TopicProgress | undefined
  types: string[]
}): { typeId: string; cell: Cell }[] {
  return types.map((typeId) => {
    if (!topic || topic.skills.length === 0) {
      return { typeId, cell: { kind: "empty" } as Cell }
    }
    const skill = topic.skills.find((s) => s.exercise_type === typeId)
    if (!skill || skill.state === "sin_empezar") {
      return { typeId, cell: { kind: "nuevo" } as Cell }
    }
    const days = daysUntil(skill.next_review)
    if (days === null) {
      return { typeId, cell: { kind: "aprendiendo", days: 1 } as Cell }
    }
    if (days <= 0) {
      return { typeId, cell: { kind: "pendiente" } as Cell }
    }
    const kind =
      days >= LEJANO_MAS_DAYS
        ? "lejano_mas"
        : days >= CONSOLIDATED_DAYS
          ? "lejano"
          : "aprendiendo"
    return { typeId, cell: { kind, days } as Cell }
  })
}

export type BeltGridRow = {
  topic: Topic
  cells: { typeId: string; cell: Cell }[]
}

export function BeltGrid({
  rows,
  onItemTap,
  showState,
}: {
  rows: BeltGridRow[]
  onItemTap?: () => void
  showState?: boolean
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <div
          key={row.topic.key}
          className="flex items-center justify-between gap-3"
        >
          <Dialog>
            <DialogTrigger
              aria-label={`Más sobre ${topicLabel(row.topic)}`}
              className="flex items-center gap-1.5 text-left outline-none"
            >
              <span className="text-sm leading-tight text-foreground/80">
                {topicLabel(row.topic)}
              </span>
              <Info className="size-3.5 shrink-0 text-foreground/40" />
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader className="gap-0.5">
                <DialogTitle className="font-sans text-sm font-semibold text-foreground">
                  {topicLabel(row.topic)}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-foreground/80">
                  <MathText text={row.topic.tooltip} />
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <div className="flex gap-1">
            {row.cells.map(({ typeId, cell }) => (
              <ItemPill
                key={typeId}
                topic={row.topic}
                typeId={typeId}
                cell={cell}
                onTap={onItemTap}
                showState={showState}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ItemPill({
  topic,
  typeId,
  cell,
  onTap,
  showState,
}: {
  topic: Topic
  typeId: string
  cell: Cell
  onTap?: () => void
  showState?: boolean
}) {
  const color = cellColor(cell)
  const accentColor = cellAccentColor(cell)
  const label = cellLabel(cell)
  const painted = color !== null
  const skill = exerciseTypeInfo({ type: typeId })
  return (
    <Dialog>
      <DialogTrigger
        onClick={onTap}
        aria-label={`${topic.name} — ${skill.label}`}
        style={
          painted
            ? {
                color: accentColor ?? undefined,
                borderColor: `${accentColor}99`,
                backgroundColor: `${color}33`,
              }
            : undefined
        }
        className={cn(
          "flex h-6 w-9 items-center justify-center rounded-md border text-[0.6rem] font-semibold tabular-nums transition-opacity hover:opacity-80",
          !painted && "border-white/15 bg-white/5 text-foreground/40",
        )}
      >
        {label}
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader className="gap-0.5">
          <DialogTitle className="font-sans text-sm font-semibold text-foreground">
            {topicLabel(topic)}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-foreground/80">
            <MathText text={topic.short_description ?? topic.tooltip} />
          </DialogDescription>
        </DialogHeader>
        <div className="mt-1 flex flex-col gap-0.5 border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">
            {skill.label}
          </span>
          <span className="text-sm text-foreground/70">{skill.description}</span>
        </div>
        {showState && (
          <div className="flex flex-col gap-0.5 border-t border-border pt-3">
            <span
              className="text-sm font-semibold"
              style={{ color: STATE_INFO[cell.kind].color }}
            >
              {STATE_INFO[cell.kind].label}
            </span>
            <span className="text-sm text-foreground/70">
              {stateDescription(cell)}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
