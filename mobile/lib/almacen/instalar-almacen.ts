// Instala el almacén del juego al evaluarse el módulo. Lo importa, solo por el
// efecto, la primera línea de `app/_layout.tsx`, así que está puesto antes de
// cualquier lectura de game-storage.

import { instalarAlmacen } from "@intervalo/dx-core/almacen/key-value-store"
import { mmkvStore } from "./mmkv-store"
import { espejarTokenEnLlavero } from "./token-seguro"

instalarAlmacen({ store: mmkvStore, espejarToken: espejarTokenEnLlavero })
