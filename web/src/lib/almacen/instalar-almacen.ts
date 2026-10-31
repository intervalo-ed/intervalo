// Instala el almacén del juego al evaluarse el módulo. Lo importan, solo por el
// efecto, `app/providers.tsx` —que envuelve todo, también el panel del café que
// se abre fuera del juego— y `app/derivadas/game-root.tsx`, así que está puesto
// antes de cualquier lectura de game-storage, en el servidor y en el navegador.

import { instalarAlmacen } from "@intervalo/dx-core/almacen/key-value-store"
import { espejarTokenEnCookie } from "@/app/derivadas/token-cookie"
import { crearAlmacenLocalStorage } from "./local-storage-store"

instalarAlmacen({
  store: crearAlmacenLocalStorage(),
  espejarToken: espejarTokenEnCookie,
  esServidor: typeof window === "undefined",
})
