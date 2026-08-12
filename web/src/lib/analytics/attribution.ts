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
