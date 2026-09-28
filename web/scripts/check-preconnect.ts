// Chequeo del host de Clerk que sale de la clave publicable.
//
// Corre con: bun run check:preconnect
//
// Esto es de la clase que no se ve jugando, que es justo por lo que necesita
// chequeo. Si `hostDeClerk` devuelve null donde debería devolver el host, el
// preconnect simplemente no se hace: la página anda igual y nadie se entera de
// que el saludo TLS volvió a pagarse dentro del camino crítico. Y si devolviera
// cualquier cosa, el navegador abriría una conexión a un host inventado.
//
// El formato de la clave es de Clerk: `pk_live_<base64(host$)>`. Está escrito
// acá con casos concretos porque el día que lo cambien, esto tiene que fallar
// en vez de apagarse en silencio.

import { hostDeClerk } from "../src/app/conexiones-tempranas"

let fallos = 0

function check(condicion: boolean, etiqueta: string) {
  console.log(`  [${condicion ? "ok" : "FAIL"}] ${etiqueta}`)
  if (!condicion) fallos++
}

function clave(prefijo: string, host: string): string {
  return prefijo + Buffer.from(`${host}$`).toString("base64")
}

console.log("1. la clave publicable da el host")
check(
  hostDeClerk(clave("pk_live_", "clerk.intervalo.xyz")) === "clerk.intervalo.xyz",
  "producción: clerk.intervalo.xyz",
)
check(
  hostDeClerk(clave("pk_test_", "unique-koi-61.clerk.accounts.dev")) ===
    "unique-koi-61.clerk.accounts.dev",
  "preview y local: …clerk.accounts.dev",
)

console.log()
console.log("2. ante cualquier cosa rara, null — un hint no rompe el layout raíz")
for (const [etiqueta, valor] of [
  ["sin clave (build sin env)", undefined],
  ["clave vacía", ""],
  ["sin el prefijo de Clerk", "algo_que_no_es_una_clave"],
  ["base64 roto", "pk_live_!!!no-es-base64!!!"],
  ["base64 que no es un host", clave("pk_live_", "hola mundo")],
  ["un host sin punto", clave("pk_live_", "localhost")],
  ["intento de meter una ruta", clave("pk_live_", "malo.com/../otro")],
] as const) {
  check(hostDeClerk(valor as string | undefined) === null, `${etiqueta} → null`)
}

console.log()
if (fallos > 0) {
  console.log(`FALLARON ${fallos}`)
  process.exit(1)
}
console.log("todo ok")
