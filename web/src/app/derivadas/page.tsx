import { cookies } from "next/headers"

import { GameRoot } from "./game-root"
import { COOKIE_TOKEN } from "./token-cookie"

// La cookie se lee ACÁ y viaja como prop, en vez de pedirla con un fetch desde
// el navegador. La diferencia es un viaje entero de red en el arranque, y
// justo para quien menos lo puede pagar: quien llega sin token es o alguien
// nuevo, o alguien a quien Safari le borró el almacenamiento — las dos veces,
// en un teléfono, con la primera pantalla todavía sin pintar.
//
// No cuesta nada en renderizado: `cookies()` vuelve esta ruta dinámica, pero el
// layout raíz ya llama a `auth()` y a `cookies()`, así que toda la app lo es
// desde antes.
export default async function DerivadasPage() {
  const jar = await cookies()
  return <GameRoot tokenDeRescate={jar.get(COOKIE_TOKEN)?.value ?? null} />
}
