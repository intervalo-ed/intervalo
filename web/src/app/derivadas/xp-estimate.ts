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
//
// Desde que la base sale del tier y no del p̂, el espejo es EXACTO en todo lo
// demás: antes había que redondear un producto de flotantes en dos lenguajes
// distintos y confiar en que `Math.round` y `round` coincidieran. Ahora el
// primer intento es una búsqueda en una tabla.

// Espejo de XP_POR_TIER. El porqué de estos números vive en el backend; acá
// solo tienen que ser LOS MISMOS. `check_game_xp.py` compara las dos tablas.
const XP_POR_TIER: Record<number, number> = { 0: 8, 1: 12, 2: 15, 3: 20, 4: 26, 5: 34 }
const TIER_MIN = 0
const TIER_MAX = 5

const XP_PEEKED = 5
const COMBO_INTERVAL = 5
const FRACCION_SEGUNDO = 8 / 25
const FRACCION_INSISTIENDO = 5 / 25
const FRACCION_COMBO = 15 / 25

export function xpBaseDe(tier: number): number {
  return XP_POR_TIER[Math.min(Math.max(tier, TIER_MIN), TIER_MAX)]
}

export function estimarXp({
  attemptNumber,
  tier,
  comboAfter,
  peeked,
}: {
  attemptNumber: number
  tier: number
  comboAfter: number
  peeked: boolean
}): number {
  if (peeked) return XP_PEEKED
  const base = xpBaseDe(tier)
  if (attemptNumber === 1) {
    const bonus =
      comboAfter > 0 && comboAfter % COMBO_INTERVAL === 0
        ? Math.max(1, Math.round(base * FRACCION_COMBO))
        : 0
    return base + bonus
  }
  const fraccion = attemptNumber === 2 ? FRACCION_SEGUNDO : FRACCION_INSISTIENDO
  return Math.max(1, Math.round(base * fraccion))
}
