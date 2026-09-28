import { cookies } from "next/headers"

// La copia del `guest_token` que sobrevive a Safari.
//
// EL PROBLEMA. Safari borra todo el almacenamiento que un script puede escribir
// —localStorage, IndexedDB y las cookies puestas con `document.cookie`— de un
// sitio al que no se vuelve en siete días. Y sin `guest_token` guardado, cada
// carga de página del juego es un jugador nuevo: lo dice `reglas-trigger.ts`
// desde antes que esto. Medido el 28/09: el 41,9% de las filas de iOS no tiene
// una sola derivada servida (contra 23,5% en Android), y entre los que sí
// engancharon iOS vuelve el 13,6% contra el 27,5% de Android. Una sola mecánica
// explica las dos mitades.
//
// POR QUÉ ESTA COOKIE SÍ SOBREVIVE. El tope de siete días es sobre el
// almacenamiento *escribible por script*. Una cookie puesta por el servidor en
// un `Set-Cookie`, como esta, no entra en esa regla. De ahí las dos decisiones
// que parecen detalles y no lo son:
//
//   · La pone `intervalo.xyz`, no la API. La API vive en otro origen
//     (`backend-v2-…up.railway.app`), así que una cookie suya sería de TERCERA
//     PARTE y Safari las bloquea enteras. Por eso este route handler existe:
//     es el único lugar de primera parte que puede mandar un `Set-Cookie`.
//   · `httpOnly`, aunque después la página la lea y se la pase al cliente
//     (`app/derivadas/page.tsx`). No es contradictorio: lo que evita es que
//     `document.cookie` la exponga, y de paso deja claro que quien la escribe
//     es el servidor — que es justamente lo que la salva del borrado.
//
// Lo que NO arregla: si la persona borra los datos del sitio a mano, o entra en
// una ventana privada, no hay nada que recuperar. Eso es correcto.

const COOKIE = "dx_token"

// `secrets.token_urlsafe(32)` del lado del server (backend/game/deps.py) da 43
// caracteres de este alfabeto. El rango es holgado por si ese largo cambia;
// validar la FORMA es lo que evita guardar cualquier cosa que alguien mande.
const FORMA = /^[A-Za-z0-9_-]{20,64}$/

// Cuatrocientos días es el techo que los navegadores le ponen a cualquier
// cookie, así que pedir más no sirve de nada. Cada visita la vuelve a escribir
// (game-storage.ts), o sea que en la práctica es una ventana deslizante y solo
// vence quien de verdad no volvió en más de un año.
const DIAS = 400

export async function POST(request: Request) {
  let token: unknown
  try {
    token = (await request.json())?.token
  } catch {
    return new Response(null, { status: 400 })
  }
  if (typeof token !== "string" || !FORMA.test(token)) {
    return new Response(null, { status: 400 })
  }
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: DIAS * 24 * 60 * 60,
  })
  return new Response(null, { status: 204 })
}

// Cerrar sesión borra el token del localStorage (`clearGameIdentity`), y sin
// esto la cookie resucitaría al invitado viejo en la carga siguiente: "cerrar
// sesión" no cerraría nada, que es exactamente el bug que `clearGameIdentity`
// existe para no tener.
export async function DELETE() {
  const jar = await cookies()
  jar.delete(COOKIE)
  return new Response(null, { status: 204 })
}
