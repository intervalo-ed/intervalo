"use client"

// La lista de reclutas: quiénes entraron por tu link y cuánto te dieron.
//
// La usan CUATRO pantallas, dos por producto: la vista "Reclutas" del ranking
// del minijuego y su diapo `¿Reclutas?`, y la vista "Reclutas" del ranking de
// Intervalo clásico. Es la misma tabla en los cuatro lados —el mismo puesto, el
// mismo @, la misma universidad, el mismo aporte en verde— así que vive acá y no
// adentro de ninguno de los dos, igual que `leaderboard-chrome.tsx`.
//
// Cada renglón NO lleva la XP propia del recluta: es la tabla de quien reclutó,
// no la del ranking, y con los dos números al lado el ojo compara y el que
// importa pierde.
//
// Lo único que cambia entre los dos productos es de dónde sale el color del
// nombre —el nivel de Elo en el juego, el cinturón máximo en clásico— y eso se
// resuelve afuera: acá entra una fila ya normalizada, con su color adentro.

import { XpDots } from "@/components/xp-dots"
import { UniTag } from "@/components/university-tag"
import { badgeWithCrown, CAREER_EMOJI } from "@/lib/career-emoji"
import { BELT_ORDER, BELT_UNIT_TEXT_COLORS } from "@/lib/catalog"
import { cn } from "@/lib/utils"
import { VERDE } from "@/app/derivadas/cafecito-cta"

/** Un renglón ya normalizado, con el color del nombre resuelto por quien llama.
 *
 *  Estructural a propósito: `GameRecruitEntry` trae `alias` y `level`, y
 *  `RecruitEntry` trae `username` y `belt`. Son la misma fila contada con dos
 *  vocabularios, y hacer que este componente entienda los dos lo obligaría a
 *  saber de los dos productos. */
export type FilaRecluta = {
  key: string | number
  rank: number
  nombre: string
  /** El color del nombre. Sale de `levelColor` en el juego y del cinturón
   *  máximo en clásico — que resultan ser la misma paleta, porque el nivel del
   *  juego se pinta con los colores de cinturón. */
  color: string
  university?: string | null
  career?: string | null
  xp_given: number
}

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
//
// Las universidades de acá son el FALLBACK, para cuando todavía no se sabe la
// de quien mira (ver `filasDeEjemplo`). Con universidad, las cinco se pintan con
// la SUYA: la promesa es "así se va a ver tu universidad ganando", y una fila
// de la UCA al lado de la propia no la cuenta tan bien como cinco de la propia.
//
// El `tono` es el escalón de la escala de cinturones (BELT_ORDER). Los cinco no
// son del mismo color a propósito: una lista monocroma se lee como una plantilla
// y no como cinco personas distintas.
const EJEMPLOS = [
  { rank: 1, alias: "cociente3196", university: "UCA", tono: 1, xp_given: 142 },
  { rank: 2, alias: "tangente4626", university: "UTN", tono: 2, xp_given: 98 },
  { rank: 3, alias: "escalar5925", university: "UBA", tono: 0, xp_given: 60 },
  { rank: 4, alias: "pendiente8515", university: "UNSAM", tono: 1, xp_given: 34 },
  { rank: 5, alias: "integral8801", university: "UTDT", tono: 0, xp_given: 12 },
] as const

// Para los indicadores de arriba del ranking: mientras se muestran estos
// renglones de ejemplo, los números de "Reclutas" y "Te aportaron" tienen que
// contar lo mismo que se ve acá abajo, no cero — cero al lado de cinco filas
// sería contradecirse.
export const EJEMPLOS_COUNT = EJEMPLOS.length
export const EJEMPLOS_XP_TOTAL = EJEMPLOS.reduce((sum, e) => sum + e.xp_given, 0)

/** Las filas de ejemplo, pintadas con la universidad de quien mira. */
export function filasDeEjemplo(
  university: string | null = null,
  cuantas: number = EJEMPLOS_COUNT,
): FilaRecluta[] {
  return EJEMPLOS.slice(0, cuantas).map((e) => ({
    key: `ejemplo-${e.rank}`,
    rank: e.rank,
    nombre: e.alias,
    color: BELT_UNIT_TEXT_COLORS[BELT_ORDER[e.tono]] ?? BELT_UNIT_TEXT_COLORS.white,
    university: university ?? e.university,
    xp_given: e.xp_given,
  }))
}

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

function Fila({ fila, ejemplo }: { fila: FilaRecluta; ejemplo?: boolean }) {
  const emoji = badgeWithCrown({
    username: fila.nombre,
    resolved: fila.career ? CAREER_EMOJI[fila.career] : undefined,
    career: fila.career,
  })
  return (
    <li
      // Las MISMAS medidas que una fila del ranking: mismo alto, mismo aire
      // adentro, mismos huecos. Es la misma tabla vista de otra manera, y una
      // fila más chica se lee como otro componente que se coló.
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
        {fila.rank}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className="truncate text-sm font-medium"
          style={{ color: fila.color }}
        >
          {fila.nombre}
        </span>
        {/* El mismo emoji de carrera que en el ranking, con la misma corona para
            quien la tiene: es la misma persona en las dos tablas y tiene que
            verse igual en las dos. */}
        {emoji && <span className="shrink-0 text-sm leading-none">{emoji}</span>}
      </span>
      {fila.university && (
        <span className="inline-flex shrink-0 items-center gap-1">
          <UniTag university={fila.university} />
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
        +{fila.xp_given}
        <XpDots className="size-[0.85em]" />
      </span>
    </li>
  )
}

export function ListaDeReclutas({
  filas,
  // Si estas filas son los renglones de ejemplo del estado vacío. Lo decide
  // quien llama, porque también decide cuántos ejemplos pedir.
  ejemplo = false,
  className,
}: {
  filas: FilaRecluta[]
  ejemplo?: boolean
  className?: string
}) {
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
  //
  // El `py-1` que sí lleva la lista del ranking no está acá a propósito: el
  // punteado se dibuja hacia adentro de la caja (offset negativo), así que sin
  // relleno vertical tampoco hay nada que se pueda recortar.
  return (
    <ul className={cn("flex flex-col gap-2", ejemplo && "opacity-90", className)}>
      {filas.map((fila) => (
        <Fila key={fila.key} fila={fila} ejemplo={ejemplo} />
      ))}
    </ul>
  )
}
