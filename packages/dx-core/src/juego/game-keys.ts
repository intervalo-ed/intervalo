import type { components } from "../api/schema"

export type GamePlayer = components["schemas"]["GamePlayerOut"]

export const gameKeys = {
  me: ["game", "me"] as const,
  leaderboard: ["game", "leaderboard"] as const,
  // Raíz aparte a propósito: invalidar el ranking hace match por prefijo, y si
  // el pulso colgara de esa misma raíz se invalidaría a sí mismo en cada
  // refresco.
  pulse: ["game", "pulse"] as const,
  // Ídem el pulso: raíz propia para que invalidar el ranking no lo arrastre.
  events: ["game", "events"] as const,
  // Raíz propia: se consulta solo al volver de Cafecito y no tiene nada que ver
  // con el ranking, así que invalidar el ranking no debe arrastrarlo.
  cafecitoStatus: ["game", "cafecito-status"] as const,
  // Los reclutas también van aparte, aunque se dibujen adentro del ranking.
  //
  // Colgados de la raíz del ranking, el latido —que invalida por prefijo cada
  // diez segundos, o sea cada vez que CUALQUIERA responde algo en el juego— los
  // volvía a pedir todo el tiempo. Una lista que cambia cuando llega un recluta
  // nuevo no tiene por qué recargarse al ritmo de la actividad de desconocidos,
  // y con la lista de ejemplo en pantalla eso es puro parpadeo por nada.
  recruits: ["game", "recruits"] as const,
  // Raíz propia por el mismo motivo que pulse/events: el latido de cada 10 s
  // invalida el ranking por prefijo, y las estadísticas no cambian a ese
  // ritmo (solo con lo que este mismo jugador responde) — colgarlas de esa
  // raíz sería refrescarlas por la actividad de cualquiera.
  stats: ["game", "stats"] as const,
}
