// La aritmética del salto del ranking: cuánto viaja la fila propia, cuánto dura
// el viaje y con qué curva.
//
// Vive afuera del componente —como `xp-pasos.ts` o `racha-estimate.ts`— por una
// razón concreta: es lo único de la animación que se puede verificar sin un
// navegador, y lo que se rompió la vez pasada fue justamente la aritmética.
// Ver `web/scripts/check-salto.ts`.
//
// ## Qué reemplaza
//
// Antes la fila subía de a UN puesto por vez, con un resorte por paso. El tope
// de 1600 ms que prometía la constante era mentira: el piso de 140 ms por paso
// lo rompía a partir de los 22 puestos, y treinta puestos duraban 4200 ms. A 140
// ms un resorte tampoco se asienta, así que lo que se veía no era movimiento
// sino temblor.
//
// Ahora es UN movimiento continuo, con velocidad de crucero acotada y un tope
// duro de tres segundos. Lo que se pierde es ver a QUIÉN pasaste; lo que se gana
// es que el tope sea cierto.

/** Fracción del viaje que se va en acelerar (y otro tanto en frenar). 0,2 deja
 *  un 60 % del camino a velocidad de crucero, que es lo que hace que se lea
 *  «arrancó, viajó, llegó» y no «una curva en S». */
export const RAMPA = 0.2

/** Alto de una fila de tapa a tapa de la siguiente, en píxeles: el `py-3` (12+12)
 *  más el renglón de `text-sm` (20) dan 44 de fila, más el `gap-2` de la lista
 *  dan 52. Medido en producción el 2026-09-11 con
 *  `rows[1].offsetTop - rows[0].offsetTop`, que es lo que hay que volver a correr
 *  si alguien toca el padding de `Row`.
 *
 *  Es el único número de este archivo que sale del CSS, y es el que convierte
 *  puestos en píxeles: todo lo demás se re-deriva solo. */
export const ALTO_FILA_PX = 52

/** Velocidad de crucero tope, en píxeles por segundo.
 *
 *  El techo es el seguimiento ocular: a unos 35 cm un píxel de teléfono son
 *  ~0,029°, y la persecución suave se mantiene cómoda hasta unos 30°/s, o sea
 *  ~1000 px/s. Más rápido que eso, la fila deja de ser una fila y es una raya.
 *
 *  Leer QUIÉN pasa a esta velocidad es imposible —eso pediría 170-280 px/s— y es
 *  deliberado: con un salto único ya no hay a quién mirar pasar. Lo que queda
 *  legible es la fila propia y su número, que cuenta en vivo (ver `RankEnVuelo`
 *  en game-ranking.tsx). */
export const V_TOPE_PX_S = 900

/** El tope que se pidió. Duro: ningún salto puede durar más que esto. */
export const SALTO_MS_MAX = 3000

/** Piso. Un puesto son 52 px, y a velocidad de crucero eso dura 72 ms: un
 *  teletransporte con pasos intermedios. 260 ms es más o menos lo que tardaba en
 *  asentarse el resorte de antes para ese mismo movimiento, así que un cruce de
 *  a uno se sigue sintiendo igual que siempre. */
export const SALTO_MS_MIN = 260

/** Cuántos puestos se pueden viajar sin romper NINGUNO de los dos topes: el de
 *  velocidad y el de tiempo. Derivado a propósito —mover cualquiera de los tres
 *  números de arriba lo corre solo—, y es lo que hace que los dos topes no se
 *  peleen: pasado este número el salto satura en distancia en vez de acelerar.
 *  Hoy da 41. */
export const FILAS_TOPE = Math.floor(
  ((1 - RAMPA) * V_TOPE_PX_S * SALTO_MS_MAX) / (1000 * ALTO_FILA_PX),
)

/** La curva del salto: la integral de un trapecio de velocidad, normalizada.
 *
 *  Sale de cero, sube en rampa hasta la velocidad de crucero, se queda ahí, y
 *  frena en rampa hasta cero. Un resorte no sirve acá: sobrepasa, y sobre dos
 *  mil píxeles de viaje un 3 % de sobrepaso son sesenta píxeles de la fila
 *  yéndose de largo para volver.
 *
 *  La velocidad de crucero es exactamente `1/(1-RAMPA)` veces la media, y esa
 *  igualdad es la que le permite a `duracionDelSalto` prometer un techo en px/s.
 *  Si alguien toca `RAMPA` de un lado y no del otro, la promesa se rompe sin que
 *  se vea nada raro en pantalla — por eso el chequeo la fija midiendo el pico de
 *  la derivada. */
export function curvaDelSalto(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const r = RAMPA
  if (t < r) return (t * t) / (2 * r * (1 - r))
  if (t > 1 - r) {
    const q = 1 - t
    return 1 - (q * q) / (2 * r * (1 - r))
  }
  return (t - r / 2) / (1 - r)
}

/** Cuántas filas viaja la fila propia DE VERDAD.
 *
 *  `disponibles` son las filas que hay por debajo suyo en la ventana cargada: la
 *  lista es infinita por baches y el puesto del que venís puede no estar
 *  cargado. Antes eso se tapaba con un `Math.min` al insertar la fila, que la
 *  clavaba al final de la lista y dejaba la duración calculada sobre una
 *  distancia que nunca se recorría: cuarenta puestos duraban 5,6 s para recorrer
 *  quizá doce filas. Acotar acá —donde todavía se puede corregir la duración— es
 *  lo que permite borrar aquel `Math.min`.
 *
 *  El puesto que se muestra no se acota: el número dice el puesto, la geometría
 *  dice lo que se puede mostrar. */
export function filasDelSalto(distancia: number, disponibles = Infinity): number {
  if (!Number.isFinite(distancia) || distancia <= 0) return 0
  const tope = Number.isFinite(disponibles) ? Math.floor(disponibles) : Infinity
  return Math.max(0, Math.min(Math.floor(distancia), FILAS_TOPE, tope))
}

/** Cuánto dura el salto, en milisegundos: crece con la distancia, satura por
 *  velocidad y queda acotada arriba y abajo. */
export function duracionDelSalto(distancia: number, disponibles = Infinity): number {
  const filas = filasDelSalto(distancia, disponibles)
  if (filas === 0) return 0
  const ms = (filas * ALTO_FILA_PX * 1000) / ((1 - RAMPA) * V_TOPE_PX_S)
  return Math.min(SALTO_MS_MAX, Math.max(SALTO_MS_MIN, Math.ceil(ms)))
}

/** La velocidad de crucero que termina teniendo un salto, en px/s. No la usa la
 *  animación: la usa el chequeo, que es donde la promesa de `V_TOPE_PX_S` se
 *  verifica de verdad. */
export function velocidadDelSalto(distancia: number, disponibles = Infinity): number {
  const filas = filasDelSalto(distancia, disponibles)
  const ms = duracionDelSalto(distancia, disponibles)
  if (filas === 0 || ms === 0) return 0
  return (filas * ALTO_FILA_PX * 1000) / (ms * (1 - RAMPA))
}
