// El nombre y la ruta de la cookie que respalda el `guest_token`.
//
// Viven en un módulo propio porque los tres lugares que las necesitan corren en
// mundos distintos y ninguno puede importar a los otros: el route handler que la
// escribe (`app/api/dx/token/route.ts`) es de servidor, la página que la lee
// (`app/derivadas/page.tsx`) también, y el espejo de abajo es del navegador. Un
// literal repetido tres veces es exactamente la clase de cosa que deja de
// coincidir el día que alguien renombra uno.
//
// El porqué de la cookie está escrito entero en el route handler.

export const COOKIE_TOKEN = "dx_token"
export const RUTA_TOKEN = "/api/dx/token"

// Cuál token ya se mandó a la cookie en esta carga. El alta lo guarda una vez y
// el rescate lo vuelve a guardar apenas lo adopta, así que sin esto la misma
// carga haría dos POST idénticos.
let enLaCookie: string | null = null

/** Copia el token a la cookie de primera parte, que es la que sobrevive al
 *  borrado de Safari (ver `app/api/dx/token/route.ts`). Con `null` la borra:
 *  es lo que hace `clearGameIdentity`, o cerrar sesión no cerraría nada.
 *
 *  Es el `espejarToken` que game-storage recibe al instalar el almacén
 *  (lib/almacen/instalar-almacen.ts).
 *
 *  Sin `await` y tragando el error a propósito: es un respaldo, y que falle no
 *  puede frenar ni ensuciar el arranque del juego. Se vuelve a escribir en cada
 *  visita, o sea que el vencimiento es una ventana deslizante. */
export function espejarTokenEnCookie(token: string | null) {
  if (token === null) {
    enLaCookie = null
    void fetch(RUTA_TOKEN, { method: "DELETE" }).catch(() => {})
    return
  }
  // `fetch` con una ruta relativa TIRA en el servidor, y lo hace antes de
  // devolver la promesa —así que el `.catch` de abajo no lo agarraría—. Este
  // módulo lo importan componentes de cliente, que Next igual renderiza del
  // lado del servidor para hidratar.
  if (typeof window === "undefined") return
  if (enLaCookie === token) return
  enLaCookie = token
  void fetch(RUTA_TOKEN, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
    keepalive: true,
  }).catch(() => {})
}
