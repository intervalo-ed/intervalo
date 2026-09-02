// Estimación optimista de la XP de un acierto, para arrancar el festejo antes
// de que conteste `/answer` (ver xp-conteo.ts :: fireProvisional).
//
// Espejo de backend/game/xp.py :: xp_for_answer. El servidor sigue siendo el
// único que escribe XP de verdad — esto solo adelanta un número plausible
// para que el conteo tenga algo que mostrar desde el primer frame; si difiere
// del real, `reconcile()` lo corrige en la cola sin que se note.
//
// No cubre `explained` (acertar después de leer «¿Por qué?»): ese camino ya
// viene de una pausa de lectura y de un viaje a `/explain`, así que no es el
// caso que se sentía lento — se deja esperando al servidor como siempre.

const XP_BY_ATTEMPT: Record<number, number> = { 1: 25, 2: 8 }
const XP_INSISTIENDO = 5
const XP_PEEKED = 5
const COMBO_INTERVAL = 5
const COMBO_BONUS = 15
const MULT_FLOOR = 0.75
const MULT_SPAN = 0.85

export function estimarXp({
  attemptNumber,
  pHat,
  comboAfter,
  peeked,
}: {
  attemptNumber: number
  pHat: number
  comboAfter: number
  peeked: boolean
}): number {
  if (peeked) return XP_PEEKED
  let base = XP_BY_ATTEMPT[attemptNumber] ?? XP_INSISTIENDO
  let bonus = 0
  if (attemptNumber === 1) {
    base = Math.round(base * (MULT_FLOOR + MULT_SPAN * (1 - pHat)))
    if (comboAfter > 0 && comboAfter % COMBO_INTERVAL === 0) bonus = COMBO_BONUS
  }
  return base + bonus
}
