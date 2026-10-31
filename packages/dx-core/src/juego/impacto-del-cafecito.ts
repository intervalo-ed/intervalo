// Qué compra un cafecito, de verdad.
//
// Vive afuera del `.tsx` —como xp-pasos.ts, racha-estimate.ts y
// salto-ranking.ts— para que un chequeo pueda importarlo sin arrastrar React.
//
// Existe por un caso concreto. El cartel prometía un multiplicador calculado con
// la donación SOLA (`min(2,0; 1 + n×0,1)`), sin mirar el empuje que ya estuviera
// corriendo. Pero los cafecitos vigentes se suman y el total se corta en ×3, así
// que con la universidad ya en el techo una donación no mueve el multiplicador ni
// un décimo: lo que hace es sostenerlo más tiempo.
//
// El mayor donante del juego —60 cafecitos en cuatro días— donó cinco veces en un
// día y DOS de esas cayeron con su universidad ya en ×3. Escribió preguntando si
// el límite era ×3. Tenía razón, y no había forma de que lo supiera antes de
// pagar: el cartel le decía ×2,0 y después del pago el número seguía en ×3,0.
//
// Las dos cosas que un cafecito puede comprar son legítimas. Lo que no lo es, es
// prometer la primera y entregar la segunda sin decirlo.

// Espejo de backend/game/boosts.py. Los tres números tienen que decir lo mismo
// que allá, y el chequeo (`bun run check:cafecito`) es lo único que lo ata:
// hasta ahora el front tenía un ×2,0 propio que el backend no prometía en
// ningún lado.
export const CAFECITO_STEP = 0.1
export const MAX_MULTIPLIER = 3.0
/** Lo que aporta UNA donación: `MAX_CAFECITOS_PER_DONATION × CAFECITO_STEP`. */
export const APORTE_MAX = 1.0
export const SLIDER_MAX = 10

// Espejo de `horas_de`: una base fija más medio cafecito, redondeando para
// arriba, así que la duración baja DE A PARES.
export const BOOST_HOURS_BASE = 1

/** Lo que esta donación aporta, sola. */
export function aporteDe(n: number): number {
  return Math.min(APORTE_MAX, Math.max(0, n) * CAFECITO_STEP)
}

/** Cuántas horas dura una donación de `n` cafecitos. */
export function horasDe(n: number): number {
  return BOOST_HOURS_BASE + Math.ceil(Math.min(Math.max(n, 0), SLIDER_MAX) / 2)
}

export type ImpactoDelCafecito = {
  /** En cuánto queda el multiplicador de la universidad después de donar. */
  destino: number
  /** ¿Sube el multiplicador? Si no, lo que se compra es tiempo. */
  sube: boolean
  /** Segundos que se estira el final del empuje. */
  segundosGanados: number
}

/** Qué le hace esta donación al empuje que YA está corriendo.
 *
 *  `actual` es el multiplicador vigente de la universidad (1 si no hay empuje) y
 *  `restanSegundos` lo que le queda. Los dos salen del pulso, así que el cartel
 *  no tiene que calcular nada por su cuenta ni pedir nada de más.
 *
 *  El margen de 0,001 en `sube` no es paranoia: son flotantes, y `2,9999...`
 *  contra `3,0` no es una subida que valga la pena anunciar. */
export function impactoDelCafecito(
  n: number,
  actual: number,
  restanSegundos: number,
): ImpactoDelCafecito {
  const base = Math.max(1, actual)
  const destino = Math.min(MAX_MULTIPLIER, base + aporteDe(n))
  return {
    destino,
    sube: destino - base > 0.001,
    // Lo que ya corría vence cuando vence: se gana la diferencia, nunca menos
    // de cero. Donar cuando quedan cinco horas y media compra media hora, no
    // seis.
    segundosGanados: Math.max(0, horasDe(n) * 3600 - Math.max(0, restanSegundos)),
  }
}
