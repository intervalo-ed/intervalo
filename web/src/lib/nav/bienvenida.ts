// La bienvenida animada del shell —la palabra "intervalo" escribiéndose con los
// colores de los cinturones (components/splash-gate.tsx)— se apaga para siempre
// en cuanto la persona termina su primera sesión. De la segunda en adelante la
// app abre directo en el home.
//
// Son ~2,6 s de piso (MIN_INTRO) en CADA carga fría, y una carga fría es lo
// normal en una PWA que se abre desde el ícono. La primera vez eso es la marca
// presentándose; la número veinte es un peaje entre la persona y la única cosa
// que vino a hacer.
//
// **Es una cookie y no localStorage, y ahí está todo el truco.** La decisión se
// toma en el layout raíz, que corre en el SERVIDOR: si el dato viviera en
// localStorage habría que leerlo después de hidratar, o sea con la bienvenida ya
// pintada, y lo único que se lograría es cambiar un splash de 2,6 s por un
// parpadeo. Con cookie el servidor ya sabe, y el HTML sale sin bienvenida.
//
// **Guarda el id de Clerk y no un "1"**, porque lo que se recuerda es una
// persona y no un navegador. En un teléfono prestado —el caso más común de
// cuenta nueva en un dispositivo usado— el que se acaba de registrar tiene que
// ver la bienvenida aunque el dueño ya haya hecho mil sesiones.
export const COOKIE_BIENVENIDA = "intervalo_sesion_hecha"

// Un año. Se reescribe en cada visita al home, así que a quien usa la app no se
// le vence nunca; a quien la abandonó y vuelve dentro de dos años lo saludamos
// de nuevo, que tampoco está mal.
const MAX_AGE_S = 60 * 60 * 24 * 365

/** ¿Esta persona ya hizo su primera sesión? Lee lo que dejó `marcarSesionHecha`.
 *
 *  Vive pegada al escritor y no suelta en el layout a propósito: el valor de la
 *  cookie es un id de usuario, y comparar contra el id de quien está logueado es
 *  la mitad que hace que la cookie signifique lo que dice. Separadas, la de
 *  lectura se escribe como `!== undefined` y la cookie pasa a significar
 *  "alguien, alguna vez, en este navegador". */
export function yaHizoSesion(
  cookie: string | undefined,
  userId: string | null | undefined,
): boolean {
  return !!userId && !!cookie && cookie === userId
}

/** Anota que esta persona ya terminó una sesión, para no volver a saludarla.
 *
 *  Lo llama el home con la respuesta de `/user/status`, que es la fuente
 *  autoritativa (la base, no el dispositivo). Por eso se reescribe siempre y no
 *  solo la primera vez: así se repara solo el caso de quien cambia de teléfono o
 *  borra los datos del navegador —una bienvenida de más y nunca otra—, y así
 *  entraron todos los que ya venían usando la app cuando esto se desplegó. */
export function marcarSesionHecha(userId: string): void {
  if (typeof document === "undefined") return
  // Sin escapar y sin decodificar del otro lado: los ids de Clerk son
  // `user_` + base62, así que escribirlos crudos es exacto. Si alguna vez
  // dejaran de serlo, esto no escribe nada y la bienvenida vuelve a salir —que
  // es el lado inofensivo de equivocarse—, en vez de guardar un valor que el
  // lector del servidor compararía ya decodificado contra otro sin decodificar.
  if (!/^[A-Za-z0-9_-]+$/.test(userId)) return
  // `Secure` solo en https: en `http://localhost` el navegador descarta la
  // cookie con ese atributo y esto no funcionaría en desarrollo.
  const seguro = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie =
    `${COOKIE_BIENVENIDA}=${userId}; Path=/; Max-Age=${MAX_AGE_S}; ` +
    `SameSite=Lax${seguro}`
}
