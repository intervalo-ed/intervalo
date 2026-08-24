/**
 * Atribución de primer contacto.
 *
 * El `utm_source` viaja en la URL solo en el aterrizaje inicial: al volver del
 * login con Google el referrer pasa a ser accounts.google.com y el parámetro ya
 * no está, así que PostHog lo pierde justo en el evento que importa — la
 * conversión. Se guarda como super property (persistida en localStorage) al
 * aterrizar, y se copia al perfil de la persona al identificar.
 */
export const FIRST_UTM_SOURCE = "first_utm_source"

/**
 * Grupo de WhatsApp por el que llegó la persona.
 *
 * Los links que Hermes manda a cada grupo son `intervalo.xyz/?g=uba042`: el id
 * identifica al grupo puntual y su prefijo es la universidad, de modo que
 * `?g=uba042` produce el mismo `first_utm_source` que el viejo `?utm_source=uba`
 * y los reportes por universidad siguen andando.
 *
 * Es query propia y no `utm_content` porque el link tiene que verse corto en el
 * mensaje de WhatsApp. La contra es que PostHog no lo parsea solo como parámetro
 * de campaña, así que se registra a mano igual que `first_utm_source`.
 */
export const FIRST_GROUP_ID = "first_group_id"

/** Formato del id de grupo: prefijo de universidad + número. */
export const GROUP_ID_PATTERN = /^([a-z]{2,6})(\d{1,5})$/

/**
 * Copia de la atribución en localStorage, aparte de las super properties de
 * PostHog.
 *
 * PostHog la tiene, pero para el análisis por cohortes no alcanza: subcuenta
 * ~2x por bloqueadores, así que las tasas por origen salen sobre un denominador
 * que no es el real, y cruzarla con comportamiento (sesiones, retención, XP)
 * obliga a un join manual entre dos sistemas. Con esta copia el backend la
 * guarda en `users.first_group_id` al completar el onboarding y el origen pasa
 * a ser una columna más.
 *
 * Se lee al dar de alta, no al aterrizar: entre las dos cosas está el OAuth de
 * Google, que se lleva puesto el query param.
 */
const ATTRIBUTION_KEYS = {
  group: "first-group-id",
  utm: "first-utm-source",
} as const

/**
 * Guarda el origen la PRIMERA vez y nunca lo pisa, igual que el
 * `register_once` de PostHog: si la persona vuelve a entrar por otro link, el
 * origen real sigue siendo el primero.
 */
export function rememberAttribution({
  groupId,
  utmSource,
}: {
  groupId?: string | null
  utmSource?: string | null
}) {
  try {
    if (groupId && !localStorage.getItem(ATTRIBUTION_KEYS.group)) {
      localStorage.setItem(ATTRIBUTION_KEYS.group, groupId)
    }
    if (utmSource && !localStorage.getItem(ATTRIBUTION_KEYS.utm)) {
      localStorage.setItem(ATTRIBUTION_KEYS.utm, utmSource)
    }
  } catch {
    // Safari en modo privado tira al escribir. La atribución es un extra: que
    // falle no puede romper el aterrizaje.
  }
}

export function readAttribution(): { groupId?: string; utmSource?: string } {
  if (typeof window === "undefined") return {}
  try {
    return {
      groupId: localStorage.getItem(ATTRIBUTION_KEYS.group) ?? undefined,
      utmSource: localStorage.getItem(ATTRIBUTION_KEYS.utm) ?? undefined,
    }
  } catch {
    return {}
  }
}

/**
 * Primera vez que vimos a esta persona usando la app instalada. Se guarda en el
 * perfil con $set_once para poder segmentar sin depender del evento puntual.
 */
export const FIRST_PWA_USE_AT = "first_pwa_use_at"

/**
 * Key de localStorage donde queda ese timestamp del lado del dispositivo.
 *
 * Tiene que ser un valor estable entre cargas: posthog-js deduplica
 * `setPersonProperties` hasheando las propiedades, así que un `new Date()`
 * calculado en cada carga rompería el dedupe y mandaría un `$set` de más en cada
 * apertura de la PWA.
 */
export const FIRST_PWA_USE_STORAGE_KEY = "pwa-first-use-at"
