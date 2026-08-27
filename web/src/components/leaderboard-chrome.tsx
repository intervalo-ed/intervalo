"use client"

// Cabecera compartida de los rankings: los dos números grandes y los tres
// selectores. Estaban dentro de leaderboard-content.tsx; se extrajeron para que
// el ranking del minijuego (app/derivadas/game-ranking.tsx) sea exactamente el
// mismo formato y no una imitación.

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDownIcon } from "lucide-react"

// Valor del filtro "sin acotar", compartido por los selectores.
export const ALL_SCOPE = "all"

// Carreras en orden fijo + catch-all "Otra". Nombre completo, sin abreviar y
// sin emoji, tanto en el valor colapsado del filtro como en el desplegable.
export const CAREER_META: { key: string; name: string }[] = [
  { key: "S", name: "Ciencia" },
  { key: "T", name: "Tecnología" },
  { key: "E", name: "Ingeniería" },
  { key: "M", name: "Matemática" },
  { key: "Otra", name: "Otra" },
]

export const CAREER_NAME: Record<string, string> = Object.fromEntries(
  CAREER_META.map((c) => [c.key, c.name]),
)

export const fmtCount = (n: number) => n.toLocaleString("es")

export function Metric({
  label,
  value,
}: {
  label: React.ReactNode
  value: React.ReactNode
}) {
  return (
    <div className="flex flex-col justify-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-[14px]">
      <span className="text-lg font-semibold leading-none tabular-nums">
        {value}
      </span>
      <span className="whitespace-nowrap text-[0.7rem] leading-tight text-foreground/60">
        {label}
      </span>
    </div>
  )
}

export function FilterBox({
  label,
  value,
  onChange,
  display,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  display: (v: string) => React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Select value={value} onValueChange={(v) => v && onChange(v)}>
      <SelectTrigger
        aria-label={label}
        className="flex h-auto! w-full flex-col items-stretch justify-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-[10px] text-foreground shadow-none [&>svg]:hidden"
      >
        <SelectValue className="truncate text-left text-[0.75rem] font-semibold leading-none tabular-nums">
          {display}
        </SelectValue>
        <span className="flex items-center justify-between gap-1 text-[0.65rem] leading-tight text-foreground/60">
          <span className="truncate whitespace-nowrap">{label}</span>
          <ChevronDownIcon className="size-3 shrink-0" />
        </span>
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  )
}

// Los tres selectores del ranking, con el mismo orden y las mismas etiquetas en
// Intervalo y en el minijuego.
export function ScopeFilters({
  view,
  onViewChange,
  career,
  onCareerChange,
  university,
  onUniversityChange,
  universities,
}: {
  view: "individual" | "university"
  onViewChange: (v: "individual" | "university") => void
  career: string
  onCareerChange: (v: string) => void
  university: string
  onUniversityChange: (v: string) => void
  universities: string[]
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <FilterBox
        label="Ranking"
        value={view}
        onChange={(v) => onViewChange(v as "individual" | "university")}
        display={(v) => (v === "individual" ? "Individual" : "Universitario")}
      >
        <SelectItem value="individual">Individual</SelectItem>
        <SelectItem value="university">Universitario</SelectItem>
      </FilterBox>

      <FilterBox
        label="Carrera"
        value={career}
        onChange={onCareerChange}
        display={(v) => (v === ALL_SCOPE ? "Todas" : (CAREER_NAME[v] ?? v))}
      >
        <SelectItem value={ALL_SCOPE}>Todas</SelectItem>
        {CAREER_META.map((c) => (
          <SelectItem key={c.key} value={c.key}>
            {c.name}
          </SelectItem>
        ))}
      </FilterBox>

      <FilterBox
        label="Universidad"
        value={university}
        onChange={onUniversityChange}
        display={(v) => (v === ALL_SCOPE ? "Todas" : v)}
      >
        <SelectItem value={ALL_SCOPE}>Todas</SelectItem>
        {universities.map((u) => (
          <SelectItem key={u} value={u}>
            {u}
          </SelectItem>
        ))}
      </FilterBox>
    </div>
  )
}
