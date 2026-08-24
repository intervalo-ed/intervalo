import posthog from "posthog-js"
import {
  FIRST_GROUP_ID,
  FIRST_PWA_USE_STORAGE_KEY,
  FIRST_UTM_SOURCE,
  GROUP_ID_PATTERN,
  rememberAttribution,
} from "@/lib/analytics/attribution"
import { getPlatform, isStandalone } from "@/lib/platform/detect"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "https://us.i.posthog.com",
  // Enables automatic pageview + pageleave capture for the App Router.
  defaults: "2026-01-30",
})

// register_once persiste en localStorage y adjunta el origen a todos los eventos
// siguientes, incluidos los de después del OAuth (ver lib/analytics/attribution).
// "once" es a propósito: gana el primer contacto, así que si la persona vuelve a
// entrar por otro link no se le pisa el origen real.
const params = new URLSearchParams(window.location.search)

// `?g=<id>` son los links por grupo de WhatsApp (ver lib/analytics/attribution).
// El prefijo del id es la universidad, así que de un solo parámetro salen las dos
// cosas: el grupo puntual y el `utm_source` que los reportes ya usan.
//
// Los links viejos con `?utm_source=` siguen funcionando: hay cientos ya enviados
// a grupos, grabados en esos chats para siempre.
const groupId = params.get("g")
const groupMatch = groupId ? GROUP_ID_PATTERN.exec(groupId) : null
const utmSource = params.get("utm_source") ?? groupMatch?.[1]

if (groupMatch) {
  posthog.register_once({ [FIRST_GROUP_ID]: groupId })
}
if (utmSource) {
  posthog.register_once({ [FIRST_UTM_SOURCE]: utmSource })
}

// Además de PostHog, una copia propia en localStorage: el alta la manda al
// backend y el origen queda como columna de `users`, que es lo que permite
// cruzarlo con retención sin depender de un sistema que subcuenta por
// bloqueadores (ver lib/analytics/attribution).
rememberAttribution({ groupId: groupMatch ? groupId : null, utmSource })

// La instalación de la PWA es manual: el resumen de sesión muestra los pasos y
// el usuario los hace en el menú del navegador (ver notify-hint-pane.tsx). No hay
// `beforeinstallprompt` que interceptar, y en iOS `appinstalled` no existe. La
// única señal fiable es si la app está corriendo instalada, que se evalúa en
// cada carga.
const standalone = isStandalone()
const platform = getPlatform()

// Como super properties viajan en TODOS los eventos, así que se puede segmentar
// cualquier métrica (retención, sesiones, permiso de push) por instalado vs.
// navegador sin tener que cruzar con un evento aparte.
posthog.register({ pwa_standalone: standalone, platform })

// Además, un evento puntual la primera vez que vemos a esta persona corriendo
// instalada. En iOS la PWA instalada tiene su propio storage, separado del
// navegador, así que el guard vive del lado correcto y el evento sale una vez
// por instalación.
const INSTALL_TRACKED_KEY = "pwa-install-tracked"
try {
  if (standalone) {
    // Timestamp del primer uso instalado, que posthog-user.tsx copia al perfil de
    // la persona al identificar. Es la red de contención del evento de abajo: si
    // el evento se pierde, esto sigue permitiendo contar la instalación.
    if (!localStorage.getItem(FIRST_PWA_USE_STORAGE_KEY)) {
      localStorage.setItem(FIRST_PWA_USE_STORAGE_KEY, new Date().toISOString())
    }

    if (!localStorage.getItem(INSTALL_TRACKED_KEY)) {
      // send_instantly saltea la cola batcheada: la primera carga de la PWA suele
      // redirigir enseguida (ej. /sso-callback) y el evento encolado se perdía en
      // la descarga de la página. El guard se escribe después del capture para que
      // un fallo no lo deje puesto suprimiendo el reintento.
      posthog.capture("pwa_install", { platform }, { send_instantly: true })
      localStorage.setItem(INSTALL_TRACKED_KEY, "1")
    }
  }
} catch {
  // localStorage puede tirar en modo privado; la super property ya cubre el caso.
}
