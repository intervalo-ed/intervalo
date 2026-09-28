// El nombre y la ruta de la cookie que respalda el `guest_token`.
//
// Viven en un módulo propio porque los tres lugares que las necesitan corren en
// mundos distintos y ninguno puede importar a los otros: el route handler que la
// escribe (`app/api/dx/token/route.ts`) es de servidor, la página que la lee
// (`app/derivadas/page.tsx`) también, y `game-storage.ts` es del navegador. Un
// literal repetido tres veces es exactamente la clase de cosa que deja de
// coincidir el día que alguien renombra uno.
//
// El porqué de la cookie está escrito entero en el route handler.

export const COOKIE_TOKEN = "dx_token"
export const RUTA_TOKEN = "/api/dx/token"
