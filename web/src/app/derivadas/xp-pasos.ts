// Los pasos del conteo de XP: en cuántos entra un acierto, cuánto suma cada uno
// y de qué color sale su orbe.
//
// Vive aparte de `xp-conteo.ts` —que es el hook, con sus temporizadores y su
// estado— porque esto es aritmética, o sea justo lo que se puede comprobar sin
// navegador. Y conviene tenerlo comprobado: que el reparto no pierda ni gane un
// punto de XP es invisible jugando —uno de más se ve como nada— pero es el
// contador del juego mintiendo; y que el color diga lo que promete no se puede
// ver de a un festejo por vez, porque es una distribución.
//
// Se chequea con: bun run check:xp

// Cuánta XP entra por paso. Un acierto normal son veinticinco: de a uno serían
// veinticinco ticks, o sea varios segundos de conteo por cada derivada. De a
// tres, la misma XP entra en un puñado que se lee de un vistazo.
const XP_POR_PASO = 3

// El tope de arriba es por duración —catorce ticks ya son casi dos segundos— y
// el de abajo para que un acierto chico igual se sienta.
const PASOS_MIN = 4
const PASOS_MAX = 14

/** En cuántos pasos se cuenta un acierto de `xp`.
 *
 * El `min` contra la XP es lo que evita pasos de cero: con 2 de XP y un piso de
 * cuatro pasos, dos de ellos sonarían sin sumar nada. */
export function pasosDe(xp: number): number {
  return Math.min(
    xp,
    Math.max(PASOS_MIN, Math.min(PASOS_MAX, Math.round(xp / XP_POR_PASO))),
  )
}

/** Reparte `total` en `pasos` sumas lo más parejas posible, sin perder nada: los
 *  primeros pasos se llevan el resto de a uno. */
export function repartir(total: number, pasos: number): number[] {
  const piso = Math.floor(total / pasos)
  const resto = total % pasos
  return Array.from({ length: pasos }, (_, i) => piso + (i < resto ? 1 : 0))
}

// ─── El color de cada orbe ──────────────────────────────────────────────────
//
// Los orbes ya no salen de la paleta de cinturones de Intervalo. Salen de una
// rampa entre amarillo y verde, y dónde caen en esa rampa lo decide cómo se
// resolvió el ejercicio: verde maduro cuando pagó mucha XP, amarillentos y
// desparejos cuando hubo que intentarlo más de una vez.
//
// La fruta es la metáfora y se sostiene sola: lo que salió redondo cae maduro y
// parejo, lo que costó cae verde y disparejo. No hay que explicar nada.

// Los dos extremos, en HSL. El amarillo es el mismo de `accuracyColor`
// (components/metric-card.tsx), que es la rampa de porcentaje de acierto de
// Intervalo; el verde es el del acierto (VERDE_ACIERTO en exercise-card.tsx), o
// sea el mismo del que se prende el contador cuando los orbes llegan.
//
// Los dos caen en L=45% —#E6B800 y #22C55E, comprobado— así que la rampa es un
// barrido de TONO a luminosidad constante. Eso es lo que la hace limpia: mezclando
// estos dos en RGB se pasa por un oliva apagado en el medio, y a media rampa está
// justo el naranja-verdoso que hay que evitar.
const H_AMARILLO = 48
const S_AMARILLO = 100
const H_VERDE = 142
const S_VERDE = 71
const L_RAMPA = 45

// La XP que paga resolverla de una, antes de dificultad y de combo
// (XP_BY_ATTEMPT[1] en backend/game/xp.py). Es la vara del índice: madurez 1 es
// "esta valió por lo menos lo que vale una derivada resuelta de una".
const XP_DE_REFERENCIA = 25

// Cuánto se abre el abanico alrededor de la madurez. Al primer intento casi nada
// —salieron todos de lo mismo, se parecen— y en cuanto hubo un error se abre
// fuerte: la varianza ES el mensaje, porque lo que distingue a una tanda que
// costó no es solo que sea más amarilla sino que sea despareja.
const ABANICO_LIMPIO = 0.06
const ABANICO_ERRANDO = 0.34

const acotar = (x: number) => Math.max(0, Math.min(1, x))

/** Qué tan "maduro" salió el ejercicio, de 0 (amarillo) a 1 (verde maduro).
 *
 * Se descuenta el empuje de la universidad: una derivada no se resolvió mejor
 * porque a la universidad le estén multiplicando la XP, y sin descontarlo una
 * universidad empujada vería todo verde siempre. */
export function madurezDe({
  xp,
  multiplicador = 1,
}: {
  xp: number
  multiplicador?: number
}): number {
  const limpia = multiplicador > 0 ? xp / multiplicador : xp
  return acotar(limpia / XP_DE_REFERENCIA)
}

/** Cuánto se desparraman los orbes alrededor de esa madurez. */
export function abanicoDe(intento: number): number {
  return intento <= 1 ? ABANICO_LIMPIO : ABANICO_ERRANDO
}

/** Un punto de la rampa, en color CSS. */
export function colorDeMadurez(madurez: number): string {
  const t = acotar(madurez)
  const h = H_AMARILLO + (H_VERDE - H_AMARILLO) * t
  const s = S_AMARILLO + (S_VERDE - S_AMARILLO) * t
  return `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${L_RAMPA}%)`
}

/** Los colores de una tanda de orbes: uno por orbe, sorteados alrededor de la
 *  madurez del ejercicio y con el abanico que le corresponde al intento. */
export function coloresDelFestejo({
  cuantos,
  xp,
  multiplicador = 1,
  intento,
}: {
  cuantos: number
  xp: number
  multiplicador?: number
  intento: number
}): string[] {
  const centro = madurezDe({ xp, multiplicador })
  const abanico = abanicoDe(intento)
  return Array.from({ length: cuantos }, () =>
    colorDeMadurez(centro + (Math.random() * 2 - 1) * abanico),
  )
}
