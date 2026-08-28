"use client"

// Telemetría del juego: los dos destinos, en un solo lugar.
//
// **PostHog** sabe cosas que la base no puede saber (la sesión, el dispositivo,
// el referrer, quién vio la página y se fue sin crear jugador) y sirve para
// explorar. **La base** sabe la única cosa que PostHog no puede saber: si el
// cafecito llegó, porque eso es una fila en `game_boosts`. El embudo de la
// donación necesita las dos puntas, así que los llamados a la acción se
// registran en los dos lados y el panel del juego lee el de la base
// (backend/metrics/game_queries.py).
//
// Duplicar la escritura es a propósito y tiene un costo asumido: si el POST se
// pierde (pestaña que se cierra, red que corta) el panel ve una impresión menos
// que PostHog. Preferimos eso a que el panel dependa de una API externa para
// contestar «¿cuántos de los que vieron el cartel donaron?».

import { useCallback, useEffect } from "react"
import posthog from "posthog-js"
import { useGameApi } from "./UseGameApi"

// Vocabulario cerrado, espejo de _CTA_KINDS/_CTA_ACTIONS en game/router.py. Lo
// que el server no reconoce lo descarta en silencio, así que un typo acá se
// vería como un cartel que nadie mira nunca.
export type CtaKind = "cafecito" | "share" | "boost_offer" | "register"
export type CtaAction = "impression" | "click"

export type CtaOptions = {
  /** Dónde salió (header, card, settings) o qué lo disparó (record, milestone). */
  placement?: string
  /** Cuántas derivadas llevaba resueltas. Es lo que permite cortar el embudo
   *  por momento de la partida: un cartel que convierte bien pero aparece
   *  tardísimo está dejando plata sobre la mesa. */
  solved?: number
  /** Cualquier cosa extra que solo tenga sentido en PostHog (la cantidad del
   *  slider, el multiplicador resultante). La tabla del server es a propósito
   *  pobre: una tabla de eventos con un JSON adentro termina siendo un log que
   *  nadie consulta. */
  props?: Record<string, unknown>
}

/** Registra un llamado a la acción en PostHog y en la base.
 *
 * El nombre del evento de PostHog es `game_<cta>_<action>`, que es exactamente
 * cómo se llamaban los eventos sueltos que había antes — el historial no se
 * corta. */
export function useCta() {
  const api = useGameApi()
  return useCallback(
    (cta: CtaKind, action: CtaAction, opts: CtaOptions = {}) => {
      posthog.capture(`game_${cta}_${action}`, {
        placement: opts.placement,
        solved: opts.solved,
        ...opts.props,
      })
      // Sin await y sin manejo de error: es telemetría. Que falle no puede
      // frenar ni ensuciar lo que la persona estaba haciendo — y menos todavía
      // el click que la lleva a Cafecito, que es lo único que importa acá.
      void api
        .POST("/game/derivemos/cta", {
          body: {
            cta,
            action,
            placement: opts.placement ?? null,
            solved: opts.solved ?? null,
          },
        })
        .catch(() => {})
    },
    [api],
  )
}

/** Cuelga la identidad del jugador de TODOS los eventos del juego.
 *
 * Son super propiedades de PostHog: en vez de acordarse de pasar la universidad en
 * cada uno de los treinta `capture` que hay repartidos, se registran una vez y
 * viajan solas. El prefijo `game_` no es decorativo — las super propiedades
 * persisten en el navegador y se pegan también a los eventos de Intervalo, así
 * que tienen que decir de dónde salieron.
 *
 * `null` en vez de omitir cuando el dato falta: una propiedad ausente y una
 * propiedad vacía se filtran distinto en PostHog, y «todavía no cargó la
 * universidad» es una respuesta, no un hueco. */
export function useGameIdentity(player: {
  university?: string | null
  career?: string | null
  is_guest?: boolean
} | null) {
  const uni = player?.university ?? null
  const career = player?.career ?? null
  const guest = player?.is_guest ?? null
  useEffect(() => {
    if (player === null) return
    posthog.register({
      game_university: uni,
      game_career: career,
      game_is_guest: guest,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uni, career, guest, player === null])
}
