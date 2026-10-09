// Cada cuánto aparece el ranking después de acertar, y cuándo se le pregunta.
//
// Hasta el 09/10 toda correcta llevaba a la diapo del ranking, sin excepción. La
// varita mágica trajo varias quejas con la misma forma —«que no aparezca el
// ranking cada vez»— y la medida que las respalda: en la primera sesión, hasta
// la derivada 12 casi nadie saltea el ranking (lo mira 6-8 s); en la 15 el
// salteo (< 1,5 s) se duplica al 11,7% y la mediana cae a 4 s. Ahí empieza a
// molestar, y ahí se pregunta.
//
// Sin React en este módulo —salvo el hook del final, que es una línea— por el
// mismo motivo que sus gemelos (encuesta-trigger.ts, reglas-trigger.ts): la
// regla se prueba en un script de bun sin navegador
// (web/scripts/check-ranking-frecuencia.ts).

import { useSyncExternalStore } from "react"

import {
  PEDIDO_RANKING_FRECUENCIA,
  readPedidoState,
  readUltimaPantalla,
  savePedidoState,
} from "./game-storage"

/** Las tres cadencias que se ofrecen. `cada` es lo que el juego hizo siempre y
 *  sigue siendo el valor por defecto: la diapo avisa que existe la opción, no
 *  obliga a elegir. */
export type FrecuenciaRanking = "cada" | "cada5" | "subo"

/** Cuántas correctas entre un ranking y el siguiente con `cada5`. */
export const RANKING_CADA_N = 5

export const FRECUENCIAS: { valor: FrecuenciaRanking; texto: string }[] = [
  { valor: "cada", texto: "Después de cada derivada" },
  { valor: "cada5", texto: `Cada ${RANKING_CADA_N} derivadas` },
  { valor: "subo", texto: "Solo cuando subo de puesto" },
]

export const FRECUENCIA_DEFAULT: FrecuenciaRanking = "cada"

/** ¿Después de ESTA correcta se muestra el ranking?
 *
 *  `totalCorrectas` son las acumuladas del jugador —las del servidor— y no un
 *  contador de pestaña, por lo de siempre (hitos-del-juego.ts): con `cada5`,
 *  recargar no puede correr la cuenta.
 *
 *  `subio` compara `rank_after` con `rank_before` de la misma respuesta. Si el
 *  servidor no mandó puestos, se muestra: ante la duda, lo que el juego hizo
 *  siempre. */
export function tocaRanking({
  frecuencia,
  totalCorrectas,
  subio,
}: {
  frecuencia: FrecuenciaRanking
  totalCorrectas: number
  subio: boolean | null
}): boolean {
  switch (frecuencia) {
    case "cada":
      return true
    case "cada5":
      return totalCorrectas % RANKING_CADA_N === 0
    case "subo":
      return subio !== false
  }
}

// ── La preferencia, guardada en el aparato ────────────────────────────────────
//
// localStorage y no el servidor, como el sonido (lib/audio/sound-settings.ts):
// es cómo esta persona quiere que se vea ESTA pantalla, en el teléfono, y el
// escritorio ni tiene la diapo —allá el ranking es la columna de al lado y no
// interrumpe nada—. Reiniciar el progreso o cerrar sesión no la borra: es del
// aparato, no de la cuenta.

const FRECUENCIA_KEY = "intervalo:game:ranking-frecuencia"
const EVENTO = "intervalo:game:ranking-frecuencia-change"

const VALORES = new Set<string>(FRECUENCIAS.map((f) => f.valor))

export function readFrecuenciaRanking(): FrecuenciaRanking {
  if (typeof window === "undefined") return FRECUENCIA_DEFAULT
  try {
    const raw = window.localStorage.getItem(FRECUENCIA_KEY)
    return raw !== null && VALORES.has(raw)
      ? (raw as FrecuenciaRanking)
      : FRECUENCIA_DEFAULT
  } catch {
    return FRECUENCIA_DEFAULT
  }
}

export function saveFrecuenciaRanking(valor: FrecuenciaRanking) {
  try {
    window.localStorage.setItem(FRECUENCIA_KEY, valor)
    window.dispatchEvent(new Event(EVENTO))
  } catch {}
}

/** La que sigue a la actual, para la fila de Ajustes que rota al tocarla,
 *  igual que la del sonido. */
export function siguienteFrecuencia(actual: FrecuenciaRanking): FrecuenciaRanking {
  const i = FRECUENCIAS.findIndex((f) => f.valor === actual)
  return FRECUENCIAS[(i + 1) % FRECUENCIAS.length].valor
}

export function textoDeFrecuencia(valor: FrecuenciaRanking): string {
  return FRECUENCIAS.find((f) => f.valor === valor)?.texto ?? FRECUENCIAS[0].texto
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENTO, callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener(EVENTO, callback)
    window.removeEventListener("storage", callback)
  }
}

export function useFrecuenciaRanking(): FrecuenciaRanking {
  return useSyncExternalStore(
    subscribe,
    readFrecuenciaRanking,
    () => FRECUENCIA_DEFAULT,
  )
}

// ── Cuándo se pregunta ────────────────────────────────────────────────────────

/** En qué derivada sale la diapo. Una sola vez en la vida del aparato.
 *
 *  Quince, por los datos del encabezado: es la primera derivada en que el
 *  salteo del ranking se vuelve visible, y antes de eso la diapo ofrecería una
 *  solución a un problema que la persona todavía no tiene. El casillero está
 *  libre —3 perfil, 8 dificultad, 10 registro, 14 reclutas, 18 varita, 20 café,
 *  21 instalar— y a la varita de la 18 no la corre: esta diapo no escribe el
 *  cooldown compartido, igual que ella.
 *
 *  **Sale pegada a reclutas, que está en la 14 y escribe el cooldown.** Por eso
 *  esta diapo NO mide distancia contra el último pedido —con la separación de
 *  cuatro que usan la varita e instalar se caería a la 18 y le quitaría la
 *  respuesta a la varita—; respeta solo la igualdad de pantalla. Es una
 *  preferencia de la propia pantalla y no un pedido, y la 15 fue una decisión
 *  de producto tomada con el mapa a la vista (09/10). */
export const FRECUENCIA_EN = 15

export function tocaPreguntarFrecuencia(totalCorrectas: number): boolean {
  if (totalCorrectas < FRECUENCIA_EN) return false
  if (readPedidoState(PEDIDO_RANKING_FRECUENCIA).vistas > 0) return false
  // Solo la igualdad (ver arriba): dos pantallas no comparten respuesta.
  return totalCorrectas !== readUltimaPantalla()
}

/** Anota que se mostró. Al MOSTRARLA y no al elegir: quien la pasa de largo
 *  dejó dicho que no le interesa, y volver a preguntarle en la siguiente sería
 *  el peaje que la diapo existe para sacar. No toca el cooldown compartido, ver
 *  `FRECUENCIA_EN`. */
export function marcarFrecuenciaMostrada(totalCorrectas: number) {
  savePedidoState(PEDIDO_RANKING_FRECUENCIA, { vistas: 1, ultima: totalCorrectas })
}
