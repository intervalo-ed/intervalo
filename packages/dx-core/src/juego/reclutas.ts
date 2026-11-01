// Lo que reclutar comparte entre la web y la app nativa: el disparador de la
// diapo, el verde de WhatsApp, el link con el @ y las filas de ejemplo de la
// lista. Sin React: el hook de las filas vive en UseFilasDeEjemplo.ts.

import { BELT_ORDER, BELT_UNIT_TEXT_COLORS } from "../catalog"

// `record` sigue reservado para el cafecito: la diapo de reclutar que sale sola
// lo hace por conteo, y "hito" es lo que la distingue de la que abrió la persona.
export type ReclutasTrigger = "pedido" | "hito"

// El verde de WhatsApp, con el mismo tratamiento que el marrón del cafecito:
// `VERDE` para el relleno del botón y `VERDE_TINTA` para lo que es tinta sobre el
// fondo oscuro.
//
// El relleno lleva letra OSCURA y no blanca. #25D366 es un color claro: contra
// blanco da 1,9:1 —ilegible— y contra este verde muy oscuro, 9,6:1. Es la misma
// decisión que toma el botón del cafecito cuando el slider lo lleva al dorado.
export const VERDE = "#25D366"
export const VERDE_TINTA_OSCURA = "#07271A"
// El verde de la TINTA: el de la barra de arriba y el de las filas de color de
// configuración. Va apagado contra el relleno, porque al lado tiene al marrón
// del cafecito y con los dos al mismo brillo el verde se lo comía.
//
// Pero estaba apagado de más. Medido sobre el fondo del juego (#131324):
// #25D366 da 9,2:1 y el marrón #EABB74 da 10,3:1 — o sea que el verde nunca
// tuvo más contraste que su vecino, y el #2E9E5B que había acá daba 5,4:1, la
// mitad. Lo que hacía que se comiera al otro no era el contraste sino la
// saturación: un verde saturado tira más del ojo que un ámbar suave con el
// mismo brillo. Así que el freno se mantiene, pero apenas: este da 7,1:1, se
// lee bastante más verde de WhatsApp y sigue estando por debajo del marrón.
export const VERDE_TINTA = "#2CB863"

/** El link con el @ de quien comparte, que es lo que después permite contar
 *  cuánta gente entró por cada persona (ver FIRST_REFERRER en
 *  web/src/lib/analytics/attribution.ts). Sin alias, el link pelado. `base` es
 *  la URL de /derivadas de cada plataforma. */
export function shareLink({ alias, base }: { alias?: string | null; base: string }): string {
  return alias ? `${base}?r=${encodeURIComponent(alias)}` : base
}

/** Un renglón ya normalizado, con el color del nombre resuelto por quien llama.
 *
 *  Estructural a propósito: `GameRecruitEntry` trae `alias` y `level`, y
 *  `RecruitEntry` trae `username` y `belt`. Son la misma fila contada con dos
 *  vocabularios, y hacer que la tabla entienda los dos la obligaría a saber de
 *  los dos productos. */
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
  /** Es el #1 del ranking general de clásico. Solo lo manda el backend de
   *  clásico; en el juego y en los renglones de ejemplo queda sin corona. */
  crowned?: boolean
}

// Los renglones de ejemplo del estado vacío.
//
// Van con datos plausibles y no con guiones: lo que hay que mostrar es la FORMA
// de lo que va a pasar —un @, una universidad, un número en verde— y unas filas
// de rayitas no la muestran.
//
// Los @ se sortean de `POOL_DE_EJEMPLO` (reclutas-ejemplos.ts), armado mirando
// los que la gente eligió de verdad en producción. Lo que NO se sortea es el
// resto de la fila —puesto, aporte, universidad, color—: esos cuentan la forma
// de la cosa y tienen que ser estables.
//
// Cinco y no tres: con tres, la lista termina en un puesto al que se llega
// rápido y el hueco de abajo es lo que más se ve. Cinco llenan la caja y dejan
// planteado que la cosa sigue.
//
// Las universidades de acá son el FALLBACK, para cuando todavía no se sabe la
// de quien mira (ver `useFilasDeEjemplo`). Con universidad, las cinco se pintan
// con la SUYA: la promesa es "así se va a ver tu universidad ganando".
//
// El `tono` es el escalón de la escala de cinturones (BELT_ORDER). Los cinco no
// son del mismo color a propósito: una lista monocroma se lee como una plantilla
// y no como cinco personas distintas.
export const EJEMPLOS = [
  { rank: 1, university: "UCA", tono: 1, xp_given: 142 },
  { rank: 2, university: "UTN", tono: 2, xp_given: 98 },
  { rank: 3, university: "UBA", tono: 0, xp_given: 60 },
  { rank: 4, university: "UNSAM", tono: 1, xp_given: 34 },
  { rank: 5, university: "UTDT", tono: 0, xp_given: 12 },
] as const

// El porcentaje que se muestra mientras el servidor no contestó todavía. Es el
// mismo valor que `SHARE_PERCENT` en backend/referrals.py; la respuesta lo trae
// y pisa a este, así que si algún día cambia allá, acá solo queda un parpadeo
// del valor viejo y no un número mentiroso permanente.
export const PORCENTAJE_POR_DEFECTO = 10

// Para los indicadores de arriba del ranking: mientras se muestran los
// renglones de ejemplo, "Reclutas" y "Te aportaron" tienen que contar lo mismo
// que se ve abajo, no cero.
export const EJEMPLOS_COUNT = EJEMPLOS.length
export const EJEMPLOS_XP_TOTAL = EJEMPLOS.reduce((sum, e) => sum + e.xp_given, 0)

/** Las filas de ejemplo, pintadas con la universidad de quien mira y con los @
 *  que le pasen.
 *
 *  Con `alias` vacío las filas salen SIN NOMBRE, sin que nada falle: desde un
 *  componente hay que pasar por `useFilasDeEjemplo`, que garantiza un sorteo
 *  por montaje. Se exporta para el chequeo y para quien ya tenga los @. */
export function filasDeEjemplo({
  university = null,
  cuantas = EJEMPLOS_COUNT,
  alias = [],
}: {
  university?: string | null
  cuantas?: number
  alias?: readonly string[]
} = {}): FilaRecluta[] {
  return EJEMPLOS.slice(0, cuantas).map((e, i) => ({
    key: `ejemplo-${e.rank}`,
    rank: e.rank,
    nombre: alias[i] ?? "",
    color: BELT_UNIT_TEXT_COLORS[BELT_ORDER[e.tono]] ?? BELT_UNIT_TEXT_COLORS.white,
    university: university ?? e.university,
    xp_given: e.xp_given,
  }))
}
