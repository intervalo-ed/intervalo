"use client"

// Página de un solo uso: renderiza el top de universidades para las imágenes
// de campaña de Hermes (hermes/campaigns/ranking_image.py la abre con
// Selenium y le saca un screenshot del elemento). No es una pantalla del
// juego —no hay
// fetch, no hay sesión de jugador, no hay filtros— es la MISMA pintura que
// game-ranking.tsx :: UniversityRanking pero con los datos puestos por afuera
// en la URL, para que la imagen de campaña sea un screenshot de componentes
// reales y no un dibujo aparte hecho a mano que se desincroniza en el primer
// rediseño del ranking.
//
// Sin selectores de vista/universidad a propósito: esta pantalla no se elige
// nada, se manda.
//
//   /derivadas/campana-ranking?data=<JSON codificado con encodeURIComponent>
//
// data: { estudiantes: number, derivadas: number,
//         filas: { universidad: string, estudiantes: number, xp: number }[] }

import { useSearchParams } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { LayersIcon, UsersIcon } from "lucide-react"
import { fmtCount } from "@/components/leaderboard-chrome"
import { UniTag } from "@/components/university-tag"
import { XpDots } from "@/components/xp-dots"
import { GRID_BG_STYLE } from "@/components/grid-bg"

type Fila = { universidad: string; estudiantes: number; xp: number }
type Datos = { estudiantes: number; derivadas: number; filas: Fila[] }

// Mismo layout que <Metric> (leaderboard-chrome.tsx), pero con fondo SÓLIDO
// en vez de `bg-white/5`: ese tono es translúcido a propósito para flotar
// sobre el resto de la UI del juego, y acá la grilla del fondo se le colaba
// por detrás. No se toca el componente compartido —lo usan otras pantallas
// que sí quieren la translucidez— así que esta es una variante local, solo
// para la imagen de campaña.
function MetricSolido({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex flex-col justify-center gap-1 rounded-md border border-border bg-card px-3 py-[14px]">
      <span className="text-lg font-semibold leading-none tabular-nums">{value}</span>
      <span className="whitespace-nowrap text-[0.7rem] leading-tight text-foreground/60">
        {label}
      </span>
    </div>
  )
}

function Contenido() {
  const params = useSearchParams()
  const crudo = params.get("data")
  let datos: Datos | null = null
  try {
    datos = crudo ? (JSON.parse(crudo) as Datos) : null
  } catch {
    datos = null
  }

  if (!datos) {
    return <p className="p-6 text-sm text-red-400">Falta ?data= con el JSON de universidades.</p>
  }

  return (
    <div className="game-shell min-h-screen bg-background" style={GRID_BG_STYLE}>
      {/* La grilla de fondo queda visible (es la piel de marca real de
          /derivadas) — lo que cambia es que cada tarjeta y cada fila son
          SÓLIDAS, no translúcidas, para que el texto no compita con las
          líneas de la grilla pasando por detrás. */}
      <div data-campana-card className="mx-auto flex w-full max-w-sm flex-col gap-3 p-4">
        {/* Los dos indicadores: mismo bloque que la cabecera del ranking del
            juego (game-ranking.tsx :: Metric), pero sumando solo las
            universidades de `filas` —no la base entera del juego— y con
            fondo sólido (ver MetricSolido). */}
        <div className="grid grid-cols-2 gap-2">
          <MetricSolido
            label="Estudiantes activos"
            value={
              <span className="inline-flex items-center gap-1.5">
                {fmtCount(datos.estudiantes)}
                <UsersIcon className="size-[0.85em] text-primary" />
              </span>
            }
          />
          <MetricSolido
            label="Derivadas resueltas"
            value={
              <span className="inline-flex items-center gap-1.5">
                {fmtCount(datos.derivadas)}
                <LayersIcon className="size-[0.85em] text-primary" />
              </span>
            }
          />
        </div>

        {/* La lista: mismas clases que UniversityRanking salvo el fondo
            —`bg-card` sólido en vez del `ring-1` translúcido de la fila
            real— sin `mine` (ninguna fila se resalta) y sin el Popover del
            cafecito (XP en texto plano). */}
        <ol className="flex flex-col gap-2 py-1">
          {datos.filas.map((row, index) => (
            <li
              key={row.universidad}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex min-w-0 flex-1 items-center gap-1">
                <UniTag university={row.universidad} />
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                {fmtCount(row.estudiantes)}
                <UsersIcon className="size-[0.9em] text-white" />
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                {fmtCount(row.xp)}
                <XpDots className="size-[0.9em] text-white" />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function CampanaRankingPage() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  )
}
