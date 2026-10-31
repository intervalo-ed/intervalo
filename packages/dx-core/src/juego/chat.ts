// Lo puro del chat del juego, compartido por la web (chat-panel.tsx) y la app
// nativa (mobile/components/juego/chat-panel.tsx).

import { readEnviosRecientes } from "./game-storage"
import type { ConTiempo, GameEvent, GameMessage } from "./UseGameLeaderboard"

// Lo mismo que acepta el servidor (chat.MAX_TEXTO). Se repite acá para poder
// avisar ANTES de mandar; quien manda de verdad es el backend.
export const MAX_TEXTO = 140

// Espejo de chat.MAX_LINEAS: hasta dónde crece el campo solo. El tope de verdad
// lo pone igual el servidor (`limpiar()`); esto es nada más para que el campo no
// empuje un dibujo entero fuera de la pantalla mientras se escribe.
export const MAX_LINEAS = 6

// Hasta tres mensajes por minuto, espejo de `limits.por_jugador(3)`. Acá solo
// sirve para que el botón sepa esperar en vez de comerse un 429.
export const VENTANA_MS = 60_000
export const MAX_POR_MINUTO = 3

/** Segundos que faltan para poder volver a escribir.
 *
 * Cero mientras haya lugar en la ventana de un minuto (menos de
 * `MAX_POR_MINUTO` envíos recientes) — recién cuando se llena hay que esperar
 * a que el más viejo de esos envíos cumpla el minuto y se caiga de la cuenta. */
export function restante(): number {
  return restanteDe({ envios: readEnviosRecientes(), ahora: Date.now() })
}

export function restanteDe({ envios, ahora }: { envios: readonly number[]; ahora: number }): number {
  const vigentes = envios.filter((t) => t > ahora - VENTANA_MS)
  if (vigentes.length < MAX_POR_MINUTO) return 0
  const masViejo = Math.min(...vigentes)
  return Math.max(0, Math.ceil((masViejo + VENTANA_MS - ahora) / 1000))
}

export type Linea =
  | { tipo: "evento"; at: number; clave: string; evento: ConTiempo<GameEvent> }
  | { tipo: "mensaje"; at: number; clave: string; mensaje: ConTiempo<GameMessage> }

/** Las dos listas, intercaladas por cuándo pasó cada cosa. Vienen de la más
 *  nueva a la más vieja y se dan vuelta al final, igual que el feed: así lo
 *  último queda abajo, que es donde se lo busca en un chat. */
export function intercalar({
  events,
  messages,
}: {
  events: readonly ConTiempo<GameEvent>[]
  messages: readonly ConTiempo<GameMessage>[]
}): Linea[] {
  const eventos: Linea[] = events.map((e) => ({
    tipo: "evento",
    at: e.at,
    clave: `e${e.id}`,
    evento: e,
  }))
  const mensajes: Linea[] = messages.map((m) => ({
    tipo: "mensaje",
    at: m.at,
    clave: `m${m.id}`,
    mensaje: m,
  }))
  return [...eventos, ...mensajes].sort((a, b) => b.at - a.at).reverse()
}

/** Los marcadores del feed, reemplazados a texto pelado. Ver events.py. */
export function textoPlano(evento: Pick<GameEvent, "text" | "actor_alias" | "actor_b_alias" | "universities">): string {
  const unis = evento.universities
  return evento.text
    .replace("{a}", evento.actor_alias ?? "alguien")
    .replace("{b}", evento.actor_b_alias ?? "alguien")
    .replace("{u0}", unis[0] ?? "")
    .replace("{u1}", unis[1] ?? "")
}

/** Un mensaje propio que todavía no confirmó el servidor (ver `useChat`). */
export type MensajePendiente = {
  localId: number
  text: string
  failed: boolean
  // Capturados al escribir, no releídos si se reintenta: es la misma foto
  // del jugador con la que se vería si el servidor ya hubiera contestado.
  alias: string
  level: number
  university: string | null
  // Sellado al crearlo (evento, no render) para armar el `ConTiempo` que el
  // renglón espera sin llamar a `Date.now()` durante el dibujado.
  at: number
}

/** El pendiente con la forma de un mensaje confirmado, para dibujarlo igual. */
export function mensajeDePendiente(p: MensajePendiente): ConTiempo<GameMessage> {
  return {
    id: p.localId,
    alias: p.alias,
    level: p.level,
    university: p.university,
    text: p.text,
    is_mine: true,
    seconds_ago: 0,
    at: p.at,
  }
}

/** El motivo del error tal cual lo manda el servidor: en español y dirigido a
 *  la persona (422 del saneado, 429 del tope, 403 de invitado). Mostrar el suyo
 *  y no uno inventado acá es lo que hace que sea cierto. */
export function detalleDeError(e: unknown): string {
  return typeof e === "object" && e !== null && "message" in e
    ? String((e as { message: unknown }).message)
    : "No se pudo mandar."
}

/** Cuántos renglones mostrar en el campo: sigue a los escritos, de 1 a MAX_LINEAS. */
export function renglonesDelCampo(texto: string): number {
  return Math.min(MAX_LINEAS, Math.max(1, texto.split("\n").length))
}
