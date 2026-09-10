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
import { cn } from "@/lib/utils"

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

/** Las opciones del selector de universidad, con la elegida SIEMPRE adentro.
 *
 *  Existe por un bug que costó dos intentos de arreglo. El <Select> de Base UI
 *  es controlado, y cuando el valor que se le pasa no figura entre sus
 *  <SelectItem> montados, no se queda quieto: revierte al valor inicial y avisa
 *  llamando a `onValueChange` con ÉL. O sea que el componente le contesta al
 *  padre "elegiste Todas" sin que nadie haya elegido nada.
 *
 *  Y la lista se vaciaba sola: sale de `summary.data.universities`, y el resumen
 *  se pide con el scope adentro de la clave de caché, así que elegir una
 *  universidad estrena clave, deja `data` en undefined por un commit y borra
 *  todas las opciones menos "Todas". El resultado, desde el asiento de la
 *  persona: la primera vez que filtrás no pasa nada, y la segunda —con el
 *  resumen ya cacheado— funciona.
 *
 *  La causa se saca en cada pantalla pidiendo el catálogo sin scope (el backend
 *  lo devuelve igual para todos: «esas van siempre sin scope», dice su
 *  docstring). Esto es la red de abajo: mientras la elegida esté montada, no hay
 *  revert posible, venga la lista vacía por donde venga. */
export function opcionesDeUniversidad(universities: string[], elegida: string): string[] {
  const fuera = elegida !== ALL_SCOPE && !universities.includes(elegida)
  return fuera ? [elegida, ...universities] : universities
}

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
  // Deshabilitado de VERDAD, no apagado a medias. `ScopeFilters` bajaba la
  // opacidad de estas cajas y nada más, así que un selector que se veía
  // apagado seguía aceptando clicks: el valor mostrado venía de otro lado y
  // la elección quedaba guardada sin efecto, para aparecer de golpe cuando el
  // otro lado soltaba el control. Desde el asiento de la persona eso es «la
  // primera vez el filtro no hizo nada».
  disabled = false,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  display: (v: string) => React.ReactNode
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange(v)}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={label}
        disabled={disabled}
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
      {/* `alignItemWithTrigger={false}`: por defecto el componente usa el modo
          "select nativo" de Base UI, que monta la lista ENCIMA del disparador
          alineando la opción elegida con él. Eso, en un filtro con veinte
          universidades y dentro de una pantalla de 667 px, tapa medio ranking y
          se va por abajo del borde; y además ese modo trae reglas propias de
          foco y puntero (el disparador se cierra solo si recibe el foco estando
          abierto). Acá alcanza y sobra con un desplegable normal, colgado del
          disparador y con su propio scroll. */}
      <SelectContent alignItemWithTrigger={false}>{children}</SelectContent>
    </Select>
  )
}

// Las vistas del ranking. "recruits" es opt-in (`withRecruits`) porque no toda
// pantalla que monta esto tiene reclutas que mostrar: la eligen los dos rankings
// —el del minijuego y el de Intervalo clásico—, no la vista pública.
export type RankingView = "individual" | "university" | "recruits"

// "Reclutas" a secas y no "Mis reclutas": al lado de Individual y Universitario
// el posesivo sobra, porque ya son tuyos por definición y ninguna de las otras
// dos lo lleva.
const VIEW_LABEL: Record<RankingView, string> = {
  individual: "Individual",
  university: "Universitario",
  recruits: "Reclutas",
}

// Los tres selectores del ranking, con el mismo orden y las mismas etiquetas en
// Intervalo y en el minijuego.
export function ScopeFilters({
  view,
  onViewChange,
  career = ALL_SCOPE,
  onCareerChange,
  university,
  onUniversityChange,
  universities,
  withRecruits = false,
  // La caja de carrera es opt-in, igual que la de reclutas. El ranking del
  // minijuego la sacó —tres selectores para elegir entre cinco carreras eran
  // más pantalla de la que ese filtro se ganaba— y el de Intervalo la
  // conserva. El componente es UNO solo a propósito, así que la diferencia se
  // pide con una prop y no clonando la cabecera.
  withCareer = true,
  // Carrera y universidad no significan nada sobre los reclutas propios: son
  // tuyos, y filtrarlos por universidad es filtrar una lista de cinco personas.
  // Se apagan en vez de desaparecer para que la fila no cambie de forma al
  // cambiar de vista.
  scopeDisabled = false,
}: {
  view: RankingView
  onViewChange: (v: RankingView) => void
  career?: string
  onCareerChange?: (v: string) => void
  university: string
  onUniversityChange: (v: string) => void
  universities: string[]
  withRecruits?: boolean
  withCareer?: boolean
  scopeDisabled?: boolean
}) {
  return (
    <div
      className={cn(
        "grid gap-2",
        // Derivado de cuántas cajas se dibujan y no fijo en tres: con la de
        // carrera apagada, `grid-cols-3` dejaba una columna vacía a la derecha
        // y las dos que quedaban a dos tercios de ancho.
        withCareer ? "grid-cols-3" : "grid-cols-2",
        scopeDisabled && "[&>*:not(:first-child)]:opacity-40",
      )}
    >
      <FilterBox
        label="Ranking"
        value={view}
        onChange={(v) => onViewChange(v as RankingView)}
        display={(v) => VIEW_LABEL[v as RankingView] ?? v}
      >
        <SelectItem value="individual">Individual</SelectItem>
        <SelectItem value="university">Universitario</SelectItem>
        {withRecruits && <SelectItem value="recruits">Reclutas</SelectItem>}
      </FilterBox>

      {withCareer && (
        <FilterBox
          label="Carrera"
          value={career}
          onChange={onCareerChange ?? (() => {})}
          display={(v) => (v === ALL_SCOPE ? "Todas" : (CAREER_NAME[v] ?? v))}
          disabled={scopeDisabled}
        >
          <SelectItem value={ALL_SCOPE}>Todas</SelectItem>
          {CAREER_META.map((c) => (
            <SelectItem key={c.key} value={c.key}>
              {c.name}
            </SelectItem>
          ))}
        </FilterBox>
      )}

      <FilterBox
        label="Universidad"
        value={university}
        onChange={onUniversityChange}
        display={(v) => (v === ALL_SCOPE ? "Todas" : v)}
        disabled={scopeDisabled}
      >
        <SelectItem value={ALL_SCOPE}>Todas</SelectItem>
        {opcionesDeUniversidad(universities, university).map((u) => (
          <SelectItem key={u} value={u}>
            {u}
          </SelectItem>
        ))}
      </FilterBox>
    </div>
  )
}
