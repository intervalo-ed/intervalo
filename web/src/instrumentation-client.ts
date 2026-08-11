import posthog from "posthog-js"
import { getPlatform, isStandalone } from "@/lib/platform/detect"

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: "https://us.i.posthog.com",
  // Enables automatic pageview + pageleave capture for the App Router.
  defaults: "2026-01-30",
})

// La instalación de la PWA es manual: el onboarding muestra los pasos y el
// usuario los hace en el menú del navegador (ver install-prompt.tsx). No hay
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
  if (standalone && !localStorage.getItem(INSTALL_TRACKED_KEY)) {
    localStorage.setItem(INSTALL_TRACKED_KEY, "1")
    posthog.capture("pwa_install", { platform })
  }
} catch {
  // localStorage puede tirar en modo privado; la super property ya cubre el caso.
}
