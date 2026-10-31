// El `posthog.capture` de la web, con el mismo nombre de evento y las mismas
// propiedades, para que los eventos se porten de a uno sin pensarlos. Sin
// PostHog inicializado no hace nada.

import { posthog } from "./posthog"

type Propiedades = NonNullable<Parameters<NonNullable<typeof posthog>["capture"]>[1]>

export function track(event: string, props?: Propiedades) {
  posthog?.capture(event, props)
}
