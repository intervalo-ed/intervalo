// El `useCta` de la web (web/src/app/derivadas/game-telemetry.ts): un llamado a
// la acción se anota en PostHog y en la base, con el mismo nombre de evento
// (`game_<cta>_<action>`) y el mismo POST.

import { useCallback } from "react"
import { useGameApi } from "@intervalo/dx-core/juego/game-api-context"
import { track } from "./track"

// Vocabulario cerrado, espejo de _CTA_KINDS/_CTA_ACTIONS en game/router.py: lo
// que el server no reconoce lo descarta en silencio.
export type CtaKind = "cafecito" | "share" | "boost_offer" | "register" | "instalar"
export type CtaAction = "impression" | "click"

export type CtaOptions = {
  /** Dónde salió (header, card, settings) o qué lo disparó (hito, pedido). */
  placement?: string
  /** Cuántas derivadas llevaba resueltas. */
  solved?: number
  /** Lo extra que solo tiene sentido en PostHog. */
  props?: Record<string, unknown>
}

export function useCta() {
  const api = useGameApi()
  return useCallback(
    (cta: CtaKind, action: CtaAction, opts: CtaOptions = {}) => {
      // `props` llega como `unknown` (la firma de la web); PostHog lo serializa
      // igual que allá.
      track(`game_${cta}_${action}`, {
        placement: opts.placement,
        solved: opts.solved,
        ...opts.props,
      } as Parameters<typeof track>[1])
      // Sin await y sin manejo de error: es telemetría, y que falle no puede
      // frenar lo que la persona estaba haciendo.
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
