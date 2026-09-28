"use client"

// Abrir las conexiones a los dos hosts de afuera mientras todavía se está
// bajando el JavaScript, en vez de cuando hace falta usarlas.
//
// EL PROBLEMA, medido en una carga en frío de /derivadas el 28/09: el primer
// pedido al backend sale a los **6.644 ms**, y recién ahí empiezan el DNS, el
// TCP y el saludo TLS de ese origen. Clerk arranca a los 6.639 ms y sus dos
// llamadas tardan 864 y 1.081 ms. Nada de eso depende del JavaScript: son
// conexiones que se podrían haber abierto con el HTML.
//
// En un teléfono con datos móviles ese saludo son entre 200 y 300 ms, y se
// pagan enteros dentro del camino crítico.
//
// `ReactDOM.preconnect` y no un `<link rel="preconnect">` a mano porque es lo
// que la Metadata API de esta versión de Next manda usar para los resource
// hints (ver generate-metadata.md, «Resource hints»).

import ReactDOM from "react-dom"

import { BASE_URL } from "@/lib/api/client"

/** El host de Clerk, sacado de la clave publicable.
 *
 * Clerk codifica su Frontend API adentro de la clave: `pk_live_<base64(host$)>`.
 * Hay que sacarlo de ahí y no escribir `clerk.intervalo.xyz` a mano, porque en
 * los previews y en local la clave es otra y apunta a `…clerk.accounts.dev` —
 * un preconnect a un host que nadie va a usar es una conexión tirada.
 *
 * Devuelve null ante cualquier cosa rara: no vale la pena romper el layout raíz
 * por un hint. */
export function hostDeClerk(clave: string | undefined): string | null {
  if (clave === undefined || clave === "") return null
  const cuerpo = clave.replace(/^pk_(test|live)_/, "")
  if (cuerpo === clave) return null
  try {
    const host = atob(cuerpo).replace(/\$+$/, "")
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$/i.test(host)
      ? host
      : null
  } catch {
    return null
  }
}

/** El origen de una URL, o null si no se puede leer. */
function origenDe(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

export function ConexionesTempranas() {
  const api = origenDe(BASE_URL)
  // `anonymous` y no credenciales: la API se llama con un header y no con
  // cookies, así que la conexión que abre el navegador para ella es la de modo
  // CORS sin credenciales. Pedir la otra abriría una segunda que nadie reusa.
  if (api !== null) ReactDOM.preconnect(api, { crossOrigin: "anonymous" })

  // Clerk sí manda cookies (su sesión), así que acá va la credencial. Si el
  // modo no coincidiera, el costo es una conexión de más que no se reusa — no
  // rompe nada, solo no sirve.
  const clerk = hostDeClerk(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  if (clerk !== null) {
    ReactDOM.preconnect(`https://${clerk}`, { crossOrigin: "use-credentials" })
  }
  return null
}
