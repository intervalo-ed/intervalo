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
 * Quién compartió el link del minijuego.
 *
 * El botón de compartir arma `intervalo.xyz/derivadas?r=<alias>` con el @ de
 * quien comparte, así se puede contar cuánta gente entró por cada persona — que
 * es lo único que distingue el boca a boca del reparto por grupos.
 *
 * Es `r` y no un `utm_*` por lo mismo que `g`: el link se ve entero en el
 * mensaje de WhatsApp y cada caracter de más se lee como spam. Y como PostHog
 * no lo parsea solo, se registra a mano igual que los otros dos.
 *
 * No afecta la vista previa: WhatsApp la arma pidiendo la URL tal cual, y la
 * ruta sigue siendo /derivadas con sus mismos tags Open Graph.
 */
export const FIRST_REFERRER = "first_referrer"

/** Formato del alias: el mismo que acepta el campo del @ (a-z, 0-9, punto y
 *  guión bajo). Se valida antes de registrarlo para que nadie meta cualquier
 *  cosa en una propiedad de PostHog por query string. */
export const REFERRER_PATTERN = /^[a-z0-9._]{1,20}$/

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
  // El `?r=` también, y acá no es solo analítica: es lo que el alta del
  // minijuego manda para dejar al jugador anotado como recluta de ese @, y a
  // partir de ahí una parte de su XP se le paga (ver backend/game/referrals.py).
  //
  // Tiene que estar en localStorage y no solo en las super properties de
  // PostHog por dos motivos. Uno: PostHog puede no cargar —bloqueadores— y el
  // reclutamiento no puede depender de eso. Dos: entre aterrizar y darse de
  // alta puede haber un OAuth de Google de por medio, que se lleva puesto el
  // query param.
  referrer: "first-referrer",
} as const

/**
 * Guarda el origen la PRIMERA vez y nunca lo pisa, igual que el
 * `register_once` de PostHog: si la persona vuelve a entrar por otro link, el
 * origen real sigue siendo el primero.
 */
export function rememberAttribution({
  groupId,
  utmSource,
  referrer,
}: {
  groupId?: string | null
  utmSource?: string | null
  referrer?: string | null
}) {
  try {
    if (groupId && !localStorage.getItem(ATTRIBUTION_KEYS.group)) {
      localStorage.setItem(ATTRIBUTION_KEYS.group, groupId)
    }
    if (utmSource && !localStorage.getItem(ATTRIBUTION_KEYS.utm)) {
      localStorage.setItem(ATTRIBUTION_KEYS.utm, utmSource)
    }
    if (referrer && !localStorage.getItem(ATTRIBUTION_KEYS.referrer)) {
      localStorage.setItem(ATTRIBUTION_KEYS.referrer, referrer)
    }
  } catch {
    // Safari en modo privado tira al escribir. La atribución es un extra: que
    // falle no puede romper el aterrizaje.
  }
}

export function readAttribution(): {
  groupId?: string
  utmSource?: string
  referrer?: string
} {
  if (typeof window === "undefined") return {}
  try {
    return {
      groupId: localStorage.getItem(ATTRIBUTION_KEYS.group) ?? undefined,
      utmSource: localStorage.getItem(ATTRIBUTION_KEYS.utm) ?? undefined,
      referrer: localStorage.getItem(ATTRIBUTION_KEYS.referrer) ?? undefined,
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
