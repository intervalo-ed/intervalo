/**
 * Helpers para que ninguna espera pueda durar para siempre.
 *
 * El motivo: `/onboarding/complete` encadena varios `await` de red (Clerk, el
 * backend, PostHog) y ninguno tenía tope. Una promesa que no resuelve deja al
 * usuario mirando un spinner sin error ni forma de reintentar, y en el peor
 * caso sin fila en la base — el 15% de las cuentas que se perdía.
 */

/** Se agotó el presupuesto de tiempo de una operación. */
export class TimeoutError extends Error {
  readonly label: string
  readonly ms: number

  constructor(label: string, ms: number) {
    super(`"${label}" no respondió en ${ms} ms`)
    this.name = "TimeoutError"
    this.label = label
    this.ms = ms
  }
}

/**
 * Rechaza con `TimeoutError` si `work` no se resuelve dentro de `ms`.
 *
 * No cancela el trabajo subyacente — no hay forma de abortar un
 * `user.update()` de Clerk — solo deja de esperarlo. Si hay algo cancelable,
 * pasá `onTimeout` para abortarlo.
 */
export function withTimeout<T>(
  work: Promise<T>,
  { ms, label, onTimeout }: { ms: number; label: string; onTimeout?: () => void },
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout?.()
      reject(new TimeoutError(label, ms))
    }, ms)

    work.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/**
 * Promesa que se resuelve por suscripción o, si nadie la resuelve a tiempo,
 * con `fallback`. Nunca rechaza.
 *
 * `subscribe` recibe un `settle` idempotente y devuelve su propia función de
 * baja. El orden importa y es la parte delicada: si el callback resuelve de
 * forma **sincrónica** —`posthog.onFeatureFlags` lo hace cuando los flags ya
 * están cargados— `settle` corre antes de que `subscribe` haya retornado, así
 * que todavía no tenemos con qué darnos de baja. Por eso la baja se hace
 * después, mirando `settled`, y el timeout recién se arma si de verdad
 * quedamos esperando.
 *
 * Esto vivía duplicado en UsePostOnboardingRanking y en el wizard, donde una
 * versión previa con `const` explotaba en la temporal dead zone: posthog-js se
 * tragaba la excepción, la promesa no resolvía nunca y el onboarding quedaba
 * colgado sin redirect. Está acá para que no se pueda volver a escribir mal.
 */
export function settleWithTimeout<T>({
  ms,
  fallback,
  subscribe,
}: {
  ms: number
  fallback: T
  subscribe: (settle: (value: T) => void) => (() => void) | undefined
}): Promise<T> {
  return new Promise<T>((resolve) => {
    // eslint-disable-next-line prefer-const -- settle() la lee antes de la asignación; con const eso es TDZ
    let unsubscribe: (() => void) | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    let settled = false

    const settle = (value: T) => {
      if (settled) return
      settled = true
      unsubscribe?.()
      if (timer !== undefined) clearTimeout(timer)
      resolve(value)
    }

    unsubscribe = subscribe(settle)

    if (settled) unsubscribe?.()
    else timer = setTimeout(() => settle(fallback), ms)
  })
}
