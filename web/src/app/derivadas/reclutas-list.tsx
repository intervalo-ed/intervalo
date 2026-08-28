"use client"

// La lista de reclutas: quiénes entraron por tu link y cuánto te dieron.
//
// Vive en su propio archivo porque la usan dos pantallas: la vista "Reclutas"
// del ranking y la diapo `¿Reclutas?` en el teléfono, donde el ranking no está
// en pantalla y la promesa no se vería si la lista no viajara con ella.
//
// Cada renglón lleva el puesto, el @, la universidad y lo aportado. NO lleva la
// XP propia del recluta: es la tabla de quien reclutó, no la del juego, y con los
// dos números al lado el ojo compara y el que importa pierde.

import { XpDots } from "@/components/xp-dots"
import { UniTag } from "@/components/university-tag"
import { cn } from "@/lib/utils"
import { VERDE } from "./cafecito-cta"
import { levelColor } from "./game-colors"
import type { GameRecruitEntry } from "./UseGameLeaderboard"

// Los tres renglones de ejemplo del estado vacío.
//
// Van con datos plausibles y no con guiones: lo que hay que mostrar es la FORMA
// de lo que va a pasar —un @, una universidad, un número en verde— y tres filas
// de rayitas no la muestran.
//
// Los @ salen del mismo generador que los de verdad (backend/game/aliases.py):
// palabra de matemática más cuatro dígitos. Que se parezcan a los reales es lo
// que hace que la lista se lea como una promesa concreta y no como un adorno.
//
// Lo que impide que se lean como datos es la combinación de tres cosas: el borde
// punteado, la opacidad, y sobre todo el renglón de abajo que dice qué son. Sin
// ese renglón, una fila punteada con un `+142` verde se lee como algo que no
// terminó de cargar.
const EJEMPLOS: GameRecruitEntry[] = [
  { rank: 1, player_id: -1, alias: "cociente3196", university: "UCA", level: 1, xp_given: 142 },
  { rank: 2, player_id: -2, alias: "tangente4626", university: "UTN", level: 2, xp_given: 98 },
  { rank: 3, player_id: -3, alias: "escalar5925", university: "UBA", level: 0, xp_given: 60 },
]

function Fila({ entry, ejemplo }: { entry: GameRecruitEntry; ejemplo?: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5",
        ejemplo ? "border border-dashed border-foreground/30" : "ring-1 ring-foreground/10",
      )}
    >
      <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {entry.rank}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-left text-sm font-medium"
        style={{ color: levelColor(entry.level) }}
      >
        {entry.alias}
      </span>
      {entry.university && <UniTag university={entry.university} />}
      <span
        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums"
        style={{ color: VERDE }}
      >
        +{entry.xp_given}
        <XpDots className="size-[0.85em]" />
      </span>
    </li>
  )
}

export function ListaDeReclutas({
  entries,
  className,
}: {
  entries: GameRecruitEntry[]
  className?: string
}) {
  const vacia = entries.length === 0
  const filas = vacia ? EJEMPLOS : entries
  return (
    <div className={className}>
      <ul className={cn("flex flex-col gap-1.5", vacia && "opacity-50")}>
        {filas.map((entry) => (
          <Fila key={entry.player_id} entry={entry} ejemplo={vacia} />
        ))}
      </ul>
      {vacia && (
        <p className="mt-3 px-1 text-left text-xs leading-relaxed text-muted-foreground">
          Así se va a ver cuando lleguen.
        </p>
      )}
    </div>
  )
}
