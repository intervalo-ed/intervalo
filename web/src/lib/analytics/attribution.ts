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
