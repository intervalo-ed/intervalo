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

/** Cuánto tarda la lista en ABRIR el lugar al que la fila va a viajar, y cuánto
 *  en CERRAR el que deja atrás.
 *
 *  Son dos tiempos y no uno solo porque son dos cosas distintas y se leen una
 *  después de la otra: primero la lista se corre para hacer lugar, después la
 *  fila viaja a ese lugar, y recién cuando llegó se cierra el hueco de donde
 *  salió. Antes las tres pasaban a la vez —la fila subía mientras todas las
 *  demás se acomodaban— y lo que se veía era la lista entera moviéndose sin que
 *  se entendiera qué había pasado.
 *
 *  Cortos a propósito: no son el protagonista, son el lugar abriéndose. Lo que
 *  hay que mirar es el viaje, que dura `duracionDelSalto`. */
export const ABRIR_MS = 200
export const CERRAR_MS = 200

/** Los tres tramos del salto, en el orden en que se ven. Sin salto, los tres en
 *  cero: no hay lugar que abrir para una fila que no se mueve. */
export function tramosDelSalto(
  distancia: number,
  disponibles = Infinity,
): { abrir: number; viaje: number; cerrar: number } {
  const viaje = duracionDelSalto(distancia, disponibles)
  return viaje === 0
    ? { abrir: 0, viaje: 0, cerrar: 0 }
    : { abrir: ABRIR_MS, viaje, cerrar: CERRAR_MS }
}

/** Lo que dura el salto entero, de punta a punta. */
export function duracionTotalDelSalto(distancia: number, disponibles = Infinity): number {
  const t = tramosDelSalto(distancia, disponibles)
  return t.abrir + t.viaje + t.cerrar
}

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
  return curvaConRampa(t, RAMPA)
}

/** El mismo trapecio de velocidad, con la rampa que se le pida: `r` es la
 *  fracción del viaje que se va en acelerar, y otro tanto en frenar. Con 0,5 no
 *  queda crucero —acelera hasta la mitad y frena desde ahí—, que es lo más
 *  blando que este trapecio puede ser. La velocidad de crucero es `1/(1-r)`
 *  veces la media. */
