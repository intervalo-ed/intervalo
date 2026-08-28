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
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { cn } from "@/lib/utils"
import { VERDE } from "./cafecito-cta"
import { levelColor } from "./game-colors"
import type { GameRecruitEntry } from "./UseGameLeaderboard"

// Los renglones de ejemplo del estado vacío.
//
// Van con datos plausibles y no con guiones: lo que hay que mostrar es la FORMA
// de lo que va a pasar —un @, una universidad, un número en verde— y unas filas
// de rayitas no la muestran.
//
// Los @ salen del mismo generador que los de verdad (backend/game/aliases.py):
// palabra de matemática más cuatro dígitos. Que se parezcan a los reales es lo
// que hace que la lista se lea como una promesa concreta y no como un adorno.
//
// Cinco y no tres: con tres, la lista termina en un puesto al que se llega
// rápido y el hueco de abajo es lo que más se ve. Cinco llenan la caja y dejan
// planteado que la cosa sigue.
//
// Lo que impide que se lean como datos son el borde punteado y la opacidad —el
// aporte además baja fuerte hacia abajo, así que la columna verde tampoco se
// lee como un ranking real en marcha.
const EJEMPLOS: GameRecruitEntry[] = [
  { rank: 1, player_id: -1, alias: "cociente3196", university: "UCA", level: 1, xp_given: 142 },
  { rank: 2, player_id: -2, alias: "tangente4626", university: "UTN", level: 2, xp_given: 98 },
  { rank: 3, player_id: -3, alias: "escalar5925", university: "UBA", level: 0, xp_given: 60 },
  { rank: 4, player_id: -4, alias: "pendiente8515", university: "UNSAM", level: 1, xp_given: 34 },
  { rank: 5, player_id: -5, alias: "integral8801", university: "UTDT", level: 0, xp_given: 12 },
]

// El recuadro punteado de un renglón de ejemplo.
//
// Verde y no gris: el punteado gris se leía como un hueco —una fila que falta—
// y lo que tiene que decir es lo contrario, que ahí va a entrar algo que paga.
// Con el mismo verde del aporte, la caja y el número de la derecha hablan del
// mismo asunto.
//
// Va por `style` y no por clase porque el color sale de una constante
// interpolada, y Tailwind encuentra las clases leyendo el código como texto: una
// armada con template no existe en el CSS final.
// `outline` y no `border`, y eso importa para el tamaño. Una fila real se dibuja
// con `ring`, que es una sombra y no ocupa lugar; con un `border` de 1px la fila
// de ejemplo medía dos píxeles más de alto que la de al lado. El `outline` no
// entra en la caja, así que las dos miden exactamente igual, y con offset
// negativo se dibuja donde estaría el borde en vez de por fuera del redondeo.
const CAJA_EJEMPLO: React.CSSProperties = {
  outline: `1px dashed color-mix(in oklab, ${VERDE} 75%, transparent)`,
  outlineOffset: "-1px",
  backgroundColor: `color-mix(in oklab, ${VERDE} 13%, transparent)`,
}

function Fila({ entry, ejemplo }: { entry: GameRecruitEntry; ejemplo?: boolean }) {
  const emoji = badgeWithCrown({
    username: entry.alias,
    resolved: entry.career ? CAREER_EMOJI[entry.career] : undefined,
    career: entry.career,
  })
  return (
    <li
      // Las MISMAS medidas que una fila del ranking (ver `Row` en
      // game-ranking.tsx): mismo alto, mismo aire adentro, mismos huecos. Es la
      // misma tabla vista de otra manera, y una fila más chica se lee como otro
      // componente que se coló.
      //
      // El punteado de la fila de ejemplo va por `outline` y el de una real por
      // `ring` — ninguno de los dos ocupa lugar en la caja, así que las dos miden
      // exactamente igual (ver CAJA_EJEMPLO).
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3",
        !ejemplo && "ring-1 ring-foreground/10",
      )}
      style={ejemplo ? CAJA_EJEMPLO : undefined}
    >
      <span className="w-4 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {entry.rank}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className="truncate text-sm font-medium"
          style={{ color: levelColor(entry.level) }}
        >
          {entry.alias}
        </span>
        {/* El mismo emoji de carrera que en el ranking, con la misma corona para
            quien la tiene: es la misma persona en las dos tablas y tiene que
            verse igual en las dos. */}
        {emoji && <span className="shrink-0 text-sm leading-none">{emoji}</span>}
      </span>
      {entry.university && (
        <span className="inline-flex shrink-0 items-center gap-1">
          <UniTag university={entry.university} />
        </span>
      )}
      {/* Donde el ranking pone la XP del jugador, acá va lo que aportó. Mismo
          lugar, mismo tamaño, mismo ícono — lo único distinto es el signo, el
          verde, y que este número no abre el cartel que explica qué es la
          experiencia, porque no es la experiencia de nadie sino un aporte. */}
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded text-sm font-semibold tabular-nums"
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
  // Sin rótulo que explique que son ejemplos: el borde punteado y la opacidad ya
  // lo dicen, y escribirlo además obligaba a leer un renglón para enterarse de
  // algo que se ve.
  //
  // La opacidad de la lista de ejemplo terminó en 90 después de subirla dos
  // veces. Empezó en 50 y era el ajuste equivocado: bajarle el brillo a todo por
  // parejo apaga también lo único que hay en pantalla mostrando qué se gana.
  //
  // Lo que separa un ejemplo de una fila real no es que esté más apagado sino
  // que está PUNTEADO y tiene fondo verde, dos cosas que ninguna fila real
  // tiene. Con esas dos haciendo el trabajo, la opacidad puede quedarse en el
  // hilo que hace falta para que la caja no se lea como definitiva.
  // El `py-1` que sí lleva la lista del ranking no está acá a propósito: ver el
  // comentario de `RecruitsRanking` en game-ranking.tsx. El punteado se dibuja
  // hacia adentro de la caja (offset negativo), así que sin relleno vertical
  // tampoco hay nada que se pueda recortar.
  return (
    <ul className={cn("flex flex-col gap-2", vacia && "opacity-90", className)}>
      {filas.map((entry) => (
        <Fila key={entry.player_id} entry={entry} ejemplo={vacia} />
      ))}
    </ul>
  )
}