export function curvaConRampa(t: number, r: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
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

/** Cuántas filas puede viajar la fila propia SIN MOVERSE DE LA PANTALLA antes
 *  de arrancar.
 *
 *  El salto empieza dibujando la fila en el puesto del que viene, y la tiene que
 *  dibujar en el mismo lugar de la pantalla donde la persona la estaba mirando
 *  cuando recibió su XP. Eso es un `scrollTop` concreto (`deseado`), y la lista
 *  no siempre lo da: si el puesto de origen cae muy cerca del final de lo
 *  cargado, no hay contenido debajo con qué llenar la ventana y el scroll se
 *  queda en su tope. Antes ahí se mandaba el scroll al fondo igual, y la fila
 *  aparecía de golpe pegada al borde de abajo del ranking.
 *
 *  Así que el viaje se ACORTA hasta que el origen entre: cada fila de menos sube
 *  el origen `altoFila` píxeles. El número del puesto cuenta la distancia entera
 *  igual —la geometría dice lo que se puede mostrar, no lo que pasó— y siempre
 *  queda al menos una fila de viaje: un salto que no se mueve no es un salto. */
export function filasConLugar(
  filas: number,
  deseado: number,
  tope: number,
  altoFila = ALTO_FILA_PX,
): number {
  // Un píxel de gracia: las alturas se miden redondeadas.
  if (deseado <= tope + 1) return filas
  return Math.max(1, filas - Math.ceil((deseado - tope) / altoFila))
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

// ── El ritmo: escritorio y teléfono ────────────────────────────────────────
/** Con qué tiempos y con qué curvas se mueve un salto.
 *
 *  Es un objeto y no cinco constantes sueltas porque hay DOS ritmos, y lo que
 *  no puede pasar es que el componente tome la duración de uno y la curva del
 *  otro: la duración promete un techo de px/s y la curva es la que lo cumple. */
export type Ritmo = {
  /** Cuánto tarda la lista en abrir el lugar, y en cerrar el que queda atrás. */
  abrir: number
  cerrar: number
  /** La curva con la que las filas hacen y cierran ese lugar. */
  curvaDelLugar: (t: number) => number
  /** Cuánto dura el viaje de `filas` filas (las que viaja DE VERDAD: ya
   *  acotadas por `filasDelSalto` y `filasConLugar`). */
  viaje: (filas: number) => number
  /** La curva de ese viaje. Devuelve siempre la MISMA función para las mismas
   *  filas: es la `ease` de un tween, y su identidad tiene que ser estable. */
  curvaDelViaje: (filas: number) => (t: number) => number
}

/** El de siempre. */
export const RITMO: Ritmo = {
  abrir: ABRIR_MS,
  cerrar: CERRAR_MS,
  curvaDelLugar: curvaDelSalto,
  viaje: (filas) => duracionDelSalto(filas),
  curvaDelViaje: () => curvaDelSalto,
}

/** Cuánto más lento va todo en el teléfono.
 *
 *  Pedido mirándolo: con los tiempos de escritorio, en el teléfono la apertura
 *  y la subida se sentían bruscas. Ahí el ranking ocupa la pantalla entera —no
 *  es una columna al costado de otra cosa— y un salto corto, que es el de casi
 *  todas las derivadas, eran 200 ms de abrir y 260 de viaje. */
export const LENTITUD_MOVIL = 1.3

/** Hasta cuánta rampa puede tener el viaje en el teléfono. El escritorio usa
 *  `RAMPA` (0,2) siempre; acá cada viaje toma toda la que le entra. */
export const RAMPA_MOVIL = 0.4

/** La rampa de un viaje en el teléfono: la más blanda que se pueda SIN pasar
 *  `V_TOPE_PX_S`.
 *
 *  Un viaje corto dura mucho más de lo que su distancia pide —lo sostiene el
 *  piso— así que le sobra tiempo: en vez de gastarlo viajando a velocidad
 *  constante, lo gasta acelerando y frenando. Un viaje largo va justo de
 *  tiempo, no le sobra nada y se queda con la rampa de siempre. Entre los dos
 *  extremos la rampa sale de despejar el techo de velocidad:
 *  `crucero = px / (ms × (1 − r))`. Redondeada hacia ABAJO, para que el
 *  redondeo nunca la pase del techo. */
export function rampaMovil(filas: number): number {
  const ms = RITMO_MOVIL.viaje(filas)
  if (filas <= 0 || ms === 0) return RAMPA
  const justa = 1 - (filas * ALTO_FILA_PX * 1000) / (ms * V_TOPE_PX_S)
  return Math.max(RAMPA, Math.min(RAMPA_MOVIL, Math.floor(justa * 100) / 100))
}

const curvasMoviles = new Map<number, (t: number) => number>()
// Sin crucero: para correr una fila 52 px no hace falta, y es lo más blando.
const curvaBlanda = (t: number): number => curvaConRampa(t, 0.5)

/** El del teléfono: lo mismo, `LENTITUD_MOVIL` veces más lento y con las
 *  rampas más largas. El tope de tres segundos del viaje es el mismo. */
export const RITMO_MOVIL: Ritmo = {
  abrir: Math.round(ABRIR_MS * LENTITUD_MOVIL),
  cerrar: Math.round(CERRAR_MS * LENTITUD_MOVIL),
  curvaDelLugar: curvaBlanda,
  viaje: (filas) => {
    const base = duracionDelSalto(filas)
    return base === 0 ? 0 : Math.min(SALTO_MS_MAX, Math.ceil(base * LENTITUD_MOVIL))
  },
  curvaDelViaje: (filas) => {
    const r = rampaMovil(filas)
    let c = curvasMoviles.get(r)
    if (c === undefined) {
      c = (t: number) => curvaConRampa(t, r)
      curvasMoviles.set(r, c)
    }
    return c
  },
}

export function ritmoDelSalto(movil: boolean): Ritmo {
  return movil ? RITMO_MOVIL : RITMO
}
